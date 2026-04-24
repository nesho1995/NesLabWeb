export type FiscalBranding = {
  laboratoryDisplayName: string | null;
  laboratoryLogoUrl: string | null;
  laboratoryAddress: string | null;
  laboratoryPhone: string | null;
  laboratoryEmail: string | null;
  defaultPrintProfile?: 'standard' | 'compact' | 'thermal' | null;
  documentTitleSar: string | null;
  documentTitleInternal: string | null;
  clasificacionActividad: string | null;
  footerLines: string[] | null;
  exigirFacturaLine: string | null;
};

export type CompanyFiscalStatus = {
  companyId: number;
  companyName: string;
  isActive: boolean;
  useCai: boolean;
  allowNonSarDocument: boolean;
  internalDocPrefix: string;
  internalDocCurrent: number | null;
  invoicePrefix: string;
  currentCorrelative: number | null;
  rangeStart: number | null;
  rangeEnd: number | null;
  cai: string | null;
  rangeLabel: string | null;
  caiDueDate: string | null;
  daysUntilCaiExpires: number | null;
  isCaiValid: boolean;
  warning: string | null;
  branding: FiscalBranding | null;
};

export type UpdateSarConfigBody = {
  useCai: boolean;
  invoicePrefix: string;
  invoiceStart: number | null;
  invoiceEnd: number | null;
  cai: string;
  rangeLabel: string;
  caiDueDate: string | null;
  resetCorrelativeToRangeStart: boolean;
  allowNonSarDocument?: boolean;
  internalDocPrefix?: string | null;
};

export type UpdateFiscalBrandingBody = FiscalBranding;
