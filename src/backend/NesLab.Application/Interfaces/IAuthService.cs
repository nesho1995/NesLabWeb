using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<LoginAttemptResult> LoginDetailedAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<AuthResponse?> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken);
    Task<bool> LogoutAsync(int userId, string refreshToken, CancellationToken cancellationToken);
    Task<CurrentUserResponse?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken);
}
