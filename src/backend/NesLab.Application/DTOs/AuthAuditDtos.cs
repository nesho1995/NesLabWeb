namespace NesLab.Application.DTOs;

public sealed record LoginAttemptResult(AuthResponse? Response, bool Success, string FailureReason);
