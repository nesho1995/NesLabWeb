using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface ICashSessionService
{
    Task<CashSessionStatusDto> GetStatusAsync(CancellationToken cancellationToken = default);
    Task<CashSessionOpenedResultDto> OpenAsync(OpenCashSessionRequest request, CancellationToken cancellationToken = default);
    Task<CashSessionClosedResultDto> CloseAsync(CloseCashSessionRequest request, CancellationToken cancellationToken = default);
}
