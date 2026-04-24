using NesLab.Domain.Entities;

namespace NesLab.Domain.Rules;

public static class HondurasFiscalEngine
{
    public static FiscalReservation GetNextFiscal(Company company, DateTime utcNow)
    {
        var tz = GetHondurasTimeZone();
        var today = TimeZoneInfo.ConvertTimeFromUtc(utcNow.Kind == DateTimeKind.Utc ? utcNow : utcNow.ToUniversalTime(), tz).Date;

        var prefix = string.IsNullOrWhiteSpace(company.InvoicePrefix) ? "INT" : company.InvoicePrefix.Trim();
        var actual = company.InvoiceCurrent ?? 0;
        var siguiente = actual + 1;
        if (siguiente <= 0)
        {
            siguiente = 1;
        }

        if (!company.UseCai)
        {
            return new FiscalReservation(
                $"{prefix}-{siguiente:D8}",
                siguiente,
                "N/A",
                "SIN CONTROL SAR (CAI)",
                FechaLimite: DateTime.MaxValue,
                CaiMode: false);
        }

        var inicio = company.InvoiceStart ?? 0;
        var fin = company.InvoiceEnd ?? 0;
        if (inicio <= 0 || fin <= 0)
        {
            throw new InvalidOperationException("Falta configurar el rango de facturacion autorizado para CAI.");
        }

        var cai = company.Cai?.Trim() ?? "";
        if (string.IsNullOrEmpty(cai))
        {
            throw new InvalidOperationException("Falta el CAI de la empresa.");
        }

        var venc = company.CaiDueDate?.Date
            ?? throw new InvalidOperationException("Falta la fecha de vencimiento del CAI.");
        if (today > venc)
        {
            throw new InvalidOperationException("El CAI esta vencido. No se puede facturar.");
        }

        if (siguiente < inicio)
        {
            siguiente = inicio;
        }

        if (siguiente > fin)
        {
            throw new InvalidOperationException("Se alcanzo el limite del rango autorizado (SAR).");
        }

        var rango = string.IsNullOrWhiteSpace(company.InvoiceRangeLabel) ? cai : company.InvoiceRangeLabel!.Trim();
        return new FiscalReservation(
            $"{prefix}-{siguiente:D8}",
            siguiente,
            cai,
            rango,
            company.CaiDueDate ?? venc,
            CaiMode: true);
    }

    /// <summary>Secuencia independiente del correlativo SAR: recibos / notas internas (sin bloque CAI).</summary>
    public static FiscalReservation GetNextInternalDocument(Company company, DateTime utcNow)
    {
        _ = GetHondurasTimeZone();
        _ = TimeZoneInfo.ConvertTimeFromUtc(utcNow.Kind == DateTimeKind.Utc ? utcNow : utcNow.ToUniversalTime(), GetHondurasTimeZone()).Date;
        var p = string.IsNullOrWhiteSpace(company.InternalDocPrefix) ? "REC" : company.InternalDocPrefix.Trim();
        var actual = company.InternalDocCurrent ?? 0;
        var siguiente = actual + 1;
        if (siguiente <= 0)
        {
            siguiente = 1;
        }
        return new FiscalReservation(
            $"{p}-{siguiente:D8}",
            siguiente,
            "N/A",
            "DOCUMENTO SIN BLOQUE SAR (CONFIGURACION DE EMPRESA)",
            FechaLimite: DateTime.MaxValue,
            CaiMode: false);
    }

    public static bool IsRtn14DigitsOrFinalConsumer(string? rtn, bool isFinal)
    {
        if (isFinal)
        {
            return true;
        }
        if (string.IsNullOrWhiteSpace(rtn) || rtn.Length != 14)
        {
            return false;
        }
        foreach (var c in rtn)
        {
            if (c is < '0' or > '9')
            {
                return false;
            }
        }
        return true;
    }

    public static (decimal subtotalBase, decimal subtotalAfterDiscount, decimal discountAmount, decimal isv, decimal total) ComputeTotals(
        IReadOnlyList<(decimal basePrice, decimal lineDiscountPercent)> lines,
        decimal isvRate)
    {
        if (lines.Count == 0)
        {
            throw new InvalidOperationException("La orden requiere al menos un detalle.");
        }
        var subBase = 0m;
        var subFinal = 0m;
        foreach (var (b, p) in lines)
        {
            if (b < 0)
            {
                throw new InvalidOperationException("Precio de linea invalido.");
            }
            if (p < 0 || p > 100)
            {
                throw new InvalidOperationException("Descuento de linea invalido.");
            }
            var lineTotal = b - b * (p / 100m);
            if (lineTotal < 0)
            {
                lineTotal = 0;
            }
            subBase += b;
            subFinal += lineTotal;
        }
        var disc = subBase - subFinal;
        if (disc < 0)
        {
            disc = 0;
        }
        var isv = Math.Round(subFinal * isvRate, 2, MidpointRounding.AwayFromZero);
        var tot = subFinal + isv;
        return (subBase, subFinal, disc, isv, tot);
    }

    public static TimeZoneInfo GetHondurasTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/Tegucigalpa");
        }
        catch
        {
            return TimeZoneInfo.CreateCustomTimeZone("Honduras", TimeSpan.FromHours(-6), "Honduras", "Honduras");
        }
    }
}

public readonly record struct FiscalReservation(
    string FormattedNumber,
    int NewCorrelative,
    string? Cai,
    string? Rango,
    DateTime FechaLimite,
    bool CaiMode);
