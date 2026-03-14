from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from artifact.model import Artifact
from auth import model as auth_model
from auth.oauth_model import OAuthAccount
from chunk.model import Chunk
from conf.config import settings
from conf.db import Base
from conversation.model import Conversation, Message
from document.model import Document
from glossary.model import GlossaryTerm
from pipeline.event_store import PipelineEvent
from pipeline.model import PipelineTask
from project.model import TranslationProject
from tenant import model as tenant_model
from user import model as user_model

_ = user_model.User
_ = auth_model.InvitationCode
_ = tenant_model.Tenant
_ = tenant_model.UserTenant
_ = tenant_model.TenantInvitation
_ = OAuthAccount

_ = TranslationProject
_ = Document
_ = Chunk
_ = GlossaryTerm
_ = PipelineTask
_ = PipelineEvent
_ = Artifact
_ = Conversation
_ = Message

alembic_config = context.config

if alembic_config.config_file_name is not None:
    fileConfig(alembic_config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.sync_database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = alembic_config.get_section(alembic_config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = settings.sync_database_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
