import { authJson } from '../../shared/api/authFetch';
import type { PagedResult } from '../patients/patients.types';
import type { OrderListItem } from './ordersList.types';

export function fetchOrdersPage(
  search: string,
  page: number,
  pageSize = 20,
  fiscalStatus: 'ALL' | 'REGULARIZADA' | 'PENDIENTE' = 'ALL'
): Promise<PagedResult<OrderListItem>> {
  const sp = new URLSearchParams();
  if (search) {
    sp.set('search', search);
  }
  if (fiscalStatus !== 'ALL') {
    sp.set('fiscalStatus', fiscalStatus);
  }
  sp.set('page', String(page));
  sp.set('pageSize', String(pageSize));
  return authJson<PagedResult<OrderListItem>>(`/api/orders?${sp.toString()}`);
}
