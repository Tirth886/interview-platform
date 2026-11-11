from __future__ import annotations

from app.utils.text_utils import normalize_whitespace


def clean_resume_text(text: str) -> str:
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = cleaned.replace("•", "-").replace("●", "-").replace("○", "-")
    return normalize_whitespace(cleaned)
