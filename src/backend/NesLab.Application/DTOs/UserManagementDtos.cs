namespace NesLab.Application.DTOs;

public sealed record RoleListItemDto(int Id, string Code, string Name);

public sealed record CreateUserRequest(
    string Username,
    string FullName,
    string Password,
    IReadOnlyList<int> RoleIds);

public sealed record UpdateUserRequest(
    string FullName,
    bool IsActive,
    IReadOnlyList<int> RoleIds);

public sealed record SetUserPasswordRequest(string NewPassword);

public sealed class UpdateSarConfigRequest
{
    public bool UseCai { get; set; }
    public string? InvoicePrefix { get; set; }
    public int? InvoiceStart { get; set; }
    public int? InvoiceEnd { get; set; }
    public string? Cai { get; set; }
    public string? RangeLabel { get; set; }
    public DateTime? CaiDueDate { get; set; }
    /// <summary>Tras asignar rango SAR, ajusta el correlativo a inicio-1 (proxima = inicio).</summary>
    public bool ResetCorrelativeToRangeStart { get; set; }
    public bool? AllowNonSarDocument { get; set; }
    public string? InternalDocPrefix { get; set; }
}
