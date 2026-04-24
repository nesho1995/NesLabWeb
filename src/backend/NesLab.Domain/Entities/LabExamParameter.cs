namespace NesLab.Domain.Entities;

public sealed class LabExamParameter
{
    public int Id { get; set; }
    public int LabExamId { get; set; }
    public LabExam LabExam { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string? Unit { get; set; }
    public string? ReferenceText { get; set; }
    public bool IsActive { get; set; } = true;
}
