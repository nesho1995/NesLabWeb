using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class PatientService(
    NesLabDbContext dbContext,
    ITenantContext tenant) : IPatientService
{
    public async Task<PagedResult<PatientListItemDto>> GetPagedAsync(PatientListQuery query, CancellationToken cancellationToken)
    {
        var companyId = tenant.CompanyId;
        var page = Math.Max(1, query.Page);
        var size = Math.Clamp(query.PageSize, 1, 100);
        var search = query.Search?.Trim().ToLowerInvariant();

        IQueryable<Patient> q = dbContext.Patients.Where(p => p.CompanyId == companyId);

        if (!query.IncludeInactive)
        {
            q = q.Where(p => p.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            q = q.Where(p =>
                p.FullName.ToLower().Contains(search) ||
                (p.NationalId != null && p.NationalId.ToLower().Contains(search)) ||
                (p.Phone != null && p.Phone.Contains(query.Search!)));
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderBy(p => p.FullName)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(p => new PatientListItemDto(
                p.Id,
                p.FullName,
                p.NationalId,
                p.Phone,
                p.IsActive,
                p.RegisteredAtUtc))
            .ToListAsync(cancellationToken);

        return new PagedResult<PatientListItemDto>(items, total, page, size);
    }

    public async Task<PatientDetailDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await dbContext.Patients
            .AsNoTracking()
            .Where(p => p.CompanyId == tenant.CompanyId && p.Id == id)
            .Select(p => new PatientDetailDto(
                p.Id,
                p.CompanyId,
                p.FullName,
                p.NationalId,
                p.Phone,
                p.IsActive,
                p.RegisteredAtUtc,
                p.UpdatedAtUtc))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PatientDetailDto> CreateAsync(CreatePatientRequest request, CancellationToken cancellationToken)
    {
        var companyId = tenant.CompanyId;
        var name = request.FullName.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("El nombre del paciente es requerido.");
        }

        var idNorm = string.IsNullOrWhiteSpace(request.NationalId) ? null : request.NationalId.Trim();
        if (idNorm is not null)
        {
            var exists = await dbContext.Patients.AnyAsync(
                p => p.CompanyId == companyId && p.NationalId == idNorm, cancellationToken);
            if (exists)
            {
                throw new InvalidOperationException("Ya existe un paciente con esta identidad.");
            }
        }

        var p = new Patient
        {
            CompanyId = companyId,
            FullName = name,
            NationalId = idNorm,
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            IsActive = true,
        };

        dbContext.Patients.Add(p);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (await GetByIdAsync(p.Id, cancellationToken))!;
    }

    public async Task<PatientDetailDto?> UpdateAsync(int id, UpdatePatientRequest request, CancellationToken cancellationToken)
    {
        var companyId = tenant.CompanyId;
        var p = await dbContext.Patients.FirstOrDefaultAsync(
            x => x.Id == id && x.CompanyId == companyId, cancellationToken);
        if (p is null)
        {
            return null;
        }

        var name = request.FullName.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("El nombre del paciente es requerido.");
        }

        var idNorm = string.IsNullOrWhiteSpace(request.NationalId) ? null : request.NationalId.Trim();
        if (idNorm is not null)
        {
            var taken = await dbContext.Patients.AnyAsync(
                x => x.CompanyId == companyId && x.NationalId == idNorm && x.Id != id, cancellationToken);
            if (taken)
            {
                throw new InvalidOperationException("Ya existe un paciente con esta identidad.");
            }
        }

        p.FullName = name;
        p.NationalId = idNorm;
        p.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        p.IsActive = request.IsActive ?? p.IsActive;
        p.UpdatedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }
}
