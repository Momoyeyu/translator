from uuid import UUID

from sqlalchemy import select

from common import erri
from conf.db import AsyncSessionLocal
from glossary.model import GlossaryTerm


async def get_project_glossary(project_id: UUID) -> list[GlossaryTerm]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(GlossaryTerm).where(GlossaryTerm.project_id == project_id)
        )
        return list(result.scalars().all())


async def update_term(project_id: UUID, term_id: UUID, translated_term: str) -> GlossaryTerm:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(GlossaryTerm).where(GlossaryTerm.id == term_id, GlossaryTerm.project_id == project_id)
        )
        term = result.scalars().one_or_none()
        if not term:
            raise erri.not_found("Term not found")
        term.translated_term = translated_term
        await session.commit()
        await session.refresh(term)
        return term
