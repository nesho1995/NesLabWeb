import type { CreateOrderRequest, CreateOrderResult } from '../../features/orders/orders.types';

const KEY_PENDING = 'neslab.offline.orders.pending.v1';
const KEY_HISTORY = 'neslab.offline.orders.history.v1';
const EVT = 'neslab-offline-outbox-updated';

export type PendingOrderItem = {
  tempId: string;
  createdAtIso: string;
  patientName: string;
  requestedCai: boolean;
  payload: CreateOrderRequest;
  idempotencyKey: string;
};

export type RegularizedOrderItem = {
  tempId: string;
  regularizedAtIso: string;
  orderId: number;
  invoiceNumber: string;
  caiMode: boolean;
  patientName: string;
  requestedCai?: boolean;
};

function readPending(): PendingOrderItem[] {
  try {
    const raw = globalThis.localStorage.getItem(KEY_PENDING);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingOrderItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePending(items: PendingOrderItem[]) {
  globalThis.localStorage.setItem(KEY_PENDING, JSON.stringify(items));
  globalThis.dispatchEvent(new Event(EVT));
}

function readHistory(): RegularizedOrderItem[] {
  try {
    const raw = globalThis.localStorage.getItem(KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RegularizedOrderItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(items: RegularizedOrderItem[]) {
  globalThis.localStorage.setItem(KEY_HISTORY, JSON.stringify(items.slice(0, 200)));
  globalThis.dispatchEvent(new Event(EVT));
}

export function subscribeOrderOutboxUpdated(cb: () => void) {
  globalThis.addEventListener(EVT, cb);
  return () => globalThis.removeEventListener(EVT, cb);
}

export function getPendingOrders(): PendingOrderItem[] {
  return readPending();
}

export function getPendingOrdersCount(): number {
  return readPending().length;
}

export function getRegularizedOrders(limit = 20): RegularizedOrderItem[] {
  return readHistory().slice(0, limit);
}

export function enqueuePendingOrder(item: PendingOrderItem) {
  const items = readPending();
  items.push(item);
  writePending(items);
}

export async function syncPendingOrders(
  submitOrder: (payload: CreateOrderRequest, idempotencyKey: string) => Promise<CreateOrderResult>,
  onRegularized?: (item: PendingOrderItem, result: CreateOrderResult) => Promise<void> | void
) {
  const items = readPending();
  if (items.length === 0) return { synced: 0, failed: 0 };

  const keep: PendingOrderItem[] = [];
  const hist = readHistory();
  let synced = 0;
  let failed = 0;
  for (const item of items) {
    try {
      const payload: CreateOrderRequest = {
        ...item.payload,
        // Al sincronizar, si el usuario lo queria con CAI, se intenta fiscalizar.
        ...(item.requestedCai ? { useSarInvoice: true } : {}),
      };
      const r = await submitOrder(payload, item.idempotencyKey);
      hist.unshift({
        tempId: item.tempId,
        regularizedAtIso: new Date().toISOString(),
        orderId: r.orderId,
        invoiceNumber: r.invoiceNumber,
        caiMode: r.caiMode,
        patientName: item.patientName,
        requestedCai: item.requestedCai,
      });
      if (onRegularized) {
        await onRegularized(item, r);
      }
      synced += 1;
    } catch {
      keep.push(item);
      failed += 1;
    }
  }
  writePending(keep);
  writeHistory(hist);
  return { synced, failed };
}
