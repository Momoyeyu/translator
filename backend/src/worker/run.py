"""Entry point for Kafka consumer workers."""
import asyncio
from loguru import logger
from conf.config import settings
from llm.service import LLMService
from worker.pipeline_executor import PipelineExecutor
from worker.chat_executor import ChatExecutor

async def main():
    llm = LLMService(
        api_key=settings.llm_api_key.get_secret_value(),
        base_url=settings.llm_base_url,
        model_name=settings.llm_model_name,
        fast_model_name=settings.llm_fast_model_name,
        pro_model_name=settings.llm_pro_model_name,
    )

    pipeline_worker = PipelineExecutor(llm)
    chat_worker = ChatExecutor(llm)

    logger.info("Starting workers...")
    await asyncio.gather(
        pipeline_worker.start(),
        chat_worker.start(),
    )

if __name__ == "__main__":
    asyncio.run(main())
