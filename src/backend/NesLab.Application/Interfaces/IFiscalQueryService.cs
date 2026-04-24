using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IFiscalQueryService
{
    Task<CompanyFiscalStatusDto?> GetCompanyFiscalStatusAsync(int companyId, CancellationToken cancellationToken = default);
}
