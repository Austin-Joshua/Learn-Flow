"""add uploading status and upload_lease_id to stored_files

Revision ID: a1b2c3d4e5f6
Revises: f6a7b8c9d0e1
Create Date: 2026-11-14 06:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    columns = [c['name'] for c in insp.get_columns('stored_files')]
    if 'upload_lease_id' not in columns:
        op.add_column('stored_files', sa.Column('upload_lease_id', sa.String(length=64), nullable=True))
        op.create_index('ix_stored_files_upload_lease_id', 'stored_files', ['upload_lease_id'], unique=False)

    if bind.dialect.name == "postgresql":
        op.drop_constraint('chk_file_status', 'stored_files', type_='check')
        op.create_check_constraint(
            'chk_file_status',
            'stored_files',
            "status IN ('pending_upload', 'uploading', 'quarantined', 'validated', 'rejected')"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.drop_constraint('chk_file_status', 'stored_files', type_='check')
        op.create_check_constraint(
            'chk_file_status',
            'stored_files',
            "status IN ('pending_upload', 'quarantined', 'validated', 'rejected')"
        )
    insp = sa.inspect(bind)
    columns = [c['name'] for c in insp.get_columns('stored_files')]
    if 'upload_lease_id' in columns:
        op.drop_index('ix_stored_files_upload_lease_id', table_name='stored_files', if_exists=True)
        op.drop_column('stored_files', 'upload_lease_id')
