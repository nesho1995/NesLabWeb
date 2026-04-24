using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/offline-sync")]
[Authorize]
public sealed class OfflineSyncController(IOfflineSyncService offlineSync) : ControllerBase
{
    [HttpGet("regularizations")]
    [Authorize(Policy = "RequireOrderRead")]
    [ProducesResponseType(typeof(IReadOnlyList<OfflineSyncRegularizationDto>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> List([FromQuery] int take = 200, CancellationToken cancellationToken = default) =>
        Ok(await offlineSync.ListRecentAsync(take, cancellationToken));

    [HttpPost("regularizations")]
    [Authorize(Policy = "RequireOrderCreate")]
    [ProducesResponseType(typeof(OfflineSyncRegularizationDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Add([FromBody] OfflineSyncRegularizationRequest body, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await offlineSync.AddRegularizationAsync(body, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
