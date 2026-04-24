namespace NesLab.Application.DTOs;

public sealed record OfflineSyncRegularizationRequest(
    string TempId,
    int OrderId,
    string InvoiceNumber,
    bool CaiMode,
    bool RequestedCai,
    string PatientName,
    string? Source);

public sealed record OfflineSyncRegularizationDto(
    int Id,
    string TempId,
    int OrderId,
    string InvoiceNumber,
    bool CaiMode,
    bool RequestedCai,
    string PatientName,
    string Source,
    DateTime RegularizedAtUtc);
