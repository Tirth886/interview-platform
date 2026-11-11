# Resume Parser Service

Local ATS resume parser (PDF/DOCX) using spaCy + regex. **No LLM APIs.**

## Requirements

- **Python 3.9+** (3.10+ recommended)
- On Windows + Python 3.9, `requirements.txt` pins **spaCy 3.7.5** so pip uses binary wheels (spaCy 3.8 often fails building `blis` without a C compiler).

## Run

```bash
cd api/resume_parser
python -m venv .venv
# Windows
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# API
uvicorn app.main:app --reload --port 5001

# RabbitMQ worker (separate terminal)
python worker.py
```

If spaCy install still fails, the parser still runs with regex-only name extraction after installing the rest of the deps (skip the `spacy download` step).

Requires RabbitMQ at `amqp://guest:guest@localhost:5672/`.

## Endpoints

- `GET /api/v1/resume/health`
- `POST /api/v1/resume/parse` — single file
- `POST /api/v1/resume/parse-bulk` — multiple files

## Queue

Consumes `resume.parse.requested` messages published by `hiring_service` after batch candidate create.
Writes JSON under `parsed/` and POSTs results to hiring_service `POST /api/v1/candidates/:id/parse-result`.
