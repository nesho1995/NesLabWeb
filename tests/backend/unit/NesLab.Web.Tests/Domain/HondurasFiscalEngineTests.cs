using NesLab.Domain.Entities;
using NesLab.Domain.Rules;

namespace NesLab.Web.Tests.Domain;

/// <summary>Escenarios de reglas fiscales HN (SAR) para comprobantes.</summary>
public class HondurasFiscalEngineTests
{
    [Fact(DisplayName = "Usuario: empresa sin CAI obtiene comprobante local y no CaiMode")]
    public void SinCai_Reserva_SinBloqueSar()
    {
        var c = new Company
        {
            UseCai = false,
            InvoicePrefix = "LAB",
            InvoiceCurrent = 0,
        };
        var r = HondurasFiscalEngine.GetNextFiscal(c, DateTime.UtcNow);
        Assert.Equal("LAB-00000001", r.FormattedNumber);
        Assert.False(r.CaiMode);
        Assert.Equal(1, r.NewCorrelative);
    }

    [Fact(DisplayName = "Usuario: empresa con CAI y vigente recibe bloque, correlativo y vencimiento")]
    public void ConCaiVigente_Reserva_ConCaiYCorrelativoEnRango()
    {
        var vence = new DateTime(2030, 1, 15, 0, 0, 0, DateTimeKind.Utc);
        var c = new Company
        {
            UseCai = true,
            InvoicePrefix = "F",
            InvoiceCurrent = 0,
            InvoiceStart = 100,
            InvoiceEnd = 5000,
            Cai = "CAI-TEST-1",
            InvoiceRangeLabel = "1 al 5000",
            CaiDueDate = vence,
        };
        var r = HondurasFiscalEngine.GetNextFiscal(c, new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        Assert.True(r.CaiMode);
        Assert.Equal(100, r.NewCorrelative);
        Assert.Equal("F-00000100", r.FormattedNumber);
        Assert.Equal("CAI-TEST-1", r.Cai);
    }

    [Fact(DisplayName = "Usuario: CAI vencido no debe permitir facturar")]
    public void CaiVencido_Lanza()
    {
        var c = new Company
        {
            UseCai = true,
            InvoicePrefix = "F",
            InvoiceCurrent = 99,
            InvoiceStart = 1,
            InvoiceEnd = 2000,
            Cai = "X",
            CaiDueDate = new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        };
        var ex = Assert.Throws<InvalidOperationException>(
            () => HondurasFiscalEngine.GetNextFiscal(c, new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)));
        Assert.Contains("vencid", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Usuario: comprobante interno usa otra secuencia y no CaiMode")]
    public void ComprobanteInterno_SecuenciaIndependiente()
    {
        var c = new Company
        {
            UseCai = true,
            InternalDocPrefix = "R",
            InternalDocCurrent = 2,
        };
        var r = HondurasFiscalEngine.GetNextInternalDocument(c, DateTime.UtcNow);
        Assert.False(r.CaiMode);
        Assert.Equal(3, r.NewCorrelative);
        Assert.Equal("R-00000003", r.FormattedNumber);
    }

    [Fact(DisplayName = "Usuario: totales con ISV 15% incluye descuento e ISV redondeado")]
    public void Totales_IsvYRedondeo()
    {
        var (subBase, subFinal, disc, isv, total) = HondurasFiscalEngine.ComputeTotals(
            [(100m, 0m), (200m, 10m)], 0.15m);
        Assert.Equal(300m, subBase);
        Assert.Equal(280m, subFinal);
        Assert.Equal(20m, disc);
        Assert.Equal(42m, isv);
        Assert.Equal(322m, total);
    }

    [Theory(DisplayName = "Usuario: credito fiscal exige RTN 14 digitos; consumidor final acepta")]
    [InlineData("08019001234567", false, true)]
    [InlineData("123", false, false)]
    [InlineData(null, true, true)]
    public void RtnOConsumidorFinal(string? rtn, bool final, bool ok) =>
        Assert.Equal(ok, HondurasFiscalEngine.IsRtn14DigitsOrFinalConsumer(rtn, final));
}
