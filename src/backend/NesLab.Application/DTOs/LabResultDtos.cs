namespace NesLab.Application.DTOs;

public sealed record ResultLineListItemDto(
    int LineId,
    int OrderId,
    DateTime OrderAtUtc,
    string InvoiceNumber,
    string PatientName,
    string ExamCode,
    string ExamName,
    string ResultFormat,
    IReadOnlyList<LabExamParameterDto> ResultFieldDefinitions,
    IReadOnlyDictionary<string, string> ResultParameterValues,
    string? ResultNotes,
    bool IsValidated,
    DateTime? ValidatedAtUtc,
    string? ValidatedByName);

public sealed record ResultLinesListQuery(
    string? Search,
    string? Status,
    string? Format,
    string? Completeness,
    int Page = 1,
    int PageSize = 20);

public sealed record UpdateResultLineRequest(
    string? ResultNotes,
    IReadOnlyDictionary<string, string>? ResultParameterValues,
    bool MarkValidated);
