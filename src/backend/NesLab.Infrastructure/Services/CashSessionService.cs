using Microsoft.EntityFrameworkCore;
using NesLab.Application.Abstractions;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Domain.Rules;
using NesLab.Infrastructure.Persistence;
using System.Data;

namespace NesLab.Infrastructure.Services;

public sealed class CashSessionService : ICashSessionService
{
    private readonly ICurrentUserContext _current;
    private readonly ITenantContext _tenant;
    private readonly NesLabDbContext _db;

    public CashSessionService(ICurrentUserContext current, ITenantContext tenant, NesLabDbContext db)
    {
        _current = current;
        _tenant = tenant;
        _db = db;
    }

    public async Task<CashSessionStatusDto> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var companyId = _tenant.CompanyId;
        var company = await _db.Companies.AsNoTracking().FirstOrDefaultAsync(x => x.Id == companyId, cancellationToken)
            ?? throw new InvalidOperationException("Empresa inexistente.");
        var (startUtc, endUtc) = HondurasDayBoundsUtc();
        _ = endUtc;
        var opensToday = await _db.CashSessions
            .AsNoTracking()
            .CountAsync(
                s => s.CompanyId == companyId && s.OpenedAtUtc >= startUtc && s.OpenedAtUtc < endUtc,
                cancellationToken);
        var open = await _db.CashSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.ClosedAtUtc == null, cancellationToken);
        var hasOpen = open is not null;
        var canOpen = !hasOpen;
        string? block = null;
        if (hasOpen)
        {
            block = "Hay una caja abierta; debe cerrarse antes de abrir otra.";
        }
        CashSessionOpenViewDto? openView = null;
        if (open is not null)
        {
            var now = DateTime.UtcNow;
            var snap = await ComputeSessionSnapshotAsync(companyId, open.OpenedAtUtc, now, cancellationToken);
            var exp = Round2(open.PettyCashOpening + snap.SumInPhysicalDrawer);
            openView = new CashSessionOpenViewDto(
                open.Id,
                open.OpenedAtUtc,
                open.PettyCashOpening,
                snap.DistinctOrderCount,
                snap.OrdersWithPhysicalCount,
                snap.SumEfectivo,
                snap.SumInPhysicalDrawer,
                snap.TotalFromOrders,
                snap.TotalFromPayments,
                snap.SessionTotalsMatch,
                snap.Breakdown,
                exp);
        }
        return new CashSessionStatusDto(
            companyId,
            company.CashShiftsPerDay,
            company.CashPettyCashEnabled,
            company.CashPettyCashDefault,
            opensToday,
            hasOpen,
            canOpen,
            canOpen ? null : block,
            openView);
    }

    public async Task<CashSessionOpenedResultDto> OpenAsync(
        OpenCashSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = _current.UserId ?? throw new InvalidOperationException("No hay usuario en contexto para abrir caja.");
        var companyId = _tenant.CompanyId;
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var company = await _db.Companies.FirstAsync(x => x.Id == companyId, cancellationToken);
        if (await _db.CashSessions.AnyAsync(s => s.CompanyId == companyId && s.ClosedAtUtc == null, cancellationToken))
        {
            throw new InvalidOperationException("Ya existe una caja abierta.");
        }
        var petty = ResolvePetty(request, company);
        var row = new CashSession
        {
            CompanyId = companyId,
            OpenedAtUtc = DateTime.UtcNow,
            OpenedByUserId = userId,
            PettyCashOpening = petty
        };
        _db.CashSessions.Add(row);
        await _db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return new CashSessionOpenedResultDto(row.Id, row.OpenedAtUtc, row.PettyCashOpening);
    }

    public async Task<CashSessionClosedResultDto> CloseAsync(
        CloseCashSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = _current.UserId ?? throw new InvalidOperationException("No hay usuario en contexto para cerrar caja.");
        var companyId = _tenant.CompanyId;
        var session = await _db.CashSessions
            .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.ClosedAtUtc == null, cancellationToken);
        if (session is null)
        {
            throw new InvalidOperationException("No hay turno de caja abierto.");
        }
        var declared = decimal.Round(request.DeclaredCash, 2, MidpointRounding.AwayFromZero);
        if (declared < 0m)
        {
            throw new InvalidOperationException("El monto declarado no puede ser negativo.");
        }
        var now = DateTime.UtcNow;
        var snap = await ComputeSessionSnapshotAsync(companyId, session.OpenedAtUtc, now, cancellationToken);
        var expected = Round2(session.PettyCashOpening + snap.SumInPhysicalDrawer);
        var diff = Round2(declared - expected);
        session.ClosedAtUtc = now;
        session.ClosedByUserId = userId;
        session.DeclaredClosingCash = declared;
        session.ExpectedClosingCash = expected;
        session.DifferenceClosing = diff;
        session.CloseNotes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        if (session.CloseNotes is not null && session.CloseNotes.Length > 500)
        {
            session.CloseNotes = session.CloseNotes[..500];
        }
        await _db.SaveChangesAsync(cancellationToken);
        return new CashSessionClosedResultDto(
            session.Id,
            session.OpenedAtUtc,
            now,
            session.PettyCashOpening,
            snap.DistinctOrderCount,
            snap.OrdersWithPhysicalCount,
            snap.SumEfectivo,
            snap.SumInPhysicalDrawer,
            snap.TotalFromOrders,
            snap.TotalFromPayments,
            snap.SessionTotalsMatch,
            snap.Breakdown,
            expected,
            declared,
            diff,
            session.CloseNotes);
    }

    private static decimal Round2(decimal d) => decimal.Round(d, 2, MidpointRounding.AwayFromZero);

    private static decimal ResolvePetty(OpenCashSessionRequest request, Company company)
    {
        if (!company.CashPettyCashEnabled)
        {
            return 0m;
        }
        var a = request.PettyCashAmount;
        if (a is null)
        {
            return Round2(company.CashPettyCashDefault);
        }
        if (a < 0m)
        {
            throw new InvalidOperationException("Caja chica no puede ser negativa.");
        }
        return Round2(a.Value);
    }

    private static bool IsInPhysical(Payment p)
    {
        if (p.CompanyPaymentMethod is { } m)
        {
            return m.InPhysicalDrawer;
        }
        return string.Equals(p.Method, "Efectivo", StringComparison.OrdinalIgnoreCase);
    }

    private async Task<SessionSnapshot> ComputeSessionSnapshotAsync(
        int companyId,
        DateTime openUtc,
        DateTime endExclusiveUtc,
        CancellationToken cancellationToken)
    {
        var totalFromOrders = await _db.Orders.AsNoTracking()
            .Where(
                o => o.CompanyId == companyId
                && o.OrderAtUtc >= openUtc
                && o.OrderAtUtc < endExclusiveUtc)
            .SumAsync(o => o.Total, cancellationToken);
        var payments = await _db.Payments
            .AsNoTracking()
            .Include(p => p.CompanyPaymentMethod)
            .Where(
                p => p.Order.CompanyId == companyId
                && p.Order.OrderAtUtc >= openUtc
                && p.Order.OrderAtUtc < endExclusiveUtc)
            .ToListAsync(cancellationToken);
        var totalFromPayments = payments.Count == 0 ? 0m : payments.Sum(p => p.Amount);
        var sumInPhysical = payments.Where(IsInPhysical).Sum(p => p.Amount);
        sumInPhysical = Round2(sumInPhysical);
        var ordersWithPhysical = payments.Where(IsInPhysical).Select(p => p.OrderId).Distinct().Count();
        var distinctOrderCount = payments.Select(p => p.OrderId).Distinct().Count();
        var match = Math.Abs(Round2(totalFromOrders) - Round2(totalFromPayments)) < 0.01m;
        var byCode = new Dictionary<string, (string Name, decimal Amt, bool Phys)>(StringComparer.Ordinal);
        foreach (var p in payments)
        {
            var phys = IsInPhysical(p);
            var code = p.CompanyPaymentMethod?.Code ?? p.Method;
            if (string.IsNullOrEmpty(code))
            {
                code = "—";
            }
            var name = p.CompanyPaymentMethod?.Name ?? p.Method;
            if (string.IsNullOrEmpty(name))
            {
                name = code;
            }
            if (!byCode.TryGetValue(code, out var row))
            {
                byCode[code] = (name, p.Amount, phys);
            }
            else
            {
                byCode[code] = (row.Name, row.Amt + p.Amount, row.Phys || phys);
            }
        }
        var breakdown = byCode
            .OrderBy(k => k.Value.Phys ? 0 : 1)
            .ThenBy(k => k.Value.Name)
            .Select(
                k => new CashMethodBreakdownItem(
                    k.Key,
                    k.Value.Name,
                    Round2(k.Value.Amt),
                    k.Value.Phys))
            .ToList();
        var sumEfectivo = payments
            .Where(
                p => (p.CompanyPaymentMethod is { } m
                    && string.Equals(m.Code, "EFECTIVO", StringComparison.Ordinal))
                || (p.CompanyPaymentMethod is null
                    && string.Equals(p.Method, "Efectivo", StringComparison.OrdinalIgnoreCase)))
            .Sum(p => p.Amount);
        sumEfectivo = Round2(sumEfectivo);
        return new SessionSnapshot(
            distinctOrderCount,
            ordersWithPhysical,
            sumEfectivo,
            sumInPhysical,
            Round2(totalFromOrders),
            Round2(totalFromPayments),
            match,
            breakdown);
    }

    private static (DateTime StartUtc, DateTime EndUtc) HondurasDayBoundsUtc()
    {
        var tz = HondurasFiscalEngine.GetHondurasTimeZone();
        var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        var startLocal = now.Date;
        var endLocal = startLocal.AddDays(1);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startLocal, tz);
        var endUtc = TimeZoneInfo.ConvertTimeToUtc(endLocal, tz);
        return (startUtc, endUtc);
    }

    private sealed record SessionSnapshot(
        int DistinctOrderCount,
        int OrdersWithPhysicalCount,
        decimal SumEfectivo,
        decimal SumInPhysicalDrawer,
        decimal TotalFromOrders,
        decimal TotalFromPayments,
        bool SessionTotalsMatch,
        IReadOnlyList<CashMethodBreakdownItem> Breakdown);
}
