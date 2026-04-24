using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class OrdersController(IOrderService orders) : ControllerBase
{
    [HttpGet("discounts")]
    [Authorize(Policy = "RequireOrderCreate")]
    [ProducesResponseType(typeof(IReadOnlyList<DiscountItemDto>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetDiscounts(CancellationToken cancellationToken) =>
        Ok(await orders.GetDiscountsAsync(cancellationToken));

    [HttpGet]
    [Authorize(Policy = "RequireOrderRead")]
    [ProducesResponseType(typeof(PagedResult<OrderListItemDto>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<PagedResult<OrderListItemDto>>> GetList(
        [FromQuery] string? search,
        [FromQuery] string? fiscalStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await orders.GetOrdersPagedAsync(
            new OrderListQuery(search, fiscalStatus, page, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}/voucher")]
    [Authorize(Policy = "RequireOrderRead")]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetVoucher(
        int id,
        CancellationToken cancellationToken)
    {
        var dto = await orders.GetOrderVoucherAsync(id, cancellationToken);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    [Authorize(Policy = "RequireOrderCreate")]
    [ProducesResponseType(typeof(CreateOrderResultDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> CreateOrder(
        [FromBody] CreateOrderRequest request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        CancellationToken cancellationToken)
    {
        try
        {
            var r = await orders.CreateOrderAsync(request, idempotencyKey, cancellationToken);
            return Ok(r);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
