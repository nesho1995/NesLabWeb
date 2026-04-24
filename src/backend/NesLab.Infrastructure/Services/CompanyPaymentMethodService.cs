using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class CompanyPaymentMethodService(
    ITenantContext tenant,
    NesLabDbContext db) : ICompanyPaymentMethodService
{
    private int CompanyId => tenant.CompanyId;

    public async Task<IReadOnlyList<PaymentMethodListItemDto>> ListActiveForOrdersAsync(
        CancellationToken cancellationToken = default)
    {
        return await db.CompanyPaymentMethods
            .AsNoTracking()
            .Where(x => x.CompanyId == CompanyId && x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .Select(x => new PaymentMethodListItemDto(
                x.Id, x.Code, x.Name, x.SortOrder, x.IsActive, x.InPhysicalDrawer, x.RequiresAmountReceived))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PaymentMethodListItemDto>> ListAllAsync(CancellationToken cancellationToken = default)
    {
        return await db.CompanyPaymentMethods
            .AsNoTracking()
            .Where(x => x.CompanyId == CompanyId)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .Select(x => new PaymentMethodListItemDto(
                x.Id, x.Code, x.Name, x.SortOrder, x.IsActive, x.InPhysicalDrawer, x.RequiresAmountReceived))
            .ToListAsync(cancellationToken);
    }

    public async Task<PaymentMethodListItemDto> CreateAsync(
        CreatePaymentMethodRequest request,
        CancellationToken cancellationToken = default)
    {
        var code = NormalizeCode(request.Code);
        if (code.Length is < 2 or > 20)
        {
            throw new InvalidOperationException("El codigo debe tener entre 2 y 20 caracteres (A-Z, numeros, guion).");
        }
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 80)
        {
            throw new InvalidOperationException("El nombre no es valido.");
        }
        if (await db.CompanyPaymentMethods
                .AnyAsync(
                    x => x.CompanyId == CompanyId && x.Code == code,
                    cancellationToken))
        {
            throw new InvalidOperationException("Ya existe una forma de pago con ese codigo.");
        }
        var r = new CompanyPaymentMethod
        {
            CompanyId = CompanyId,
            Code = code,
            Name = request.Name.Trim(),
            SortOrder = request.SortOrder,
            IsActive = true,
            InPhysicalDrawer = request.InPhysicalDrawer,
            RequiresAmountReceived = request.RequiresAmountReceived
        };
        db.CompanyPaymentMethods.Add(r);
        await db.SaveChangesAsync(cancellationToken);
        return new PaymentMethodListItemDto(
            r.Id, r.Code, r.Name, r.SortOrder, r.IsActive, r.InPhysicalDrawer, r.RequiresAmountReceived);
    }

    public async Task<PaymentMethodListItemDto> UpdateAsync(
        int id,
        UpdatePaymentMethodRequest request,
        CancellationToken cancellationToken = default)
    {
        var e = await db.CompanyPaymentMethods
                    .FirstOrDefaultAsync(
                        x => x.Id == id && x.CompanyId == CompanyId,
                        cancellationToken)
                ?? throw new InvalidOperationException("Forma de pago inexistente.");
        e.Name = request.Name.Trim();
        e.SortOrder = request.SortOrder;
        e.IsActive = request.IsActive;
        e.InPhysicalDrawer = request.InPhysicalDrawer;
        e.RequiresAmountReceived = request.RequiresAmountReceived;
        if (!e.IsActive && !await db.CompanyPaymentMethods.AnyAsync(
                x => x.CompanyId == CompanyId && x.IsActive && x.Id != e.Id,
                cancellationToken))
        {
            throw new InvalidOperationException("Debe quedar al menos una forma de pago activa.");
        }
        await db.SaveChangesAsync(cancellationToken);
        return new PaymentMethodListItemDto(
            e.Id, e.Code, e.Name, e.SortOrder, e.IsActive, e.InPhysicalDrawer, e.RequiresAmountReceived);
    }

    private static string NormalizeCode(string code)
    {
        var t = (code ?? string.Empty).Trim().ToUpperInvariant().Replace(" ", string.Empty, StringComparison.Ordinal);
        for (var i = 0; i < t.Length; i++)
        {
            if (t[i] is (>= 'A' and <= 'Z') or (>= '0' and <= '9') or '-')
            {
                continue;
            }
            throw new InvalidOperationException("El codigo solo admite A-Z, numeros y guion.");
        }
        return t;
    }
}
