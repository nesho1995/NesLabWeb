namespace NesLab.Application.DTOs;

public sealed record ReagentStockItemDto(
    int Id,
    string Code,
    string Name,
    string Unit,
    decimal CurrentStock,
    decimal MinimumStock,
    bool IsActive,
    bool IsBelowMinimum,
    DateTime UpdatedAtUtc);

public sealed record CreateReagentStockRequest(
    string Code,
    string Name,
    string Unit,
    decimal CurrentStock,
    decimal MinimumStock);

public sealed record UpdateReagentStockRequest(
    string Name,
    string Unit,
    decimal MinimumStock,
    bool IsActive);

public sealed record AdjustReagentStockRequest(
    decimal QuantityDelta,
    string? Notes);

public sealed record ReagentInventoryOverviewDto(
    int ActiveReagents,
    int LowStockReagents,
    IReadOnlyList<string> LowStockNames);
