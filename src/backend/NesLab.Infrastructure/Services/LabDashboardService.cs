using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Rules;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class LabDashboardService(
    ITenantContext tenant,
    NesLabDbContext db) : ILabDashboardService
{
    private sealed record PaymentDailyRow(DateTime OrderAtUtc, decimal Amount);

    public async Task<LabDashboardDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var companyId = tenant.CompanyId;
        var (startHn, endHn) = TodayBoundsHondurasUtc();
        var since7d = DateTime.UtcNow.AddDays(-7);
        var ordersToday = await db.Orders
            .AsNoTracking()
            .CountAsync(
                o => o.CompanyId == companyId
                && o.OrderAtUtc >= startHn
                && o.OrderAtUtc < endHn,
                cancellationToken);
        var revenueToday = await db.Orders
            .AsNoTracking()
            .Where(
                o => o.CompanyId == companyId
                && o.OrderAtUtc >= startHn
                && o.OrderAtUtc < endHn)
            .SumAsync(o => o.Total, cancellationToken);
        var orders7d = await db.Orders
            .AsNoTracking()
            .CountAsync(o => o.CompanyId == companyId && o.OrderAtUtc >= since7d, cancellationToken);
        var linesPending = await db.OrderLines
            .AsNoTracking()
            .CountAsync(
                l => l.Order.CompanyId == companyId && l.ValidatedAtUtc == null,
                cancellationToken);
        var samplesNotCollected = await db.LabSamples
            .AsNoTracking()
            .CountAsync(
                s => s.CompanyId == companyId && s.CollectedAtUtc == null,
                cancellationToken);
        var samplesToday = await db.LabSamples
            .AsNoTracking()
            .CountAsync(
                s => s.CompanyId == companyId
                && s.CreatedAtUtc >= startHn
                && s.CreatedAtUtc < endHn,
                cancellationToken);
        var cashOpen = await db.CashSessions
            .AsNoTracking()
            .Where(s => s.CompanyId == companyId && s.ClosedAtUtc == null)
            .Select(s => new { s.OpenedAtUtc })
            .FirstOrDefaultAsync(cancellationToken);
        return new LabDashboardDto(
            ordersToday,
            orders7d,
            revenueToday,
            linesPending,
            samplesNotCollected,
            samplesToday,
            cashOpen is not null,
            cashOpen?.OpenedAtUtc);
    }

    public async Task<FinanceSummaryDto> GetFinanceSummaryAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default)
    {
        var companyId = tenant.CompanyId;
        var tz = HondurasFiscalEngine.GetHondurasTimeZone();
        var nowHn = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;
        var fromLocal = (fromDate ?? DateOnly.FromDateTime(nowHn.AddDays(-6))).ToDateTime(TimeOnly.MinValue);
        var toLocalExclusive = (toDate ?? DateOnly.FromDateTime(nowHn)).AddDays(1).ToDateTime(TimeOnly.MinValue);
        var fromUtc = TimeZoneInfo.ConvertTimeToUtc(fromLocal, tz);
        var toUtc = TimeZoneInfo.ConvertTimeToUtc(toLocalExclusive, tz);
        if (toUtc <= fromUtc)
        {
            throw new InvalidOperationException("Rango de fechas invalido.");
        }

        var ordersQuery = db.Orders
            .AsNoTracking()
            .Where(o => o.CompanyId == companyId && o.OrderAtUtc >= fromUtc && o.OrderAtUtc < toUtc);
        var ordersCount = await ordersQuery.CountAsync(cancellationToken);
        var ordersTotal = ordersCount == 0 ? 0m : await ordersQuery.SumAsync(o => o.Total, cancellationToken);

        var payments = await db.Payments
            .AsNoTracking()
            .Include(p => p.CompanyPaymentMethod)
            .Where(p => p.Order.CompanyId == companyId && p.Order.OrderAtUtc >= fromUtc && p.Order.OrderAtUtc < toUtc)
            .ToListAsync(cancellationToken);
        var paymentRows = await db.Payments
            .AsNoTracking()
            .Where(p => p.Order.CompanyId == companyId && p.Order.OrderAtUtc >= fromUtc && p.Order.OrderAtUtc < toUtc)
            .Select(p => new PaymentDailyRow(p.Order.OrderAtUtc, p.Amount))
            .ToListAsync(cancellationToken);

        var paymentsTotal = payments.Count == 0 ? 0m : payments.Sum(p => p.Amount);
        var byMethod = payments
            .GroupBy(p => p.CompanyPaymentMethod?.Name ?? p.Method ?? "Sin definir")
            .Select(g => new FinanceByMethodDto(
                g.Key,
                Round2(g.Sum(x => x.Amount)),
                g.Any(x => x.CompanyPaymentMethod?.InPhysicalDrawer ?? string.Equals(x.Method, "Efectivo", StringComparison.OrdinalIgnoreCase))))
            .OrderByDescending(x => x.Amount)
            .ToList();

        var closedSessions = await db.CashSessions
            .AsNoTracking()
            .Where(s => s.CompanyId == companyId && s.ClosedAtUtc != null && s.OpenedAtUtc >= fromUtc && s.OpenedAtUtc < toUtc)
            .ToListAsync(cancellationToken);
        var cashExpected = Round2(closedSessions.Where(s => s.ExpectedClosingCash != null).Sum(s => s.ExpectedClosingCash ?? 0m));
        var cashDeclared = Round2(closedSessions.Where(s => s.DeclaredClosingCash != null).Sum(s => s.DeclaredClosingCash ?? 0m));
        var cashDiff = Round2(closedSessions.Where(s => s.DifferenceClosing != null).Sum(s => s.DifferenceClosing ?? 0m));

        var orderDates = await ordersQuery
            .Select(o => o.OrderAtUtc)
            .ToListAsync(cancellationToken);
        var dayRows = BuildDailyRows(paymentRows, closedSessions, orderDates, fromLocal.Date, toLocalExclusive.AddDays(-1).Date, tz);

        return new FinanceSummaryDto(
            fromUtc,
            toUtc,
            ordersCount,
            Round2(ordersTotal),
            Round2(paymentsTotal),
            cashExpected,
            cashDeclared,
            cashDiff,
            byMethod,
            dayRows);
    }

    private static decimal Round2(decimal d) => decimal.Round(d, 2, MidpointRounding.AwayFromZero);

    private static IReadOnlyList<FinanceDailyRowDto> BuildDailyRows(
        IReadOnlyList<PaymentDailyRow> payments,
        IReadOnlyList<Domain.Entities.CashSession> sessions,
        IReadOnlyList<DateTime> orderDates,
        DateTime fromLocalDate,
        DateTime toLocalDate,
        TimeZoneInfo tz)
    {
        var days = new List<DateOnly>();
        for (var d = fromLocalDate.Date; d <= toLocalDate.Date; d = d.AddDays(1))
        {
            days.Add(DateOnly.FromDateTime(d));
        }

        var payByDay = payments
            .GroupBy(p => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(p.OrderAtUtc, tz)))
            .ToDictionary(g => g.Key, g => Round2(g.Sum(x => x.Amount)));

        var orderCountByDay = orderDates
            .GroupBy(o => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(o, tz)))
            .ToDictionary(g => g.Key, g => g.Count());

        var cashExpectedByDay = sessions
            .Where(s => s.ExpectedClosingCash != null && s.ClosedAtUtc != null)
            .GroupBy(s => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(s.ClosedAtUtc!.Value, tz)))
            .ToDictionary(g => g.Key, g => Round2(g.Sum(x => x.ExpectedClosingCash ?? 0m)));

        var cashDeclaredByDay = sessions
            .Where(s => s.DeclaredClosingCash != null && s.ClosedAtUtc != null)
            .GroupBy(s => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(s.ClosedAtUtc!.Value, tz)))
            .ToDictionary(g => g.Key, g => Round2(g.Sum(x => x.DeclaredClosingCash ?? 0m)));

        var cashDiffByDay = sessions
            .Where(s => s.DifferenceClosing != null && s.ClosedAtUtc != null)
            .GroupBy(s => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(s.ClosedAtUtc!.Value, tz)))
            .ToDictionary(g => g.Key, g => Round2(g.Sum(x => x.DifferenceClosing ?? 0m)));

        return days.Select(day =>
        {
            var entradas = payByDay.GetValueOrDefault(day, 0m);
            var diff = cashDiffByDay.GetValueOrDefault(day, 0m);
            var salidas = diff < 0m ? Math.Abs(diff) : 0m;
            return new FinanceDailyRowDto(
                day,
                orderCountByDay.GetValueOrDefault(day, 0),
                entradas,
                Round2(salidas),
                Round2(entradas - salidas),
                cashExpectedByDay.GetValueOrDefault(day, 0m),
                cashDeclaredByDay.GetValueOrDefault(day, 0m),
                diff);
        }).ToList();
    }

    private static (DateTime StartUtc, DateTime EndUtc) TodayBoundsHondurasUtc()
    {
        var tz = HondurasFiscalEngine.GetHondurasTimeZone();
        var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        var startLocal = now.Date;
        var endLocal = startLocal.AddDays(1);
        return (
            TimeZoneInfo.ConvertTimeToUtc(startLocal, tz),
            TimeZoneInfo.ConvertTimeToUtc(endLocal, tz));
    }
}
