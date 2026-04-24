using Microsoft.EntityFrameworkCore;
using NesLab.Domain.Entities;

namespace NesLab.Infrastructure.Persistence.Seed;

public static class DefaultDataSeeder
{
    public static async Task EnsureDefaultCompanyAsync(NesLabDbContext dbContext, CancellationToken cancellationToken = default)
    {
        if (await dbContext.Companies.AnyAsync(cancellationToken))
        {
            return;
        }

        dbContext.Companies.Add(new Company
        {
            Name = "Laboratorio principal",
            IsActive = true,
            InvoicePrefix = "INT",
            UseCai = false,
            InvoiceCurrent = 0
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
