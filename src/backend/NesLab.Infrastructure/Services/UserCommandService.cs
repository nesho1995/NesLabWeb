using Microsoft.EntityFrameworkCore;
using NesLab.Application.Abstractions;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;
using NesLab.Infrastructure.Persistence;

namespace NesLab.Infrastructure.Services;

public sealed class UserCommandService(
    NesLabDbContext db,
    IPasswordHasher hasher,
    ICurrentUserContext current) : IUserCommandService
{
    private const int MinPassword = 6;

    public async Task<UserListItemDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new InvalidOperationException("Usuario y nombre completo son obligatorios.");
        }
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < MinPassword)
        {
            throw new InvalidOperationException($"La clave debe tener al menos {MinPassword} caracteres.");
        }
        if (request.RoleIds.Count == 0)
        {
            throw new InvalidOperationException("Seleccione al menos un rol.");
        }
        var u = request.Username.Trim();
        if (await db.Users.AnyAsync(x => x.Username == u, cancellationToken))
        {
            throw new InvalidOperationException("Ya existe un usuario con ese nombre de usuario.");
        }
        await EnsureRolesExistAsync(request.RoleIds, cancellationToken);
        var row = new User
        {
            Username = u,
            FullName = request.FullName.Trim(),
            PasswordHash = hasher.HashPbkdf2(request.Password),
            PasswordAlgorithm = "PBKDF2",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };
        db.Users.Add(row);
        await db.SaveChangesAsync(cancellationToken);
        await ReplaceUserRolesAsync(row.Id, request.RoleIds, cancellationToken);
        return await GetDtoAsync(row.Id, cancellationToken)
            ?? throw new InvalidOperationException("No se pudo leer el usuario creado.");
    }

    public async Task<UserListItemDto> UpdateAsync(int userId, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new InvalidOperationException("El nombre completo es obligatorio.");
        }
        if (request.RoleIds.Count == 0)
        {
            throw new InvalidOperationException("Debe asignar al menos un rol.");
        }
        await EnsureRolesExistAsync(request.RoleIds, cancellationToken);
        var u = await db.Users
            .Include(x => x.UserRoles)
            .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("Usuario no encontrado.");
        if (current.UserId == userId && !request.IsActive)
        {
            throw new InvalidOperationException("No puede desactivar su propia cuenta.");
        }
        u.FullName = request.FullName.Trim();
        u.IsActive = request.IsActive;
        u.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await ReplaceUserRolesAsync(userId, request.RoleIds, cancellationToken);
        return await GetDtoAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("No se pudo leer el usuario actualizado.");
    }

    public async Task SetPasswordAsync(int userId, SetUserPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(request.NewPassword) || request.NewPassword.Length < MinPassword)
        {
            throw new InvalidOperationException($"La clave debe tener al menos {MinPassword} caracteres.");
        }
        var u = await db.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("Usuario no encontrado.");
        u.PasswordHash = hasher.HashPbkdf2(request.NewPassword);
        u.PasswordAlgorithm = "PBKDF2";
        u.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureRolesExistAsync(IReadOnlyList<int> roleIds, CancellationToken cancellationToken)
    {
        if (roleIds.Distinct().Count() != roleIds.Count)
        {
            throw new InvalidOperationException("Roles duplicados.");
        }
        var c = await db.Roles.CountAsync(x => roleIds.Contains(x.Id), cancellationToken);
        if (c != roleIds.Count)
        {
            throw new InvalidOperationException("Uno o mas roles no existen.");
        }
    }

    private async Task ReplaceUserRolesAsync(int userId, IReadOnlyList<int> roleIds, CancellationToken cancellationToken)
    {
        var existing = await db.UserRoles.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        if (existing.Count > 0)
        {
            db.UserRoles.RemoveRange(existing);
        }
        foreach (var r in roleIds.Distinct())
        {
            db.UserRoles.Add(new UserRole { UserId = userId, RoleId = r });
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<UserListItemDto?> GetDtoAsync(int userId, CancellationToken cancellationToken)
    {
        var x = await db.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (x is null)
        {
            return null;
        }
        return new UserListItemDto(
            x.Id,
            x.Username,
            x.FullName,
            x.IsActive,
            x.UserRoles.Select(ur => ur.RoleId).Distinct().Order().ToList(),
            x.UserRoles.Select(ur => ur.Role.Code).Distinct().Order().ToList());
    }
}
