#!/bin/sh
set -e

echo "Applying database migrations via Alembic..."
alembic upgrade head

echo "Ensuring essential roles, department, and default accounts exist..."
python -m app.db.init_db

exec "$@"

