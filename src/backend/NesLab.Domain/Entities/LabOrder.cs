namespace NesLab.Domain.Entities;

public sealed class LabOrder
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime OrderAtUtc { get; set; } = DateTime.UtcNow;

    public decimal SubtotalBase { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Isv { get; set; }
    public decimal Total { get; set; }
    public string DiscountTypeLabel { get; set; } = "Sin descuento";

    public string Status { get; set; } = "PAGADO";
    public string ClientInvoiceName { get; set; } = "CONSUMIDOR FINAL";
    public string ClientRtn { get; set; } = "00000000000000";

    public string? CaiSnapshot { get; set; }
    public string? RangeSnapshot { get; set; }
    public DateTime? CaiDueDateSnapshot { get; set; }
    public bool CaiMode { get; set; }

    public int? CreatedByUserId { get; set; }
    public User? CreatedBy { get; set; }

    public ICollection<OrderLine> Lines { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<LabSample> Samples { get; set; } = [];
}
