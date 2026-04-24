namespace NesLab.Domain.Entities;

public sealed class DiscountCatalog
{
    public int Id { get; set; }
    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public string Name { get; set; } = string.Empty;
    public decimal Percent { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
