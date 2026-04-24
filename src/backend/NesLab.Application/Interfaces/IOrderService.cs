using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IOrderService
{
    Task<IReadOnlyList<DiscountItemDto>> GetDiscountsAsync(CancellationToken cancellationToken = default);
    Task<CreateOrderResultDto> CreateOrderAsync(CreateOrderRequest request, string? idempotencyKey, CancellationToken cancellationToken = default);
    Task<PagedResult<OrderListItemDto>> GetOrdersPagedAsync(OrderListQuery query, CancellationToken cancellationToken = default);
    Task<OrderVoucherDto?> GetOrderVoucherAsync(int orderId, CancellationToken cancellationToken = default);
}
