#!/usr/bin/env bash
set -euo pipefail

# Usage:
# send-alert-webhook.sh <webhook_url> <severity> <title> <message>

WEBHOOK_URL="${1:-}"
SEVERITY="${2:-warning}"
TITLE="${3:-NesLab alerta}"
MESSAGE="${4:-Sin detalle}"

if [[ -z "${WEBHOOK_URL}" ]]; then
  echo "Missing webhook URL" >&2
  exit 2
fi

TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

JSON_PAYLOAD="$(cat <<EOF
{
  "timestampUtc": "${TS}",
  "severity": "${SEVERITY}",
  "title": "${TITLE}",
  "message": "${MESSAGE}",
  "source": "NesLabWeb-Ops-Linux"
}
EOF
)"

curl -fsS -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d "${JSON_PAYLOAD}" >/dev/null

echo "Alert sent [${SEVERITY}] ${TITLE}"
