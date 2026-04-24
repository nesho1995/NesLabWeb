using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireUserRead")]
public sealed class RolesController(IRoleQueryService roles) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RoleListItemDto>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var r = await roles.ListAsync(cancellationToken);
        return Ok(r);
    }
}
