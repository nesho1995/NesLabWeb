#!/usr/bin/env bash
set -euo pipefail

MYSQLDUMP_PATH="${MYSQLDUMP_PATH:-mysqldump}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-neslab}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/neslab}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "${BACKUP_DIR}"

TS="$(date +"%Y%m%d_%H%M%S")"
OUT_FILE="${BACKUP_DIR}/${DB_NAME}_${TS}.sql"

if [[ -z "${DB_PASSWORD}" ]]; then
  "${MYSQLDUMP_PATH}" --host="${DB_HOST}" --port="${DB_PORT}" --user="${DB_USER}" \
    --single-transaction --routines --triggers "${DB_NAME}" > "${OUT_FILE}"
else
  MYSQL_PWD="${DB_PASSWORD}" "${MYSQLDUMP_PATH}" --host="${DB_HOST}" --port="${DB_PORT}" --user="${DB_USER}" \
    --single-transaction --routines --triggers "${DB_NAME}" > "${OUT_FILE}"
fi

find "${BACKUP_DIR}" -type f -name "${DB_NAME}_*.sql" -mtime +"${KEEP_DAYS}" -delete

echo "Backup generated: ${OUT_FILE}"
