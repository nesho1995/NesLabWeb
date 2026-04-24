#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:5225}"

echo "== NesLab release smoke =="

HEALTH_URL="${API_BASE_URL}/api/ops/health"
ROOT_URL="${API_BASE_URL}/"

code_health="$(curl -sS -o /dev/null -w "%{http_code}" "${HEALTH_URL}")"
code_root="$(curl -sS -o /dev/null -w "%{http_code}" "${ROOT_URL}")"

if [[ "${code_health}" != "200" ]]; then
  echo "[FAIL] ${HEALTH_URL} => ${code_health}" >&2
  exit 2
fi

if [[ "${code_root}" != "200" ]]; then
  echo "[FAIL] ${ROOT_URL} => ${code_root}" >&2
  exit 3
fi

echo "[OK] ${HEALTH_URL}"
echo "[OK] ${ROOT_URL}"
echo "Manual pending: login, create order, cash open/close, validate result, offline sync."
