#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/neslab}"
BACKUP_PATTERN="${BACKUP_PATTERN:-*.sql}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-26}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

if [[ ! -d "${BACKUP_DIR}" ]]; then
  MSG="Backup directory not found: ${BACKUP_DIR}"
  echo "${MSG}" >&2
  if [[ -n "${WEBHOOK_URL}" ]]; then
    "$(dirname "$0")/send-alert-webhook.sh" "${WEBHOOK_URL}" "critical" "NesLab backup missing dir" "${MSG}" || true
  fi
  exit 2
fi

LATEST_FILE="$(ls -1t "${BACKUP_DIR}"/${BACKUP_PATTERN} 2>/dev/null | head -n 1 || true)"
if [[ -z "${LATEST_FILE}" ]]; then
  MSG="No backup files in ${BACKUP_DIR} with pattern ${BACKUP_PATTERN}"
  echo "${MSG}" >&2
  if [[ -n "${WEBHOOK_URL}" ]]; then
    "$(dirname "$0")/send-alert-webhook.sh" "${WEBHOOK_URL}" "critical" "NesLab backup not found" "${MSG}" || true
  fi
  exit 3
fi

NOW_EPOCH="$(date +%s)"
FILE_EPOCH="$(stat -c %Y "${LATEST_FILE}")"
AGE_HOURS="$(( (NOW_EPOCH - FILE_EPOCH) / 3600 ))"

if (( AGE_HOURS > MAX_AGE_HOURS )); then
  MSG="Backup outdated. file=$(basename "${LATEST_FILE}") age=${AGE_HOURS}h max=${MAX_AGE_HOURS}h"
  echo "${MSG}" >&2
  if [[ -n "${WEBHOOK_URL}" ]]; then
    "$(dirname "$0")/send-alert-webhook.sh" "${WEBHOOK_URL}" "critical" "NesLab backup outdated" "${MSG}" || true
  fi
  exit 1
fi

echo "Backup OK file=$(basename "${LATEST_FILE}") age=${AGE_HOURS}h"
exit 0
