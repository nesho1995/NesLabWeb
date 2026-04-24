import { authJson } from '../../shared/api/authFetch';
import type {
  BulkImportExamsResult,
  ClearExamCatalogResult,
  ApplyExamTemplatesResult,
  LabExamDetail,
  LabExamListItem,
  PagedResult,
  ResultFormat,
} from './labExams.types';

export function fetchExams(
  search: string,
  includeInactive: boolean,
  page: number,
  pageSize = 20
): Promise<PagedResult<LabExamListItem>> {
  const sp = new URLSearchParams();
  if (search) {
    sp.set('search', search);
  }
  if (includeInactive) {
    sp.set('includeInactive', 'true');
  }
  sp.set('page', String(page));
  sp.set('pageSize', String(pageSize));
  return authJson<PagedResult<LabExamListItem>>(`/api/lab-exams?${sp.toString()}`);
}

export function fetchExamById(id: number): Promise<LabExamDetail> {
  return authJson<LabExamDetail>(`/api/lab-exams/${id}`);
}

export type CreateExamBody = {
  code: string;
  name: string;
  price: number;
  resultFormat: ResultFormat;
  /** En formato texto se envia null; en panel, la lista de filas. */
  parameters: {
    name: string;
    sortOrder: number;
    unit: string | null;
    referenceText: string | null;
    isActive: boolean;
  }[] | null;
};

export function createExam(payload: CreateExamBody): Promise<LabExamDetail> {
  return authJson<LabExamDetail>('/api/lab-exams', {
    method: 'POST',
    json: payload,
  });
}

export function updateExam(id: number, payload: CreateExamBody & { isActive: boolean }): Promise<LabExamDetail> {
  return authJson<LabExamDetail>(`/api/lab-exams/${id}`, {
    method: 'PUT',
    json: payload,
  });
}

export function bulkImportExams(payload: {
  items: { name: string; price: number; code?: string }[];
  skipDuplicates: boolean;
}): Promise<BulkImportExamsResult> {
  return authJson<BulkImportExamsResult>('/api/lab-exams/bulk', {
    method: 'POST',
    json: payload,
  });
}

export function clearExamCatalog(): Promise<ClearExamCatalogResult> {
  return authJson<ClearExamCatalogResult>('/api/lab-exams/clear-catalog', { method: 'POST' });
}

export function applyExamTemplates(): Promise<ApplyExamTemplatesResult> {
  return authJson<ApplyExamTemplatesResult>('/api/lab-exams/apply-templates', { method: 'POST' });
}
