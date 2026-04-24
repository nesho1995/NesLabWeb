import { authJson } from '../../shared/api/authFetch';
import type { PagedResult, PatientDetail, PatientListItem } from './patients.types';

export function fetchPatients(
  search: string,
  includeInactive: boolean,
  page: number
): Promise<PagedResult<PatientListItem>> {
  const sp = new URLSearchParams();
  if (search) {
    sp.set('search', search);
  }
  if (includeInactive) {
    sp.set('includeInactive', 'true');
  }
  sp.set('page', String(page));
  return authJson<PagedResult<PatientListItem>>(`/api/patients?${sp.toString()}`);
}

export function createPatient(payload: { fullName: string; nationalId: string; phone: string }): Promise<PatientDetail> {
  return authJson<PatientDetail>('/api/patients', {
    method: 'POST',
    json: {
      fullName: payload.fullName,
      nationalId: payload.nationalId || null,
      phone: payload.phone || null,
    },
  });
}

export function updatePatient(
  id: number,
  payload: { fullName: string; nationalId: string; phone: string; isActive: boolean }
): Promise<PatientDetail> {
  return authJson<PatientDetail>(`/api/patients/${id}`, {
    method: 'PUT',
    json: {
      fullName: payload.fullName,
      nationalId: payload.nationalId || null,
      phone: payload.phone || null,
      isActive: payload.isActive,
    },
  });
}
