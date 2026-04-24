using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IUserQueryService
{
    Task<IReadOnlyList<UserListItemDto>> ListUsersAsync(CancellationToken cancellationToken = default);
}
