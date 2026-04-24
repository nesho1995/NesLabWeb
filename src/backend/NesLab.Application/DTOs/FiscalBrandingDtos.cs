namespace NesLab.Application.DTOs;

public sealed class FiscalBrandingDto
{
    public string? LaboratoryDisplayName { get; set; }
    public string? LaboratoryLogoUrl { get; set; }
    public string? LaboratoryAddress { get; set; }
    public string? LaboratoryPhone { get; set; }
    public string? LaboratoryEmail { get; set; }
    public string? DefaultPrintProfile { get; set; }
    public string? DocumentTitleSar { get; set; }
    public string? DocumentTitleInternal { get; set; }
    public string? ClasificacionActividad { get; set; }
    public IReadOnlyList<string>? FooterLines { get; set; }
    public string? ExigirFacturaLine { get; set; }
}
