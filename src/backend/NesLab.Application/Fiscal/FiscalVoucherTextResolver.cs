using NesLab.Application.DTOs;

namespace NesLab.Application.Fiscal;

/// <summary>Textos de comprobante a partir de configuracion de marca fiscal.</summary>
public static class FiscalVoucherTextResolver
{
    public static (string DocumentTitle, string Clasificacion, IReadOnlyList<string> FooterLines, string? Exigir) Resolve(
        FiscalBrandingDto? branding,
        bool caiMode)
    {
        const string defSar = "Comprobante fiscal (CAI / correlativo SAR)";
        const string defInt = "Comprobante de cobro (secuencia interna, sin bloque SAR)";
        const string defClas = "Servicios de laboratorio clinico / atencion ambulatoria";
        var title = caiMode
            ? (string.IsNullOrWhiteSpace(branding?.DocumentTitleSar) ? defSar : branding!.DocumentTitleSar!.Trim())
            : (string.IsNullOrWhiteSpace(branding?.DocumentTitleInternal) ? defInt : branding!.DocumentTitleInternal!.Trim());
        var clas = string.IsNullOrWhiteSpace(branding?.ClasificacionActividad)
            ? defClas
            : branding!.ClasificacionActividad!.Trim();
        var foot = new List<string>();
        if (branding?.FooterLines is { Count: > 0 } lines)
        {
            foreach (var line in lines)
            {
                var t = line?.Trim();
                if (!string.IsNullOrEmpty(t))
                {
                    foot.Add(t);
                }
            }
        }
        var ex = string.IsNullOrWhiteSpace(branding?.ExigirFacturaLine) ? null : branding!.ExigirFacturaLine!.Trim();
        return (title, clas, foot, ex);
    }
}
