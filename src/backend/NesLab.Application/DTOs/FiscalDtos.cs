namespace NesLab.Application.DTOs;

public sealed record CompanyFiscalStatusDto(
    int CompanyId,
    string CompanyName,
    bool IsActive,
    bool UseCai,
    /// <summary>Si UseCai, permite al cobrador elegir documento con SAR o nota interna (sin tocar correlativo CAI).</summary>
    bool AllowNonSarDocument,
    string InternalDocPrefix,
    int? InternalDocCurrent,
    string InvoicePrefix,
    int? CurrentCorrelative,
    int? RangeStart,
    int? RangeEnd,
    string? Cai,
    string? RangeLabel,
    DateTime? CaiDueDate,
    int? DaysUntilCaiExpires,
    bool IsCaiValid,
    string? Warning,
    FiscalBrandingDto? Branding);
