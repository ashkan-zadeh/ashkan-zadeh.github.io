#!/usr/bin/env python3
"""Build the static news feed used by the website.

The site is hosted on GitHub Pages, so this script writes a JSON file that the
browser can load without a live server or database.

Set HF_TOKEN to enable LLM-powered curation and summarisation via the
Hugging Face Serverless Inference API (free tier).  Without the token the
script falls back to keyword-based scoring.

Optionally set HF_MODEL to override the default model.
"""

from __future__ import annotations

import email.utils
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "news.json"
JS_OUTPUT = ROOT / "data" / "news.js"
ARCHIVE_OUTPUT = ROOT / "data" / "news-archive.json"
MAX_ITEMS = 10
MAX_PER_CATEGORY = 3
LLM_CANDIDATE_LIMIT = 30

DEFAULT_HF_MODEL = "Qwen/Qwen2.5-72B-Instruct"
GEMINI_MODEL = "gemini-2.0-flash"
GROQ_MODEL = "llama-3.3-70b-versatile"

# Cascading recency thresholds: prefer 14 days, fall back to 30, then 60
RECENCY_THRESHOLDS_DAYS = [14, 30, 60]
MIN_ITEMS_BEFORE_FALLBACK = 5


@dataclass(frozen=True)
class Feed:
    category: str
    url: str


FEEDS = [
    Feed(
        "automated-vehicles",
        "https://news.google.com/rss/search?"
        + urllib.parse.urlencode(
            {
                "q": '("autonomous vehicles" OR "automated vehicles" OR robotaxi OR "self-driving") (Reuters OR "AP News" OR Waymo OR Tesla OR NVIDIA OR "The Verge" OR "IEEE Spectrum" OR Wired OR Electrek OR VentureBeat OR Engadget OR Aurora OR Mobileye OR "Ars Technica" OR TechCrunch OR "InsideEVs") when:7d',
                "hl": "en-US",
                "gl": "US",
                "ceid": "US:en",
            }
        ),
    ),
    Feed(
        "ai",
        "https://news.google.com/rss/search?"
        + urllib.parse.urlencode(
            {
                "q": '("AI safety" OR "artificial intelligence" OR "AI model" OR "AI regulation") (Reuters OR "AP News" OR Nature OR OpenAI OR Google OR Microsoft OR "IEEE Spectrum" OR VentureBeat OR TechCrunch OR Wired OR "Ars Technica" OR Engadget OR "The Verge" OR ScienceDaily OR "Phys.org") when:3d',
                "hl": "en-US",
                "gl": "US",
                "ceid": "US:en",
            }
        ),
    ),
    Feed(
        "llm",
        "https://news.google.com/rss/search?"
        + urllib.parse.urlencode(
            {
                "q": '("large language model" OR "LLM" OR "foundation model" OR "language model") ("autonomous" OR "driving" OR "vehicle" OR "transportation" OR "mobility" OR "explainable" OR "XAI") (Nature OR NVIDIA OR Google OR OpenAI OR Microsoft OR "IEEE Spectrum" OR Reuters OR TechCrunch OR VentureBeat OR "Ars Technica" OR ScienceDaily OR "Phys.org") when:14d',
                "hl": "en-US",
                "gl": "US",
                "ceid": "US:en",
            }
        ),
    ),
    Feed(
        "nlp",
        "https://news.google.com/rss/search?"
        + urllib.parse.urlencode(
            {
                "q": '("natural language processing" OR "NLP" OR "language understanding" OR "text generation" OR "speech recognition") ("autonomous vehicle" OR "driving" OR "human machine" OR "HMI" OR "explainability" OR "transportation") (IEEE OR Nature OR Google OR NVIDIA OR Reuters OR "The Verge" OR VentureBeat OR ScienceDaily OR "Phys.org" OR "Ars Technica") when:30d',
                "hl": "en-US",
                "gl": "US",
                "ceid": "US:en",
            }
        ),
    ),
    Feed(
        "vlm",
        "https://news.google.com/rss/search?"
        + urllib.parse.urlencode(
            {
                "q": '("vision-language model" OR "vision language model" OR "multimodal AI" OR "VLM") (Nature OR NVIDIA OR Google OR OpenAI OR Microsoft OR "IEEE Spectrum" OR VentureBeat OR TechCrunch OR ScienceDaily OR "Phys.org" OR "Ars Technica") when:14d',
                "hl": "en-US",
                "gl": "US",
                "ceid": "US:en",
            }
        ),
    ),
    Feed(
        "computer-vision",
        "https://news.google.com/rss/search?"
        + urllib.parse.urlencode(
            {
                "q": '("computer vision" OR perception OR lidar OR "scene understanding") ("autonomous driving" OR "automated vehicles" OR "self-driving") (Nature OR NVIDIA OR Waymo OR "Carnegie Mellon" OR "MIT News" OR "IEEE Spectrum" OR Google OR Electrek OR Engadget OR ScienceDaily OR "Phys.org") when:14d',
                "hl": "en-US",
                "gl": "US",
                "ceid": "US:en",
            }
        ),
    ),
]


IMPORTANT_TERMS = {
    "automated": 8,
    "autonomous": 8,
    "vehicle": 7,
    "driving": 6,
    "vision-language": 10,
    "vision language": 10,
    "multimodal": 9,
    "computer vision": 8,
    "explainable": 9,
    "large language model": 10,
    "foundation model": 9,
    "natural language": 8,
    "safety": 7,
    "regulation": 5,
    "deployment": 5,
    "research": 4,
}

CATEGORY_LABELS = {
    "automated-vehicles": "automated vehicle",
    "ai": "AI",
    "llm": "LLM",
    "nlp": "NLP",
    "vlm": "vision-language model",
    "computer-vision": "computer vision",
}

CATEGORY_REQUIRED_TERMS = {
    "automated-vehicles": ("autonomous", "automated", "robotaxi", "self-driving", "driverless"),
    "ai": ("ai", "artificial intelligence", "machine learning", "foundation model", "safety benchmark"),
    "llm": ("large language model", "llm", "gpt", "foundation model", "language model"),
    "nlp": ("natural language", "nlp", "text generation", "speech recognition", "language understanding"),
    "vlm": ("vision-language", "vision language", "multimodal", "visual language", "vlm"),
    "computer-vision": ("computer vision", "autonomous driving", "perception", "lidar", "simulation"),
}

BLOCKED_SOURCE_TERMS = (
    "openpr",
    "tipranks",
    "investing.com",
    "stock",
    "benzinga",
    "marketwatch",
    "globenewswire",
    "pr newswire",
    "analytics insight",
    "hindustan metro",
    "technosports",
    "businesswire",
    "accesswire",
    "einpresswire",
    "yahoo finance",
    "seeking alpha",
    "fool.com",
    "motley fool",
    "the information",
    "mit technology review",
    "bloomberg",
    "new york times",
    "washington post",
    "wall street journal",
    "financial times",
)

ALLOWED_SOURCE_NAMES = {
    # Wire services & general news (free)
    "reuters",
    "associated press",
    "ap news",
    "bbc",
    "bbc news",
    "the guardian",
    # Tech & science journalism (free)
    "wired",
    "the verge",
    "ars technica",
    "techcrunch",
    "engadget",
    "venturebeat",
    "zdnet",
    "techradar",
    "gizmodo",
    "electrek",
    "insideevs",
    # Science & research news (free)
    "ieee spectrum",
    "nature",
    "nature news",
    "science",
    "sciencedaily",
    "phys.org",
    "eurekalert",
    "medical xpress",
    "mit news",
    "carnegie mellon university",
    "stanford university",
    "news at iu",
    "the regulatory review",
    # AI lab & company blogs (free)
    "nvidia",
    "nvidia developer",
    "nvidia blog",
    "nvidia newsroom",
    "google",
    "google blog",
    "google deepmind",
    "deepmind",
    "openai",
    "microsoft",
    "microsoft research",
    "meta",
    "meta ai",
    "hugging face",
    # AV & mobility companies (free)
    "waymo",
    "tesla",
    "uber",
    "aurora",
    "mobileye",
    "cruise",
    "zoox",
    "motional",
    "toyota",
    "hyundai",
}

BLOCKED_TITLE_TERMS = (
    "we're hiring",
    "companies hiring",
    "hiring:",
    "hiring computer vision",
    "stock explained",
    "stock faces",
    "market is going to boom",
    "industry outlook",
    "market size",
    "market forecast",
    "swot analysis",
    "cagr",
    "share price",
)


def fetch(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; AshkanWebsiteNewsBot/1.0; +https://ashkan-zadeh.github.io/)",
        },
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read()


_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}


def _html_to_text(raw_html: str) -> str:
    """Strip HTML and return cleaned body text."""
    # Remove non-content blocks
    raw_html = re.sub(
        r"<(script|style|nav|header|footer|aside|form|noscript)[^>]*>.*?</\1>",
        " ", raw_html, flags=re.DOTALL | re.IGNORECASE,
    )
    text = re.sub(r"<[^>]+>", " ", raw_html)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fetch_article_text(url: str, timeout: int = 12) -> str:
    """Fetch article body text using trafilatura, falling back to plain HTML parse."""
    # Try trafilatura first (handles most well-structured pages)
    try:
        import trafilatura  # noqa: PLC0415
        req = urllib.request.Request(url, headers=_BROWSER_HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw_bytes = resp.read(131072)  # 128 KB max
        encoding = resp.headers.get_content_charset("utf-8")
        raw_html = raw_bytes.decode(encoding, errors="ignore")
        text = trafilatura.extract(
            raw_html,
            include_comments=False,
            include_tables=False,
            no_fallback=False,
            favor_precision=True,
        )
        if text and len(text) > 120:
            snippet = text[:1400]
            cut = max(snippet.rfind(". "), snippet.rfind(".\n"))
            return (snippet[: cut + 1] if cut > 250 else snippet).strip()
    except Exception:
        pass

    # Plain-HTML fallback (works on simpler/blog pages)
    try:
        req2 = urllib.request.Request(url, headers=_BROWSER_HEADERS)
        with urllib.request.urlopen(req2, timeout=timeout) as resp2:
            raw_bytes2 = resp2.read(131072)
        encoding2 = resp2.headers.get_content_charset("utf-8")
        text2 = _html_to_text(raw_bytes2.decode(encoding2, errors="ignore"))
        if len(text2) > 200:
            # Skip the first 150 chars (usually site nav) and take the next 1200
            chunk = text2[150:1350]
            cut2 = chunk.rfind(". ")
            return (chunk[: cut2 + 1] if cut2 > 200 else chunk).strip()
    except Exception:
        pass

    return ""


def leading_sentences(text: str, n: int = 3) -> str:
    """Return the first n sentences of text."""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return " ".join(s for s in sentences[:n] if s)


def clean_text(value: str | None, limit: int = 400) -> str:
    text = html.unescape(value or "")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rsplit(" ", 1)[0] + "..."


def strip_source_suffix(title: str, source: str) -> str:
    if not title or not source:
        return title
    escaped = re.escape(source)
    return re.sub(rf"\s+[-–|]\s+{escaped}\s*$", "", title, flags=re.IGNORECASE).strip()


def parse_date(value: str | None) -> str:
    if not value:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    parsed = email.utils.parsedate_to_datetime(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def score_item(title: str, summary: str, category: str) -> int:
    haystack = f"{title} {summary}".lower()
    score = 20
    for term, weight in IMPORTANT_TERMS.items():
        if term in haystack:
            score += weight
    if category in {"automated-vehicles", "vlm", "llm"}:
        score += 8
    if category == "nlp":
        score += 5
    return min(score, 99)


def is_relevant(title: str, summary: str, source: str, category: str) -> bool:
    haystack = f"{title} {summary}".lower()
    source_text = source.lower()
    source_key = re.sub(r"\s+", " ", source_text.strip())
    source_key = source_key.removesuffix(".com").removesuffix(".org").removesuffix(".net")
    if source_key not in ALLOWED_SOURCE_NAMES:
        return False
    if "reutersconnect" in source_text or "not a tesla app" in source_text:
        return False
    if any(term in source_text for term in BLOCKED_SOURCE_TERMS):
        return False
    if any(term in haystack for term in BLOCKED_TITLE_TERMS):
        return False
    return any(term in haystack for term in CATEGORY_REQUIRED_TERMS.get(category, ()))


def build_summary(title: str, description: str, source: str, category: str) -> str:
    normalized_title = re.sub(r"\W+", "", title.lower())
    normalized_description = re.sub(r"\W+", "", description.lower())
    duplicated = (
        normalized_description == normalized_title
        or normalized_title in normalized_description
        or normalized_description in normalized_title
    )
    if description and normalized_description and not duplicated:
        return description
    label = CATEGORY_LABELS.get(category, "research")
    return f"Headline tracked from {source} as a recent {label} signal."


def build_abstract(title: str, description: str, category: str) -> str:
    normalized_title = re.sub(r"\W+", "", title.lower())
    normalized_description = re.sub(r"\W+", "", description.lower())
    duplicated = (
        not normalized_description
        or normalized_description == normalized_title
        or normalized_title in normalized_description
        or normalized_description in normalized_title
    )
    if description and not duplicated:
        return description

    lower_title = title.lower()
    if category == "automated-vehicles":
        if "trainer" in lower_title or "safety stats" in lower_title:
            return (
                "Reuters reports that Tesla AI training workers have raised concerns about how self-driving safety is measured and trusted internally. "
                "The report highlights a gap between publicly stated safety statistics and the day-to-day observations of staff who prepare training data for the Full Self-Driving system. "
                "The findings raise questions about how AV companies validate safety claims before commercial deployment. "
                "Independent third-party auditing of AV safety metrics remains an open policy question."
            )
        if "suspends" in lower_title or "pauses" in lower_title or "flood" in lower_title:
            return (
                "Waymo has temporarily suspended or paused robotaxi operations in response to an incident or adverse conditions, illustrating that commercial AV services remain sensitive to edge-case failures. "
                "Such pauses are part of standard safety protocols in which operators pull vehicles until the cause is diagnosed and the system is updated or validated. "
                "The episode underscores the challenge of maintaining continuous commercial operations while meeting rigorous safety standards. "
                "It also provides real-world data that feeds back into improved fault-detection and operational-design-domain policies."
            )
        if "rollout" in lower_title or "wait times" in lower_title:
            return (
                "Tesla's robotaxi rollout is advancing as the company moves from limited pilots to broader geographic availability, with early user reports focusing on ride quality and wait times. "
                "Operational metrics such as pick-up latency, route completion rates, and disengagement frequency are being closely tracked by analysts and regulators. "
                "The deployment marks a key test of Tesla's vision-only perception stack at commercial scale, without the lidar sensors used by most competitors. "
                "Performance data from this phase will shape both regulatory approvals and public trust in the technology."
            )
        if "robotaxi" in lower_title and "target" in lower_title:
            return (
                "Robotaxi operators are announcing new city-deployment targets, signaling continued expansion of driverless commercial ride-hailing services. "
                "Each new market entry requires satisfying local safety regulations, mapping the operational design domain, and building maintenance infrastructure. "
                "Geographic expansion also tests how well perception and planning systems generalise across different road layouts, weather patterns, and traffic behaviours. "
                "Competitive pressure between Waymo, Tesla, Cruise, and international players is accelerating the pace of these rollouts."
            )
        if "regulation" in lower_title or "policy" in lower_title:
            return (
                "New regulatory or policy developments are reshaping the framework under which automated vehicles are tested, certified, and commercially operated. "
                "The proposal or ruling addresses key questions around minimum safety performance standards, incident-reporting obligations, or public-road testing permits. "
                "Regulatory clarity is critical for AV developers planning multi-year deployment roadmaps and for insurers pricing liability risk. "
                "Industry stakeholders are expected to respond through public comment periods or direct engagement with the relevant agency."
            )
        if "waymo" in lower_title or "tesla" in lower_title or "robotaxi" in lower_title:
            return (
                "A major AV operator has announced a significant operational, technical, or business development affecting its commercial autonomous-driving program. "
                "The update reflects ongoing competition among leading players to demonstrate fleet reliability, safety, and scalable unit economics. "
                "Technical details — such as sensor configurations, software stack updates, or safety driver policies — will determine long-term competitive positioning. "
                "Analysts and researchers are tracking these milestones as indicators of when full driverless commercialisation at scale becomes viable."
            )
        return (
            "A recent development in automated vehicle technology, operations, or policy has been reported by a major news outlet or research institution. "
            "The article covers progress or challenges in areas such as deployment readiness, safety validation, sensor technology, or regulatory compliance. "
            "Such updates are relevant to researchers studying the engineering, societal, and governance dimensions of autonomous mobility. "
            "Tracking these developments helps contextualise where the field stands relative to the milestones needed for widespread AV adoption."
        )
    if category == "ai":
        if "safety" in lower_title:
            return (
                "A new report or research publication has highlighted safety considerations for advanced AI systems operating in high-stakes environments. "
                "The work examines alignment, robustness, or evaluation challenges that arise as models are deployed beyond controlled benchmarks. "
                "These findings are directly relevant to automated vehicles, where AI safety failures can have physical consequences for passengers and bystanders. "
                "The research contributes to the growing body of work on building AI systems that behave reliably under distribution shift and adversarial conditions."
            )
        if "regulation" in lower_title or "policy" in lower_title:
            return (
                "Governments or regulatory bodies have published new proposals or rulings on the governance of artificial intelligence systems. "
                "The policy addresses issues such as liability, transparency requirements, prohibited use cases, or mandatory safety evaluations for high-risk AI. "
                "For AV researchers, the regulatory trajectory shapes which AI architectures and validation approaches will be permissible in production systems. "
                "Industry groups and academic researchers are actively engaging with the policy process to ensure technically sound requirements."
            )
        return (
            "A significant AI research or industry development has been published, with implications for capability, safety, or deployment of intelligent systems. "
            "The work advances the state of the art in areas such as model reasoning, multimodal understanding, or large-scale training methodology. "
            "Connections to autonomous systems research include perception, decision-making, natural language explanation, and human-machine interaction. "
            "The finding is likely to influence near-term research agendas at major labs and universities working on applied AI."
        )
    if category == "llm":
        if "autonomous" in lower_title or "driving" in lower_title or "vehicle" in lower_title:
            return (
                "Researchers have demonstrated a new application of large language models to autonomous vehicle decision-making, explanation generation, or human-machine interaction. "
                "The approach leverages LLM reasoning capabilities to interpret sensor observations, generate natural-language explanations of driving decisions, or assist in scene understanding. "
                "Key results include improvements in interpretability, user trust, or task performance compared to purely end-to-end neural baselines. "
                "The work positions LLMs as a promising component in next-generation AV stacks that must communicate their reasoning to passengers, regulators, and safety auditors."
            )
        if "reasoning" in lower_title or "planning" in lower_title:
            return (
                "New research demonstrates advances in LLM-based reasoning and planning, with direct implications for autonomous system design and explainability. "
                "The model achieves improved performance on multi-step logical or spatial reasoning benchmarks, suggesting stronger capability for complex real-world decision sequences. "
                "For AV systems, reasoning improvements translate to better handling of rare traffic scenarios, more coherent driving narratives, and more robust goal-directed planning. "
                "These capabilities are increasingly integrated into AV software stacks to bridge perception outputs and actionable driving plans."
            )
        return (
            "A new large language model capability, benchmark, or application has been reported, with potential relevance to automated vehicle research and deployment. "
            "The development advances LLM competence in areas such as instruction following, structured output generation, or domain-specific knowledge retrieval. "
            "AV researchers are increasingly leveraging LLMs for tasks including scene description, failure analysis, driver-communication interfaces, and code generation for simulation. "
            "Progress in this area reduces the engineering effort needed to build explainable and interactive AV systems."
        )
    if category == "nlp":
        if "autonomous" in lower_title or "driving" in lower_title:
            return (
                "Natural language processing researchers have published work applying language understanding or generation to autonomous vehicle contexts. "
                "The system processes driver commands, generates explanations of vehicle behaviour, or enables spoken human-vehicle dialogue in realistic driving scenarios. "
                "Evaluation results show improvements in task completion, naturalness, or robustness compared to prior NLP-based driving interfaces. "
                "This line of research is central to making AV systems accessible and trustworthy for non-expert passengers and operators."
            )
        if "speech" in lower_title or "dialogue" in lower_title:
            return (
                "Advances in speech recognition or dialogue systems are improving the quality and reliability of voice interfaces for autonomous and semi-autonomous vehicles. "
                "The work addresses challenges such as noise robustness, intent disambiguation, and multi-turn conversation management in the driving context. "
                "Improved speech-based interfaces lower the cognitive barrier for passengers to query or override vehicle decisions in real time. "
                "Integration with in-vehicle AI assistants and AV planning modules is an active area of research and product development."
            )
        return (
            "A natural language processing advance has been published with relevance to human-vehicle communication, explainability, or automated report generation. "
            "The research improves language model capabilities in areas such as semantic understanding, generation quality, or cross-modal alignment with visual data. "
            "In the context of autonomous driving, NLP tools are used to generate plain-language explanations of AI decisions, process passenger instructions, and analyse incident reports. "
            "The finding advances the broader goal of building AV systems that communicate transparently and adapt to user needs."
        )
    if category == "vlm":
        return (
            "A new vision-language model or multimodal AI system has been introduced or evaluated, extending joint understanding of visual scenes and natural language. "
            "The architecture achieves strong performance on benchmarks requiring visual question answering, image captioning, or grounded instruction following in complex visual environments. "
            "For autonomous vehicle research, VLMs offer a path toward perception modules that can interpret scenes semantically and generate natural-language justifications for driving decisions. "
            "The model's zero-shot and few-shot generalisation capabilities are particularly relevant for handling rare or novel driving scenarios not covered by training distributions."
        )
    if category == "computer-vision":
        return (
            "A computer vision or perception system has been published with direct relevance to autonomous vehicle scene understanding or environmental sensing. "
            "The approach advances capabilities in object detection, depth estimation, semantic segmentation, or sensor fusion using camera, lidar, or radar inputs. "
            "Benchmark results demonstrate improvements in accuracy, latency, or robustness under challenging conditions such as adverse weather, occlusion, or nighttime driving. "
            "Deploying such systems in production AV stacks requires further validation across diverse geographic and weather conditions before safety certification."
        )
    return (
        "A recent development at the intersection of AI, autonomous vehicles, and intelligent mobility has been covered by a reputable technical or news publication. "
        "The article addresses advances in perception, planning, language interfaces, or regulatory frameworks relevant to next-generation transport systems. "
        "Researchers in automated driving and applied AI will find the findings pertinent to ongoing work on safe, explainable, and human-centred autonomous systems. "
        "Tracking such developments provides important context for situating individual research contributions within the broader field."
    )


def parse_feed(feed: Feed, payload: bytes) -> list[dict]:
    root = ET.fromstring(payload)
    items = []
    for entry in root.findall(".//item"):
        url = clean_text(entry.findtext("link"), 500)
        source_node = entry.find("source")
        source = clean_text(source_node.text if source_node is not None else "Google News", 80)
        title = strip_source_suffix(clean_text(entry.findtext("title"), 160), source)
        description = strip_source_suffix(clean_text(entry.findtext("description"), 500), source)
        summary = build_summary(title, description, source or "Google News", feed.category)
        abstract = build_abstract(title, description, feed.category)
        published = parse_date(entry.findtext("pubDate"))

        if not title or not url:
            continue
        if not is_relevant(title, summary, source, feed.category):
            continue

        items.append(
            {
                "title": title,
                "topic": title,
                "url": url,
                "source": source or "Google News",
                "published": published,
                "category": feed.category,
                "summary": summary or title,
                "abstract": abstract,
                "score": score_item(title, summary, feed.category),
            }
        )
    return items


def apply_recency_filter(items: list[dict], max_days: int) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_days)
    return [
        item for item in items
        if datetime.fromisoformat(item["published"].replace("Z", "+00:00")) >= cutoff
    ]


def _build_llm_prompt(candidates: list[dict]) -> str:
    candidate_lines: list[str] = []
    for i, item in enumerate(candidates):
        pub = item["published"][:10]
        article_text = (item.get("article_text") or "").strip()
        content = article_text if article_text else f"[headline only] {item['title']}"
        candidate_lines.append(
            f"[{i}] TITLE: {item['title']}\n"
            f"    SOURCE: {item['source']} | DATE: {pub} | CATEGORY: {item['category']}\n"
            f"    CONTENT: {content}"
        )

    return f"""You are a senior research curator for an autonomous-vehicles (AV) and AI academic website.

TASK: From the articles below, select the {MAX_ITEMS} most newsworthy and write a specific, factual abstract for each.

SELECTION PRIORITY (highest first):
1. Real-world AV/robotaxi deployments (Waymo, Tesla FSD, Aurora, Cruise, Mobileye, Zoox, NVIDIA DRIVE)
2. VLMs or LLMs applied to autonomous driving, perception, or explainability
3. Computer vision / sensor fusion breakthroughs for AVs
4. AI safety or regulation with direct AV relevance
5. Foundational AI model releases (LLMs, VLMs) relevant to AV research

STRICT ABSTRACT RULES — follow every rule:
1. CHAIN OF THOUGHT: Before writing each abstract, silently identify:
   (a) Exact actor — which company, research group, or person?
   (b) Exact event — what specifically happened (announcement, finding, deployment, lawsuit, recall, paper)?
   (c) Key details — any numbers, locations, dates, model names, benchmark scores?
   (d) Relevance — why does this matter for AV or AI research?
2. Write 3-4 sentences using ONLY facts from (a)-(d).
3. NEVER use vague filler: forbidden phrases include "a company announced", "researchers reported", "a new development", "has been introduced", "has been reported", "a major operator".
4. ALWAYS name the specific company/person/model in sentence 1 (e.g. "Waymo", "Tesla FSD v14", "NVIDIA Cosmos 3", "Illinois HB 3773").
5. If CONTENT is "[headline only]", start sentence 1 with "According to [SOURCE]," and base the abstract strictly on what the headline states — do not invent facts.
6. Prefer articles from the last 7 days. Deprioritise financial/stock news, press releases, and clickbait.

OUTPUT: Return ONLY a valid JSON array — no markdown fences, no extra text:
[
  {{"index": <int>, "abstract": "<3-4 sentence abstract>", "score": <int 1-100>}},
  ...
]

ARTICLES:
{chr(10).join(candidate_lines)}"""


def _parse_llm_response(raw: str, candidates: list[dict]) -> list[dict] | None:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    match = re.search(r"\[\s*\{.*?\}\s*\]", raw, re.DOTALL)
    if match:
        raw = match.group(0)

    selections: list[dict] = json.loads(raw)
    curated: list[dict] = []
    for sel in selections:
        idx = sel.get("index")
        if not isinstance(idx, int) or idx < 0 or idx >= len(candidates):
            continue
        item = dict(candidates[idx])
        llm_abstract = (sel.get("abstract") or "").strip()
        if llm_abstract:
            item["abstract"] = llm_abstract
            item["summary"] = llm_abstract
        raw_score = sel.get("score", item["score"])
        item["score"] = min(99, max(1, int(raw_score)))
        curated.append(item)
    return curated or None


def _call_llm(prompt: str, provider: str) -> str:
    """Dispatch a prompt to the requested provider and return raw text."""
    if provider == "gemini":
        import google.generativeai as genai  # noqa: PLC0415
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel(GEMINI_MODEL)
        resp = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.15,
                max_output_tokens=4096,
            ),
        )
        return resp.text or ""

    if provider == "groq":
        from groq import Groq  # noqa: PLC0415
        client = Groq(api_key=os.environ["GROQ_API_KEY"])
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            temperature=0.15,
        )
        return resp.choices[0].message.content or ""

    if provider == "hf":
        from huggingface_hub import InferenceClient  # noqa: PLC0415
        model = os.environ.get("HF_MODEL", DEFAULT_HF_MODEL)
        client = InferenceClient(model=model, token=os.environ["HF_TOKEN"])
        resp = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            temperature=0.15,
        )
        return resp.choices[0].message.content or ""

    raise ValueError(f"Unknown provider: {provider}")


def curate_with_llm(candidates: list[dict]) -> list[dict] | None:
    """Try Gemini → Groq → HF in order; return curated list or None."""
    providers = [
        ("gemini", "GEMINI_API_KEY", "google-generativeai"),
        ("groq",   "GROQ_API_KEY",   "groq"),
        ("hf",     "HF_TOKEN",        "huggingface_hub"),
    ]

    prompt = _build_llm_prompt(candidates)

    for provider, env_key, pkg in providers:
        if not os.environ.get(env_key):
            continue
        try:
            __import__(pkg.replace("-", "_").split(".")[0])
        except ImportError:
            print(f"warning: {pkg} not installed; skipping {provider}", file=sys.stderr)
            continue
        try:
            raw = _call_llm(prompt, provider)
            curated = _parse_llm_response(raw, candidates)
            if curated:
                print(
                    f"{provider.upper()} selected {len(curated)} items "
                    f"from {len(candidates)} candidates",
                    file=sys.stderr,
                )
                return curated[:MAX_ITEMS]
            print(f"warning: {provider} returned empty selection", file=sys.stderr)
        except Exception as exc:
            print(
                f"warning: {provider} curation failed ({type(exc).__name__}: {exc}); trying next",
                file=sys.stderr,
            )

    print("warning: all LLM providers failed or unavailable; using text fallback", file=sys.stderr)
    return None


def build_news() -> dict:
    seen: set[str] = set()
    collected: list[dict] = []

    for feed in FEEDS:
        try:
            payload = fetch(feed.url)
            parsed_items = parse_feed(feed, payload)
        except (ET.ParseError, TimeoutError, urllib.error.URLError, urllib.error.HTTPError) as exc:
            print(f"warning: failed to fetch {feed.category}: {exc}", file=sys.stderr)
            continue

        for item in parsed_items:
            key = re.sub(r"\W+", "", item["title"].lower())[:96]
            if key in seen:
                continue
            seen.add(key)
            collected.append(item)
        time.sleep(0.25)

    # Cascading recency filter: 14 days → 30 days → 60 days → all
    recent = collected
    for threshold in RECENCY_THRESHOLDS_DAYS:
        filtered = apply_recency_filter(collected, threshold)
        if len(filtered) >= MIN_ITEMS_BEFORE_FALLBACK:
            recent = filtered
            print(f"Recency filter: {len(recent)} items within {threshold} days", file=sys.stderr)
            break
    else:
        print(
            f"warning: fewer than {MIN_ITEMS_BEFORE_FALLBACK} items within {RECENCY_THRESHOLDS_DAYS[-1]} days;"
            f" using all {len(recent)} collected items",
            file=sys.stderr,
        )

    # Balance across categories and feed top candidates to the LLM
    recent.sort(key=lambda item: (item["score"], item["published"]), reverse=True)
    by_category: dict[str, list[dict]] = {}
    for item in recent:
        by_category.setdefault(item["category"], []).append(item)

    candidates: list[dict] = []
    for feed in FEEDS:
        candidates.extend(by_category.get(feed.category, [])[:MAX_PER_CATEGORY * 2])
    candidates.sort(key=lambda item: (item["score"], item["published"]), reverse=True)
    candidates = candidates[:LLM_CANDIDATE_LIMIT]

    # Fetch real article text for every candidate so the LLM (and fallback)
    # can write summaries based on actual content, not just titles.
    print(f"Fetching article text for {len(candidates)} candidates...", file=sys.stderr)
    for item in candidates:
        text = fetch_article_text(item["url"])
        item["article_text"] = text
        if text:
            print(f"  ok  {item['title'][:60]}", file=sys.stderr)
        else:
            print(f"  --  {item['title'][:60]}", file=sys.stderr)
        time.sleep(0.5)

    # LLM curation (requires HF_TOKEN); falls back to keyword scoring
    final_items = curate_with_llm(candidates)

    if not final_items:
        by_category_final: dict[str, list[dict]] = {}
        for item in candidates:
            by_category_final.setdefault(item["category"], []).append(item)

        final_items = []
        for feed in FEEDS:
            final_items.extend(by_category_final.get(feed.category, [])[:MAX_PER_CATEGORY])
        final_items.sort(key=lambda item: (item["score"], item["published"]), reverse=True)
        final_items = final_items[:MAX_ITEMS]

        # Use fetched article text as abstract when LLM is unavailable
        for item in final_items:
            text = item.get("article_text", "").strip()
            if text:
                item["abstract"] = leading_sentences(text, 3)
                item["summary"] = item["abstract"]

    # Strip internal scaffolding fields before writing to JSON
    output_fields = {"title", "topic", "url", "source", "published", "category", "summary", "abstract", "score"}
    clean_items = [{k: v for k, v in item.items() if k in output_fields} for item in final_items]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "items": clean_items,
    }


def update_archive(new_items: list[dict]) -> None:
    existing: list[dict] = []
    if ARCHIVE_OUTPUT.exists():
        try:
            data = json.loads(ARCHIVE_OUTPUT.read_text(encoding="utf-8"))
            existing = data.get("items", [])
        except (json.JSONDecodeError, KeyError):
            pass

    seen_urls = {item["url"] for item in existing}
    added = [item for item in new_items if item["url"] not in seen_urls]
    merged = added + existing
    merged.sort(key=lambda item: item["published"], reverse=True)

    payload = json.dumps(
        {
            "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "items": merged,
        },
        indent=2,
        ensure_ascii=False,
    )
    ARCHIVE_OUTPUT.write_text(payload + "\n", encoding="utf-8")
    print(f"archive: {len(merged)} total items (+{len(added)} new)", file=sys.stderr)


def main() -> int:
    news = build_news()
    if not news["items"]:
        print("error: no news items fetched; keeping existing file", file=sys.stderr)
        return 1

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(news, indent=2, ensure_ascii=False)
    OUTPUT.write_text(payload + "\n", encoding="utf-8")
    JS_OUTPUT.write_text(f"window.NEWS_FEED = {payload};\n", encoding="utf-8")
    print(f"wrote {len(news['items'])} items to {OUTPUT.relative_to(ROOT)} and {JS_OUTPUT.relative_to(ROOT)}")
    update_archive(news["items"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
