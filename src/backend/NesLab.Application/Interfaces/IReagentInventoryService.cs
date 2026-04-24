using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IReagentInventoryService
{
    Task<IReadOnlyList<ReagentStockItemDto>> ListAsync(bool includeInactive, CancellationToken cancellationToken = default);
    Task<ReagentInventoryOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default);
    Task<ReagentStockItemDto> CreateAsync(CreateReagentStockRequest request, CancellationToken cancellationToken = default);
    Task<ReagentStockItemDto> UpdateAsync(int id, UpdateReagentStockRequest request, CancellationToken cancellationToken = default);
    Task<ReagentStockItemDto> AdjustAsync(int id, AdjustReagentStockRequest request, CancellationToken cancellationToken = default);
}
