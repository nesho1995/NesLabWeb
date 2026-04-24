using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.Abstractions;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Api.Operations;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/lab-results")]
[Authorize(Policy = "RequireResultadosValidar")]
public sealed class LabResultsController(
    ILabResultService results,
    IClinicalConclusionAssistant conclusionAssistant,
    IAiSuggestionAuditWriter aiSuggestionAuditWriter,
    ITenantContext tenantContext,
    ICurrentUserContext currentUserContext) : ControllerBase
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
        var r = await results.GetResultLinesAsync(
            new ResultLinesListQuery(search, status, format, completeness, page, pageSize, fromDate, toDate),
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

    [HttpPost("lines/{lineId:int}/suggest-conclusion")]
    public async Task<ActionResult<SuggestConclusionResponseDto>> SuggestConclusion(
        int lineId,
        [FromBody] SuggestConclusionRequestDto request,
        CancellationToken cancellationToken)
    {
        if (lineId != request.LineId)
        {
            return BadRequest(new { message = "La línea de resultado no coincide." });
        }

        try
        {
            var safeRequest = NormalizeRequest(request);
            var suggestion = await conclusionAssistant.SuggestAsync(safeRequest, cancellationToken);
            await aiSuggestionAuditWriter.WriteAsync(
                new AiSuggestionAuditEntry(
                    DateTime.UtcNow,
                    tenantContext.CompanyId,
                    currentUserContext.UserId,
                    safeRequest.LineId,
                    safeRequest.OrderId,
                    safeRequest.ExamCode,
                    safeRequest.ExamName,
                    suggestion.ConfidenceLevel,
                    false,
                    suggestion.Disclaimer,
                    suggestion.References.Count,
                    HttpContext.Connection.RemoteIpAddress?.ToString(),
                    HttpContext.Request.Headers.UserAgent.ToString()),
                cancellationToken);
            return Ok(suggestion);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    message = $"Asistente IA no disponible temporalmente. {ex.Message}"
                });
        }
    }

    [HttpPost("lines/{lineId:int}/suggest-conclusion/feedback")]
    public async Task<ActionResult> RegisterSuggestionFeedback(
        int lineId,
        [FromBody] SuggestConclusionFeedbackRequestDto request,
        CancellationToken cancellationToken)
    {
        await aiSuggestionAuditWriter.WriteAsync(
            new AiSuggestionAuditEntry(
                DateTime.UtcNow,
                tenantContext.CompanyId,
                currentUserContext.UserId,
                lineId,
                request.OrderId,
                request.ExamCode.Trim(),
                request.ExamName.Trim(),
                request.ConfidenceLevel.Trim(),
                request.Accepted,
                request.Disclaimer.Trim(),
                Math.Max(0, request.ReferencesCount),
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                HttpContext.Request.Headers.UserAgent.ToString()),
            cancellationToken);
        return Accepted();
    }

    private static SuggestConclusionRequestDto NormalizeRequest(SuggestConclusionRequestDto request)
    {
        static string SafeText(string? value, int max)
        {
            var trimmed = (value ?? string.Empty).Trim();
            return trimmed.Length <= max ? trimmed : trimmed[..max];
        }

        var parameters = request.Parameters
            .Take(30)
            .Select(
                p => new ConclusionParameterInputDto(
                    SafeText(p.Name, 80),
                    SafeText(p.Value, 80),
                    SafeText(p.Unit, 40),
                    SafeText(p.ReferenceText, 120)))
            .Where(p => p.Name.Length > 0)
            .ToList();

        return request with
        {
            ExamCode = SafeText(request.ExamCode, 50),
            ExamName = SafeText(request.ExamName, 150),
            ResultFormat = SafeText(request.ResultFormat, 20),
            PatientName = SafeText(request.PatientName, 150),
            PatientSex = SafeText(request.PatientSex, 20),
            ExistingNotes = SafeText(request.ExistingNotes, 2000),
            Locale = SafeText(request.Locale, 16),
            Parameters = parameters
        };
    }
}
