namespace NesLab.Application.DTOs;

public sealed record CompanyCashSettingsDto(
    int CompanyId,
    int CashShiftsPerDay,
    bool CashPettyCashEnabled,
    decimal CashPettyCashDefault);

public sealed record UpdateCompanyCashSettingsRequest(
    int CashShiftsPerDay,
    bool CashPettyCashEnabled,
    decimal CashPettyCashDefault);
