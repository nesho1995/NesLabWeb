using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class UsersController(IUserQueryService users, IUserCommandService commands) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "RequireUserRead")]
    [ProducesResponseType(typeof(IReadOnlyList<UserListItemDto>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var list = await users.ListUsersAsync(cancellationToken);
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Policy = "RequireUserWrite")]
    [ProducesResponseType(typeof(UserListItemDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest body, CancellationToken cancellationToken)
    {
        try
        {
            var u = await commands.CreateAsync(body, cancellationToken);
            return Ok(u);
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequireUserWrite")]
    [ProducesResponseType(typeof(UserListItemDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest body, CancellationToken cancellationToken)
    {
        try
        {
            var u = await commands.UpdateAsync(id, body, cancellationToken);
            return Ok(u);
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPut("{id:int}/password")]
    [Authorize(Policy = "RequireUserWrite")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> SetPassword(int id, [FromBody] SetUserPasswordRequest body, CancellationToken cancellationToken)
    {
        try
        {
            await commands.SetPasswordAsync(id, body, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
