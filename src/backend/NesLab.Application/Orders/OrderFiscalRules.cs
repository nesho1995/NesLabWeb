namespace NesLab.Application.Orders;

/// <summary>Reglas al crear orden: factura SAR vs comprobante interno.</summary>
public static class OrderFiscalRules
{
    public const string ErrorNoCaiSarRequest =
        "La empresa no esta registrada con SAR/CAI; no puede emitir factura con bloque SAR.";

    public const string ErrorSarOnlyPolicy = "La politica de la empresa exige comprobante con correlativo SAR (CAI).";

    /// <summary>
    /// True si se debe avanzar el correlativo de facturacion (SAR o simulado sin CAI); false = secuencia interna.
    /// </summary>
    public static bool UseSarCorrelative(bool useCai, bool allowNonSarDocument, bool? useSarInvoice) =>
        !useCai
        || (useCai && !allowNonSarDocument)
        || (useCai && allowNonSarDocument && (useSarInvoice ?? true));

    public static void EnsureValidFiscalRequest(bool useCai, bool allowNonSarDocument, bool? useSarInvoice)
    {
        if (!useCai && useSarInvoice == true)
        {
            throw new InvalidOperationException(ErrorNoCaiSarRequest);
        }
        if (useCai && !allowNonSarDocument && useSarInvoice == false)
        {
            throw new InvalidOperationException(ErrorSarOnlyPolicy);
        }
    }
}
