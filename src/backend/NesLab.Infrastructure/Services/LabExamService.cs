using System.Text;
using System.Text.RegularExpressions;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class LabExamService(
    NesLabDbContext dbContext,
    ITenantContext tenant) : ILabExamService
{
    public async Task<PagedResult<LabExamListItemDto>> GetPagedAsync(LabExamListQuery query, CancellationToken cancellationToken)
    {
        var companyId = tenant.CompanyId;
        var page = Math.Max(1, query.Page);
        var size = Math.Clamp(query.PageSize, 1, 100);
        var search = query.Search?.Trim().ToLowerInvariant();

        IQueryable<LabExam> q = dbContext.LabExams.Where(e => e.CompanyId == companyId);

        if (!query.IncludeInactive)
        {
            q = q.Where(e => e.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            q = q.Where(e =>
                e.Name.ToLower().Contains(search) ||
                e.Code.ToLower().Contains(search));
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderBy(e => e.Name)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(e => new LabExamListItemDto(e.Id, e.Code, e.Name, e.Price, e.IsActive, e.ResultFormat))
            .ToListAsync(cancellationToken);

        return new PagedResult<LabExamListItemDto>(items, total, page, size);
    }

    public async Task<LabExamDetailDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var e = await dbContext.LabExams
            .AsNoTracking()
            .Include(x => x.Parameters)
            .Where(x => x.CompanyId == tenant.CompanyId && x.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        if (e is null)
        {
            return null;
        }

        return ToDetailDto(e);
    }

    public async Task<LabExamDetailDto> CreateAsync(CreateLabExamRequest request, CancellationToken cancellationToken)
    {
        var companyId = tenant.CompanyId;
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("El nombre del examen es requerido.");
        }

        if (request.Price < 0)
        {
            throw new InvalidOperationException("El precio no puede ser negativo.");
        }

        var code = string.IsNullOrWhiteSpace(request.Code) ? BuildCodeFromName(name) : NormalizeCode(request.Code);
        await EnsureCodeUnique(companyId, code, null, cancellationToken);
        var existsName = await dbContext.LabExams.AnyAsync(
            e => e.CompanyId == companyId && e.Name == name, cancellationToken);
        if (existsName)
        {
            throw new InvalidOperationException("Ya existe un examen con este nombre en el catalogo.");
        }

        var format = NormalizeResultFormat(request.ResultFormat);
        ValidateParameterList(format, request.Parameters);

        var exam = new LabExam
        {
            CompanyId = companyId,
            Code = code,
            Name = name,
            Price = request.Price,
            IsActive = true,
            ResultFormat = format
        };
        dbContext.LabExams.Add(exam);
        await dbContext.SaveChangesAsync(cancellationToken);
        if (format == "panel" && request.Parameters is not null)
        {
            AddParameters(exam.Id, request.Parameters, dbContext);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        return (await GetByIdAsync(exam.Id, cancellationToken))!;
    }

    public async Task<LabExamDetailDto?> UpdateAsync(int id, UpdateLabExamRequest request, CancellationToken cancellationToken)
    {
        var companyId = tenant.CompanyId;
        var exam = await dbContext.LabExams.FirstOrDefaultAsync(
            e => e.Id == id && e.CompanyId == companyId, cancellationToken);
        if (exam is null)
        {
            return null;
        }

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("El nombre del examen es requerido.");
        }
        if (request.Price < 0)
        {
            throw new InvalidOperationException("El precio no puede ser negativo.");
        }

        var code = string.IsNullOrWhiteSpace(request.Code) ? exam.Code : NormalizeCode(request.Code);
        await EnsureCodeUnique(companyId, code, id, cancellationToken);

        var nameTaken = await dbContext.LabExams.AnyAsync(
            e => e.CompanyId == companyId && e.Name == name && e.Id != id, cancellationToken);
        if (nameTaken)
        {
            throw new InvalidOperationException("Ya existe un examen con este nombre en el catalogo.");
        }

        var format = request.ResultFormat is not null
            ? NormalizeResultFormat(request.ResultFormat)
            : exam.ResultFormat;
        if (format == "panel" && request.Parameters is null)
        {
            throw new InvalidOperationException("Con formato panel envie la lista de parametros o baje a texto libre.");
        }
        ValidateParameterList(format, request.Parameters);

        exam.Code = code;
        exam.Name = name;
        exam.Price = request.Price;
        exam.IsActive = request.IsActive ?? exam.IsActive;
        exam.ResultFormat = format;
        exam.UpdatedAtUtc = DateTime.UtcNow;

        var oldParams = await dbContext.LabExamParameters
            .Where(p => p.LabExamId == id)
            .ToListAsync(cancellationToken);
        if (oldParams.Count > 0)
        {
            dbContext.LabExamParameters.RemoveRange(oldParams);
        }
        if (format == "panel" && request.Parameters is not null)
        {
            AddParameters(id, request.Parameters, dbContext);
        }
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<BulkImportLabExamsResult> BulkImportAsync(
        BulkImportLabExamsRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            return new BulkImportLabExamsResult(0, 0, new[] { "No se enviaron filas." });
        }

        const int max = 2_000;
        if (request.Items.Count > max)
        {
            return new BulkImportLabExamsResult(0, 0, new[] { $"Máximo {max} filas por lote." });
        }

        var companyId = tenant.CompanyId;
        var usedNames = new HashSet<string>(
            await dbContext.LabExams
                .AsNoTracking()
                .Where(e => e.CompanyId == companyId)
                .Select(e => e.Name)
                .ToListAsync(cancellationToken),
            StringComparer.OrdinalIgnoreCase);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var created = 0;
        var skipped = 0;
        var messages = new List<string>();
        const int codeMax = 40;
        var row = 0;

        foreach (var item in request.Items)
        {
            row++;
            var baseName = (item.Name ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(baseName))
            {
                messages.Add($"Fila {row}: nombre vacío, omitida.");
                continue;
            }

            if (item.Price < 0m)
            {
                messages.Add($"Fila {row} “{baseName}”: precio no válido, omitida.");
                continue;
            }

            if (baseName.Length > 200)
            {
                baseName = baseName[..200];
            }

            var finalName = AllocateUniqueName(baseName, item.Price, usedNames);
            if (request.SkipDuplicates
                && await dbContext.LabExams.AnyAsync(
                    e => e.CompanyId == companyId
                         && e.Name == finalName
                         && e.Price == item.Price,
                    cancellationToken))
            {
                skipped++;
                continue;
            }

            var code = !string.IsNullOrWhiteSpace(item.Code) ? NormalizeCode(item.Code) : RandomCode();
            for (var guard = 0;
                 guard < 50
                 && code.Length > 0
                 && await dbContext.LabExams.AnyAsync(
                     e => e.CompanyId == companyId && e.Code == code,
                     cancellationToken);
                 guard++)
            {
                code = RandomCode();
            }

            if (code.Length > codeMax)
            {
                code = code[..codeMax];
            }

            dbContext.LabExams.Add(
                new LabExam
                {
                    CompanyId = companyId,
                    Name = finalName,
                    Code = code,
                    Price = item.Price,
                    IsActive = true,
                    ResultFormat = "texto"
                });
            usedNames.Add(finalName);
            created++;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new BulkImportLabExamsResult(created, skipped, messages);
    }

    public async Task<ClearLabExamsCatalogResult> ClearCatalogAsync(CancellationToken cancellationToken = default)
    {
        var companyId = tenant.CompanyId;
        var usedIds = await dbContext.OrderLines
            .AsNoTracking()
            .Where(ol => ol.Order.CompanyId == companyId)
            .Select(ol => ol.LabExamId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var used = usedIds.ToHashSet();
        var candidates = await dbContext.LabExams
            .Where(e => e.CompanyId == companyId)
            .ToListAsync(cancellationToken);

        var toRemove = candidates.Where(e => !used.Contains(e.Id)).ToList();
        var kept = candidates.Count - toRemove.Count;

        if (toRemove.Count == 0)
        {
            var msg = kept == 0
                ? "No hay examenes en el catalogo."
                : $"No se puede eliminar ningun examen: los {kept} estan referenciados en ordenes existentes.";
            return new ClearLabExamsCatalogResult(0, kept, msg);
        }

        dbContext.LabExams.RemoveRange(toRemove);
        await dbContext.SaveChangesAsync(cancellationToken);
        var message = kept > 0
            ? $"Se eliminaron {toRemove.Count} examen(es). Quedan {kept} que no se pueden borrar porque figuran en lineas de orden."
            : $"Se eliminaron {toRemove.Count} examen(es) del catalogo.";
        return new ClearLabExamsCatalogResult(toRemove.Count, kept, message);
    }

    public async Task<ApplyExamTemplatesResult> ApplyDefaultTemplatesAsync(CancellationToken cancellationToken = default)
    {
        var companyId = tenant.CompanyId;
        var exams = await dbContext.LabExams
            .Include(x => x.Parameters)
            .Where(x => x.CompanyId == companyId)
            .ToListAsync(cancellationToken);

        var updated = 0;
        var skipped = 0;
        var messages = new List<string>();
        foreach (var exam in exams)
        {
            var template = ResolveTemplateForExam(exam.Name);
            if (template.Count == 0)
            {
                skipped++;
                messages.Add($"{exam.Name}: sin plantilla específica, se omitió.");
                continue;
            }

            exam.ResultFormat = "panel";
            exam.UpdatedAtUtc = DateTime.UtcNow;
            if (exam.Parameters.Count > 0)
            {
                dbContext.LabExamParameters.RemoveRange(exam.Parameters);
            }
            AddParameters(
                exam.Id,
                template.Select(
                    p => new CreateLabExamParameterItem(
                        p.Name,
                        p.SortOrder,
                        p.Unit,
                        p.ReferenceText,
                        true)).ToList(),
                dbContext);
            updated++;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return new ApplyExamTemplatesResult(updated, skipped, messages.Take(40).ToList());
    }

    private static string AllocateUniqueName(string baseName, decimal price, ISet<string> usedNames)
    {
        if (!usedNames.Contains(baseName))
        {
            return baseName;
        }

        var candidate = $"{baseName} (L. {price:0.##})";
        if (!usedNames.Contains(candidate))
        {
            return candidate;
        }

        for (var n = 2; n < 1000; n++)
        {
            candidate = $"{baseName} (L. {price:0.##}) ({n})";
            if (!usedNames.Contains(candidate))
            {
                return candidate;
            }
        }

        return $"{baseName} ({Guid.NewGuid().ToString("N")[..6]})";
    }

    private static string RandomCode() => "E" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

    private async Task EnsureCodeUnique(int companyId, string code, int? id, CancellationToken cancellationToken)
    {
        if (id.HasValue)
        {
            var taken = await dbContext.LabExams.AnyAsync(
                e => e.CompanyId == companyId && e.Code == code && e.Id != id.Value, cancellationToken);
            if (taken)
            {
                throw new InvalidOperationException("Ya existe un examen con este codigo interno.");
            }
        }
        else
        {
            if (await dbContext.LabExams.AnyAsync(e => e.CompanyId == companyId && e.Code == code, cancellationToken))
            {
                throw new InvalidOperationException("Ya existe un examen con este codigo interno.");
            }
        }
    }

    private static string NormalizeCode(string value)
    {
        var t = value.Trim().ToUpperInvariant();
        t = Regex.Replace(t, @"\s+", "_");
        return t.Length == 0 ? "EX" : t;
    }

    private static string BuildCodeFromName(string name)
    {
        _ = name;
        return "E" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
    }

    private static LabExamDetailDto ToDetailDto(LabExam e)
    {
        var pars = e.Parameters
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
        return new LabExamDetailDto(
            e.Id,
            e.CompanyId,
            e.Code,
            e.Name,
            e.Price,
            e.IsActive,
            e.ResultFormat,
            pars,
            e.CreatedAtUtc,
            e.UpdatedAtUtc);
    }

    private static string NormalizeResultFormat(string? v)
    {
        var t = (v ?? "texto").Trim().ToLowerInvariant();
        if (t is "panel" or "texto")
        {
            return t;
        }
        return "texto";
    }

    private static void ValidateParameterList(string format, IReadOnlyList<CreateLabExamParameterItem>? items)
    {
        if (format != "panel")
        {
            return;
        }
        if (items is null || items.Count == 0)
        {
            throw new InvalidOperationException("Con formato \"panel\" debe agregar al menos un parametro (por ejemplo: Hemoglobina, Leucocitos).");
        }
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var p in items)
        {
            var n = p.Name?.Trim() ?? string.Empty;
            if (n.Length == 0)
            {
                throw new InvalidOperationException("Cada parametro debe tener un nombre.");
            }
            if (n.Length > 120)
            {
                throw new InvalidOperationException($"El parametro \"{n[..20]}...\" excede 120 caracteres.");
            }
            if (!seen.Add(n))
            {
                throw new InvalidOperationException($"Parametro duplicado: {n}.");
            }
        }
    }

    private static void AddParameters(
        int examId,
        IReadOnlyList<CreateLabExamParameterItem> items,
        NesLabDbContext db)
    {
        foreach (var p in items.OrderBy(x => x.SortOrder).ThenBy(x => x.Name))
        {
            db.LabExamParameters.Add(
                new LabExamParameter
                {
                    LabExamId = examId,
                    Name = p.Name.Trim(),
                    SortOrder = p.SortOrder,
                    Unit = string.IsNullOrWhiteSpace(p.Unit) ? null : p.Unit.Trim(),
                    ReferenceText = string.IsNullOrWhiteSpace(p.ReferenceText) ? null : p.ReferenceText.Trim(),
                    IsActive = p.IsActive
                });
        }
    }

    private static List<(string Name, int SortOrder, string? Unit, string? ReferenceText)> ResolveTemplateForExam(string examName)
    {
        var n = examName.Trim().ToLowerInvariant();
        var k = NormalizeExamKey(examName);
        var q = ResolveQuantitativeTemplate(k);
        if (q.Count > 0)
        {
            return q;
        }
        if (n.Contains("hemograma"))
        {
            return
            [
                ("Hemoglobina", 1, "g/dL", "12-16"),
                ("Hematocrito", 2, "%", "36-46"),
                ("Leucocitos", 3, "10^3/uL", "4.0-10.5"),
                ("Plaquetas", 4, "10^3/uL", "150-450")
            ];
        }
        if (n.Contains("general de orina") || n.Contains("ego"))
        {
            return
            [
                ("Color", 1, null, "Amarillo"),
                ("Aspecto", 2, null, "Claro"),
                ("Densidad", 3, null, "1.005-1.030"),
                ("pH", 4, null, "5.0-8.0")
            ];
        }
        if (n.Contains("perfil") || n.Contains("bilirrubina"))
        {
            return
            [
                ("Resultado", 1, null, null),
                ("Interpretación", 2, null, null)
            ];
        }
        if (n.Contains("cultivo") || n.Contains("coprocultivo") || n.Contains("espermocultivo"))
        {
            return
            [
                ("Microorganismo", 1, null, null),
                ("Recuento", 2, "UFC/mL", null),
                ("Sensibilidad", 3, null, null)
            ];
        }
        if (n.Contains("coombs") || n.Contains("rpr") || n.Contains("chagas") || n.Contains("dengue")
            || n.Contains("hepatitis") || n.Contains("toxoplasmosis") || n.Contains("influenza")
            || n.Contains("covid") || n.Contains("rotavirus") || n.Contains("adenovirus")
            || n.Contains("prueba de embarazo") || n.Contains("hcg") || n.Contains("psa")
            || n.Contains("cea") || n.Contains("ca19") || n.Contains("anti ccp")
            || n.Contains("aso") || n.Contains("factor reumatoideo") || n.Contains("proteina c. reactiva")
            || n.Contains("troponina") || n.Contains("dimero") || n.Contains("procalcitonina")
            || n.Contains("testosterona") || n.Contains("prolactina") || n.Contains("cortisol")
            || n.Contains("tsh") || n == "t3" || n.Contains("t3 libre") || n == "t4" || n.Contains("t4 libre"))
        {
            return
            [
                ("Resultado", 1, null, null),
                ("Método", 2, null, null)
            ];
        }
        if (n.Contains("curva de"))
        {
            return
            [
                ("Basal", 1, "mg/dL", null),
                ("30 min", 2, "mg/dL", null),
                ("60 min", 3, "mg/dL", null),
                ("120 min", 4, "mg/dL", null)
            ];
        }
        if (n.Contains("hematocrito- hemoglobina"))
        {
            return
            [
                ("Hemoglobina", 1, "g/dL", "12-16"),
                ("Hematocrito", 2, "%", "36-46")
            ];
        }
        if (n.Contains("inr") || n.Contains("protombina") || n.Contains("tp") || n.Contains("ttp"))
        {
            return
            [
                ("Resultado", 1, "seg", null),
                ("INR", 2, null, null)
            ];
        }
        if (n.Contains("espermograma"))
        {
            return
            [
                ("Volumen", 1, "mL", null),
                ("Concentración", 2, "mill/mL", null),
                ("Motilidad", 3, "%", null),
                ("Morfología", 4, "%", null)
            ];
        }
        if (n.Contains("general de heces") || n.Contains("sangre oculta") || n.Contains("guayaco"))
        {
            return
            [
                ("Macroscópico", 1, null, null),
                ("Microscópico", 2, null, null),
                ("Resultado", 3, null, null)
            ];
        }
        if (n.Contains("tipo rh"))
        {
            return
            [
                ("Grupo ABO", 1, null, null),
                ("Rh", 2, null, null)
            ];
        }

        // Química clínica simple: un analito cuantitativo con unidad y referencia.
        if (n.Contains("acido urico") || n.Contains("albumina") || n.Contains("amilasa") || n.Contains("calcio")
            || n.Contains("cloro") || n.Contains("colesterol") || n.Contains("cpk") || n.Contains("creatinina")
            || n.Contains("fosfatasa") || n.Contains("fosforo") || n.Contains("ggt") || n.Contains("globulina")
            || n.Contains("glucosa") || n.Contains("hba1c") || n.Contains("insulina") || n.Contains("ldh")
            || n.Contains("lipasa") || n.Contains("potasio") || n.Contains("proteina de 24 horas")
            || n.Contains("proteinas totales") || n.Contains("reticulositos") || n.Contains("sodio")
            || n.Contains("tgo") || n.Contains("tgp") || n.Contains("trigliceridos") || n.Contains("ferritina"))
        {
            return
            [
                ("Resultado", 1, "mg/dL", null),
                ("Referencia", 2, null, null)
            ];
        }

        // Fallback: al menos estructura mínima para captura.
        return
        [
            ("Resultado", 1, null, null),
            ("Observación", 2, null, null)
        ];
    }

    private static List<(string Name, int SortOrder, string? Unit, string? ReferenceText)> ResolveQuantitativeTemplate(string key)
    {
        return key switch
        {
            "acido urico" => Quant("Ácido úrico [URIC]", "mg/dL", "3.5-7.2"),
            "glucosa" => Quant("Glucosa [GLU]", "mg/dL", "70-110"),
            "glucosa post pandrial" => Quant("Glucosa postprandial [GLU-PP]", "mg/dL", "70-140"),
            "creatinina" => Quant("Creatinina [CREA]", "mg/dL", "0.6-1.3"),
            "colesterol" => Quant("Colesterol total [CHOL]", "mg/dL", "<200"),
            "colesterol hdl" => Quant("Colesterol HDL [HDL]", "mg/dL", ">40"),
            "colesterol ldl" => Quant("Colesterol LDL [LDL]", "mg/dL", "<130"),
            "trigliceridos" => Quant("Triglicéridos [TG]", "mg/dL", "<150"),
            "tgo" => Quant("TGO / AST [AST]", "U/L", "5-40"),
            "tgp" => Quant("TGP / ALT [ALT]", "U/L", "7-56"),
            "ggt" => Quant("GGT [GGT]", "U/L", "9-48"),
            "fosfatasa alcalina" => Quant("Fosfatasa alcalina [ALP]", "U/L", "44-147"),
            "amilasa" => Quant("Amilasa [AMY]", "U/L", "25-125"),
            "lipasa" => Quant("Lipasa [LIPA]", "U/L", "13-60"),
            "calcio" => Quant("Calcio [CA]", "mg/dL", "8.5-10.5"),
            "fosforo" => Quant("Fósforo [PHOS]", "mg/dL", "2.5-4.5"),
            "sodio" => Quant("Sodio [NA]", "mmol/L", "135-145"),
            "potasio" => Quant("Potasio [K]", "mmol/L", "3.5-5.1"),
            "cloro" => Quant("Cloro [CL]", "mmol/L", "98-107"),
            "proteinas totales" => Quant("Proteínas totales [TP]", "g/dL", "6.0-8.3"),
            "albumina" => Quant("Albúmina [ALB]", "g/dL", "3.5-5.0"),
            "globulinas" => Quant("Globulinas [GLOB]", "g/dL", "2.0-3.5"),
            "ferritina" => Quant("Ferritina [FER]", "ng/mL", "30-400"),
            "hormona tsh" => Quant("TSH [TSH]", "uIU/mL", "0.4-4.0"),
            "tsh" => Quant("TSH [TSH]", "uIU/mL", "0.4-4.0"),
            "t3" => Quant("T3 total [T3]", "ng/dL", "80-200"),
            "t3 libre" => Quant("T3 libre [FT3]", "pg/mL", "2.3-4.2"),
            "t4" => Quant("T4 total [T4]", "ug/dL", "4.5-12.0"),
            "t4 libre" => Quant("T4 libre [FT4]", "ng/dL", "0.8-1.8"),
            "testosterona" => Quant("Testosterona [TESTO]", "ng/dL", "300-1000"),
            "prolactina" => Quant("Prolactina [PRL]", "ng/mL", "4.0-23.0"),
            "insulina" => Quant("Insulina [INS]", "uIU/mL", "2-25"),
            "hemoglobina glicosilada hba1c" => Quant("HbA1c [HBA1C]", "%", "4.0-5.6"),
            "inr" => Quant("INR [INR]", null, "0.8-1.2"),
            "dimero d" => Quant("Dímero D [DD]", "ng/mL", "0-500"),
            "troponinas" => Quant("Troponina [TnI/TnT]", "ng/mL", "0-0.04"),
            "procalcitonina" => Quant("Procalcitonina [PCT]", "ng/mL", "0-0.5"),
            _ => []
        };
    }

    private static string NormalizeExamKey(string value)
    {
        var f = value.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(f.Length);
        foreach (var c in f)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }
        var t = sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        t = Regex.Replace(t, @"\s+", " ").Trim();
        return t;
    }

    private static List<(string Name, int SortOrder, string? Unit, string? ReferenceText)> Quant(
        string analyte,
        string? unit,
        string? reference) =>
    [
        (analyte, 1, unit, reference)
    ];
}
