namespace NesLab.Application.DTOs;

public sealed record OpenCashSessionRequest(decimal? PettyCashAmount);

public sealed record CloseCashSessionRequest(decimal DeclaredCash, string? Notes);

public sealed record CashMethodBreakdownItem(
    string Code,
    string Name,
    decimal Amount,
    bool InPhysicalDrawer);

public sealed record CashSessionOpenViewDto(
    int Id,
    DateTime OpenedAtUtc,
    decimal PettyCashOpening,
    int OrderCount,
    int EfectivoOrderCount,
    decimal SumEfectivo,
    decimal SumInPhysicalDrawer,
    decimal TotalFromOrders,
    decimal TotalFromPayments,
    bool SessionTotalsMatch,
    IReadOnlyList<CashMethodBreakdownItem> Breakdown,
    decimal ExpectedInDrawer);

public sealed record CashSessionStatusDto(
    int CompanyId,
    int CashShiftsPerDay,
    bool CashPettyCashEnabled,
    decimal CashPettyCashDefault,
    int OpensTodayHn,
    bool HasOpenSession,
    bool CanOpen,
    string? BlockReason,
    CashSessionOpenViewDto? Open);

public sealed record CashSessionOpenedResultDto(
    int Id,
    DateTime OpenedAtUtc,
    decimal PettyCashOpening);

public sealed record CashSessionClosedResultDto(
    int Id,
    DateTime OpenedAtUtc,
    DateTime ClosedAtUtc,
    decimal PettyCashOpening,
    int OrderCount,
    int EfectivoOrderCount,
    decimal SumEfectivo,
    decimal SumInPhysicalDrawer,
    decimal TotalFromOrders,
    decimal TotalFromPayments,
    bool SessionTotalsMatch,
    IReadOnlyList<CashMethodBreakdownItem> Breakdown,
    decimal ExpectedInDrawer,
    decimal DeclaredCash,
    decimal Difference,
    string? CloseNotes);
