import { authJson } from '../../shared/api/authFetch';
import type { CashSessionClosedResult, CashSessionOpenedResult, CashSessionStatus } from './cashSession.types';

export function getCashSessionStatus() {
  return authJson<CashSessionStatus>('/api/cash/session');
}

export function openCashSession(pettyCashAmount: number | null | undefined) {
  return authJson<CashSessionOpenedResult>('/api/cash/session/open', {
    method: 'POST',
    json: { pettyCashAmount: pettyCashAmount ?? null },
  });
}

export function closeCashSession(declaredCash: number, notes: string | undefined) {
  return authJson<CashSessionClosedResult>('/api/cash/session/close', {
    method: 'POST',
    json: { declaredCash, notes: notes?.trim() || null },
  });
}
