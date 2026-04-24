using NesLab.Application.Orders;

namespace NesLab.Web.Tests.Application;

/// <summary>Decisiones de caja: factura SAR o comprobante interno.</summary>
public class OrderFiscalRulesTests
{
    [Theory(DisplayName = "UX: distintas politicas de empresa y eleccion de correlativo")]
    [InlineData(false, false, true, true)]
    [InlineData(true, false, true, true)]
    [InlineData(true, true, true, true)]
    [InlineData(true, true, false, false)]
    public void UseSarCorrelative_Matriz(bool useCai, bool allowNonSar, bool useSarRequest, bool expectedSar) =>
        Assert.Equal(
            expectedSar,
            OrderFiscalRules.UseSarCorrelative(useCai, allowNonSar, useSarRequest));

    [Fact(DisplayName = "UX: con politica dual y sin useSarInvoice, por defecto es factura SAR")]
    public void UseSarCorrelative_Dual_SinUsarFlag_PorDefectoSar() =>
        Assert.True(OrderFiscalRules.UseSarCorrelative(true, true, null));

    [Fact(DisplayName = "UX: no se puede pedir 'factura SAR' si la empresa no esta en CAI")]
    public void SinCai_NoPuedePedirSar()
    {
        var ex = Assert.Throws<InvalidOperationException>(
            () => OrderFiscalRules.EnsureValidFiscalRequest(false, false, true));
        Assert.Equal(OrderFiscalRules.ErrorNoCaiSarRequest, ex.Message);
    }

    [Fact(DisplayName = "UX: con SAR estricto no se acepta comprobante interno en la peticion")]
    public void SarEstricto_RechazaInterna()
    {
        var ex = Assert.Throws<InvalidOperationException>(
            () => OrderFiscalRules.EnsureValidFiscalRequest(true, false, false));
        Assert.Equal(OrderFiscalRules.ErrorSarOnlyPolicy, ex.Message);
    }

    [Fact(DisplayName = "UX: dual policy con factura o interna valida")]
    public void Dual_SinExcepcion() =>
        OrderFiscalRules.EnsureValidFiscalRequest(true, true, false);
}
