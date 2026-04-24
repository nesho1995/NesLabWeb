namespace NesLab.Domain.Entities;

/// <summary>Turno de caja: apertura / cierre con caja chica y arqueo (empresa inquilino).</summary>
public sealed class CashSession
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public DateTime OpenedAtUtc { get; set; }
    public DateTime? ClosedAtUtc { get; set; }

    public int OpenedByUserId { get; set; }
    public User OpenedBy { get; set; } = null!;

    public int? ClosedByUserId { get; set; }
    public User? ClosedBy { get; set; }

    public decimal PettyCashOpening { get; set; }

    public decimal? DeclaredClosingCash { get; set; }
    public decimal? ExpectedClosingCash { get; set; }
    public decimal? DifferenceClosing { get; set; }
    public string? CloseNotes { get; set; }
}
