using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class UserQueryService(NesLabDbContext db) : IUserQueryService
{
    public async Task<IReadOnlyList<UserListItemDto>> ListUsersAsync(CancellationToken cancellationToken = default)
    {
        var list = await db.Users
            .AsNoTracking()
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .OrderBy(x => x.Username)
            .ToListAsync(cancellationToken);
        return list
            .Select(x => new UserListItemDto(
                x.Id,
                x.Username,
                x.FullName,
                x.IsActive,
                x.UserRoles.Select(ur => ur.RoleId).Distinct().Order().ToList(),
                x.UserRoles
                    .Select(ur => ur.Role.Code)
                    .Distinct()
                    .Order()
                    .ToList()))
            .ToList();
    }
}
