using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/payment-methods")]
[Authorize]
public sealed class PaymentMethodsController(ICompanyPaymentMethodService methods) : ControllerBase
{
    [HttpGet("active")]
    [ProducesResponseType(typeof(IReadOnlyList<PaymentMethodListItemDto>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetActiveForOrders(CancellationToken cancellationToken) =>
        Ok(await methods.ListActiveForOrdersAsync(cancellationToken));

    [HttpGet]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(IReadOnlyList<PaymentMethodListItemDto>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(await methods.ListAllAsync(cancellationToken));

    [HttpPost]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(PaymentMethodListItemDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreatePaymentMethodRequest body, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await methods.CreateAsync(body, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(PaymentMethodListItemDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdatePaymentMethodRequest body,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await methods.UpdateAsync(id, body, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
