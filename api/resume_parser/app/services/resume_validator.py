from __future__ import annotations

from pathlib import Path

from app.config import get_settings


SIGNATURES = {
    ".pdf": [b"%PDF"],
    ".docx": [b"PK\x03\x04"],
}


class ResumeValidationError(ValueError):
    pass


def validate_resume_file(path: Path, declared_name: str | None = None) -> None:
    settings = get_settings()
    suffix = path.suffix.lower()
    if suffix not in settings.allowed_extension_set:
        raise ResumeValidationError(
            f"Unsupported extension '{suffix}'. Allowed: {sorted(settings.allowed_extension_set)}"
        )

    if not path.exists() or not path.is_file():
        raise ResumeValidationError("Resume file not found.")

    size = path.stat().st_size
    if size <= 0:
        raise ResumeValidationError("Resume file is empty.")
    if size > settings.max_upload_bytes:
        raise ResumeValidationError(
            f"Resume exceeds max size of {settings.max_upload_size_mb} MB."
        )

    signatures = SIGNATURES.get(suffix, [])
    header = path.read_bytes()[:8]
    if signatures and not any(header.startswith(sig) for sig in signatures):
        raise ResumeValidationError("File signature does not match extension.")

    if declared_name:
        declared_suffix = Path(declared_name).suffix.lower()
        if declared_suffix and declared_suffix != suffix:
            raise ResumeValidationError("Declared filename extension mismatch.")
