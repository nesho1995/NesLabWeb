namespace NesLab.Domain.Entities;

public sealed class OrderLine
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public LabOrder Order { get; set; } = null!;

    public int LabExamId { get; set; }
    public LabExam LabExam { get; set; } = null!;

    public string ExamName { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal LineDiscountPercent { get; set; }
    public decimal LineTotal { get; set; }

    /// <summary>Texto libre del resultado (o notas de captura previa a validar).</summary>
    public string? ResultNotes { get; set; }

    /// <summary>Valores del panel (formato examen = panel), JSON: {"Parametro":"valor",...}.</summary>
    public string? ResultParametersJson { get; set; }
    public DateTime? ValidatedAtUtc { get; set; }
    public int? ValidatedByUserId { get; set; }
    public User? ValidatedBy { get; set; }
}
