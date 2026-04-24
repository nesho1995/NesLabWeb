namespace NesLab.Application.DTOs;

public sealed record CurrentUserResponse(
    int UserId,
    string Username,
    string FullName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);
