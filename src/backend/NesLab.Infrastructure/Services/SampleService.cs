using System.Globalization;
using Microsoft.EntityFrameworkCore;
using NesLab.Application.Abstractions;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class SampleService(
    NesLabDbContext db,
    ITenantContext tenant,
    ICurrentUserContext current) : ISampleService
{
    private static readonly TimeZoneInfo HondurasTimeZone = ResolveHondurasTimeZone();

    public async Task<PagedResult<SampleListItemDto>> GetSamplesAsync(
        SamplesListQuery query,
        CancellationToken cancellationToken = default)
    {
        var companyId = tenant.CompanyId;
        var page = Math.Max(1, query.Page);
        var size = Math.Clamp(query.PageSize, 1, 100);
        var search = query.Search?.Trim();
        var fromUtc = query.FromDate is null
            ? (DateTime?)null
            : ToUtcStartOfDay(query.FromDate.Value);
        var toUtcExclusive = query.ToDate is null
            ? (DateTime?)null
            : ToUtcStartOfDay(query.ToDate.Value.AddDays(1));

        IQueryable<LabSample> q = db.LabSamples
            .AsNoTracking()
            .Where(s => s.CompanyId == companyId);

        if (query.OnlyPending)
        {
            q = q.Where(s => s.CollectedAtUtc == null);
        }

        if (!string.IsNullOrEmpty(search))
        {
            if (int.TryParse(search, NumberStyles.Integer, CultureInfo.InvariantCulture, out var orderId) && orderId > 0)
            {
                var s2 = search.ToLower();
                q = q.Where(
                    s => s.OrderId == orderId
                         || s.Code.ToLower().Contains(s2)
                         || s.Order.InvoiceNumber.ToLower().Contains(s2)
                         || s.Order.Patient.FullName.ToLower().Contains(s2));
            }
            else
            {
                var s2 = search.ToLower();
                q = q.Where(
                    s => s.Code.ToLower().Contains(s2)
                         || s.Order.InvoiceNumber.ToLower().Contains(s2)
                         || s.Order.Patient.FullName.ToLower().Contains(s2));
            }
        }

        if (fromUtc is not null)
        {
            q = q.Where(s => s.Order.OrderAtUtc >= fromUtc.Value);
        }

        if (toUtcExclusive is not null)
        {
            q = q.Where(s => s.Order.OrderAtUtc < toUtcExclusive.Value);
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(s => s.CreatedAtUtc)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(
                s => new SampleListItemDto(
                    s.Id,
                    s.OrderId,
                    s.Code,
                    s.Notes,
                    s.CollectedAtUtc,
                    s.CreatedAtUtc,
                    s.Order.Patient.FullName,
                    s.Order.InvoiceNumber,
                    s.Order.OrderAtUtc,
                    s.CreatedBy != null ? s.CreatedBy.FullName : null))
            .ToListAsync(cancellationToken);

        return new PagedResult<SampleListItemDto>(items, total, page, size);
    }

    public async Task<SampleListItemDto> CreateAsync(
        CreateSampleRequest request,
        CancellationToken cancellationToken = default)
    {
        var companyId = tenant.CompanyId;
        var userId = current.UserId;
        var order = await db.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(
                o => o.Id == request.OrderId && o.CompanyId == companyId, cancellationToken);
        if (order is null)
        {
            throw new InvalidOperationException("Orden no encontrada o no pertenece a la empresa.");
        }

        var code = await NewUniqueCodeAsync(companyId, order.Id, cancellationToken);
        var notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        if (notes is { Length: > 2000 })
        {
            notes = notes[..2000];
        }

        var sample = new LabSample
        {
            CompanyId = companyId,
            OrderId = order.Id,
            Code = code,
            Notes = notes,
            CreatedByUserId = userId,
            CreatedAtUtc = DateTime.UtcNow
        };
        db.LabSamples.Add(sample);
        await db.SaveChangesAsync(cancellationToken);
        return (await GetOneAsync(sample.Id, companyId, cancellationToken))!;
    }

    public async Task<SampleListItemDto?> UpdateAsync(
        int sampleId,
        UpdateSampleRequest request,
        CancellationToken cancellationToken = default)
    {
        var companyId = tenant.CompanyId;
        var s = await db.LabSamples
            .Include(x => x.Order)
            .ThenInclude(o => o.Patient)
            .Include(x => x.CreatedBy)
            .FirstOrDefaultAsync(
                x => x.Id == sampleId && x.CompanyId == companyId, cancellationToken);
        if (s is null)
        {
            return null;
        }

        if (request.Notes is not null)
        {
            var t = request.Notes.Trim();
            s.Notes = t.Length == 0 ? null : (t.Length > 2000 ? t[..2000] : t);
        }

        if (request.CollectedAtUtc.HasValue)
        {
            s.CollectedAtUtc = request.CollectedAtUtc;
        }
        else if (request.MarkCollected == true)
        {
            s.CollectedAtUtc = DateTime.UtcNow;
        }
        else if (request.MarkCollected == false)
        {
            s.CollectedAtUtc = null;
        }

        await db.SaveChangesAsync(cancellationToken);
        return await GetOneAsync(sampleId, companyId, cancellationToken);
    }

    private async Task<SampleListItemDto?> GetOneAsync(
        int id,
        int companyId,
        CancellationToken cancellationToken)
    {
        return await db.LabSamples
            .AsNoTracking()
            .Where(s => s.Id == id && s.CompanyId == companyId)
            .Select(
                s => new SampleListItemDto(
                    s.Id,
                    s.OrderId,
                    s.Code,
                    s.Notes,
                    s.CollectedAtUtc,
                    s.CreatedAtUtc,
                    s.Order.Patient.FullName,
                    s.Order.InvoiceNumber,
                    s.Order.OrderAtUtc,
                    s.CreatedBy != null ? s.CreatedBy.FullName : null))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<string> NewUniqueCodeAsync(
        int companyId,
        int orderId,
        CancellationToken cancellationToken)
    {
        for (var i = 0; i < 20; i++)
        {
            var c = "M" + orderId + "-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
            c = c.Length > 50 ? c[..50] : c;
            if (!await db.LabSamples.AnyAsync(s => s.CompanyId == companyId && s.Code == c, cancellationToken))
            {
                return c;
            }
        }

        return "M" + orderId + "-" + Guid.NewGuid().ToString("N")[..12].ToUpperInvariant();
    }

    private static DateTime ToUtcStartOfDay(DateOnly date)
    {
        var local = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(local, HondurasTimeZone);
    }

    private static TimeZoneInfo ResolveHondurasTimeZone()
    {
        var ids = new[] { "America/Tegucigalpa", "Central America Standard Time" };
        foreach (var id in ids)
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.Utc;
    }
}
