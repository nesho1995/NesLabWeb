using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Rules;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Fiscal;

public sealed class FiscalCommandService(NesLabDbContext db, IFiscalQueryService read) : IFiscalCommandService
{
    public async Task<CompanyFiscalStatusDto> UpdateSarConfigAsync(
        int companyId,
        UpdateSarConfigRequest request,
        CancellationToken cancellationToken = default)
    {
        var c = await db.Companies.FirstOrDefaultAsync(x => x.Id == companyId, cancellationToken)
            ?? throw new InvalidOperationException("Empresa no encontrada.");
        if (!string.IsNullOrWhiteSpace(request.InvoicePrefix))
        {
            c.InvoicePrefix = request.InvoicePrefix.Trim();
        }
        c.UseCai = request.UseCai;
        if (request.UseCai)
        {
            if (string.IsNullOrWhiteSpace(request.Cai))
            {
                throw new InvalidOperationException("Con SAR activo, el CAI es obligatorio.");
            }
            if (request.CaiDueDate is null)
            {
                throw new InvalidOperationException("Con SAR activo, la fecha de vencimiento del CAI es obligatoria.");
            }
            if (request.InvoiceStart is null or <= 0 || request.InvoiceEnd is null or <= 0)
            {
                throw new InvalidOperationException("Con SAR activo, configure inicio y fin de correlativo.");
            }
            if (request.InvoiceEnd < request.InvoiceStart)
            {
                throw new InvalidOperationException("El fin del rango no puede ser menor que el inicio.");
            }
            c.Cai = request.Cai.Trim();
            c.CaiDueDate = request.CaiDueDate;
            c.InvoiceStart = request.InvoiceStart;
            c.InvoiceEnd = request.InvoiceEnd;
            c.InvoiceRangeLabel = string.IsNullOrWhiteSpace(request.RangeLabel) ? null : request.RangeLabel!.Trim();
            if (request.ResetCorrelativeToRangeStart)
            {
                c.InvoiceCurrent = c.InvoiceStart - 1;
            }
        }
        else
        {
            c.Cai = null;
            c.InvoiceRangeLabel = null;
            c.CaiDueDate = null;
            c.InvoiceStart = null;
            c.InvoiceEnd = null;
        }
        if (c.UseCai && c.InvoiceCurrent is { } cur && c.InvoiceEnd is { } rEnd && c.InvoiceStart is { } rInicio)
        {
            if (cur < rInicio - 1)
            {
                c.InvoiceCurrent = rInicio - 1;
            }
            if (cur > rEnd)
            {
                throw new InvalidOperationException("El correlativo actual excede el rango. Use reinicio a inicio o ajuste el rango en SAR.");
            }
        }
        if (c.UseCai)
        {
            _ = HondurasFiscalEngine.GetNextFiscal(c, DateTime.UtcNow);
        }
        if (!c.UseCai)
        {
            c.AllowNonSarDocument = false;
        }
        if (request.AllowNonSarDocument is { } allow)
        {
            c.AllowNonSarDocument = c.UseCai && allow;
        }
        if (!string.IsNullOrWhiteSpace(request.InternalDocPrefix))
        {
            c.InternalDocPrefix = request.InternalDocPrefix!.Trim().Length > 20
                ? request.InternalDocPrefix!.Trim().Substring(0, 20)
                : request.InternalDocPrefix!.Trim();
        }
        await db.SaveChangesAsync(cancellationToken);
        return (await read.GetCompanyFiscalStatusAsync(companyId, cancellationToken))!;
    }

    public async Task<CompanyFiscalStatusDto> UpdateFiscalBrandingAsync(
        int companyId,
        FiscalBrandingDto branding,
        CancellationToken cancellationToken = default)
    {
        var c = await db.Companies.FirstOrDefaultAsync(x => x.Id == companyId, cancellationToken)
            ?? throw new InvalidOperationException("Empresa no encontrada.");
        c.FiscalBrandingJson = JsonSerializer.Serialize(
            branding,
            new JsonSerializerOptions { WriteIndented = false, PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        await db.SaveChangesAsync(cancellationToken);
        return (await read.GetCompanyFiscalStatusAsync(companyId, cancellationToken))!;
    }
}
