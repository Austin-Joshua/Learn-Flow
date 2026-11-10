"""add quiz feedback and course feedback

Revision ID: e5f1a2b3c4d5
Revises: d4e8a1f93b70
Create Date: 2026-11-10 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e5f1a2b3c4d5'
down_revision: Union[str, Sequence[str], None] = 'd4e8a1f93b70'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add feedback columns to assessment_attempts
    op.add_column(
        'assessment_attempts',
        sa.Column('instructor_feedback', sa.Text(), nullable=True)
    )
    op.add_column(
        'assessment_attempts',
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    )
    op.add_column(
        'assessment_attempts',
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True)
    )

    # 2. Create course_feedback table if not exists
    op.execute("""
    CREATE TABLE IF NOT EXISTS course_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        difficulty_rating VARCHAR(30) NULL,
        pace_rating VARCHAR(30) NULL,
        feedback_text TEXT NOT NULL,
        is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_course_user_feedback UNIQUE (course_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS ix_course_feedback_course_id ON course_feedback(course_id);
    CREATE INDEX IF NOT EXISTS ix_course_feedback_user_id ON course_feedback(user_id);
    """)


def downgrade() -> None:
    op.drop_column('assessment_attempts', 'reviewed_at')
    op.drop_column('assessment_attempts', 'reviewed_by')
    op.drop_column('assessment_attempts', 'instructor_feedback')
    op.execute("DROP TABLE IF EXISTS course_feedback CASCADE;")
