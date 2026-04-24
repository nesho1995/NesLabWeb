using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Fiscal;

public sealed class FiscalQueryService(NesLabDbContext db) : IFiscalQueryService
{
    public async Task<CompanyFiscalStatusDto?> GetCompanyFiscalStatusAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var c = await db.Companies.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == companyId, cancellationToken);
        if (c is null)
        {
            return null;
        }
        return Map(c);
    }

    private static CompanyFiscalStatusDto Map(Company c)
    {
        int? days = null;
        var isValid = true;
        string? warn = null;
        if (c.CaiDueDate is { } d)
        {
            days = (int)(d.Date - DateTime.UtcNow.Date).TotalDays;
            if (c.UseCai && DateTime.UtcNow.Date > d.Date)
            {
                isValid = false;
                warn = "CAI vencido. La empresa no deberia emitir comprobantes.";
            }
            else if (c.UseCai && days is < 7 and >= 0)
            {
                warn = $"Quedan pocos dias de vigencia del CAI ({days}d).";
            }
        }
        return new CompanyFiscalStatusDto(
            c.Id,
            c.Name,
            c.IsActive,
            c.UseCai,
            c.AllowNonSarDocument,
            c.InternalDocPrefix,
            c.InternalDocCurrent,
            c.InvoicePrefix,
            c.InvoiceCurrent,
            c.InvoiceStart,
            c.InvoiceEnd,
            c.Cai,
            c.InvoiceRangeLabel,
            c.CaiDueDate,
            days,
            isValid,
            warn,
            FiscalBrandingParser.FromJson(c.FiscalBrandingJson));
    }
}
