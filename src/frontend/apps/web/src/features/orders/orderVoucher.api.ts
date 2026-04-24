import { authJson } from '../../shared/api/authFetch';
import type { OrderVoucher } from './orderVoucher.types';

export function fetchOrderVoucher(orderId: number): Promise<OrderVoucher> {
  return authJson<OrderVoucher>(`/api/orders/${orderId}/voucher`);
}
