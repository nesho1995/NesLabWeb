import { authJson } from '../../shared/api/authFetch';
import type { PagedResult, SampleListItem } from './samples.types';

export function fetchSamples(
  search: string,
  onlyPending: boolean,
  fromDate: string,
  toDate: string,
  page: number,
  pageSize = 20
): Promise<PagedResult<SampleListItem>> {
  const sp = new URLSearchParams();
  if (search) {
    sp.set('search', search);
  }
  if (onlyPending) {
    sp.set('onlyPending', 'true');
  }
  if (fromDate) {
    sp.set('fromDate', fromDate);
  }
  if (toDate) {
    sp.set('toDate', toDate);
  }
  sp.set('page', String(page));
  sp.set('pageSize', String(pageSize));
  return authJson<PagedResult<SampleListItem>>(`/api/samples?${sp.toString()}`);
}

export function createSample(orderId: number, notes: string | undefined): Promise<SampleListItem> {
  return authJson<SampleListItem>('/api/samples', {
    method: 'POST',
    json: { orderId, notes: notes || null },
  });
}

export function updateSample(
  id: number,
  body: { notes?: string; markCollected?: boolean; collectedAtUtc?: string | null }
): Promise<SampleListItem> {
  return authJson<SampleListItem>(`/api/samples/${id}`, {
    method: 'PATCH',
    json: body,
  });
}
