export type ReagentStockItem = {
  id: number;
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
  isBelowMinimum: boolean;
  updatedAtUtc: string;
};

export type CreateReagentInput = {
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
};

export type UpdateReagentInput = {
  name: string;
  unit: string;
  minimumStock: number;
  isActive: boolean;
};

export type InventoryOverview = {
  activeReagents: number;
  lowStockReagents: number;
  lowStockNames: string[];
};
