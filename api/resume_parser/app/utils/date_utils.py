from __future__ import annotations

from datetime import date
from typing import Optional

import dateparser


PRESENT_TOKENS = {"present", "current", "till date", "to date", "ongoing", "now"}


def normalize_date(value: str | None) -> str | None:
    if not value:
        return None
    raw = value.strip()
    if raw.lower() in PRESENT_TOKENS:
        return "Present"
    parsed = dateparser.parse(raw, settings={"PREFER_DAY_OF_MONTH": "first"})
    if not parsed:
        return None
    return parsed.date().isoformat()


def parse_date(value: str | None) -> Optional[date]:
    if not value:
        return None
    if value.strip().lower() in PRESENT_TOKENS or value == "Present":
        return date.today()
    parsed = dateparser.parse(value, settings={"PREFER_DAY_OF_MONTH": "first"})
    return parsed.date() if parsed else None
