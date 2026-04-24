using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/inventory/reagents")]
[Authorize]
public sealed class InventoryController(IReagentInventoryService inventory) : ControllerBase
{
    [HttpGet("overview")]
    [Authorize(Policy = "RequireOrderCreate")]
    [ProducesResponseType(typeof(ReagentInventoryOverviewDto), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> Overview(CancellationToken cancellationToken) =>
        Ok(await inventory.GetOverviewAsync(cancellationToken));

    [HttpGet]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(IReadOnlyList<ReagentStockItemDto>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> List([FromQuery] bool includeInactive = false, CancellationToken cancellationToken = default) =>
        Ok(await inventory.ListAsync(includeInactive, cancellationToken));

    [HttpPost]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(ReagentStockItemDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateReagentStockRequest body, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await inventory.CreateAsync(body, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(ReagentStockItemDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateReagentStockRequest body, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await inventory.UpdateAsync(id, body, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPost("{id:int}/adjust")]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(ReagentStockItemDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Adjust(int id, [FromBody] AdjustReagentStockRequest body, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await inventory.AdjustAsync(id, body, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
