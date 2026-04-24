export type LabDashboard = {
  ordersTodayHn: number;
  ordersLast7DaysUtc: number;
  revenueTodayHn: number;
  orderLinesPendingValidation: number;
  samplesPendingCollection: number;
  samplesRegisteredTodayHn: number;
  cashSessionOpen: boolean;
  cashSessionOpenedAtUtc: string | null;
};

export type FinanceByMethod = {
  method: string;
  amount: number;
  inPhysicalDrawer: boolean;
};

export type FinanceSummary = {
  fromUtcInclusive: string;
  toUtcExclusive: string;
  ordersCount: number;
  ordersTotal: number;
  paymentsTotal: number;
  cashExpectedTotal: number;
  cashDeclaredTotal: number;
  cashDifferenceTotal: number;
  byMethod: FinanceByMethod[];
  dailyRows: FinanceDailyRow[];
};

export type FinanceDailyRow = {
  dateHn: string;
  ordersCount: number;
  entradas: number;
  salidas: number;
  neto: number;
  cashExpected: number;
  cashDeclared: number;
  cashDifference: number;
};
