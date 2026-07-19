"""add use_tls to smtp_settings

Revision ID: 3f8db4f4aa6b
Revises: 90a3efbbd367
Create Date: 2026-07-19 20:10:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3f8db4f4aa6b"
down_revision: str | None = "90a3efbbd367"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "smtp_settings",
        sa.Column("use_tls", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column("smtp_settings", "use_tls", server_default=None)


def downgrade() -> None:
    op.drop_column("smtp_settings", "use_tls")
