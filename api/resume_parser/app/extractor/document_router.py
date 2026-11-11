from __future__ import annotations

from pathlib import Path

from app.extractor.docx_extractor import extract_docx_text
from app.extractor.pdf_extractor import ExtractedDocument, extract_pdf_text


class UnsupportedDocumentError(ValueError):
    pass


def extract_document(path: Path) -> ExtractedDocument:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return extract_pdf_text(path)
    if suffix == ".docx":
        return extract_docx_text(path)
    raise UnsupportedDocumentError(f"Unsupported file type: {suffix}")
