from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import fitz  # PyMuPDF


@dataclass
class PageText:
    page_number: int
    text: str


@dataclass
class ExtractedDocument:
    pages: list[PageText]
    full_text: str
    source_type: str = "pdf"


def extract_pdf_text(path: Path) -> ExtractedDocument:
    doc = fitz.open(path)
    pages: list[PageText] = []
    chunks: list[str] = []

    for index, page in enumerate(doc, start=1):
        text = page.get_text("text") or ""
        pages.append(PageText(page_number=index, text=text))
        chunks.append(text)

    doc.close()
    return ExtractedDocument(pages=pages, full_text="\n".join(chunks), source_type="pdf")
