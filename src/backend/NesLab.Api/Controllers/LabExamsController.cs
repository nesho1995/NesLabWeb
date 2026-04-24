using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/lab-exams")]
[Authorize]
public sealed class LabExamsController(ILabExamService exams) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "RequireExamRead")]
    public async Task<ActionResult<PagedResult<LabExamListItemDto>>> Get(
        [FromQuery] string? search,
        [FromQuery] bool includeInactive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await exams.GetPagedAsync(
            new LabExamListQuery(search, includeInactive, page, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "RequireExamRead")]
    public async Task<ActionResult<LabExamDetailDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var item = await exams.GetByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "RequireExamAdminConfig")]
    public async Task<ActionResult<LabExamDetailDto>> Create(
        [FromBody] CreateLabExamRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await exams.CreateAsync(request, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPost("bulk")]
    [Authorize(Policy = "RequireExamAdminConfig")]
    public async Task<ActionResult<BulkImportLabExamsResult>> Bulk(
        [FromBody] BulkImportLabExamsRequest request,
        CancellationToken cancellationToken)
    {
        var r = await exams.BulkImportAsync(request, cancellationToken);
        return Ok(r);
    }

    [HttpPost("clear-catalog")]
    [Authorize(Policy = "RequireExamAdminConfig")]
    [ProducesResponseType(typeof(ClearLabExamsCatalogResult), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<ClearLabExamsCatalogResult>> ClearCatalog(CancellationToken cancellationToken)
    {
        var r = await exams.ClearCatalogAsync(cancellationToken);
        return Ok(r);
    }

    [HttpPost("apply-templates")]
    [Authorize(Policy = "RequireExamAdminConfig")]
    [ProducesResponseType(typeof(ApplyExamTemplatesResult), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<ApplyExamTemplatesResult>> ApplyTemplates(CancellationToken cancellationToken)
    {
        var r = await exams.ApplyDefaultTemplatesAsync(cancellationToken);
        return Ok(r);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequireExamAdminConfig")]
    public async Task<ActionResult<LabExamDetailDto>> Update(
        int id,
        [FromBody] UpdateLabExamRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var item = await exams.UpdateAsync(id, request, cancellationToken);
            return item is null ? NotFound() : Ok(item);
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
