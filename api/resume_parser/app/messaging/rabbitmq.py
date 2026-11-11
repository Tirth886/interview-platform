from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any

import aio_pika
import httpx
from aio_pika import ExchangeType, IncomingMessage, Message

from app.config import get_settings
from app.schemas.resume_schema import ParseCompletedMessage, ParseJobMessage, ParsedResume
from app.services.resume_parser import resume_parser_service

logger = logging.getLogger(__name__)


async def publish_json(queue_name: str, payload: dict[str, Any]) -> None:
    settings = get_settings()
    connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    async with connection:
        channel = await connection.channel()
        await channel.declare_queue(queue_name, durable=True)
        await channel.default_exchange.publish(
            Message(
                body=json.dumps(payload).encode("utf-8"),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key=queue_name,
        )


async def _apply_to_hiring_service(candidate_id: str, parsed: ParsedResume) -> None:
    settings = get_settings()
    url = f"{settings.hiring_service_url.rstrip('/')}/api/v1/candidates/{candidate_id}/parse-result"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            json={"parsed": parsed.model_dump(mode="json")},
            headers={"x-internal-token": settings.hiring_service_internal_token},
        )
        response.raise_for_status()


def _resolve_resume_path(resume_key: str) -> Path:
    settings = get_settings()
    # key like "resumes/uuid-file.pdf"
    candidate = settings.resume_files_root_path / resume_key
    if candidate.exists():
        return candidate
    # fallback: only filename under resumes/
    return settings.resume_files_root_path / "resumes" / Path(resume_key).name


async def handle_parse_job(payload: dict[str, Any]) -> None:
    settings = get_settings()
    job = ParseJobMessage.model_validate(payload)
    completed: ParseCompletedMessage

    try:
        path = _resolve_resume_path(job.resume_key)
        parsed = resume_parser_service.parse_file(path, original_name=job.file_name)
        completed = ParseCompletedMessage(
            candidate_id=job.candidate_id,
            company_id=job.company_id,
            success=True,
            parsed=parsed,
        )
        try:
            await _apply_to_hiring_service(job.candidate_id, parsed)
        except Exception as callback_error:  # noqa: BLE001
            logger.warning("Failed hiring_service callback: %s", callback_error)
    except Exception as error:  # noqa: BLE001
        logger.exception("Resume parse failed for candidate %s", job.candidate_id)
        completed = ParseCompletedMessage(
            candidate_id=job.candidate_id,
            company_id=job.company_id,
            success=False,
            error=str(error),
        )

    await publish_json(settings.resume_parse_completed_queue, completed.model_dump(mode="json"))


async def _on_message(message: IncomingMessage) -> None:
    async with message.process(requeue=False):
        payload = json.loads(message.body.decode("utf-8"))
        await handle_parse_job(payload)


async def run_consumer() -> None:
    settings = get_settings()
    logger.info("Connecting to RabbitMQ %s", settings.rabbitmq_url)
    connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)
    queue = await channel.declare_queue(settings.resume_parse_queue, durable=True)
    logger.info("Consuming queue %s", settings.resume_parse_queue)
    await queue.consume(_on_message)

    try:
        await asyncio.Future()
    finally:
        await connection.close()
