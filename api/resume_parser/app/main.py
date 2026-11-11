from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.extractor.document_router import UnsupportedDocumentError
from app.services.resume_parser import resume_parser_service
from app.services.resume_validator import ResumeValidationError
from app.utils.text_utils import safe_filename

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0")


@app.get("/api/v1/resume/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "env": settings.app_env,
        "allowed_extensions": sorted(settings.allowed_extension_set),
        "max_upload_size_mb": settings.max_upload_size_mb,
    }


async def _save_upload(file: UploadFile) -> Path:
    suffix = Path(file.filename or "resume.bin").suffix.lower()
    if suffix not in settings.allowed_extension_set:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds {settings.max_upload_size_mb} MB limit",
        )

    tmp_dir = Path(tempfile.gettempdir()) / "resume_parser_uploads"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    path = tmp_dir / f"{uuid4()}-{safe_filename(file.filename or 'resume')}{suffix}"
    path.write_bytes(content)
    return path


@app.post("/api/v1/resume/parse")
async def parse_resume(file: UploadFile = File(...)) -> JSONResponse:
    path: Path | None = None
    try:
        path = await _save_upload(file)
        parsed = resume_parser_service.parse_file(path, original_name=file.filename)
        return JSONResponse(parsed.model_dump(mode="json"))
    except (ResumeValidationError, UnsupportedDocumentError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:  # noqa: BLE001
        logger.exception("Parse failed")
        raise HTTPException(status_code=500, detail=f"Parse failed: {error}") from error
    finally:
        if path and path.exists():
            path.unlink(missing_ok=True)


@app.post("/api/v1/resume/parse-bulk")
async def parse_resumes_bulk(files: list[UploadFile] = File(...)) -> JSONResponse:
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")

    results: list[dict[str, Any]] = []
    for upload in files:
        path: Path | None = None
        try:
            path = await _save_upload(upload)
            parsed = resume_parser_service.parse_file(path, original_name=upload.filename)
            results.append(
                {
                    "file_name": upload.filename,
                    "success": True,
                    "parsed": parsed.model_dump(mode="json"),
                }
            )
        except Exception as error:  # noqa: BLE001
            results.append(
                {
                    "file_name": upload.filename,
                    "success": False,
                    "error": str(error),
                }
            )
        finally:
            if path and path.exists():
                path.unlink(missing_ok=True)

    return JSONResponse({"items": results})


@app.get("/api/v1/resume/{resume_id}")
async def get_parsed_resume(resume_id: str) -> JSONResponse:
    path = settings.parsed_output_path / f"{resume_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Parsed resume not found")
    return JSONResponse(content=path.read_text(encoding="utf-8"))
