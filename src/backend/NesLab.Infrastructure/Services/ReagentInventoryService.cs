using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class ReagentInventoryService(
    ITenantContext tenant,
    NesLabDbContext db) : IReagentInventoryService
{
    private int CompanyId => tenant.CompanyId;

    public async Task<IReadOnlyList<ReagentStockItemDto>> ListAsync(
        bool includeInactive,
        CancellationToken cancellationToken = default)
    {
        var query = db.ReagentStocks
            .AsNoTracking()
            .Where(x => x.CompanyId == CompanyId);
        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }

        return await query
            .OrderBy(x => x.Name)
            .ThenBy(x => x.Id)
            .Select(MapDto())
            .ToListAsync(cancellationToken);
    }

    public async Task<ReagentInventoryOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var q = db.ReagentStocks
            .AsNoTracking()
            .Where(x => x.CompanyId == CompanyId && x.IsActive);
        var total = await q.CountAsync(cancellationToken);
        var lowTotal = await q.CountAsync(x => x.CurrentStock <= x.MinimumStock, cancellationToken);
        var low = await q
            .Where(x => x.CurrentStock <= x.MinimumStock)
            .OrderBy(x => x.Name)
            .Take(8)
            .Select(x => x.Name)
            .ToListAsync(cancellationToken);
        return new ReagentInventoryOverviewDto(total, lowTotal, low);
    }

    public async Task<ReagentStockItemDto> CreateAsync(
        CreateReagentStockRequest request,
        CancellationToken cancellationToken = default)
    {
        var code = NormalizeCode(request.Code);
        if (string.IsNullOrWhiteSpace(code))
        {
            code = await GenerateCodeAsync(cancellationToken);
        }
        var name = request.Name?.Trim() ?? string.Empty;
        var unit = string.IsNullOrWhiteSpace(request.Unit) ? "unidad" : request.Unit.Trim();
        if (name.Length is < 2 or > 120)
        {
            throw new InvalidOperationException("El nombre del reactivo debe tener entre 2 y 120 caracteres.");
        }
        if (unit.Length is < 1 or > 20)
        {
            throw new InvalidOperationException("La unidad debe tener entre 1 y 20 caracteres.");
        }
        if (request.CurrentStock < 0m || request.MinimumStock < 0m)
        {
            throw new InvalidOperationException("Las existencias no pueden ser negativas.");
        }
        if (await db.ReagentStocks.AnyAsync(
                x => x.CompanyId == CompanyId && x.Code == code,
                cancellationToken))
        {
            throw new InvalidOperationException("Ya existe un reactivo con ese codigo.");
        }

        var now = DateTime.UtcNow;
        var row = new ReagentStock
        {
            CompanyId = CompanyId,
            Code = code,
            Name = name,
            Unit = unit,
            CurrentStock = Round3(request.CurrentStock),
            MinimumStock = Round3(request.MinimumStock),
            IsActive = true,
            UpdatedAtUtc = now
        };
        db.ReagentStocks.Add(row);
        await db.SaveChangesAsync(cancellationToken);
        return Map(row);
    }

    public async Task<ReagentStockItemDto> UpdateAsync(
        int id,
        UpdateReagentStockRequest request,
        CancellationToken cancellationToken = default)
    {
        var row = await db.ReagentStocks
                      .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == CompanyId, cancellationToken)
                  ?? throw new InvalidOperationException("Reactivo no encontrado.");
        var name = request.Name?.Trim() ?? string.Empty;
        var unit = string.IsNullOrWhiteSpace(request.Unit) ? "unidad" : request.Unit.Trim();
        if (name.Length is < 2 or > 120)
        {
            throw new InvalidOperationException("El nombre del reactivo debe tener entre 2 y 120 caracteres.");
        }
        if (unit.Length is < 1 or > 20)
        {
            throw new InvalidOperationException("La unidad debe tener entre 1 y 20 caracteres.");
        }
        if (request.MinimumStock < 0m)
        {
            throw new InvalidOperationException("El minimo no puede ser negativo.");
        }

        row.Name = name;
        row.Unit = unit;
        row.MinimumStock = Round3(request.MinimumStock);
        row.IsActive = request.IsActive;
        row.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Map(row);
    }

    public async Task<ReagentStockItemDto> AdjustAsync(
        int id,
        AdjustReagentStockRequest request,
        CancellationToken cancellationToken = default)
    {
        var row = await db.ReagentStocks
                      .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == CompanyId, cancellationToken)
                  ?? throw new InvalidOperationException("Reactivo no encontrado.");
        var delta = Round3(request.QuantityDelta);
        if (delta == 0m)
        {
            throw new InvalidOperationException("El ajuste no puede ser cero.");
        }
        var next = Round3(row.CurrentStock + delta);
        if (next < 0m)
        {
            throw new InvalidOperationException("No puedes dejar inventario negativo.");
        }

        row.CurrentStock = next;
        row.UpdatedAtUtc = DateTime.UtcNow;
        _ = request.Notes;
        await db.SaveChangesAsync(cancellationToken);
        return Map(row);
    }

    private static decimal Round3(decimal value) => decimal.Round(value, 3, MidpointRounding.AwayFromZero);

    private static string NormalizeCode(string? code)
    {
        var t = (code ?? string.Empty).Trim().ToUpperInvariant().Replace(" ", string.Empty, StringComparison.Ordinal);
        if (t.Length == 0)
        {
            return string.Empty;
        }
        if (t.Length is < 2 or > 30)
        {
            throw new InvalidOperationException("El codigo debe tener entre 2 y 30 caracteres.");
        }
        for (var i = 0; i < t.Length; i++)
        {
            if (t[i] is (>= 'A' and <= 'Z') or (>= '0' and <= '9') or '-' or '_')
            {
                continue;
            }
            throw new InvalidOperationException("El codigo solo admite A-Z, 0-9, guion y guion bajo.");
        }
        return t;
    }

    private async Task<string> GenerateCodeAsync(CancellationToken cancellationToken)
    {
        var prefix = "REA-";
        var existing = await db.ReagentStocks
            .AsNoTracking()
            .Where(x => x.CompanyId == CompanyId && x.Code.StartsWith(prefix))
            .Select(x => x.Code)
            .ToListAsync(cancellationToken);

        var max = 0;
        foreach (var code in existing)
        {
            var suffix = code[prefix.Length..];
            if (int.TryParse(suffix, out var n) && n > max)
            {
                max = n;
            }
        }
        return $"{prefix}{max + 1:000}";
    }

    private static ReagentStockItemDto Map(ReagentStock x) =>
        new(
            x.Id,
            x.Code,
            x.Name,
            x.Unit,
            x.CurrentStock,
            x.MinimumStock,
            x.IsActive,
            x.CurrentStock <= x.MinimumStock,
            x.UpdatedAtUtc);

    private static Expression<Func<ReagentStock, ReagentStockItemDto>> MapDto() =>
        x => new ReagentStockItemDto(
            x.Id,
            x.Code,
            x.Name,
            x.Unit,
            x.CurrentStock,
            x.MinimumStock,
            x.IsActive,
            x.CurrentStock <= x.MinimumStock,
            x.UpdatedAtUtc);
}
