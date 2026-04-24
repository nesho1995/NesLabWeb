using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class PatientsController(IPatientService patients) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "RequirePatientRead")]
    public async Task<ActionResult<PagedResult<PatientListItemDto>>> Get(
        [FromQuery] string? search,
        [FromQuery] bool includeInactive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await patients.GetPagedAsync(
            new PatientListQuery(search, includeInactive, page, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "RequirePatientRead")]
    public async Task<ActionResult<PatientDetailDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var item = await patients.GetByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "RequirePatientWrite")]
    public async Task<ActionResult<PatientDetailDto>> Create(
        [FromBody] CreatePatientRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await patients.CreateAsync(request, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequirePatientWrite")]
    public async Task<ActionResult<PatientDetailDto>> Update(
        int id,
        [FromBody] UpdatePatientRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var item = await patients.UpdateAsync(id, request, cancellationToken);
            return item is null ? NotFound() : Ok(item);
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
