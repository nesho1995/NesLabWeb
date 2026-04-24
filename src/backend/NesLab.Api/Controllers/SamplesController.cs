using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/samples")]
[Authorize(Policy = "RequireMuestraGestion")]
public sealed class SamplesController(ISampleService samples) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SampleListItemDto>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<PagedResult<SampleListItemDto>>> Get(
        [FromQuery] string? search,
        [FromQuery] bool onlyPending = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        return Ok(
            await samples.GetSamplesAsync(
                new SamplesListQuery(search, onlyPending, page, pageSize), cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType(typeof(SampleListItemDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<ActionResult<SampleListItemDto>> Create(
        [FromBody] CreateSampleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await samples.CreateAsync(request, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPatch("{id:int}")]
    [ProducesResponseType(typeof(SampleListItemDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<ActionResult<SampleListItemDto>> Update(
        int id,
        [FromBody] UpdateSampleRequest request,
        CancellationToken cancellationToken = default)
    {
        var r = await samples.UpdateAsync(id, request, cancellationToken);
        return r is null ? NotFound() : Ok(r);
    }
}
