export type CreatePaymentMethodInput = {
  code: string;
  name: string;
  sortOrder: number;
  inPhysicalDrawer: boolean;
  requiresAmountReceived: boolean;
};

export type UpdatePaymentMethodInput = {
  name: string;
  sortOrder: number;
  isActive: boolean;
  inPhysicalDrawer: boolean;
  requiresAmountReceived: boolean;
};
