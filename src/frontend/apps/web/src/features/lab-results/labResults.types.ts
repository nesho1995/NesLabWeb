import type { LabExamParameter } from '../lab-exams/labExams.types';

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type ResultLineItem = {
  lineId: number;
  orderId: number;
  orderAtUtc: string;
  invoiceNumber: string;
  patientName: string;
  examCode: string;
  examName: string;
  resultFormat: 'texto' | 'panel';
  resultFieldDefinitions: LabExamParameter[];
  resultParameterValues: Record<string, string>;
  resultNotes: string | null;
  isValidated: boolean;
  validatedAtUtc: string | null;
  validatedByName: string | null;
};

export type AiConclusionReference = {
  title: string;
  url: string;
  source: string;
  publishedAtUtc: string | null;
};

export type AiConclusionSuggestion = {
  draftConclusion: string;
  interpretation: string;
  suggestedFollowUp: string;
  limitations: string;
  disclaimer: string;
  confidenceLevel: string;
  references: AiConclusionReference[];
};
