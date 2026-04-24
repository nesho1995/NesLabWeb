using Microsoft.EntityFrameworkCore;
using NesLab.Domain.Entities;

namespace NesLab.Infrastructure.Persistence.Seed;

public static class PaymentMethodSeeder
{
    public static async Task EnsureAsync(NesLabDbContext db, CancellationToken cancellationToken = default)
    {
        var companyIds = await db.Companies.Select(c => c.Id).ToListAsync(cancellationToken);
        foreach (var cid in companyIds)
        {
            if (await db.CompanyPaymentMethods.AnyAsync(x => x.CompanyId == cid, cancellationToken))
            {
                continue;
            }
            var defaults = new (string Code, string Name, int Ord, bool Drawer, bool Req)[]
            {
                ("EFECTIVO", "Efectivo", 0, true, true),
                ("TARJETA", "Tarjeta", 10, false, false),
                ("TRANSFERENCIA", "Transferencia", 20, false, false),
                ("OTRO", "Otro", 30, false, false)
            };
            foreach (var d in defaults)
            {
                db.CompanyPaymentMethods.Add(
                    new CompanyPaymentMethod
                    {
                        CompanyId = cid,
                        Code = d.Code,
                        Name = d.Name,
                        SortOrder = d.Ord,
                        IsActive = true,
                        InPhysicalDrawer = d.Drawer,
                        RequiresAmountReceived = d.Req
                    });
            }
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
