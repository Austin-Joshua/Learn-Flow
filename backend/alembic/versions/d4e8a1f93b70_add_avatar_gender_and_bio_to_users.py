"""add avatar_gender and bio to users

Revision ID: d4e8a1f93b70
Revises: c73d9e184fa2
Create Date: 2026-11-09 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e8a1f93b70'
down_revision: Union[str, Sequence[str], None] = 'c73d9e184fa2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('avatar_gender', sa.String(20), server_default=sa.text("'auto'"), nullable=True)
    )
    op.add_column(
        'users',
        sa.Column('bio', sa.String(1000), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('users', 'bio')
    op.drop_column('users', 'avatar_gender')

