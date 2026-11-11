from __future__ import annotations

import re

from app.data.skill_taxonomy import ALIAS_TO_CANONICAL, CATEGORY_MAP
from app.schemas.resume_schema import Skills


def extract_skills(text: str, skills_section: str | None = None) -> Skills:
    haystacks = [skills_section or "", text]
    found: dict[str, str] = {}

    for haystack in haystacks:
        if not haystack:
            continue
        lower = f" {haystack.lower()} "
        for alias, canonical in ALIAS_TO_CANONICAL.items():
            # Word-ish boundary to avoid matching inside unrelated tokens
            pattern = re.compile(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", re.I)
            if pattern.search(lower):
                found[canonical] = CATEGORY_MAP.get(canonical, "backend")

    skills = Skills()
    for canonical, category in sorted(found.items()):
        getattr(skills, category).append(canonical)
    return skills
