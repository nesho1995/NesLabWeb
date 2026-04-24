using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface ICompanyPaymentMethodService
{
    Task<IReadOnlyList<PaymentMethodListItemDto>> ListActiveForOrdersAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PaymentMethodListItemDto>> ListAllAsync(CancellationToken cancellationToken = default);
    Task<PaymentMethodListItemDto> CreateAsync(CreatePaymentMethodRequest request, CancellationToken cancellationToken = default);
    Task<PaymentMethodListItemDto> UpdateAsync(int id, UpdatePaymentMethodRequest request, CancellationToken cancellationToken = default);
}
