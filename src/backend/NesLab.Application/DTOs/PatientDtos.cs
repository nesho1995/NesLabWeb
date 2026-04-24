namespace NesLab.Application.DTOs;

public sealed record PatientListItemDto(
    int Id,
    string FullName,
    string? NationalId,
    string? Phone,
    bool IsActive,
    DateTime RegisteredAtUtc);

public sealed record PatientDetailDto(
    int Id,
    int CompanyId,
    string FullName,
    string? NationalId,
    string? Phone,
    bool IsActive,
    DateTime RegisteredAtUtc,
    DateTime? UpdatedAtUtc);

public sealed record CreatePatientRequest(
    string FullName,
    string? NationalId,
    string? Phone);

public sealed record UpdatePatientRequest(
    string FullName,
    string? NationalId,
    string? Phone,
    bool? IsActive);

public sealed record PatientListQuery(
    string? Search,
    bool IncludeInactive,
    int Page = 1,
    int PageSize = 20);
