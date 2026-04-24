namespace NesLab.Application.DTOs;

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAtUtc,
    int UserId,
    string Username,
    string FullName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);
