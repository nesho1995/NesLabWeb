using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/lab-results")]
[Authorize(Policy = "RequireResultadosValidar")]
public sealed class LabResultsController(ILabResultService results) : ControllerBase
{
    [HttpGet("lines")]
    public async Task<ActionResult<PagedResult<ResultLineListItemDto>>> GetLines(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? format,
        [FromQuery] string? completeness,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var r = await results.GetResultLinesAsync(
            new ResultLinesListQuery(search, status, format, completeness, page, pageSize),
            cancellationToken);
        return Ok(r);
    }

    [HttpPatch("lines/{lineId:int}")]
    public async Task<ActionResult<ResultLineListItemDto>> UpdateLine(
        int lineId,
        [FromBody] UpdateResultLineRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var dto = await results.UpdateResultLineAsync(lineId, request, cancellationToken);
            return dto is null ? NotFound() : Ok(dto);
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
        catch (Exception e)
        {
            var detail = e.InnerException?.Message;
            var msg = string.IsNullOrWhiteSpace(detail)
                ? e.Message
                : $"{e.Message} | {detail}";
            return BadRequest(new { message = $"No se pudo validar el resultado. {msg}" });
        }
    }
}
