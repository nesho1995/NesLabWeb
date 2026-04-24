using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/lab-dashboard")]
[Authorize]
public sealed class LabDashboardController(ILabDashboardService dashboard) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "RequireResultadosValidar")]
    [ProducesResponseType(typeof(LabDashboardDto), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) =>
        Ok(await dashboard.GetAsync(cancellationToken));

    [HttpGet("finance")]
    [Authorize(Policy = "RequireResultadosValidar")]
    [ProducesResponseType(typeof(FinanceSummaryDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> GetFinance(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await dashboard.GetFinanceSummaryAsync(fromDate, toDate, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
