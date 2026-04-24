#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:5225}"
LATENCY_WARN_MS="${LATENCY_WARN_MS:-2500}"
WEBHOOK_URL="${WEBHOOK_URL:-}"
HEALTH_URL="${API_BASE_URL}/api/ops/health"

START_MS="$(date +%s%3N)"
HTTP_CODE="$(curl -sS -o /tmp/neslab_health.json -w "%{http_code}" "${HEALTH_URL}" || true)"
END_MS="$(date +%s%3N)"
LATENCY_MS="$((END_MS - START_MS))"

if [[ "${HTTP_CODE}" != "200" ]]; then
  MSG="Health check failed with HTTP ${HTTP_CODE} at ${HEALTH_URL}"
  echo "${MSG}" >&2
  if [[ -n "${WEBHOOK_URL}" ]]; then
    "$(dirname "$0")/send-alert-webhook.sh" "${WEBHOOK_URL}" "critical" "NesLab API down" "${MSG}" || true
  fi
  exit 3
fi

STATUS="$(grep -o '"status":"[^"]*"' /tmp/neslab_health.json | cut -d':' -f2 | tr -d '"')"
DB="$(grep -o '"db":"[^"]*"' /tmp/neslab_health.json | cut -d':' -f2 | tr -d '"')"

if [[ "${STATUS}" != "ok" || "${DB}" != "up" ]]; then
  MSG="Health degraded: status=${STATUS}, db=${DB}, latencyMs=${LATENCY_MS}"
  echo "${MSG}" >&2
  if [[ -n "${WEBHOOK_URL}" ]]; then
    "$(dirname "$0")/send-alert-webhook.sh" "${WEBHOOK_URL}" "critical" "NesLab health degraded" "${MSG}" || true
  fi
  exit 2
fi

if (( LATENCY_MS > LATENCY_WARN_MS )); then
  MSG="Health OK but high latency: ${LATENCY_MS}ms (threshold=${LATENCY_WARN_MS}ms)"
  echo "${MSG}" >&2
  if [[ -n "${WEBHOOK_URL}" ]]; then
    "$(dirname "$0")/send-alert-webhook.sh" "${WEBHOOK_URL}" "warning" "NesLab high latency" "${MSG}" || true
  fi
  exit 1
fi

echo "Health OK db=up latency=${LATENCY_MS}ms"
exit 0
