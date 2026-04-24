using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NesLab.Application.Abstractions;
using NesLab.Application.DTOs;
using NesLab.Application.Fiscal;
using NesLab.Application.Interfaces;
using NesLab.Application.Orders;
using NesLab.Domain.Entities;
using NesLab.Domain.Rules;
using NesLab.Infrastructure.Fiscal;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class OrderService : IOrderService
{
    private const decimal DefaultIsv = 0.15m;
    private static readonly TimeZoneInfo HondurasTimeZone = ResolveHondurasTimeZone();
    private readonly IConfiguration _configuration;
    private readonly ICurrentUserContext _current;
    private readonly ITenantContext _tenant;
    private readonly NesLabDbContext _db;

    public OrderService(
        IConfiguration configuration,
        ICurrentUserContext current,
        ITenantContext tenant,
        NesLabDbContext db)
    {
        _configuration = configuration;
        _current = current;
        _tenant = tenant;
        _db = db;
    }

    public async Task<IReadOnlyList<DiscountItemDto>> GetDiscountsAsync(CancellationToken cancellationToken = default)
    {
        var companyId = _tenant.CompanyId;
        return await _db.Discounts.AsNoTracking()
            .Where(x => x.IsActive && (x.CompanyId == null || x.CompanyId == companyId))
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .Select(x => new DiscountItemDto(x.Id, x.Name, x.Percent, x.SortOrder))
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<OrderListItemDto>> GetOrdersPagedAsync(
        OrderListQuery query,
        CancellationToken cancellationToken = default)
    {
        var companyId = _tenant.CompanyId;
        var page = Math.Max(1, query.Page);
        var size = Math.Clamp(query.PageSize, 1, 100);
        var search = query.Search?.Trim().ToLowerInvariant();
        var fiscal = query.FiscalStatus?.Trim().ToUpperInvariant();
        var fromUtc = query.FromDate is null
            ? (DateTime?)null
            : ToUtcStartOfDay(query.FromDate.Value);
        var toUtcExclusive = query.ToDate is null
            ? (DateTime?)null
            : ToUtcStartOfDay(query.ToDate.Value.AddDays(1));

        IQueryable<LabOrder> q = _db.Orders.AsNoTracking().Where(o => o.CompanyId == companyId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            q = q.Where(o =>
                o.InvoiceNumber.ToLower().Contains(search!) ||
                o.Patient.FullName.ToLower().Contains(search!) ||
                (o.Patient.NationalId != null && o.Patient.NationalId.ToLower().Contains(search!)));
        }

        if (fiscal is "REGULARIZADA" or "PENDIENTE")
        {
            if (fiscal == "REGULARIZADA")
            {
                q = q.Where(o =>
                    o.CaiMode ||
                    _db.OfflineSyncRegularizations.Any(r => r.CompanyId == companyId && r.OrderId == o.Id));
            }
            else
            {
                q = q.Where(o =>
                    !o.CaiMode &&
                    !_db.OfflineSyncRegularizations.Any(r => r.CompanyId == companyId && r.OrderId == o.Id));
            }
        }

        if (fromUtc is not null)
        {
            q = q.Where(o => o.OrderAtUtc >= fromUtc.Value);
        }

        if (toUtcExclusive is not null)
        {
            q = q.Where(o => o.OrderAtUtc < toUtcExclusive.Value);
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(o => o.OrderAtUtc)
            .ThenByDescending(o => o.Id)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(o => new OrderListItemDto(
                o.Id,
                o.InvoiceNumber,
                o.OrderAtUtc,
                o.Patient.FullName,
                o.Patient.NationalId,
                o.Status,
                _db.OfflineSyncRegularizations.Any(r => r.CompanyId == companyId && r.OrderId == o.Id) || o.CaiMode
                    ? "REGULARIZADA"
                    : "PENDIENTE",
                o.Total,
                o.Payments.OrderBy(p => p.Id).Select(p => p.Method).FirstOrDefault(),
                o.Lines.Count))
            .ToListAsync(cancellationToken);

        return new PagedResult<OrderListItemDto>(items, total, page, size);
    }

    public async Task<OrderVoucherDto?> GetOrderVoucherAsync(
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var companyId = _tenant.CompanyId;
        var order = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Company)
            .Include(o => o.Patient)
            .Include(o => o.Lines)
            .ThenInclude(l => l.LabExam)
            .Include(o => o.Payments)
            .Include(o => o.CreatedBy)
            .FirstOrDefaultAsync(
                o => o.Id == orderId && o.CompanyId == companyId,
                cancellationToken);
        if (order is null)
        {
            return null;
        }
        var lines = order.Lines
            .OrderBy(l => l.Id)
            .Select(l => new OrderVoucherLineDto(
                l.LabExam.Code,
                l.ExamName,
                1m,
                l.BasePrice,
                l.LineTotal))
            .ToList();
        var sumLines = order.Lines.Sum(l => l.LineTotal);
        var payM = order.Payments.FirstOrDefault();
        var b = FiscalBrandingParser.FromJson(order.Company.FiscalBrandingJson);
        var (docTitle, clas, footers, exigir) = FiscalVoucherTextResolver.Resolve(b, order.CaiMode);
        var companyName = string.IsNullOrWhiteSpace(b?.LaboratoryDisplayName) ? order.Company.Name : b!.LaboratoryDisplayName!.Trim();
        var companyAddress = string.IsNullOrWhiteSpace(b?.LaboratoryAddress) ? order.Company.Address : b!.LaboratoryAddress!.Trim();
        var companyPhone = string.IsNullOrWhiteSpace(b?.LaboratoryPhone) ? order.Company.Phone : b!.LaboratoryPhone!.Trim();
        var companyEmail = string.IsNullOrWhiteSpace(b?.LaboratoryEmail) ? null : b!.LaboratoryEmail!.Trim();
        var companyLogo = string.IsNullOrWhiteSpace(b?.LaboratoryLogoUrl) ? null : b!.LaboratoryLogoUrl!.Trim();
        return new OrderVoucherDto(
            order.Id,
            docTitle,
            string.IsNullOrEmpty(order.InvoiceNumber) ? $"ORDEN-{order.Id}" : order.InvoiceNumber,
            order.OrderAtUtc,
            clas,
            companyName,
            new OrderVoucherCompanyDto(
                companyName,
                order.Company.Rtn,
                companyAddress,
                companyPhone,
                companyEmail,
                companyLogo),
            order.Patient.FullName,
            order.Patient.NationalId,
            order.Patient.FullName,
            lines,
            sumLines,
            order.SubtotalBase,
            order.DiscountAmount,
            order.DiscountTypeLabel,
            order.Isv,
            order.Total,
            string.Equals(order.Status, "PAGADO", StringComparison.OrdinalIgnoreCase) ? 0m : order.Total,
            payM?.Method,
            order.CaiMode,
            order.CaiSnapshot,
            order.RangeSnapshot,
            order.CaiDueDateSnapshot?.ToString("dd/MM/yyyy", System.Globalization.CultureInfo.InvariantCulture),
            order.ClientRtn,
            order.ClientInvoiceName,
            order.CreatedBy?.FullName,
            footers,
            exigir);
    }

    public async Task<CreateOrderResultDto> CreateOrderAsync(
        CreateOrderRequest request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default)
    {
        var isv = _configuration.GetValue("Fiscal:IsvRate", DefaultIsv);
        var userId = _current.UserId ?? throw new InvalidOperationException("Se requiere un usuario autenticado para emitir una orden.");
        var companyId = _tenant.CompanyId;
        if (request.Lines is null)
        {
            throw new InvalidOperationException("Solicitud de orden invalida.");
        }
        if (request.DiscountPercent < 0 || request.DiscountPercent > 100)
        {
            throw new InvalidOperationException("El descuento no es valido.");
        }
        if (request.PaymentMethodId is null && string.IsNullOrWhiteSpace(request.PaymentMethod))
        {
            throw new InvalidOperationException("Metodo de pago requerido (id o descripcion).");
        }
        if (!HondurasFiscalEngine.IsRtn14DigitsOrFinalConsumer(request.ClientRtn, request.IsFinalConsumer))
        {
            throw new InvalidOperationException("El RTN del cliente debe tener 14 digitos, o elija consumidor final.");
        }
        var (legalName, rtn) = request.IsFinalConsumer
            ? ("CONSUMIDOR FINAL", "00000000000000")
            : (request.ClientLegalName?.Trim() ?? throw new InvalidOperationException("Razon social requerida para credito fiscal."),
                request.ClientRtn!.Trim());

        var idemK = string.IsNullOrWhiteSpace(idempotencyKey) ? null : idempotencyKey.Trim();
        if (idemK is not null)
        {
            var h0 = IdempotencyHash(userId, idemK);
            var ex0 = await _db.IdempotencyKeys.AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId && x.KeyHash == h0, cancellationToken);
            if (ex0?.OrderId is { } oid0)
            {
                return await ToResult(oid0, cancellationToken);
            }
        }

        await using var tr = await _db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var r = await CreateOrderInTransaction(isv, userId, companyId, request, legalName, rtn, idemK, cancellationToken);
            await tr.CommitAsync(cancellationToken);
            return r;
        }
        catch (DbUpdateException)
        {
            await tr.RollbackAsync(cancellationToken);
            if (idemK is null)
            {
                throw;
            }
            var h = IdempotencyHash(userId, idemK);
            var ex = await _db.IdempotencyKeys.AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId && x.KeyHash == h, cancellationToken);
            if (ex?.OrderId is { } ox)
            {
                return await ToResult(ox, cancellationToken);
            }
            throw;
        }
    }

    private async Task<CreateOrderResultDto> CreateOrderInTransaction(
        decimal isv,
        int userId,
        int companyId,
        CreateOrderRequest request,
        string legalName,
        string rtn,
        string? idemK,
        CancellationToken cancellationToken)
    {

        if (request.Lines.Count == 0)
        {
            throw new InvalidOperationException("Debe incluir al menos un examen.");
        }
        var lineExamIds = request.Lines.Select(x => x.LabExamId).Distinct().ToList();
        if (lineExamIds.Count != request.Lines.Count)
        {
            throw new InvalidOperationException("Examen duplicado en el detalle.");
        }

        var company = await _db.Companies
            .FromSqlRaw("SELECT * FROM empresas WHERE id = {0} FOR UPDATE", companyId)
            .SingleOrDefaultAsync(cancellationToken) ?? throw new InvalidOperationException("Empresa inexistente.");

        var payDef = await ResolvePaymentMethodAsync(companyId, request, cancellationToken);

        if (!company.IsActive)
        {
            throw new InvalidOperationException("La empresa no esta activa. No se puede facturar.");
        }

        var patient = await _db.Patients
            .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.Id == request.PatientId, cancellationToken)
            ?? throw new InvalidOperationException("Paciente inexistente para la empresa actual.");

        if (!patient.IsActive)
        {
            throw new InvalidOperationException("El paciente esta inactivo.");
        }
        var exams = await _db.LabExams
            .Where(x => x.CompanyId == companyId && lineExamIds.Contains(x.Id) && x.IsActive)
            .ToListAsync(cancellationToken);
        if (exams.Count != lineExamIds.Count)
        {
            throw new InvalidOperationException("Uno o mas examenes no existen, no estan activos, o no pertenecen a su empresa.");
        }
        var examById = exams.ToDictionary(x => x.Id);
        var lineData = request.Lines
            .Select(l => (examById[l.LabExamId].Price, request.DiscountPercent))
            .ToList();
        var totals = HondurasFiscalEngine.ComputeTotals(lineData, isv);
        if (payDef.RequiresAmountReceived)
        {
            if (request.AmountReceived is null || request.AmountReceived < totals.total)
            {
                throw new InvalidOperationException("El monto recibido debe ser mayor o igual al total a cobrar (forma de pago con vuelto).");
            }
        }
        OrderFiscalRules.EnsureValidFiscalRequest(company.UseCai, company.AllowNonSarDocument, request.UseSarInvoice);
        var useSarCorrelative = OrderFiscalRules.UseSarCorrelative(
            company.UseCai,
            company.AllowNonSarDocument,
            request.UseSarInvoice);
        FiscalReservation fiscal;
        if (useSarCorrelative)
        {
            fiscal = HondurasFiscalEngine.GetNextFiscal(company, DateTime.UtcNow);
            company.InvoiceCurrent = fiscal.NewCorrelative;
        }
        else
        {
            fiscal = HondurasFiscalEngine.GetNextInternalDocument(company, DateTime.UtcNow);
            company.InternalDocCurrent = fiscal.NewCorrelative;
        }
        var order = new LabOrder
        {
            CompanyId = companyId,
            PatientId = patient.Id,
            InvoiceNumber = fiscal.FormattedNumber,
            OrderAtUtc = DateTime.UtcNow,
            SubtotalBase = totals.subtotalBase,
            DiscountPercent = request.DiscountPercent,
            DiscountAmount = totals.discountAmount,
            Isv = totals.isv,
            Total = totals.total,
            DiscountTypeLabel = string.IsNullOrWhiteSpace(request.DiscountTypeLabel) ? "Sin descuento" : request.DiscountTypeLabel.Trim(),
            Status = "PAGADO",
            ClientInvoiceName = legalName,
            ClientRtn = rtn,
            CaiSnapshot = fiscal.CaiMode ? fiscal.Cai : null,
            RangeSnapshot = fiscal.CaiMode ? fiscal.Rango : null,
            CaiDueDateSnapshot = fiscal.CaiMode ? fiscal.FechaLimite : null,
            CaiMode = fiscal.CaiMode,
            CreatedByUserId = userId
        };
        _db.Orders.Add(order);
        foreach (var l in request.Lines)
        {
            var e = examById[l.LabExamId];
            var baseP = e.Price;
            var lineT = baseP - baseP * (request.DiscountPercent / 100m);
            if (lineT < 0)
            {
                lineT = 0;
            }
            _db.OrderLines.Add(new OrderLine
            {
                Order = order,
                LabExamId = e.Id,
                ExamName = e.Name,
                BasePrice = baseP,
                LineDiscountPercent = request.DiscountPercent,
                LineTotal = lineT
            });
        }
        _db.Payments.Add(new Payment
        {
            Order = order,
            CompanyPaymentMethodId = payDef.Id,
            Method = payDef.Name,
            Amount = totals.total,
            PaidAtUtc = DateTime.UtcNow
        });
        if (idemK is not null)
        {
            _db.IdempotencyKeys.Add(new IdempotencyRecord
            {
                UserId = userId,
                KeyHash = IdempotencyHash(userId, idemK),
                Order = order,
                ExpiresAtUtc = DateTime.UtcNow.AddHours(24)
            });
        }
        await _db.SaveChangesAsync(cancellationToken);
        return BuildResult(order, request, payDef);
    }

    private async Task<CompanyPaymentMethod> ResolvePaymentMethodAsync(
        int companyId,
        CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (request.PaymentMethodId is { } pid)
        {
            return await _db.CompanyPaymentMethods
                       .FirstOrDefaultAsync(
                           x => x.CompanyId == companyId && x.Id == pid && x.IsActive,
                           cancellationToken)
                   ?? throw new InvalidOperationException("Forma de pago inexistente o inactiva.");
        }
        if (string.IsNullOrWhiteSpace(request.PaymentMethod))
        {
            throw new InvalidOperationException("Metodo de pago requerido.");
        }
        var name = request.PaymentMethod.Trim();
        var list = await _db.CompanyPaymentMethods
            .Where(x => x.CompanyId == companyId && x.IsActive)
            .ToListAsync(cancellationToken);
        var m = list.FirstOrDefault(x => x.Name == name);
        if (m is not null)
        {
            return m;
        }
        var lower = name.ToLowerInvariant();
        m = list.FirstOrDefault(x => x.Name.ToLowerInvariant() == lower);
        return m
               ?? throw new InvalidOperationException(
                   "Forma de pago no catalogada. Elija una opcion de la lista o pida a un admin que defina el catalogo.");
    }

    private static string IdempotencyHash(int userId, string key)
    {
        var b = SHA256.HashData(Encoding.UTF8.GetBytes($"{userId}\u200b{key}"));
        return Convert.ToHexString(b);
    }

    private async Task<CreateOrderResultDto> ToResult(int orderId, CancellationToken cancellationToken)
    {
        var o = await _db.Orders
            .Include(x => x.Payments)
            .ThenInclude(p => p.CompanyPaymentMethod)
            .AsNoTracking()
            .FirstAsync(x => x.Id == orderId, cancellationToken);
        var m = o.Payments.First().Method;
        return BuildResultFromLoaded(o, m, null);
    }

    private static CreateOrderResultDto BuildResult(
        LabOrder o,
        CreateOrderRequest request,
        CompanyPaymentMethod def)
    {
        decimal? ch = null;
        if (def.RequiresAmountReceived && request.AmountReceived is { } a)
        {
            ch = Math.Round(a - o.Total, 2, MidpointRounding.AwayFromZero);
        }
        return BuildResultFromLoaded(o, def.Name, ch);
    }

    private static CreateOrderResultDto BuildResultFromLoaded(
        LabOrder o,
        string? paymentOverride,
        decimal? changeOverride) =>
        new(
            o.Id,
            o.InvoiceNumber,
            o.CaiMode,
            o.CaiSnapshot,
            o.RangeSnapshot,
            o.CaiDueDateSnapshot,
            o.SubtotalBase,
            o.DiscountAmount,
            o.Isv,
            o.Total,
            paymentOverride ?? string.Empty,
            changeOverride);

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
