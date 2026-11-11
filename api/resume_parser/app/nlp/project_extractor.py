from __future__ import annotations

import re

from app.schemas.resume_schema import ProjectItem


def extract_projects(section_text: str | None) -> list[ProjectItem]:
    if not section_text:
        return []

    blocks = re.split(r"\n{2,}", section_text.strip())
    projects: list[ProjectItem] = []

    for block in blocks:
        lines = [line.strip(" -•\t") for line in block.split("\n") if line.strip()]
        if not lines:
            continue
        name = lines[0][:160]
        description = " ".join(lines[1:4])[:500] if len(lines) > 1 else None
        tech_line = next((line for line in lines if re.search(r"tech|stack|tools", line, re.I)), "")
        technologies = [
            part.strip()
            for part in re.split(r"[,|/]", tech_line)
            if 1 < len(part.strip()) < 40
        ][:12]
        projects.append(
            ProjectItem(name=name, description=description, technologies=technologies)
        )

    return projects
