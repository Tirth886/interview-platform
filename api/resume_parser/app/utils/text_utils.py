from __future__ import annotations

import re


EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_RE = re.compile(
    r"(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}"
)
URL_RE = re.compile(r"https?://[^\s<>\")]+|www\.[^\s<>\")]+", re.IGNORECASE)
LINKEDIN_RE = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9_-]+/?", re.I)
GITHUB_RE = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_-]+/?", re.I)


def normalize_whitespace(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def safe_filename(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]", "_", name).strip("._")
    return cleaned[:180] or "resume"


def first_match(pattern: re.Pattern[str], text: str) -> str | None:
    match = pattern.search(text)
    return match.group(0) if match else None
