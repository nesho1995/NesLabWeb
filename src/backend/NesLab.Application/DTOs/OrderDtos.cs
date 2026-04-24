namespace NesLab.Application.DTOs;

public sealed record DiscountItemDto(int Id, string Name, decimal Percent, int SortOrder);

public sealed record CreateOrderLineRequest(int LabExamId);

public sealed record CreateOrderRequest(
    int PatientId,
    decimal DiscountPercent,
    string DiscountTypeLabel,
    IReadOnlyList<CreateOrderLineRequest> Lines,
    string? PaymentMethod,
    decimal? AmountReceived,
    bool IsFinalConsumer,
    string? ClientLegalName,
    string? ClientRtn,
    int? PaymentMethodId = null,
    /// <summary>Solo si la empresa usa CAI y permite documento interno. True = factura con correlativo/bloque SAR, false = nota interna (otra secuencia).</summary>
    bool? UseSarInvoice = null);

public sealed record CreateOrderResultDto(
    int OrderId,
    string InvoiceNumber,
    bool CaiMode,
    string? Cai,
    string? Rango,
    DateTime? CaiDueDate,
    decimal SubtotalBase,
    decimal DiscountAmount,
    decimal Isv,
    decimal Total,
    string PaymentMethod,
    decimal? Change);

public sealed record OrderVoucherLineDto(
    string ExamCode,
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record OrderVoucherCompanyDto(
    string Name,
    string? Rtn,
    string? Address,
    string? Phone,
    string? Email,
    string? LogoUrl);

public sealed record OrderVoucherDto(
    int OrderId,
    string DocumentTitle,
    string OrderNumberText,
    DateTime OrderAtUtc,
    string Clasificacion,
    string ProviderName,
    OrderVoucherCompanyDto Company,
    string PatientName,
    string? NationalId,
    string? TitularName,
    IReadOnlyList<OrderVoucherLineDto> Lines,
    decimal SubtotalExams,
    decimal SubtotalBase,
    decimal DiscountAmount,
    string DiscountTypeLabel,
    decimal Isv,
    decimal Total,
    decimal Saldo,
    string? PaymentMethod,
    bool CaiMode,
    string? Cai,
    string? Rango,
    string? CaiVencText,
    string ClientRtn,
    string ClientInvoiceName,
    string? EmittedByName,
    IReadOnlyList<string> VoucherFooterLines,
    string? VoucherExigirLine);

public sealed record OrderListItemDto(
    int Id,
    string InvoiceNumber,
    DateTime OrderAtUtc,
    string PatientName,
    string? PatientNationalId,
    string Status,
    string FiscalStatus,
    decimal Total,
    string? PaymentMethod,
    int LineCount);

public sealed record OrderListQuery(
    string? Search,
    string? FiscalStatus,
    int Page = 1,
    int PageSize = 20);
