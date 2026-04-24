using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/cash")]
[Authorize]
public sealed class CashController(ICashSessionService cash) : ControllerBase
{
    [HttpGet("session")]
    [ProducesResponseType(typeof(CashSessionStatusDto), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetSessionStatus(CancellationToken cancellationToken)
    {
        var s = await cash.GetStatusAsync(cancellationToken);
        return Ok(s);
    }

    [HttpPost("session/open")]
    [Authorize(Policy = "RequireCajaCerrar")]
    [ProducesResponseType(typeof(CashSessionOpenedResultDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Open([FromBody] OpenCashSessionRequest? body, CancellationToken cancellationToken)
    {
        try
        {
            var r = body ?? new OpenCashSessionRequest(null);
            return Ok(await cash.OpenAsync(r, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPost("session/close")]
    [Authorize(Policy = "RequireCajaCerrar")]
    [ProducesResponseType(typeof(CashSessionClosedResultDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Close([FromBody] CloseCashSessionRequest body, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await cash.CloseAsync(body, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
