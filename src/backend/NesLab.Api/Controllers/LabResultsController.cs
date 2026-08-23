using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.Abstractions;
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
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await results.GetResultLinesAsync(
            new ResultLinesListQuery(search, status, format, completeness, page, pageSize, fromDate, toDate),
            cancellationToken);
        return Ok(result);
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
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (Exception exception)
        {
            var detail = exception.InnerException?.Message;
            var message = string.IsNullOrWhiteSpace(detail)
                ? exception.Message
                : $"{exception.Message} | {detail}";
            return BadRequest(new { message = $"No se pudo validar el resultado. {message}" });
        }
    }
}

