import { authJson } from '../../shared/api/authFetch';
import type {
  CompanyFiscalStatus,
  CreateOrderRequest,
  CreateOrderResult,
  DiscountItem,
  PaymentMethodListItem,
} from './orders.types';

export function getCompanyFiscal(): Promise<CompanyFiscalStatus> {
  return authJson<CompanyFiscalStatus>('/api/fiscal/company');
}

export function getOrderDiscounts(): Promise<DiscountItem[]> {
  return authJson<DiscountItem[]>('/api/orders/discounts');
}

export function getActivePaymentMethods(): Promise<PaymentMethodListItem[]> {
  return authJson<PaymentMethodListItem[]>('/api/payment-methods/active');
}

export function createOrder(
  body: CreateOrderRequest,
  idempotencyKey: string
): Promise<CreateOrderResult> {
  return authJson<CreateOrderResult>('/api/orders', {
    method: 'POST',
    json: body,
    idempotencyKey,
  });
}
