namespace NesLab.Application.DTOs;

public sealed record PaymentMethodListItemDto(
    int Id,
    string Code,
    string Name,
    int SortOrder,
    bool IsActive,
    bool InPhysicalDrawer,
    bool RequiresAmountReceived);

public sealed record CreatePaymentMethodRequest(
    string Code,
    string Name,
    int SortOrder,
    bool InPhysicalDrawer,
    bool RequiresAmountReceived);

public sealed record UpdatePaymentMethodRequest(
    string Name,
    int SortOrder,
    bool IsActive,
    bool InPhysicalDrawer,
    bool RequiresAmountReceived);
