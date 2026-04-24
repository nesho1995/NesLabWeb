namespace NesLab.Application.DTOs;

public sealed record ConclusionParameterInputDto(
    string Name,
    string? Value,
    string? Unit,
    string? ReferenceText);

public sealed record SuggestConclusionRequestDto(
    int LineId,
    int OrderId,
    string ExamCode,
    string ExamName,
    string ResultFormat,
    string? PatientName,
    string? PatientSex,
    int? PatientAgeYears,
    string? ExistingNotes,
    IReadOnlyList<ConclusionParameterInputDto> Parameters,
    string Locale = "es-HN");

public sealed record ConclusionReferenceDto(
    string Title,
    string Url,
    string Source,
    DateTime? PublishedAtUtc);

public sealed record SuggestConclusionResponseDto(
    string DraftConclusion,
    string Interpretation,
    string SuggestedFollowUp,
    string Limitations,
    string Disclaimer,
    string ConfidenceLevel,
    IReadOnlyList<ConclusionReferenceDto> References);

public sealed record SuggestConclusionFeedbackRequestDto(
    int OrderId,
    string ExamCode,
    string ExamName,
    bool Accepted,
    string ConfidenceLevel,
    string Disclaimer,
    int ReferencesCount);
