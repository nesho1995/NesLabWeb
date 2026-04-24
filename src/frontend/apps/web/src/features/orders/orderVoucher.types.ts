export type OrderVoucher = {
  orderId: number;
  documentTitle: string;
  orderNumberText: string;
  orderAtUtc: string;
  clasificacion: string;
  providerName: string;
  company: {
    name: string;
    rtn: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
  };
  patientName: string;
  nationalId: string | null;
  titularName: string | null;
  lines: {
    examCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotalExams: number;
  subtotalBase: number;
  discountAmount: number;
  discountTypeLabel: string;
  isv: number;
  total: number;
  saldo: number;
  paymentMethod: string | null;
  caiMode: boolean;
  cai: string | null;
  rango: string | null;
  caiVencText: string | null;
  clientRtn: string;
  clientInvoiceName: string;
  emittedByName: string | null;
  /** Lineas de pie (leyenda, legales) configurables por laboratorio. */
  voucherFooterLines: string[] | null;
  /** Texto tipo "exija comprobante fiscal" (configurable). */
  voucherExigirLine: string | null;
};
