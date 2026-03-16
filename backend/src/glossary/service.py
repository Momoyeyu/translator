from uuid import UUID

from sqlalchemy import select

from common import erri
from conf.db import AsyncSessionLocal
from glossary.dto import CreateGlossaryTermRequest
from glossary.model import GlossaryTerm


async def _verify_project_ownership(project_id: UUID, user_id: UUID) -> None:
    from project.service import get_project_detail

    await get_project_detail(project_id, user_id)


async def get_project_glossary(project_id: UUID, user_id: UUID) -> list[GlossaryTerm]:
    await _verify_project_ownership(project_id, user_id)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(GlossaryTerm).where(GlossaryTerm.project_id == project_id)
        )
        return list(result.scalars().all())


async def update_term(project_id: UUID, term_id: UUID, translated_term: str, user_id: UUID) -> GlossaryTerm:
    await _verify_project_ownership(project_id, user_id)
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


async def create_term(project_id: UUID, body: CreateGlossaryTermRequest, user_id: UUID) -> GlossaryTerm:
    await _verify_project_ownership(project_id, user_id)
    async with AsyncSessionLocal() as session:
        term = GlossaryTerm(
            project_id=project_id,
            source_term=body.source_term,
            translated_term=body.translated_term,
            context=body.context,
            confirmed=True,  # manually added terms are pre-confirmed
            confidence=1.0,
        )
        session.add(term)
        await session.commit()
        await session.refresh(term)
        return term
