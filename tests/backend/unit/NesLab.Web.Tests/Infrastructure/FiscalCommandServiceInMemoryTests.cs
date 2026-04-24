using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Fiscal;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Web.Tests.Infrastructure;

/// <summary>Admin: guardar politica fiscal de empresa (EF in-memory).</summary>
public class FiscalCommandServiceInMemoryTests
{
    private static (NesLabDbContext Db, IFiscalQueryService Query, IFiscalCommandService Command) Create()
    {
        var options = new DbContextOptionsBuilder<NesLabDbContext>()
            .UseInMemoryDatabase("neslab_fiscal_" + Guid.NewGuid().ToString("N"))
            .Options;
        var db = new NesLabDbContext(options);
        var query = new FiscalQueryService(db);
        var command = new FiscalCommandService(db, query);
        return (db, query, command);
    }

    [Fact(DisplayName = "Admin: al desactivar SAR se borra el CAI y no se permite 'documento interno'")]
    public async Task DesactivaSar_DescorrelacionYAllowNonSar()
    {
        var (db, _, command) = Create();
        await db.Companies.AddAsync(
            new Company
            {
                Name = "Lab",
                IsActive = true,
                UseCai = true,
                InvoicePrefix = "A",
                InvoiceStart = 1,
                InvoiceEnd = 100,
                InvoiceCurrent = 5,
                Cai = "C",
                CaiDueDate = DateTime.UtcNow.AddDays(10),
                AllowNonSarDocument = true,
                InternalDocPrefix = "REC",
            });
        await db.SaveChangesAsync();

        var dto = await command.UpdateSarConfigAsync(
            1,
            new UpdateSarConfigRequest
            {
                UseCai = false,
                InvoicePrefix = "A",
            });

        Assert.False(dto.UseCai);
        Assert.False(dto.AllowNonSarDocument);
    }

    [Fact(DisplayName = "Admin: branding se persiste y se reexpone al leer estado")]
    public async Task Branding_JsonRonda()
    {
        var (db, query, command) = Create();
        await db.Companies.AddAsync(
            new Company
            {
                Name = "Lab2",
                IsActive = true,
            });
        await db.SaveChangesAsync();

        var branding = new FiscalBrandingDto
        {
            DocumentTitleSar = "Factura A",
            DocumentTitleInternal = "Rec R",
            ClasificacionActividad = "Lab clínico",
            FooterLines = new[] { "Pie" },
        };
        var after = await command.UpdateFiscalBrandingAsync(1, branding, CancellationToken.None);
        var read = await query.GetCompanyFiscalStatusAsync(1, CancellationToken.None);
        Assert.NotNull(read);
        Assert.NotNull(read!.Branding);
        Assert.Equal("Factura A", read.Branding!.DocumentTitleSar);
        Assert.Equal("Rec R", read.Branding.DocumentTitleInternal);
        Assert.Equal("Pie", Assert.Single(read.Branding.FooterLines!));
    }
}
