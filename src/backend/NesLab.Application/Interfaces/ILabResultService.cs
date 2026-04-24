using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface ILabResultService
{
    Task<PagedResult<ResultLineListItemDto>> GetResultLinesAsync(
        ResultLinesListQuery query,
        CancellationToken cancellationToken = default);

    Task<ResultLineListItemDto?> UpdateResultLineAsync(
        int lineId,
        UpdateResultLineRequest request,
        CancellationToken cancellationToken = default);
}
