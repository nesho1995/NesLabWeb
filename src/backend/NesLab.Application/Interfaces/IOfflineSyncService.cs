using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IOfflineSyncService
{
    Task<OfflineSyncRegularizationDto> AddRegularizationAsync(
        OfflineSyncRegularizationRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OfflineSyncRegularizationDto>> ListRecentAsync(
        int take = 200,
        CancellationToken cancellationToken = default);
}
