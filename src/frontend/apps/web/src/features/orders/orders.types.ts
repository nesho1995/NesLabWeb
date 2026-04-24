export type FiscalBranding = {
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
  /** Con SAR, permite al cobrador elegir factura CAI o comprobante interno (otra secuencia). */
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

export type DiscountItem = {
  id: number;
  name: string;
  percent: number;
  sortOrder: number;
};

export type PaymentMethodListItem = {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  inPhysicalDrawer: boolean;
  requiresAmountReceived: boolean;
};

export type CreateOrderRequest = {
  patientId: number;
  discountPercent: number;
  discountTypeLabel: string;
  lines: { labExamId: number }[];
  paymentMethod?: string | null;
  paymentMethodId?: number | null;
  amountReceived: number | null;
  isFinalConsumer: boolean;
  clientLegalName: string | null;
  clientRtn: string | null;
  /** Si la empresa lo permite: true = correlativo SAR, false = recibo/serie interna. */
  useSarInvoice?: boolean | null;
};

export type CreateOrderResult = {
  orderId: number;
  invoiceNumber: string;
  caiMode: boolean;
  cai: string | null;
  rango: string | null;
  caiDueDate: string | null;
  subtotalBase: number;
  discountAmount: number;
  isv: number;
  total: number;
  paymentMethod: string;
  change: number | null;
};
