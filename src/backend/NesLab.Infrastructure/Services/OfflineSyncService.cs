using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class OfflineSyncService(
    ITenantContext tenant,
    NesLabDbContext db) : IOfflineSyncService
{
    private int CompanyId => tenant.CompanyId;

    public async Task<OfflineSyncRegularizationDto> AddRegularizationAsync(
        OfflineSyncRegularizationRequest request,
        CancellationToken cancellationToken = default)
    {
        var tempId = (request.TempId ?? string.Empty).Trim();
        if (tempId.Length is < 4 or > 80)
        {
            throw new InvalidOperationException("TempId invalido.");
        }
        var invoice = (request.InvoiceNumber ?? string.Empty).Trim();
        if (invoice.Length is < 2 or > 60)
        {
            throw new InvalidOperationException("InvoiceNumber invalido.");
        }
        var existsOrder = await db.Orders.AnyAsync(
            o => o.CompanyId == CompanyId && o.Id == request.OrderId,
            cancellationToken);
        if (!existsOrder)
        {
            throw new InvalidOperationException("La orden final no existe en esta empresa.");
        }

        var already = await db.OfflineSyncRegularizations
            .FirstOrDefaultAsync(
                x => x.CompanyId == CompanyId && x.TempId == tempId && x.OrderId == request.OrderId,
                cancellationToken);
        if (already is not null)
        {
            return Map(already);
        }

        var row = new OfflineSyncRegularization
        {
            CompanyId = CompanyId,
            TempId = tempId,
            OrderId = request.OrderId,
            InvoiceNumber = invoice,
            CaiMode = request.CaiMode,
            RequestedCai = request.RequestedCai,
            PatientName = (request.PatientName ?? string.Empty).Trim(),
            Source = string.IsNullOrWhiteSpace(request.Source) ? "web-offline" : request.Source.Trim(),
            RegularizedAtUtc = DateTime.UtcNow,
        };
        db.OfflineSyncRegularizations.Add(row);
        await db.SaveChangesAsync(cancellationToken);
        return Map(row);
    }

    public async Task<IReadOnlyList<OfflineSyncRegularizationDto>> ListRecentAsync(
        int take = 200,
        CancellationToken cancellationToken = default)
    {
        var max = Math.Clamp(take, 1, 1000);
        return await db.OfflineSyncRegularizations
            .AsNoTracking()
            .Where(x => x.CompanyId == CompanyId)
            .OrderByDescending(x => x.RegularizedAtUtc)
            .Take(max)
            .Select(x => new OfflineSyncRegularizationDto(
                x.Id,
                x.TempId,
                x.OrderId,
                x.InvoiceNumber,
                x.CaiMode,
                x.RequestedCai,
                x.PatientName,
                x.Source,
                x.RegularizedAtUtc))
            .ToListAsync(cancellationToken);
    }

    private static OfflineSyncRegularizationDto Map(OfflineSyncRegularization x) =>
        new(
            x.Id,
            x.TempId,
            x.OrderId,
            x.InvoiceNumber,
            x.CaiMode,
            x.RequestedCai,
            x.PatientName,
            x.Source,
            x.RegularizedAtUtc);
}
