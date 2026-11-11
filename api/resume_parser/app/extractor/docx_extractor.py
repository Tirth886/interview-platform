from __future__ import annotations

from pathlib import Path

from docx import Document

from app.extractor.pdf_extractor import ExtractedDocument, PageText


def extract_docx_text(path: Path) -> ExtractedDocument:
    document = Document(path)
    lines: list[str] = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if text:
            lines.append(text)

    for table in document.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if cells:
                lines.append(" | ".join(cells))

    full_text = "\n".join(lines)
    return ExtractedDocument(
        pages=[PageText(page_number=1, text=full_text)],
        full_text=full_text,
        source_type="docx",
    )
