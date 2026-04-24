using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/company")]
[Authorize]
public sealed class CompanyController(ICompanyCashSettingsService cash) : ControllerBase
{
    /// <summary>Politica de caja y caja chica (por empresa / sesion actual). Lectura para todo usuario autenticado.</summary>
    [HttpGet("cash-settings")]
    [ProducesResponseType(typeof(CompanyCashSettingsDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetCashSettings(CancellationToken cancellationToken)
    {
        var dto = await cash.GetForCurrentCompanyAsync(cancellationToken);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPut("cash-settings")]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(CompanyCashSettingsDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> UpdateCashSettings(
        [FromBody] UpdateCompanyCashSettingsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var r = await cash.UpdateAsync(request, cancellationToken);
            return Ok(r);
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
