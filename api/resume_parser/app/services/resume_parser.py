from __future__ import annotations

import json
import re
from pathlib import Path
from uuid import uuid4

from app.config import get_settings
from app.extractor.document_router import extract_document
from app.nlp.certification_extractor import extract_certifications
from app.nlp.education_extractor import extract_education
from app.nlp.entity_extractor import extract_personal_information
from app.nlp.experience_extractor import calculate_total_experience, extract_experience
from app.nlp.project_extractor import extract_projects
from app.nlp.skill_extractor import extract_skills
from app.preprocessing.section_detector import detect_sections
from app.preprocessing.text_cleaner import clean_resume_text
from app.schemas.resume_schema import ParsedResume
from app.services.resume_validator import validate_resume_file


def _extract_list_section(section_text: str | None) -> list[str]:
    if not section_text:
        return []
    items: list[str] = []
    for line in section_text.split("\n"):
        clean = line.strip(" -•\t")
        if len(clean) >= 2:
            items.append(clean[:240])
    return items[:30]


class ResumeParserService:
    def parse_file(self, path: Path, original_name: str | None = None) -> ParsedResume:
        validate_resume_file(path, declared_name=original_name)
        extracted = extract_document(path)
        text = clean_resume_text(extracted.full_text)
        sections = detect_sections(text)

        header = "\n".join(text.split("\n")[:30])
        personal = extract_personal_information(
            text,
            header_text=header,
            original_name=original_name,
        )
        skills = extract_skills(text, sections.get("skills").text if "skills" in sections else None)
        experience = extract_experience(sections.get("experience").text if "experience" in sections else None)
        education = extract_education(sections.get("education").text if "education" in sections else None)
        projects = extract_projects(sections.get("projects").text if "projects" in sections else None)
        certifications = extract_certifications(
            sections.get("certifications").text if "certifications" in sections else None
        )
        achievements = _extract_list_section(
            sections.get("achievements").text if "achievements" in sections else None
        )
        languages = _extract_list_section(
            sections.get("languages").text if "languages" in sections else None
        )
        internships = [item for item in experience if item.is_internship]
        full_time = [item for item in experience if not item.is_internship]

        summary = None
        if "summary" in sections and sections["summary"].text:
            summary = sections["summary"].text.strip()[:1500] or None
        if not summary:
            # Do not invent — only use a short non-contact paragraph near top if labeled-like
            for para in re.split(r"\n{2,}", header):
                compact = para.strip()
                if 80 <= len(compact) <= 600 and "@" not in compact:
                    summary = compact
                    break

        parsed = ParsedResume(
            personal_information=personal,
            professional_summary=summary,
            total_experience=calculate_total_experience(full_time),
            skills=skills,
            experience=full_time,
            education=education,
            projects=projects,
            certifications=certifications,
            languages=languages,
            achievements=achievements,
            internships=internships,
            meta={
                "source_type": extracted.source_type,
                "page_count": len(extracted.pages),
                "sections_detected": sorted(sections.keys()),
                "original_name": original_name,
            },
        )

        settings = get_settings()
        out_path = settings.parsed_output_path / f"{uuid4()}.json"
        out_path.write_text(parsed.model_dump_json(indent=2), encoding="utf-8")
        parsed.meta["parsed_file"] = str(out_path)
        return parsed


resume_parser_service = ResumeParserService()
