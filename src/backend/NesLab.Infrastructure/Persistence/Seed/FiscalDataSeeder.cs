using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NesLab.Domain.Entities;

namespace NesLab.Infrastructure.Persistence.Seed;

public static class FiscalDataSeeder
{
    public static async Task EnsureAsync(
        NesLabDbContext db,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var companyId = configuration.GetValue("Lab:DefaultCompanyId", 1);
        var company = await db.Companies.FirstOrDefaultAsync(x => x.Id == companyId, cancellationToken);
        if (company is not null)
        {
            var touch = false;
            if (string.IsNullOrWhiteSpace(company.InvoicePrefix))
            {
                company.InvoicePrefix = "INT";
                touch = true;
            }
            if (company.InvoiceCurrent is null)
            {
                company.InvoiceCurrent = 0;
                touch = true;
            }
            if (touch)
            {
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        if (await db.Discounts.AnyAsync(cancellationToken))
        {
            return;
        }

        db.Discounts.AddRange(
            new DiscountCatalog
            {
                CompanyId = null,
                Name = "Sin descuento",
                Percent = 0,
                IsActive = true,
                SortOrder = 0
            },
            new DiscountCatalog
            {
                CompanyId = null,
                Name = "5% convenio",
                Percent = 5,
                IsActive = true,
                SortOrder = 1
            },
            new DiscountCatalog
            {
                CompanyId = null,
                Name = "10% promocion",
                Percent = 10,
                IsActive = true,
                SortOrder = 2
            },
            new DiscountCatalog
            {
                CompanyId = null,
                Name = "20% carga social",
                Percent = 20,
                IsActive = true,
                SortOrder = 3
            });
        await db.SaveChangesAsync(cancellationToken);
    }
}
