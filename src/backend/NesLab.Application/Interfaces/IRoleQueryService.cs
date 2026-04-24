using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IRoleQueryService
{
    Task<IReadOnlyList<RoleListItemDto>> ListAsync(CancellationToken cancellationToken = default);
}
