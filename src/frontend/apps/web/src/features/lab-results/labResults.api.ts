import { authJson } from '../../shared/api/authFetch';
import type { AiConclusionSuggestion, PagedResult, ResultLineItem } from './labResults.types';

export function fetchResultLines(
  search: string,
  status: 'todos' | 'pendientes' | 'validados',
  format: 'todos' | 'texto' | 'panel',
  completeness: 'todos' | 'incompletos-panel',
  fromDate: string,
  toDate: string,
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
  if (fromDate) {
    sp.set('fromDate', fromDate);
  }
  if (toDate) {
    sp.set('toDate', toDate);
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

export function suggestConclusion(
  lineId: number,
  payload: {
    lineId: number;
    orderId: number;
    examCode: string;
    examName: string;
    resultFormat: string;
    patientName: string | null;
    patientSex: string | null;
    patientAgeYears: number | null;
    existingNotes: string | null;
    parameters: Array<{
      name: string;
      value: string | null;
      unit: string | null;
      referenceText: string | null;
    }>;
    locale: string;
  }
): Promise<AiConclusionSuggestion> {
  return authJson<AiConclusionSuggestion>(`/api/lab-results/lines/${lineId}/suggest-conclusion`, {
    method: 'POST',
    json: payload,
  });
}

export function sendSuggestionFeedback(
  lineId: number,
  payload: {
    orderId: number;
    examCode: string;
    examName: string;
    accepted: boolean;
    confidenceLevel: string;
    disclaimer: string;
    referencesCount: number;
  }
): Promise<void> {
  return authJson<void>(`/api/lab-results/lines/${lineId}/suggest-conclusion/feedback`, {
    method: 'POST',
    json: payload,
  });
}
