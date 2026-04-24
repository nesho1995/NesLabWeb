namespace NesLab.Domain.Entities;

/// <summary>Bitacora auditada de regularizaciones offline (provisional -> factura final).</summary>
public sealed class OfflineSyncRegularization
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string TempId { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public LabOrder Order { get; set; } = null!;
    public string InvoiceNumber { get; set; } = string.Empty;
    public bool CaiMode { get; set; }
    public bool RequestedCai { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string Source { get; set; } = "web-offline";
    public DateTime RegularizedAtUtc { get; set; } = DateTime.UtcNow;
}
