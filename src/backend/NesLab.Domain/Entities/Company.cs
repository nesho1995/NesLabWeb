namespace NesLab.Domain.Entities;

public sealed class Company
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Rtn { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public string InvoicePrefix { get; set; } = "INT";
    public int? InvoiceStart { get; set; }
    public int? InvoiceEnd { get; set; }
    public int? InvoiceCurrent { get; set; }
    public string? Cai { get; set; }
    public string? InvoiceRangeLabel { get; set; }
    public DateTime? CaiDueDate { get; set; }
    public bool UseCai { get; set; }

    /// <summary>Si <see cref="UseCai"/> es true, permite emitir comprobante sin bloque SAR (nota interna) en paralelo a factura CAI.</summary>
    public bool AllowNonSarDocument { get; set; }

    /// <summary>Serie/correlativo separado de la facturacion SAR (notas internas / recibos sin CAI).</summary>
    public string InternalDocPrefix { get; set; } = "REC";

    public int? InternalDocCurrent { get; set; }

    /// <summary>Textos de comprobante (titulos, pie) por laboratorio. JSON: titulos, clasificacion, lineas de pie, etc.</summary>
    public string? FiscalBrandingJson { get; set; }

    /// <summary>Turnos de caja permitidos por dia calendario (1 = un solo cierre/turno, &gt;1 para varias aperturas/cierres).</summary>
    public int CashShiftsPerDay { get; set; } = 1;

    /// <summary>Usar caja chica (fondo para vuelto / cambio) en el flujo de caja.</summary>
    public bool CashPettyCashEnabled { get; set; } = true;

    /// <summary>Monto sugerido o base de caja chica (HNL), sin decimales obligatorios en UI.</summary>
    public decimal CashPettyCashDefault { get; set; }

    public ICollection<Patient> Patients { get; set; } = [];
    public ICollection<LabExam> LabExams { get; set; } = [];
    public ICollection<LabOrder> Orders { get; set; } = [];
    public ICollection<LabSample> LabSamples { get; set; } = [];
}
