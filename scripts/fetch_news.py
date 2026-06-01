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
MAX_ITEMS = 12
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
                "q": '"automated vehicles" OR "autonomous vehicles" when:14d',
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
                "q": '"AI safety" OR "artificial intelligence" OR "AI model" when:7d',
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
                "q": '"vision language model" OR "multimodal AI" when:30d',
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
                "q": '"computer vision" "autonomous driving" when:30d',
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
    "safety": 7,
    "regulation": 5,
    "deployment": 5,
    "research": 4,
}

CATEGORY_LABELS = {
    "automated-vehicles": "automated vehicle",
    "ai": "AI",
    "vlm": "vision-language model",
    "computer-vision": "computer vision",
}

CATEGORY_REQUIRED_TERMS = {
    "automated-vehicles": ("autonomous", "automated", "robotaxi", "self-driving", "driverless"),
    "ai": ("ai", "artificial intelligence", "machine learning", "foundation model", "safety benchmark"),
    "vlm": ("vision-language", "vision language", "multimodal", "visual language"),
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
    if category in {"automated-vehicles", "vlm"}:
        score += 8
    return min(score, 99)


def is_relevant(title: str, summary: str, source: str, category: str) -> bool:
    haystack = f"{title} {summary}".lower()
    source_text = source.lower()
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
        published = parse_date(entry.findtext("pubDate"))

        if not title or not url:
            continue
        if not is_relevant(title, summary, source, feed.category):
            continue

        items.append(
            {
                "title": title,
                "url": url,
                "source": source or "Google News",
                "published": published,
                "category": feed.category,
                "summary": summary or title,
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

    if len(balanced) < MAX_ITEMS:
        used = {item["url"] for item in balanced}
        for item in collected:
            if item["url"] in used:
                continue
            balanced.append(item)
            used.add(item["url"])
            if len(balanced) >= MAX_ITEMS:
                break

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
    OUTPUT.write_text(json.dumps(news, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {len(news['items'])} items to {OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
