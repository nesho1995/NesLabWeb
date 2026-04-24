namespace NesLab.Api.Operations;

public sealed record AuthLoginAuditEntry(
    DateTime OccurredAtUtc,
    int? CompanyId,
    int? UserId,
    string Username,
    bool Success,
    string FailureReason,
    string? RemoteIp,
    string? UserAgent);
