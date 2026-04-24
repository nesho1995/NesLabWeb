namespace NesLab.Domain.Entities;

public sealed class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public LabOrder Order { get; set; } = null!;

    public int? CompanyPaymentMethodId { get; set; }
    public CompanyPaymentMethod? CompanyPaymentMethod { get; set; }

    /// <summary>Texto congelado al emitir (compatibilidad e impresion).</summary>
    public string Method { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaidAtUtc { get; set; } = DateTime.UtcNow;
}
