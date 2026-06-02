#!/usr/bin/env python3
"""Build the static news feed used by the website.

The site is hosted on GitHub Pages, so this script writes a JSON file that the
browser can load without a live server or database.
"""

from __future__ import annotations

import email.utils
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "news.json"
JS_OUTPUT = ROOT / "data" / "news.js"
MAX_ITEMS = 10
MAX_PER_CATEGORY = 3


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
                "q": '("autonomous vehicles" OR "automated vehicles" OR robotaxi OR "self-driving") (Reuters OR "AP News" OR Waymo OR Tesla OR NVIDIA OR "The Verge" OR "IEEE Spectrum" OR Bloomberg OR Wired) when:30d',
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
                "q": '("AI safety" OR "artificial intelligence" OR "AI model" OR "AI regulation") (Reuters OR "AP News" OR Nature OR OpenAI OR Google OR Microsoft OR "MIT Technology Review" OR "IEEE Spectrum" OR Bloomberg) when:14d',
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
                "q": '("large language model" OR "LLM" OR "foundation model" OR "language model") ("autonomous" OR "driving" OR "vehicle" OR "transportation" OR "mobility" OR "explainable" OR "XAI") (Nature OR NVIDIA OR Google OR OpenAI OR Microsoft OR "MIT Technology Review" OR "IEEE Spectrum" OR Reuters OR TechCrunch) when:60d',
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
                "q": '("natural language processing" OR "NLP" OR "language understanding" OR "text generation" OR "speech recognition") ("autonomous vehicle" OR "driving" OR "human machine" OR "HMI" OR "explainability" OR "transportation") (IEEE OR Nature OR Google OR NVIDIA OR "MIT Technology Review" OR Reuters OR "The Verge") when:60d',
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
                "q": '("vision-language model" OR "vision language model" OR "multimodal AI" OR "VLM") (Nature OR NVIDIA OR Google OR OpenAI OR Microsoft OR "MIT Technology Review" OR "IEEE Spectrum") when:45d',
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
                "q": '("computer vision" OR perception OR lidar OR "scene understanding") ("autonomous driving" OR "automated vehicles" OR "self-driving") (Nature OR NVIDIA OR Waymo OR "Carnegie Mellon" OR "MIT News" OR "IEEE Spectrum" OR Google) when:45d',
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
)

ALLOWED_SOURCE_NAMES = {
    "reuters",
    "associated press",
    "ap news",
    "bbc",
    "the guardian",
    "the new york times",
    "washington post",
    "the wall street journal",
    "financial times",
    "bloomberg",
    "wired",
    "the verge",
    "ars technica",
    "mit technology review",
    "ieee spectrum",
    "nature",
    "science",
    "eurekalert",
    "medical xpress",
    "techcrunch",
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
    "meta",
    "waymo",
    "tesla",
    "uber",
    "toyota",
    "hyundai",
    "carnegie mellon university",
    "stanford university",
    "mit news",
    "news at iu",
    "the regulatory review",
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


def clean_text(value: str | None, limit: int = 220) -> str:
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
            return "Reuters reports concerns from Tesla AI training workers about self-driving trust and safety measurement."
        if "suspends" in lower_title or "pauses" in lower_title or "flood" in lower_title:
            return "Waymo's operational pause highlights how robotaxi services remain constrained by safety validation and incident response."
        if "rollout" in lower_title or "wait times" in lower_title:
            return "Tesla's robotaxi deployment is being watched closely for operational readiness, user experience, and safety performance."
        if "robotaxi" in lower_title and "target" in lower_title:
            return "Robotaxi partnerships continue to expand, with operators targeting new city deployments."
        if "regulation" in lower_title or "policy" in lower_title:
            return "Policy and safety developments are shaping how automated vehicles are tested, certified, and deployed."
        if "waymo" in lower_title or "tesla" in lower_title or "robotaxi" in lower_title:
            return "Commercial autonomous-driving programs continue to face deployment, safety, and operational scrutiny."
        return "A recent automated-vehicle development relevant to deployment, safety, or mobility operations."
    if category == "ai":
        if "safety" in lower_title:
            return "AI safety remains a policy and engineering concern as models move into higher-impact settings."
        if "regulation" in lower_title or "policy" in lower_title:
            return "AI governance and regulation continue to evolve as governments respond to rapid model capability growth."
        return "A recent AI development with implications for model capability, governance, or applied intelligent systems."
    if category == "llm":
        if "autonomous" in lower_title or "driving" in lower_title or "vehicle" in lower_title:
            return "Large language models are being applied to automated vehicle decision-making, explanation generation, and human-machine interaction."
        if "reasoning" in lower_title or "planning" in lower_title:
            return "Advances in LLM reasoning and planning capabilities have direct implications for autonomous system explainability and trust."
        return "A large language model development with potential applications to automated vehicle explanation, decision-making, or human-machine interaction."
    if category == "nlp":
        if "autonomous" in lower_title or "driving" in lower_title:
            return "Natural language processing advances are enabling richer human-vehicle communication and automated explanation generation."
        if "speech" in lower_title or "dialogue" in lower_title:
            return "Speech and dialogue research is improving how autonomous systems communicate decisions to passengers and operators."
        return "A natural language processing advance with relevance to automated vehicle communication, explanation generation, or driver interaction design."
    if category == "vlm":
        return "A multimodal AI update connecting visual, language, audio, or agentic capabilities."
    if category == "computer-vision":
        return "A computer-vision or perception development relevant to automated driving and intelligent mobility."
    return "A recent development relevant to automated mobility and AI research."


def parse_feed(feed: Feed, payload: bytes) -> list[dict]:
    root = ET.fromstring(payload)
    items = []
    for entry in root.findall(".//item"):
        url = clean_text(entry.findtext("link"), 500)
        source_node = entry.find("source")
        source = clean_text(source_node.text if source_node is not None else "Google News", 80)
        title = strip_source_suffix(clean_text(entry.findtext("title"), 160), source)
        description = strip_source_suffix(clean_text(entry.findtext("description"), 260), source)
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

    collected.sort(key=lambda item: (item["score"], item["published"]), reverse=True)
    by_category: dict[str, list[dict]] = {}
    for item in collected:
        by_category.setdefault(item["category"], []).append(item)

    balanced = []
    for feed in FEEDS:
        balanced.extend(by_category.get(feed.category, [])[:MAX_PER_CATEGORY])

    balanced.sort(key=lambda item: (item["score"], item["published"]), reverse=True)
    balanced = balanced[:MAX_ITEMS]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "items": balanced,
    }


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
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
