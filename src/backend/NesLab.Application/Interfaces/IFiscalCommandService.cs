using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IFiscalCommandService
{
    /// <summary>Actualiza prefijo, CAI, rango y vencimiento. Requiere permiso de configuracion de empresa.</summary>
    Task<CompanyFiscalStatusDto> UpdateSarConfigAsync(int companyId, UpdateSarConfigRequest request, CancellationToken cancellationToken = default);

    Task<CompanyFiscalStatusDto> UpdateFiscalBrandingAsync(int companyId, FiscalBrandingDto branding, CancellationToken cancellationToken = default);
}
