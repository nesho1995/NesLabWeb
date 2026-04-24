export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type ResultFormat = 'texto' | 'panel';

export type LabExamParameter = {
  id: number;
  name: string;
  sortOrder: number;
  unit: string | null;
  referenceText: string | null;
  isActive: boolean;
};

export type LabExamListItem = {
  id: number;
  code: string;
  name: string;
  price: number;
  isActive: boolean;
  resultFormat: ResultFormat;
};

export type LabExamDetail = {
  id: number;
  companyId: number;
  code: string;
  name: string;
  price: number;
  isActive: boolean;
  resultFormat: ResultFormat;
  parameters: LabExamParameter[];
  createdAtUtc: string;
  updatedAtUtc: string | null;
};

export type ExamParameterDraft = {
  name: string;
  sortOrder: number;
  unit: string;
  referenceText: string;
  isActive: boolean;
};

export type BulkImportExamsResult = {
  created: number;
  skipped: number;
  messages: string[];
};

export type ClearExamCatalogResult = {
  deleted: number;
  keptBecauseUsedInOrders: number;
  message: string;
};

export type ApplyExamTemplatesResult = {
  updated: number;
  skipped: number;
  messages: string[];
};
