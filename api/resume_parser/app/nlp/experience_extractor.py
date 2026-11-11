from __future__ import annotations

import re
from datetime import date

from app.schemas.resume_schema import ExperienceItem, FieldEvidence
from app.utils.date_utils import normalize_date, parse_date


DATE_RANGE_RE = re.compile(
    r"(?P<start>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}/\d{4}|\d{4})"
    r"\s*(?:-|–|—|to)\s*"
    r"(?P<end>Present|Current|Till Date|To Date|Now|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}/\d{4}|\d{4})",
    re.I,
)


def _months_between(start: date, end: date) -> int:
    return max(0, (end.year - start.year) * 12 + (end.month - start.month))


def _format_duration(months: int) -> str:
    years, rem = divmod(months, 12)
    parts: list[str] = []
    if years:
        parts.append(f"{years} year{'s' if years != 1 else ''}")
    if rem:
        parts.append(f"{rem} month{'s' if rem != 1 else ''}")
    return ", ".join(parts) if parts else None  # type: ignore[return-value]


def extract_experience(section_text: str | None) -> list[ExperienceItem]:
    if not section_text or not section_text.strip():
        return []

    blocks = re.split(r"\n{2,}", section_text.strip())
    items: list[ExperienceItem] = []

    for block in blocks:
        lines = [line.strip(" -•\t") for line in block.split("\n") if line.strip()]
        if not lines:
            continue

        date_match = DATE_RANGE_RE.search(block)
        start_date = normalize_date(date_match.group("start")) if date_match else None
        end_date = normalize_date(date_match.group("end")) if date_match else None

        company = None
        designation = None
        if len(lines) >= 2:
            designation = lines[0][:120]
            company = lines[1][:120]
        elif lines:
            designation = lines[0][:120]

        is_internship = bool(re.search(r"intern", block, re.I))
        bullets = [line for line in lines[2:] if len(line) > 20][:12]

        duration = None
        start_d = parse_date(start_date)
        end_d = parse_date(end_date)
        if start_d and end_d:
            duration = _format_duration(_months_between(start_d, end_d))

        # Require at least a title-ish line; do not invent dates/company
        if not designation and not company:
            continue

        items.append(
            ExperienceItem(
                company=company,
                designation=designation,
                start_date=start_date,
                end_date=end_date,
                duration=duration,
                responsibilities=bullets,
                technologies=[],
                is_internship=is_internship,
                evidence={
                    "block": FieldEvidence(
                        source_text=block[:500],
                        method="section_block",
                        confidence=0.5,
                    )
                },
            )
        )

    def sort_key(item: ExperienceItem):
        parsed = parse_date(item.start_date)
        return parsed or date.min

    items.sort(key=sort_key, reverse=True)
    return items


def calculate_total_experience(items: list[ExperienceItem]) -> str | None:
    intervals: list[tuple[date, date]] = []
    for item in items:
        if item.is_internship:
            continue
        start = parse_date(item.start_date)
        end = parse_date(item.end_date)
        if start and end and end >= start:
            intervals.append((start, end))

    if not intervals:
        return None

    intervals.sort(key=lambda pair: pair[0])
    merged: list[list[date]] = [[intervals[0][0], intervals[0][1]]]
    for start, end in intervals[1:]:
        last = merged[-1]
        if start <= last[1]:
            if end > last[1]:
                last[1] = end
        else:
            merged.append([start, end])

    total_months = sum(_months_between(start, end) for start, end in merged)
    return _format_duration(total_months)
