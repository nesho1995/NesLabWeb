using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface ICompanyCashSettingsService
{
    Task<CompanyCashSettingsDto?> GetForCurrentCompanyAsync(CancellationToken cancellationToken = default);
    Task<CompanyCashSettingsDto> UpdateAsync(UpdateCompanyCashSettingsRequest request, CancellationToken cancellationToken = default);
}
