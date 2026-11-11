from __future__ import annotations

import re
from dataclasses import dataclass


SECTION_PATTERNS: dict[str, list[str]] = {
    "summary": [
        r"professional\s+summary",
        r"summary",
        r"profile",
        r"objective",
        r"about\s+me",
        r"career\s+objective",
    ],
    "experience": [
        r"work\s+experience",
        r"professional\s+experience",
        r"employment\s+history",
        r"experience",
        r"work\s+history",
    ],
    "education": [r"education", r"academic\s+background", r"qualifications"],
    "skills": [
        r"technical\s+skills",
        r"skills",
        r"technologies",
        r"tech\s+stack",
        r"core\s+competencies",
    ],
    "projects": [r"projects", r"personal\s+projects", r"key\s+projects"],
    "certifications": [r"certifications?", r"licenses?"],
    "achievements": [r"achievements?", r"awards?", r"accomplishments?"],
    "languages": [r"languages?"],
    "internships": [r"internships?"],
}


@dataclass
class Section:
    name: str
    start: int
    end: int
    text: str


def detect_sections(text: str) -> dict[str, Section]:
    lines = text.split("\n")
    hits: list[tuple[int, str]] = []

    for idx, line in enumerate(lines):
        compact = re.sub(r"\s+", " ", line.strip().lower())
        if not compact or len(compact) > 60:
            continue
        for section_name, patterns in SECTION_PATTERNS.items():
            for pattern in patterns:
                if re.fullmatch(pattern, compact) or re.match(rf"^{pattern}\s*:?\s*$", compact):
                    hits.append((idx, section_name))
                    break

    if not hits:
        return {}

    hits.sort(key=lambda item: item[0])
    sections: dict[str, Section] = {}

    for i, (start_idx, name) in enumerate(hits):
        end_idx = hits[i + 1][0] if i + 1 < len(hits) else len(lines)
        body = "\n".join(lines[start_idx + 1 : end_idx]).strip()
        # Prefer first occurrence of a section unless empty
        if name not in sections or (not sections[name].text and body):
            sections[name] = Section(name=name, start=start_idx, end=end_idx, text=body)

    return sections
