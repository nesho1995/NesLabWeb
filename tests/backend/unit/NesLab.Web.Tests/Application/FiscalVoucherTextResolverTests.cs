using NesLab.Application.DTOs;
using NesLab.Application.Fiscal;

namespace NesLab.Web.Tests.Application;

/// <summary>Texto del comprobante (marca) para otro laboratorio o pie legal.</summary>
public class FiscalVoucherTextResolverTests
{
    [Fact(DisplayName = "Contenido: con marca nula, titulos y clasificacion por defecto")]
    public void NullBranding_Defaults()
    {
        var (title, clas, foot, ex) = FiscalVoucherTextResolver.Resolve(null, caiMode: true);
        Assert.Contains("SAR", title, StringComparison.Ordinal);
        Assert.False(string.IsNullOrEmpty(clas));
        Assert.Empty(foot);
        Assert.Null(ex);
    }

    [Fact(DisplayName = "Contenido: comprobante interno usa titulo y pie configurados")]
    public void Interno_UsaTituloInternoYPie()
    {
        var b = new FiscalBrandingDto
        {
            DocumentTitleInternal = " Recibo proforma ",
            DocumentTitleSar = "Factura A",
            ClasificacionActividad = "Clinica",
            FooterLines = new[] { "  Linea1  ", "" },
            ExigirFacturaLine = " Exija su comprobante ",
        };
        var (title, clas, foot, ex) = FiscalVoucherTextResolver.Resolve(b, caiMode: false);
        Assert.Equal("Recibo proforma", title);
        Assert.Equal("Clinica", clas);
        Assert.Single(foot);
        Assert.Equal("Linea1", foot[0]);
        Assert.Equal("Exija su comprobante", ex);
    }

    [Fact(DisplayName = "Contenido: factura SAR se sirve con titulo SAR")]
    public void Sar_UsaTituloSar()
    {
        var b = new FiscalBrandingDto
        {
            DocumentTitleSar = "Factura con CAI",
            DocumentTitleInternal = "Otro",
        };
        var (title, _, _, _) = FiscalVoucherTextResolver.Resolve(b, caiMode: true);
        Assert.Equal("Factura con CAI", title);
    }
}
