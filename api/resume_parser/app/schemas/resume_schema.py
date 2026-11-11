from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


class FieldEvidence(BaseModel):
    source_text: Optional[str] = None
    page_number: Optional[int] = None
    method: Optional[str] = None
    confidence: Optional[float] = Field(
        default=None,
        description="Heuristic score 0-1, not a calibrated probability",
    )


class PersonalInformation(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    evidence: dict[str, FieldEvidence] = Field(default_factory=dict)


class Skills(BaseModel):
    programming_languages: list[str] = Field(default_factory=list)
    backend: list[str] = Field(default_factory=list)
    frontend: list[str] = Field(default_factory=list)
    databases: list[str] = Field(default_factory=list)
    cloud: list[str] = Field(default_factory=list)
    devops: list[str] = Field(default_factory=list)
    data_science: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)


class ExperienceItem(BaseModel):
    company: Optional[str] = None
    designation: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration: Optional[str] = None
    responsibilities: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    is_internship: bool = False
    evidence: dict[str, FieldEvidence] = Field(default_factory=dict)


class EducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[str] = None
    grade: Optional[str] = None
    specialization: Optional[str] = None
    evidence: dict[str, FieldEvidence] = Field(default_factory=dict)


class ProjectItem(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: list[str] = Field(default_factory=list)


class CertificationItem(BaseModel):
    name: Optional[str] = None
    issuing_organization: Optional[str] = None
    completion_year: Optional[str] = None


class ParsedResume(BaseModel):
    personal_information: PersonalInformation = Field(default_factory=PersonalInformation)
    professional_summary: Optional[str] = None
    total_experience: Optional[str] = None
    skills: Skills = Field(default_factory=Skills)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    internships: list[ExperienceItem] = Field(default_factory=list)
    meta: dict[str, Any] = Field(default_factory=dict)


class ParseJobMessage(BaseModel):
    event: str = "resume.parse.requested"
    candidate_id: str
    company_id: str
    workflow_id: Optional[str] = None
    resume_key: str
    resume_url: Optional[str] = None
    file_name: Optional[str] = None


class ParseCompletedMessage(BaseModel):
    event: str = "resume.parse.completed"
    candidate_id: str
    company_id: str
    success: bool
    parsed: Optional[ParsedResume] = None
    error: Optional[str] = None
