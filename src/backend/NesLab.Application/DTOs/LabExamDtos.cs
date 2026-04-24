namespace NesLab.Application.DTOs;

public sealed record LabExamParameterDto(
    int Id,
    string Name,
    int SortOrder,
    string? Unit,
    string? ReferenceText,
    bool IsActive);

public sealed record LabExamListItemDto(
    int Id,
    string Code,
    string Name,
    decimal Price,
    bool IsActive,
    string ResultFormat);

public sealed record LabExamDetailDto(
    int Id,
    int CompanyId,
    string Code,
    string Name,
    decimal Price,
    bool IsActive,
    string ResultFormat,
    IReadOnlyList<LabExamParameterDto> Parameters,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc);

public sealed record CreateLabExamParameterItem(
    string Name,
    int SortOrder,
    string? Unit,
    string? ReferenceText,
    bool IsActive = true);

public sealed record CreateLabExamRequest(
    string Code,
    string Name,
    decimal Price,
    string? ResultFormat,
    IReadOnlyList<CreateLabExamParameterItem>? Parameters);

public sealed record UpdateLabExamRequest(
    string Code,
    string Name,
    decimal Price,
    bool? IsActive,
    string? ResultFormat,
    IReadOnlyList<CreateLabExamParameterItem>? Parameters);

public sealed record LabExamListQuery(
    string? Search,
    bool IncludeInactive,
    int Page = 1,
    int PageSize = 20);

public sealed record BulkImportLabExamItem(
    string Name,
    decimal Price,
    string? Code = null);

public sealed record BulkImportLabExamsRequest(
    IReadOnlyList<BulkImportLabExamItem> Items,
    /// <summary> Si es true, ignora filas cuyo nombre+precio ya existan. </summary>
    bool SkipDuplicates = true);

public sealed record BulkImportLabExamsResult(
    int Created,
    int Skipped,
    IReadOnlyList<string> Messages);

public sealed record ClearLabExamsCatalogResult(
    int Deleted,
    int KeptBecauseUsedInOrders,
    string Message);

public sealed record ApplyExamTemplatesResult(
    int Updated,
    int Skipped,
    IReadOnlyList<string> Messages);
