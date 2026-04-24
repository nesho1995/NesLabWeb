using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NesLab.Application.Abstractions;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class LabResultService(
    NesLabDbContext db,
    ITenantContext tenant,
    ICurrentUserContext current) : ILabResultService
{
    private static readonly JsonSerializerOptions JsonOpt = new() { PropertyNamingPolicy = null };

    public async Task<PagedResult<ResultLineListItemDto>> GetResultLinesAsync(
        ResultLinesListQuery query,
        CancellationToken cancellationToken = default)
    {
        var companyId = tenant.CompanyId;
        var page = Math.Max(1, query.Page);
        var size = Math.Clamp(query.PageSize, 1, 100);
        var search = query.Search?.Trim();
        var status = (query.Status ?? "todos").Trim().ToLowerInvariant();
        var format = (query.Format ?? "todos").Trim().ToLowerInvariant();
        var completeness = (query.Completeness ?? "todos").Trim().ToLowerInvariant();

        IQueryable<OrderLine> baseQ = db.OrderLines
            .AsNoTracking()
            .Where(l => l.Order.CompanyId == companyId);

        if (status is "pendientes" or "pendiente")
        {
            baseQ = baseQ.Where(l => l.ValidatedAtUtc == null);
        }
        else if (status is "validados" or "validado")
        {
            baseQ = baseQ.Where(l => l.ValidatedAtUtc != null);
        }

        if (format is "texto" or "panel")
        {
            baseQ = baseQ.Where(l => l.LabExam.ResultFormat == format);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            if (int.TryParse(search, NumberStyles.Integer, CultureInfo.InvariantCulture, out var orderId) && orderId > 0)
            {
                baseQ = baseQ.Where(
                    l => l.OrderId == orderId
                         || l.Order.InvoiceNumber.ToLower().Contains(s)
                         || l.Order.Patient.FullName.ToLower().Contains(s)
                         || l.ExamName.ToLower().Contains(s)
                         || l.LabExam.Code.ToLower().Contains(s));
            }
            else
            {
                baseQ = baseQ.Where(
                    l => l.Order.InvoiceNumber.ToLower().Contains(s)
                         || l.Order.Patient.FullName.ToLower().Contains(s)
                         || l.ExamName.ToLower().Contains(s)
                         || l.LabExam.Code.ToLower().Contains(s));
            }
        }

        var requiresIncompleteFilter = completeness is "incompletos-panel" or "panel-incompleto";
        if (requiresIncompleteFilter)
        {
            var allCandidateLines = await baseQ
                .OrderByDescending(l => l.Order.OrderAtUtc)
                .ThenBy(l => l.ExamName)
                .Include(l => l.LabExam)
                .ThenInclude(e => e!.Parameters)
                .Include(l => l.Order)
                .ThenInclude(o => o!.Patient)
                .Include(l => l.ValidatedBy)
                .ToListAsync(cancellationToken);

            var filteredItems = allCandidateLines
                .Select(MapLine)
                .Where(IsIncompletePanel)
                .ToList();
            var filteredTotal = filteredItems.Count;
            var pageItems = filteredItems
                .Skip((page - 1) * size)
                .Take(size)
                .ToList();
            return new PagedResult<ResultLineListItemDto>(pageItems, filteredTotal, page, size);
        }
        else
        {
            var total = await baseQ.CountAsync(cancellationToken);
            var lines = await baseQ
                .OrderByDescending(l => l.Order.OrderAtUtc)
                .ThenBy(l => l.ExamName)
                .Skip((page - 1) * size)
                .Take(size)
                .Include(l => l.LabExam)
                .ThenInclude(e => e!.Parameters)
                .Include(l => l.Order)
                .ThenInclude(o => o!.Patient)
                .Include(l => l.ValidatedBy)
                .ToListAsync(cancellationToken);

            var items = lines.Select(MapLine).ToList();
            return new PagedResult<ResultLineListItemDto>(items, total, page, size);
        }
    }

    public async Task<ResultLineListItemDto?> UpdateResultLineAsync(
        int lineId,
        UpdateResultLineRequest request,
        CancellationToken cancellationToken = default)
    {
        var companyId = tenant.CompanyId;
        var userId = current.UserId ?? throw new InvalidOperationException("Se requiere un usuario autenticado.");
        var line = await db.OrderLines
            .Include(l => l.Order)
            .ThenInclude(o => o!.Patient)
            .Include(l => l.LabExam)
            .ThenInclude(e => e!.Parameters)
            .Include(l => l.ValidatedBy)
            .FirstOrDefaultAsync(
                l => l.Id == lineId && l.Order.CompanyId == companyId, cancellationToken);
        if (line is null)
        {
            return null;
        }

        var format = string.IsNullOrEmpty(line.LabExam.ResultFormat) || line.LabExam.ResultFormat is not ("texto" or "panel")
            ? "texto"
            : line.LabExam.ResultFormat;

        if (format == "texto")
        {
            var notes = request.ResultNotes?.Trim();
            if (string.IsNullOrEmpty(notes))
            {
                line.ResultNotes = null;
            }
            else
            {
                line.ResultNotes = notes.Length > 2000 ? notes[..2000] : notes;
            }
            line.ResultParametersJson = null;
        }
        else
        {
            var defs = line.LabExam.Parameters
                .Where(p => p.IsActive)
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.Name)
                .ToList();
            if (defs.Count == 0)
            {
                throw new InvalidOperationException(
                    "El examen esta en modo panel sin parametros. Corrija el examen en Catalogo de examenes.");
            }
            var map = new Dictionary<string, string>(StringComparer.Ordinal);
            if (request.ResultParameterValues is { Count: > 0 } incoming)
            {
                foreach (var d in defs)
                {
                    if (incoming.TryGetValue(d.Name, out var v) && !string.IsNullOrWhiteSpace(v))
                    {
                        var t = v.Trim();
                        if (t.Length > 200)
                        {
                            t = t[..200];
                        }
                        map[d.Name] = t;
                    }
                }
            }
            if (map.Count == 0)
            {
                line.ResultParametersJson = null;
            }
            else
            {
                var json = JsonSerializer.Serialize(map, JsonOpt);
                if (json.Length > 8000)
                {
                    throw new InvalidOperationException("Resultado demasiado largo. Use textos mas cortos.");
                }
                line.ResultParametersJson = json;
            }
            line.ResultNotes = BuildPanelSummary(
                map,
                request.ResultNotes,
                defs,
                line.ExamName);
        }

        if (request.MarkValidated)
        {
            var hasRenderableResult = !string.IsNullOrWhiteSpace(line.ResultNotes);
            if (!hasRenderableResult)
            {
                throw new InvalidOperationException("No se puede validar sin resultado. Ingrese texto o parametros del examen.");
            }

            if (line.ValidatedAtUtc is null)
            {
                line.ValidatedAtUtc = DateTime.UtcNow;
                line.ValidatedByUserId = userId;
            }
        }
        await db.SaveChangesAsync(cancellationToken);
        return MapLine(line);
    }

    private static ResultLineListItemDto MapLine(OrderLine l)
    {
        var ex = l.LabExam;
        var defs = ex.Parameters
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Name)
            .Select(
                p => new LabExamParameterDto(
                    p.Id,
                    p.Name,
                    p.SortOrder,
                    p.Unit,
                    p.ReferenceText,
                    p.IsActive))
            .ToList();
        var format = string.IsNullOrEmpty(ex.ResultFormat) ? "texto" : ex.ResultFormat;
        IReadOnlyDictionary<string, string> valMap = new Dictionary<string, string>(StringComparer.Ordinal);
        if (format == "panel" && !string.IsNullOrEmpty(l.ResultParametersJson))
        {
            try
            {
                var d = JsonSerializer.Deserialize<Dictionary<string, string>>(l.ResultParametersJson, JsonOpt);
                if (d is not null)
                {
                    valMap = d;
                }
            }
            catch
            {
                /* json invalido: vacio */
            }
        }
        return new ResultLineListItemDto(
            l.Id,
            l.OrderId,
            l.Order.OrderAtUtc,
            l.Order.InvoiceNumber,
            l.Order.Patient.FullName,
            ex.Code,
            l.ExamName,
            format,
            defs,
            valMap,
            l.ResultNotes,
            l.ValidatedAtUtc != null,
            l.ValidatedAtUtc,
            l.ValidatedBy != null ? l.ValidatedBy.FullName : null);
    }

    private static string? BuildPanelSummary(
        Dictionary<string, string> map,
        string? extraRequestNotes,
        IReadOnlyList<LabExamParameter> defs,
        string examName)
    {
        var extra = extraRequestNotes?.Trim();
        if (map.Count == 0)
        {
            if (string.IsNullOrEmpty(extra))
            {
                return null;
            }
            return extra.Length > 2000 ? extra[..2000] : extra;
        }
        var sb = new StringBuilder();
        sb.Append(examName);
        foreach (var d in defs)
        {
            if (!map.TryGetValue(d.Name, out var v) || v.Length == 0)
            {
                continue;
            }
            sb.Append(" | ");
            sb.Append(d.Name);
            if (!string.IsNullOrEmpty(d.Unit))
            {
                sb.Append(" (");
                sb.Append(d.Unit);
                sb.Append(')');
            }
            sb.Append(": ");
            sb.Append(v);
        }
        if (!string.IsNullOrEmpty(extra))
        {
            sb.Append(" | Nota: ");
            sb.Append(extra);
        }
        var s = sb.ToString();
        return s.Length > 2000 ? s[..2000] : s;
    }

    private static bool IsIncompletePanel(ResultLineListItemDto line)
    {
        if (line.IsValidated || line.ResultFormat != "panel")
        {
            return false;
        }

        var activeDefs = line.ResultFieldDefinitions
            .Where(d => d.IsActive)
            .ToList();
        if (activeDefs.Count == 0)
        {
            return true;
        }

        var filled = 0;
        foreach (var d in activeDefs)
        {
            if (line.ResultParameterValues.TryGetValue(d.Name, out var v) && !string.IsNullOrWhiteSpace(v))
            {
                filled++;
            }
        }

        return filled < activeDefs.Count;
    }
}
