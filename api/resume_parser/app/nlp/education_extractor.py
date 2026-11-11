from __future__ import annotations

import re

from app.schemas.resume_schema import EducationItem, FieldEvidence


DEGREE_PATTERNS = [
    r"b\.?\s*tech",
    r"b\.?\s*e\.?",
    r"bca",
    r"mca",
    r"b\.?\s*sc",
    r"m\.?\s*sc",
    r"mba",
    r"diploma",
    r"ph\.?\s*d",
    r"bachelor",
    r"master",
]


def extract_education(section_text: str | None) -> list[EducationItem]:
    if not section_text:
        return []

    blocks = re.split(r"\n{2,}", section_text.strip())
    items: list[EducationItem] = []

    for block in blocks:
        lower = block.lower()
        degree = None
        for pattern in DEGREE_PATTERNS:
            match = re.search(pattern, lower, re.I)
            if match:
                degree = match.group(0)
                break

        year_match = re.search(r"\b(19|20)\d{2}\b", block)
        grade_match = re.search(r"(?:cgpa|gpa|grade)\s*[:\-]?\s*([0-9.]+)", block, re.I)

        lines = [line.strip() for line in block.split("\n") if line.strip()]
        institution = lines[1] if len(lines) > 1 else (lines[0] if lines else None)

        if not degree and not institution:
            continue

        items.append(
            EducationItem(
                degree=degree.title() if degree else None,
                institution=institution[:180] if institution else None,
                graduation_year=year_match.group(0) if year_match else None,
                grade=grade_match.group(1) if grade_match else None,
                specialization=None,
                evidence={
                    "block": FieldEvidence(
                        source_text=block[:400], method="section_block", confidence=0.5
                    )
                },
            )
        )

    return items
