using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class RoleQueryService(NesLabDbContext db) : IRoleQueryService
{
    public async Task<IReadOnlyList<RoleListItemDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        var r = await db.Roles
            .AsNoTracking()
            .OrderBy(x => x.Code)
            .ToListAsync(cancellationToken);
        return r.Select(x => new RoleListItemDto(x.Id, x.Code, x.Name)).ToList();
    }
}
