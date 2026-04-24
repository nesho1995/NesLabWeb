using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Api.Security;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class FiscalController(
    IFiscalQueryService fiscal,
    IFiscalCommandService fiscalCommand,
    IWebHostEnvironment env,
    ITenantContext tenant) : ControllerBase
{
    [HttpGet("company")]
    [Authorize(Policy = "RequireFiscalRead")]
    [ProducesResponseType(typeof(CompanyFiscalStatusDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetCurrentCompanyFiscalStatus(CancellationToken cancellationToken)
    {
        var dto = await fiscal.GetCompanyFiscalStatusAsync(tenant.CompanyId, cancellationToken);
        return dto is not null ? Ok(dto) : NotFound();
    }

    [HttpGet("company/branding")]
    [Authorize]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetCompanyBranding(CancellationToken cancellationToken)
    {
        var dto = await fiscal.GetCompanyFiscalStatusAsync(tenant.CompanyId, cancellationToken);
        if (dto is null)
        {
            return NotFound();
        }
        return Ok(new
        {
            companyId = dto.CompanyId,
            companyName = dto.CompanyName,
            branding = dto.Branding
        });
    }

    [HttpPut("company/sar")]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(CompanyFiscalStatusDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> UpdateSar([FromBody] UpdateSarConfigRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var r = await fiscalCommand.UpdateSarConfigAsync(tenant.CompanyId, request, cancellationToken);
            return Ok(r);
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPut("company/branding")]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType(typeof(CompanyFiscalStatusDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> UpdateBranding([FromBody] FiscalBrandingDto request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await fiscalCommand.UpdateFiscalBrandingAsync(tenant.CompanyId, request, cancellationToken));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPost("company/logo")]
    [Authorize(Policy = "RequireEmpresaConfig")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> UploadLogo([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length <= 0)
        {
            return BadRequest(new { message = "Debe seleccionar un archivo de imagen." });
        }
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "La imagen excede el limite de 5 MB." });
        }
        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant();
        if (ext is not (".png" or ".jpg" or ".jpeg" or ".webp"))
        {
            return BadRequest(new { message = "Formato no permitido. Use PNG/JPG/WEBP." });
        }

        var root = string.IsNullOrWhiteSpace(env.WebRootPath)
            ? Path.Combine(env.ContentRootPath, "wwwroot")
            : env.WebRootPath;
        var relDir = Path.Combine("uploads", "lab-logos", tenant.CompanyId.ToString());
        var absDir = Path.Combine(root, relDir);
        Directory.CreateDirectory(absDir);

        var safeName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{ext}";
        var absPath = Path.Combine(absDir, safeName);
        await using (var fs = System.IO.File.Create(absPath))
        {
            await file.CopyToAsync(fs, cancellationToken);
        }
        var relUrl = $"/{relDir.Replace('\\', '/')}/{safeName}";
        return Ok(new { url = relUrl });
    }
}
