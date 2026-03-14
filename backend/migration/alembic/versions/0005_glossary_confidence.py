"""Add confidence column to glossary_term

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-15
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "glossary_term",
        sa.Column("confidence", sa.Float(), nullable=False, server_default=sa.text("0.5")),
    )


def downgrade() -> None:
    op.drop_column("glossary_term", "confidence")
