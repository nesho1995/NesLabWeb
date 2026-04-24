export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type PatientListItem = {
  id: number;
  fullName: string;
  nationalId: string | null;
  phone: string | null;
  isActive: boolean;
  registeredAtUtc: string;
};

export type PatientDetail = {
  id: number;
  companyId: number;
  fullName: string;
  nationalId: string | null;
  phone: string | null;
  isActive: boolean;
  registeredAtUtc: string;
  updatedAtUtc: string | null;
};
