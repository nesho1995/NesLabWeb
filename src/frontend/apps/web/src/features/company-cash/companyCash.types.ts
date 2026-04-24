export type CompanyCashSettings = {
  companyId: number;
  cashShiftsPerDay: number;
  cashPettyCashEnabled: boolean;
  cashPettyCashDefault: number;
};

export type UpdateCompanyCashSettingsPayload = {
  cashShiftsPerDay: number;
  cashPettyCashEnabled: boolean;
  cashPettyCashDefault: number;
};
