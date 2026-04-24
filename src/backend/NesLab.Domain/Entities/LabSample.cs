namespace NesLab.Domain.Entities;

public sealed class LabSample
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public int OrderId { get; set; }
    public LabOrder Order { get; set; } = null!;

    /// <summary>Etiqueta o codigo de barras legible (unico por empresa).</summary>
    public string Code { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime? CollectedAtUtc { get; set; }
    public int? CreatedByUserId { get; set; }
    public User? CreatedBy { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
