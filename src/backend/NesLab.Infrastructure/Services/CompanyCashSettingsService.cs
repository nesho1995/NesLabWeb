using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Abstractions;
using NesLab.Application.Interfaces;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class CompanyCashSettingsService(NesLabDbContext db, ITenantContext tenant) : ICompanyCashSettingsService
{
    public async Task<CompanyCashSettingsDto?> GetForCurrentCompanyAsync(CancellationToken cancellationToken = default)
    {
        return await Map(tenant.CompanyId, cancellationToken);
    }

    public async Task<CompanyCashSettingsDto> UpdateAsync(
        UpdateCompanyCashSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.CashShiftsPerDay < 1 || request.CashShiftsPerDay > 8)
        {
            throw new InvalidOperationException("Turnos por dia: entre 1 y 8.");
        }
        if (request.CashPettyCashDefault < 0m)
        {
            throw new InvalidOperationException("El monto de caja chica no puede ser negativo.");
        }
        var companyId = tenant.CompanyId;
        var c = await db.Companies.FirstOrDefaultAsync(x => x.Id == companyId, cancellationToken)
                ?? throw new InvalidOperationException("Empresa inexistente.");
        c.CashShiftsPerDay = request.CashShiftsPerDay;
        c.CashPettyCashEnabled = request.CashPettyCashEnabled;
        c.CashPettyCashDefault = decimal.Round(request.CashPettyCashDefault, 2, MidpointRounding.AwayFromZero);
        await db.SaveChangesAsync(cancellationToken);
        return (await Map(companyId, cancellationToken))!;
    }

    private async Task<CompanyCashSettingsDto?> Map(int companyId, CancellationToken cancellationToken)
    {
        var c = await db.Companies.AsNoTracking().FirstOrDefaultAsync(x => x.Id == companyId, cancellationToken);
        return c is null
            ? null
            : new CompanyCashSettingsDto(
                c.Id,
                c.CashShiftsPerDay,
                c.CashPettyCashEnabled,
                c.CashPettyCashDefault);
    }
}
