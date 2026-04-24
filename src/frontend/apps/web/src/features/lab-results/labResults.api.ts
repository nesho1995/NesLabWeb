import { authJson } from '../../shared/api/authFetch';
import type { PagedResult, ResultLineItem } from './labResults.types';

export function fetchResultLines(
  search: string,
  status: 'todos' | 'pendientes' | 'validados',
  format: 'todos' | 'texto' | 'panel',
  completeness: 'todos' | 'incompletos-panel',
  page: number,
  pageSize = 20
): Promise<PagedResult<ResultLineItem>> {
  const sp = new URLSearchParams();
  if (search) {
    sp.set('search', search);
  }
  sp.set('status', status);
  if (format !== 'todos') {
    sp.set('format', format);
  }
  if (completeness !== 'todos') {
    sp.set('completeness', completeness);
  }
  sp.set('page', String(page));
  sp.set('pageSize', String(pageSize));
  return authJson<PagedResult<ResultLineItem>>(`/api/lab-results/lines?${sp.toString()}`);
}

export function updateResultLine(
  lineId: number,
  payload: {
    resultNotes: string | null;
    resultParameterValues: Record<string, string> | null;
    markValidated: boolean;
  }
): Promise<ResultLineItem> {
  return authJson<ResultLineItem>(`/api/lab-results/lines/${lineId}`, {
    method: 'PATCH',
    json: {
      resultNotes: payload.resultNotes,
      resultParameterValues: payload.resultParameterValues,
      markValidated: payload.markValidated,
    },
  });
}
