namespace NesLab.Api.Operations;

public sealed record AiSuggestionAuditEntry(
    DateTime OccurredAtUtc,
    int CompanyId,
    int? UserId,
    int LineId,
    int OrderId,
    string ExamCode,
    string ExamName,
    string ConfidenceLevel,
    bool Accepted,
    string Disclaimer,
    int ReferencesCount,
    string? RemoteIp,
    string? UserAgent);
