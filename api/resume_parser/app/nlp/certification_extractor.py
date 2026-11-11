from __future__ import annotations

import re

from app.schemas.resume_schema import CertificationItem


def extract_certifications(section_text: str | None) -> list[CertificationItem]:
    if not section_text:
        return []

    items: list[CertificationItem] = []
    for line in section_text.split("\n"):
        clean = line.strip(" -•\t")
        if len(clean) < 4:
            continue
        year_match = re.search(r"\b(19|20)\d{2}\b", clean)
        org = None
        if " - " in clean:
            parts = [p.strip() for p in clean.split(" - ", 1)]
            name, org = parts[0], parts[1]
        else:
            name = clean
        items.append(
            CertificationItem(
                name=name[:180],
                issuing_organization=org[:180] if org else None,
                completion_year=year_match.group(0) if year_match else None,
            )
        )
    return items[:20]
