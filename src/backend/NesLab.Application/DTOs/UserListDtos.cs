namespace NesLab.Application.DTOs;

public sealed record UserListItemDto(
    int Id,
    string Username,
    string FullName,
    bool IsActive,
    IReadOnlyList<string> RoleCodes);
