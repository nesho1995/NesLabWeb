namespace NesLab.Domain.Entities;

/// <summary>Forma de pago configurable por empresa (cobro y conciliacion).</summary>
public sealed class CompanyPaymentMethod
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    /// <summary>Codigo estable p.ej. EFECTIVO, TARJETA (unico por empresa).</summary>
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>Entra al arqueo de efectivo en caja (gaveta).</summary>
    public bool InPhysicalDrawer { get; set; }

    /// <summary>Requiere monto recibido y validacion de vuelto (típico efectivo).</summary>
    public bool RequiresAmountReceived { get; set; }

    public ICollection<Payment> Payments { get; set; } = [];
}
