using Microsoft.EntityFrameworkCore;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;
using System.Security.Cryptography;
using System.Text;

namespace NesLab.Infrastructure.Services;

public sealed class AuthService(
    NesLabDbContext dbContext,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator tokenGenerator) : IAuthService
{
    private const int RefreshTokenDays = 7;

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var username = (request.Username ?? string.Empty).Trim();
        if (username.Length == 0)
        {
            return null;
        }
        var password = request.Password ?? string.Empty;
        var normalizedUsername = username.ToLowerInvariant();
        var user = await dbContext.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .ThenInclude(x => x.RolePermissions)
            .ThenInclude(x => x.Permission)
            .FirstOrDefaultAsync(x => x.Username.ToLower() == normalizedUsername && x.IsActive, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var usePbkdf2 = string.Equals(user.PasswordAlgorithm, "PBKDF2", StringComparison.OrdinalIgnoreCase)
            || (string.IsNullOrWhiteSpace(user.PasswordAlgorithm)
                && user.PasswordHash.StartsWith("PBKDF2$", StringComparison.Ordinal));
        var validPassword = usePbkdf2
            ? passwordHasher.VerifyPbkdf2(password, user.PasswordHash)
            : passwordHasher.VerifyLegacySha256(password, user.PasswordHash);

        if (!validPassword)
        {
            return null;
        }

        if (string.Equals(user.PasswordAlgorithm, "SHA256", StringComparison.Ordinal))
        {
            user.PasswordHash = passwordHasher.HashPbkdf2(password);
            user.PasswordAlgorithm = "PBKDF2";
            user.UpdatedAtUtc = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var roles = user.UserRoles.Select(x => x.Role.Code).Distinct().Order().ToList();
        var permissions = user.UserRoles
            .SelectMany(x => x.Role.RolePermissions.Select(rp => rp.Permission.Code))
            .Distinct()
            .Order()
            .ToList();

        var (token, expiresAtUtc) = tokenGenerator.Generate(user, roles, permissions);
        await RevokeActiveRefreshTokensAsync(user.Id, cancellationToken);
        var refreshToken = await IssueRefreshTokenAsync(user.Id, cancellationToken);

        return new AuthResponse(
            token,
            refreshToken,
            expiresAtUtc,
            user.Id,
            user.Username,
            user.FullName,
            roles,
            permissions);
    }

    public async Task<AuthResponse?> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken)
    {
        var tokenHash = ComputeSha256(request.RefreshToken);
        var refreshToken = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash && x.RevokedAtUtc == null, cancellationToken);

        if (refreshToken is null || refreshToken.ExpiresAtUtc < DateTime.UtcNow)
        {
            return null;
        }

        var user = await dbContext.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .ThenInclude(x => x.RolePermissions)
            .ThenInclude(x => x.Permission)
            .FirstOrDefaultAsync(x => x.Id == refreshToken.UserId && x.IsActive, cancellationToken);

        if (user is null)
        {
            return null;
        }

        refreshToken.RevokedAtUtc = DateTime.UtcNow;
        var newRefreshToken = await IssueRefreshTokenAsync(user.Id, cancellationToken);

        var roles = user.UserRoles.Select(x => x.Role.Code).Distinct().Order().ToList();
        var permissions = user.UserRoles
            .SelectMany(x => x.Role.RolePermissions.Select(rp => rp.Permission.Code))
            .Distinct()
            .Order()
            .ToList();

        var (accessToken, expiresAtUtc) = tokenGenerator.Generate(user, roles, permissions);

        return new AuthResponse(
            accessToken,
            newRefreshToken,
            expiresAtUtc,
            user.Id,
            user.Username,
            user.FullName,
            roles,
            permissions);
    }

    public async Task<bool> LogoutAsync(int userId, string refreshToken, CancellationToken cancellationToken)
    {
        var tokenHash = ComputeSha256(refreshToken);
        var token = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(x => x.UserId == userId && x.TokenHash == tokenHash && x.RevokedAtUtc == null, cancellationToken);

        if (token is null)
        {
            return false;
        }

        token.RevokedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CurrentUserResponse?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .ThenInclude(x => x.RolePermissions)
            .ThenInclude(x => x.Permission)
            .FirstOrDefaultAsync(x => x.Id == userId && x.IsActive, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var roles = user.UserRoles.Select(x => x.Role.Code).Distinct().Order().ToList();
        var permissions = user.UserRoles
            .SelectMany(x => x.Role.RolePermissions.Select(rp => rp.Permission.Code))
            .Distinct()
            .Order()
            .ToList();

        return new CurrentUserResponse(user.Id, user.Username, user.FullName, roles, permissions);
    }

    private async Task<string> IssueRefreshTokenAsync(int userId, CancellationToken cancellationToken)
    {
        var tokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = ComputeSha256(tokenValue),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(RefreshTokenDays),
            CreatedAtUtc = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        return tokenValue;
    }

    private async Task RevokeActiveRefreshTokensAsync(int userId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var activeTokens = await dbContext.RefreshTokens
            .Where(x => x.UserId == userId && x.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);
        if (activeTokens.Count == 0)
        {
            return;
        }

        foreach (var token in activeTokens)
        {
            token.RevokedAtUtc = now;
        }
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string ComputeSha256(string value)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(hashBytes);
    }
}
