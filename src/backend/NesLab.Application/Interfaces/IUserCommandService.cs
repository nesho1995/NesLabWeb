using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IUserCommandService
{
    Task<UserListItemDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<UserListItemDto> UpdateAsync(int userId, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task SetPasswordAsync(int userId, SetUserPasswordRequest request, CancellationToken cancellationToken = default);
}
