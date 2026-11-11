"""RabbitMQ consumer entrypoint: python worker.py"""

from __future__ import annotations

import asyncio
import logging

from app.messaging.rabbitmq import run_consumer

logging.basicConfig(level=logging.INFO)


if __name__ == "__main__":
    asyncio.run(run_consumer())
