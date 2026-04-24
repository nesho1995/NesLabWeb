import { authJson } from '../../shared/api/authFetch';
import type { PaymentMethodListItem } from '../orders/orders.types';
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from './paymentMethods.types';

export function getAllPaymentMethods() {
  return authJson<PaymentMethodListItem[]>('/api/payment-methods');
}

export function createPaymentMethod(body: CreatePaymentMethodInput) {
  return authJson<PaymentMethodListItem>('/api/payment-methods', { method: 'POST', json: body });
}

export function updatePaymentMethod(id: number, body: UpdatePaymentMethodInput) {
  return authJson<PaymentMethodListItem>(`/api/payment-methods/${id}`, { method: 'PUT', json: body });
}
