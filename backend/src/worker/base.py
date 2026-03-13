import asyncio
from abc import ABC, abstractmethod

from aiokafka import AIOKafkaConsumer
from loguru import logger

from conf.kafka import create_kafka_consumer


class BaseWorker(ABC):
    def __init__(self, topic: str, max_concurrency: int = 5):
        self.topic = topic
        self.max_concurrency = max_concurrency
        self._semaphore = asyncio.Semaphore(max_concurrency)
        self._running = False
        self._consumer: AIOKafkaConsumer | None = None

    @abstractmethod
    async def handle_message(self, message: dict) -> None:
        ...

    async def start(self):
        self._running = True
        self._consumer = await create_kafka_consumer(self.topic)
        logger.info(f"Worker started for topic: {self.topic}")
        try:
            async for msg in self._consumer:
                if not self._running:
                    break
                async with self._semaphore:
                    try:
                        await self.handle_message(msg.value)
                        await self._consumer.commit()
                    except Exception as e:
                        logger.exception(f"Error processing message: {e}")
                        await self._consumer.commit()
        finally:
            await self._consumer.stop()
            logger.info(f"Worker stopped for topic: {self.topic}")

    async def stop(self):
        self._running = False
