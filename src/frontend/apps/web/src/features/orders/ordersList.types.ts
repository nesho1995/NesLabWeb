export type OrderListItem = {
  id: number;
  invoiceNumber: string;
  orderAtUtc: string;
  patientName: string;
  patientNationalId: string | null;
  status: string;
  fiscalStatus: 'REGULARIZADA' | 'PENDIENTE' | string;
  total: number;
  paymentMethod: string | null;
  lineCount: number;
};
