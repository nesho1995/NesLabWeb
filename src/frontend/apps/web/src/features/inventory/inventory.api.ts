import { authJson } from '../../shared/api/authFetch';
import type { CreateReagentInput, InventoryOverview, ReagentStockItem, UpdateReagentInput } from './inventory.types';

export function getReagentStock(includeInactive = false) {
  const q = includeInactive ? '?includeInactive=true' : '';
  return authJson<ReagentStockItem[]>(`/api/inventory/reagents${q}`);
}

export function getInventoryOverview() {
  return authJson<InventoryOverview>('/api/inventory/reagents/overview');
}

export function createReagent(input: CreateReagentInput) {
  return authJson<ReagentStockItem>('/api/inventory/reagents', {
    method: 'POST',
    json: input,
  });
}

export function updateReagent(id: number, input: UpdateReagentInput) {
  return authJson<ReagentStockItem>(`/api/inventory/reagents/${id}`, {
    method: 'PUT',
    json: input,
  });
}

export function adjustReagent(id: number, quantityDelta: number, notes?: string) {
  return authJson<ReagentStockItem>(`/api/inventory/reagents/${id}/adjust`, {
    method: 'POST',
    json: { quantityDelta, notes: notes?.trim() || null },
  });
}
