#!/bin/sh
# Container start: migrate → seed-if-empty → server, with a background postdeploy revalidation.
set -eu
mkdir -p "$(dirname "$DATABASE_PATH")" "$UPLOAD_DIR" /data/cache/images /data/backups
node /app/scripts/migrate.mjs
node /app/scripts/seed.mjs
node /app/scripts/postdeploy.mjs &
exec "$@"
