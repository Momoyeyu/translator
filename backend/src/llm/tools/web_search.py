import asyncio

from duckduckgo_search import DDGS
from loguru import logger


async def search_term(query: str, max_results: int = 3) -> list[dict]:
    """Search for term context using DuckDuckGo.

    Runs the synchronous DDGS client in a thread to avoid blocking the event loop.
    Returns a list of dicts with keys: title, body, href.
    """

    def _search() -> list[dict]:
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
                return [{"title": r["title"], "body": r["body"], "href": r["href"]} for r in results]
        except Exception as e:
            logger.warning(f"DuckDuckGo search failed for '{query}': {e}")
            return []

    return await asyncio.to_thread(_search)
