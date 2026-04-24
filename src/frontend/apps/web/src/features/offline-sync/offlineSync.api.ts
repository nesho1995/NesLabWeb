import { authJson } from '../../shared/api/authFetch';

export type SyncRegularizationPayload = {
  tempId: string;
  orderId: number;
  invoiceNumber: string;
  caiMode: boolean;
  requestedCai: boolean;
  patientName: string;
  source?: string;
};

export type SyncRegularizationRow = SyncRegularizationPayload & {
  id: number;
  regularizedAtUtc: string;
};

export function listSyncRegularizations(take = 200) {
  return authJson<SyncRegularizationRow[]>(`/api/offline-sync/regularizations?take=${take}`);
}

export function addSyncRegularization(payload: SyncRegularizationPayload) {
  return authJson<SyncRegularizationRow>('/api/offline-sync/regularizations', {
    method: 'POST',
    json: payload,
  });
}
