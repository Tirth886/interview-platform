from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "resume-parser"
    app_env: str = "development"
    host: str = "0.0.0.0"
    port: int = 5001

    max_upload_size_mb: int = 10
    allowed_extensions: str = "pdf,docx"

    resume_files_root: str = "../hiring_service/uploads"
    parsed_output_dir: str = "./parsed"

    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    resume_parse_queue: str = "resume.parse.requested"
    resume_parse_completed_queue: str = "resume.parse.completed"

    hiring_service_url: str = "http://localhost:3000"
    hiring_service_internal_token: str = "dev-internal-token"

    spacy_model: str = "en_core_web_sm"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def allowed_extension_set(self) -> set[str]:
        return {
            ext if ext.startswith(".") else f".{ext}"
            for ext in (item.strip().lower() for item in self.allowed_extensions.split(","))
            if ext
        }

    @property
    def resume_files_root_path(self) -> Path:
        return Path(self.resume_files_root).resolve()

    @property
    def parsed_output_path(self) -> Path:
        path = Path(self.parsed_output_dir).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()
