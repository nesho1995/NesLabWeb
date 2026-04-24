namespace NesLab.Application.DTOs;

public sealed record SampleListItemDto(
    int Id,
    int OrderId,
    string Code,
    string? Notes,
    DateTime? CollectedAtUtc,
    DateTime CreatedAtUtc,
    string PatientName,
    string InvoiceNumber,
    DateTime OrderAtUtc,
    string? CreatedByName);

public sealed record SamplesListQuery(
    string? Search,
    bool OnlyPending,
    int Page = 1,
    int PageSize = 20);

public sealed record CreateSampleRequest(
    int OrderId,
    string? Notes);

public sealed record UpdateSampleRequest(
    string? Notes,
    bool? MarkCollected,
    /// <summary>Si se envia, fija la fecha/hora de toma (null revierte a pendiente de registro de toma).</summary>
    DateTime? CollectedAtUtc = null);
