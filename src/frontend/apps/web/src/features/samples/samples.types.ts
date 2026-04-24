export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type SampleListItem = {
  id: number;
  orderId: number;
  code: string;
  notes: string | null;
  collectedAtUtc: string | null;
  createdAtUtc: string;
  patientName: string;
  invoiceNumber: string;
  orderAtUtc: string;
  createdByName: string | null;
};
