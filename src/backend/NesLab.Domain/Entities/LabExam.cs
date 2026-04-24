namespace NesLab.Domain.Entities;

public sealed class LabExam
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>texto = notas libres; panel = filas fijas (parametros) que el lab llena.</summary>
    public string ResultFormat { get; set; } = "texto";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<LabExamParameter> Parameters { get; set; } = [];
}
