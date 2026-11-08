"""add sequential_modules to courses

Revision ID: c73d9e184fa2
Revises: 2eceb097932c
Create Date: 2026-11-08 10:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c73d9e184fa2'
down_revision: Union[str, Sequence[str], None] = '2eceb097932c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'courses',
        sa.Column('sequential_modules', sa.Boolean(), server_default=sa.text('true'), nullable=False)
    )


def downgrade() -> None:
    op.drop_column('courses', 'sequential_modules')
