namespace NesLab.Application.DTOs;

/// <summary>Resumen LIS/operacion (inquilino actual). Fechas "hoy" = America/Tegucigalpa.</summary>
public sealed record LabDashboardDto(
    int OrdersTodayHn,
    int OrdersLast7DaysUtc,
    decimal RevenueTodayHn,
    int OrderLinesPendingValidation,
    int SamplesPendingCollection,
    int SamplesRegisteredTodayHn,
    bool CashSessionOpen,
    DateTime? CashSessionOpenedAtUtc);

public sealed record FinanceByMethodDto(
    string Method,
    decimal Amount,
    bool InPhysicalDrawer);

public sealed record FinanceSummaryDto(
    DateTime FromUtcInclusive,
    DateTime ToUtcExclusive,
    int OrdersCount,
    decimal OrdersTotal,
    decimal PaymentsTotal,
    decimal CashExpectedTotal,
    decimal CashDeclaredTotal,
    decimal CashDifferenceTotal,
    IReadOnlyList<FinanceByMethodDto> ByMethod,
    IReadOnlyList<FinanceDailyRowDto> DailyRows);

public sealed record FinanceDailyRowDto(
    DateOnly DateHn,
    int OrdersCount,
    decimal Entradas,
    decimal Salidas,
    decimal Neto,
    decimal CashExpected,
    decimal CashDeclared,
    decimal CashDifference);
