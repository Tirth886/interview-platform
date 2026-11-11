from __future__ import annotations

import logging
import re
from functools import lru_cache
from typing import Any, Optional

from app.config import get_settings
from app.schemas.resume_schema import FieldEvidence, PersonalInformation
from app.utils.text_utils import (
    EMAIL_RE,
    GITHUB_RE,
    LINKEDIN_RE,
    PHONE_RE,
    URL_RE,
    first_match,
)

logger = logging.getLogger(__name__)

NAME_STOPWORDS = {
    "resume",
    "curriculum",
    "vitae",
    "cv",
    "profile",
    "objective",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "linkedin",
    "github",
    "phone",
    "email",
    "address",
    "contact",
    "professional",
    "personal",
    "details",
    "information",
}

# Job-title / role words that spaCy often mislabels as PERSON
TITLE_TOKENS = {
    "software",
    "engineer",
    "engineering",
    "developer",
    "development",
    "programmer",
    "full",
    "fullstack",
    "stack",
    "frontend",
    "backend",
    "front",
    "back",
    "end",
    "senior",
    "junior",
    "lead",
    "principal",
    "staff",
    "architect",
    "manager",
    "director",
    "consultant",
    "analyst",
    "intern",
    "internship",
    "associate",
    "specialist",
    "designer",
    "devops",
    "sre",
    "qa",
    "tester",
    "founder",
    "cofounder",
    "ceo",
    "cto",
    "coo",
    "cfo",
    "president",
    "head",
    "owner",
    "freelancer",
    "student",
    "graduate",
    "trainee",
}


@lru_cache
def get_nlp() -> Any | None:
    """Load spaCy if installed; otherwise return None and use regex-only extraction."""
    try:
        import spacy
    except ImportError:
        logger.warning("spaCy is not installed; using regex-only name extraction")
        return None

    settings = get_settings()
    try:
        return spacy.load(settings.spacy_model)
    except OSError:
        nlp = spacy.blank("en")
        if "sentencizer" not in nlp.pipe_names:
            nlp.add_pipe("sentencizer")
        return nlp


def _normalize_name_spacing(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" |-•\t,;")


def _title_case_name(value: str) -> str:
    parts: list[str] = []
    for token in value.split(" "):
        if not token:
            continue
        if token.isupper() or token.islower():
            parts.append(token.capitalize())
        else:
            parts.append(token)
    return " ".join(parts)


def _tokens(value: str) -> list[str]:
    return [t for t in re.split(r"\s+", value.strip()) if t]


def _is_title_like(value: str) -> bool:
    tokens = [re.sub(r"[^a-zA-Z]", "", t).lower() for t in _tokens(value)]
    tokens = [t for t in tokens if t]
    if not tokens:
        return True
    title_hits = sum(1 for t in tokens if t in TITLE_TOKENS)
    # "Software Engineer", "Senior Developer", "Full Stack Developer"
    if title_hits >= 1 and title_hits / len(tokens) >= 0.4:
        return True
    if title_hits >= 2:
        return True
    return False


def _looks_like_name(value: str) -> bool:
    value = _normalize_name_spacing(value)
    tokens = _tokens(value)
    if not (2 <= len(tokens) <= 4):
        return False
    if any(t.lower() in NAME_STOPWORDS for t in tokens):
        return False
    if _is_title_like(value):
        return False
    if any(ch.isdigit() for ch in value):
        return False
    if "@" in value or "http" in value.lower() or "www." in value.lower():
        return False
    if "|" in value or "," in value:
        return False
    # Allow ALL CAPS names like "TIRTH JAIN"
    return all(re.match(r"^[A-Za-z][A-Za-z.'-]*$", t) for t in tokens)


def _score_name_candidate(value: str, *, source: str, line_index: int | None = None) -> float:
    value = _normalize_name_spacing(value)
    if not _looks_like_name(value):
        return -1.0

    tokens = _tokens(value)
    score = 0.0

    if source == "header_line":
        score += 3.0
        if line_index is not None:
            score += max(0.0, 2.0 - (0.4 * line_index))
    elif source == "spacy_person":
        score += 1.2
    elif source == "email_local":
        score += 0.8
    elif source == "filename":
        score += 0.6

    # Prefer 2–3 token person names
    if len(tokens) == 2:
        score += 1.0
    elif len(tokens) == 3:
        score += 0.7

    # ALL CAPS first-line names are common on resumes
    if value.isupper():
        score += 0.5

    # Penalize very short tokens
    if any(len(t) == 1 for t in tokens):
        score -= 0.8

    return score


def _name_from_email(email: str | None) -> Optional[str]:
    if not email or "@" not in email:
        return None
    local = email.split("@", 1)[0]
    local = re.sub(r"\d+", " ", local)
    local = local.replace(".", " ").replace("_", " ").replace("-", " ")
    candidate = _normalize_name_spacing(local)
    if _looks_like_name(candidate):
        return _title_case_name(candidate)
    return None


def _name_from_filename(original_name: str | None) -> Optional[str]:
    if not original_name:
        return None
    stem = re.sub(r"\.[^.]+$", "", original_name)
    stem = re.sub(r"(?i)\b(resume|cv|curriculum|vitae)\b", " ", stem)
    stem = stem.replace("_", " ").replace("-", " ")
    stem = re.sub(r"\d+", " ", stem)
    candidate = _normalize_name_spacing(stem)
    if _looks_like_name(candidate):
        return _title_case_name(candidate)
    return None


def extract_personal_information(
    text: str,
    header_text: str | None = None,
    original_name: str | None = None,
) -> PersonalInformation:
    search_space = header_text or "\n".join(text.split("\n")[:25])
    nlp = get_nlp()

    email = first_match(EMAIL_RE, text)
    phone_match = PHONE_RE.search(text)
    phone = None
    if phone_match:
        digits = re.sub(r"\D", "", phone_match.group(0))
        if 7 <= len(digits) <= 15:
            phone = phone_match.group(0).strip()

    linkedin = first_match(LINKEDIN_RE, text)
    github = first_match(GITHUB_RE, text)

    portfolio = None
    for match in URL_RE.finditer(text):
        url = match.group(0)
        lower = url.lower()
        if "linkedin.com" in lower or "github.com" in lower:
            continue
        portfolio = url
        break

    location = None
    candidates: list[tuple[str, str, float]] = []

    # 1) Header lines — strongest signal for resume names (often ALL CAPS)
    for idx, raw_line in enumerate(search_space.split("\n")[:10]):
        line = _normalize_name_spacing(raw_line)
        if not line:
            continue
        # Strip trailing role separators: "Name | Title"
        if "|" in line:
            left = _normalize_name_spacing(line.split("|", 1)[0])
            if _looks_like_name(left):
                line = left
        score = _score_name_candidate(line, source="header_line", line_index=idx)
        if score >= 0:
            candidates.append((_title_case_name(line), "header_line", score))

    # 2) spaCy PERSON — useful but noisy (titles often mislabeled)
    if nlp is not None:
        doc = nlp(search_space)
        for ent in doc.ents:
            if ent.label_ in {"GPE", "LOC"} and not location:
                location = ent.text.strip()
            if ent.label_ != "PERSON":
                continue
            name = _normalize_name_spacing(ent.text)
            score = _score_name_candidate(name, source="spacy_person")
            if score >= 0:
                candidates.append((_title_case_name(name), "spacy_person", score))

    # 3) Fallbacks from email / filename
    email_name = _name_from_email(email)
    if email_name:
        score = _score_name_candidate(email_name, source="email_local")
        if score >= 0:
            candidates.append((email_name, "email_local", score))

    file_name = _name_from_filename(original_name)
    if file_name:
        score = _score_name_candidate(file_name, source="filename")
        if score >= 0:
            candidates.append((file_name, "filename", score))

    full_name: Optional[str] = None
    name_method: Optional[str] = None
    if candidates:
        candidates.sort(key=lambda item: item[2], reverse=True)
        full_name, name_method, _ = candidates[0]

    evidence: dict[str, FieldEvidence] = {}
    if full_name:
        evidence["full_name"] = FieldEvidence(
            source_text=full_name,
            method=name_method,
            confidence=0.9 if name_method == "header_line" else 0.65,
        )
    if email:
        evidence["email"] = FieldEvidence(source_text=email, method="regex", confidence=0.95)
    if phone:
        evidence["phone"] = FieldEvidence(source_text=phone, method="regex", confidence=0.8)

    return PersonalInformation(
        full_name=full_name,
        email=email,
        phone=phone,
        location=location,
        linkedin=linkedin,
        github=github,
        portfolio=portfolio,
        evidence=evidence,
    )
