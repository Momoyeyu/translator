from enum import StrEnum
from typing import AsyncIterator

from langchain_openai import ChatOpenAI
from pydantic import BaseModel


class LLMProfile(StrEnum):
    DEFAULT = "default"
    FAST = "fast"
    PRO = "pro"


class LLMService:
    def __init__(
        self,
        api_key: str,
        base_url: str,
        model_name: str,
        fast_model_name: str = "",
        pro_model_name: str = "",
    ):
        self.api_key = api_key
        self.base_url = base_url
        self._models = {
            LLMProfile.DEFAULT: model_name,
            LLMProfile.FAST: fast_model_name or model_name,
            LLMProfile.PRO: pro_model_name or model_name,
        }

    def get_model_name(self, profile: LLMProfile) -> str:
        return self._models[profile]

    def _get_client(self, profile: LLMProfile) -> ChatOpenAI:
        return ChatOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            model=self.get_model_name(profile),
        )

    async def chat(self, messages: list[dict], profile: LLMProfile = LLMProfile.DEFAULT) -> str:
        client = self._get_client(profile)
        response = await client.ainvoke(messages)
        return response.content

    async def chat_structured(
        self, messages: list[dict], schema: type[BaseModel], profile: LLMProfile = LLMProfile.DEFAULT
    ) -> BaseModel:
        client = self._get_client(profile)
        structured = client.with_structured_output(schema)
        return await structured.ainvoke(messages)

    async def chat_stream(
        self, messages: list[dict], profile: LLMProfile = LLMProfile.DEFAULT
    ) -> AsyncIterator[str]:
        client = self._get_client(profile)
        async for chunk in client.astream(messages):
            if chunk.content:
                yield chunk.content
