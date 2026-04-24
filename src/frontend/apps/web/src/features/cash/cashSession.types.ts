export type CashMethodBreakdown = {
  code: string;
  name: string;
  amount: number;
  inPhysicalDrawer: boolean;
};

export type CashSessionStatus = {
  companyId: number;
  cashShiftsPerDay: number;
  cashPettyCashEnabled: boolean;
  cashPettyCashDefault: number;
  opensTodayHn: number;
  hasOpenSession: boolean;
  canOpen: boolean;
  blockReason: string | null;
  open: CashSessionOpenView | null;
};

export type CashSessionOpenView = {
  id: number;
  openedAtUtc: string;
  pettyCashOpening: number;
  orderCount: number;
  efectivoOrderCount: number;
  sumEfectivo: number;
  sumInPhysicalDrawer: number;
  totalFromOrders: number;
  totalFromPayments: number;
  sessionTotalsMatch: boolean;
  breakdown: CashMethodBreakdown[];
  expectedInDrawer: number;
};

export type CashSessionOpenedResult = {
  id: number;
  openedAtUtc: string;
  pettyCashOpening: number;
};

export type CashSessionClosedResult = {
  id: number;
  openedAtUtc: string;
  closedAtUtc: string;
  pettyCashOpening: number;
  orderCount: number;
  efectivoOrderCount: number;
  sumEfectivo: number;
  sumInPhysicalDrawer: number;
  totalFromOrders: number;
  totalFromPayments: number;
  sessionTotalsMatch: boolean;
  breakdown: CashMethodBreakdown[];
  expectedInDrawer: number;
  declaredCash: number;
  difference: number;
  closeNotes: string | null;
};
