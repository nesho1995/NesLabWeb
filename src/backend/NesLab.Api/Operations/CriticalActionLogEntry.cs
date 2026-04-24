namespace NesLab.Api.Operations;

public sealed record CriticalActionLogEntry(
    DateTime OccurredAtUtc,
    int? CompanyId,
    int? UserId,
    string HttpMethod,
    string Path,
    string QueryString,
    int StatusCode,
    long ElapsedMs,
    string? RemoteIp,
    string? UserAgent);
