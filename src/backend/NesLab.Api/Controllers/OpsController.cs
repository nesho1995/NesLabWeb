using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NesLab.Api.Operations;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Api.Controllers;

[ApiController]
[Route("api/ops")]
public sealed class OpsController(NesLabDbContext db, ICriticalActionLogWriter criticalLogWriter) : ControllerBase
{
    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<IActionResult> Health(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var canConnect = await db.Database.CanConnectAsync(cancellationToken);
        return Ok(new
        {
            status = canConnect ? "ok" : "degraded",
            db = canConnect ? "up" : "down",
            nowUtc = now
        });
    }

    [HttpGet("security/roles-permissions")]
    [Authorize(Policy = "RequireUserRead")]
    public async Task<IActionResult> RolePermissionAudit(CancellationToken cancellationToken)
    {
        var roles = await db.Roles
            .AsNoTracking()
            .OrderBy(r => r.Code)
            .Select(r => new
            {
                r.Id,
                r.Code,
                r.Name,
                UserCount = db.UserRoles.Count(ur => ur.RoleId == r.Id),
                Permissions = db.RolePermissions
                    .Where(rp => rp.RoleId == r.Id)
                    .Select(rp => rp.Permission.Code)
                    .OrderBy(code => code)
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            generatedAtUtc = DateTime.UtcNow,
            totalRoles = roles.Count,
            roles
        });
    }

    [HttpGet("critical-actions")]
    [Authorize(Policy = "RequireUserRead")]
    public async Task<IActionResult> RecentCriticalActions([FromQuery] int take = 200, CancellationToken cancellationToken = default)
    {
        var top = Math.Clamp(take, 1, 1000);
        var rows = await criticalLogWriter.ReadRecentAsync(top, cancellationToken);
        return Ok(new
        {
            total = rows.Count,
            rows
        });
    }
}
