import { authJson } from '../../shared/api/authFetch';
import type { FinanceSummary, LabDashboard } from './labDashboard.types';

export function getLabDashboard() {
  return authJson<LabDashboard>('/api/lab-dashboard');
}

export function getFinanceSummary(fromDate: string, toDate: string) {
  const query = new URLSearchParams({ fromDate, toDate }).toString();
  return authJson<FinanceSummary>(`/api/lab-dashboard/finance?${query}`);
}
