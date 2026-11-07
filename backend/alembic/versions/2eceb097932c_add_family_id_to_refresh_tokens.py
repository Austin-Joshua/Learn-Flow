"""add family_id to refresh_tokens

Revision ID: 2eceb097932c
Revises: 842eed5b01f0
Create Date: 2026-11-07 20:52:08.875982

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '2eceb097932c'
down_revision: Union[str, Sequence[str], None] = '842eed5b01f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('refresh_tokens', sa.Column('family_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(op.f('ix_refresh_tokens_family_id'), 'refresh_tokens', ['family_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_refresh_tokens_family_id'), table_name='refresh_tokens')
    op.drop_column('refresh_tokens', 'family_id')
