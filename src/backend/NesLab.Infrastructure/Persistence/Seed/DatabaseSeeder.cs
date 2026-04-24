using Microsoft.EntityFrameworkCore;
using NesLab.Application.Interfaces;
using NesLab.Domain.Entities;

namespace NesLab.Infrastructure.Persistence.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(
        NesLabDbContext dbContext,
        IPasswordHasher passwordHasher,
        CancellationToken cancellationToken = default)
    {
        if (await dbContext.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var roleAdmin = new Role { Code = "ADMIN", Name = "Administrador" };
        var roleRecep = new Role { Code = "RECEPCION", Name = "Recepcion" };
        var roleCash = new Role { Code = "CAJA", Name = "Caja" };
        var roleLab = new Role { Code = "LABORATORIO", Name = "Laboratorio" };

        var permissions = new[]
        {
            new Permission { Code = "AUTH.ME", Name = "Leer sesion actual" },
            new Permission { Code = "ORDEN.CREATE", Name = "Crear orden" },
            new Permission { Code = "ORDEN.READ", Name = "Listar y ver comprobantes de orden" },
            new Permission { Code = "RESULTADOS.VALIDAR", Name = "Validar resultados" },
            new Permission { Code = "CAJA.CERRAR", Name = "Cerrar caja" },
            new Permission { Code = "PACIENTE.READ", Name = "Listar y ver pacientes" },
            new Permission { Code = "PACIENTE.WRITE", Name = "Crear y actualizar pacientes" },
            new Permission { Code = "EXAMEN.READ", Name = "Ver catalogo de examenes" },
            new Permission { Code = "EXAMEN.WRITE", Name = "Administrar examenes" },
            new Permission { Code = "MUESTRA.GESTION", Name = "Gestionar muestras y etiquetado" },
            new Permission { Code = "EMPRESA.CONFIG", Name = "Configurar politica de caja y empresa" }
        };

        dbContext.Roles.AddRange(roleAdmin, roleRecep, roleCash, roleLab);
        dbContext.Permissions.AddRange(permissions);
        await dbContext.SaveChangesAsync(cancellationToken);

        var byCode = permissions.ToDictionary(x => x.Code, x => x.Id, StringComparer.Ordinal);
        var recep = new[] { "ORDEN.CREATE", "ORDEN.READ", "PACIENTE.READ", "PACIENTE.WRITE", "EXAMEN.READ" };
        var caja = new[] { "CAJA.CERRAR" };
        var lab = new[] { "ORDEN.READ", "MUESTRA.GESTION", "RESULTADOS.VALIDAR", "EXAMEN.READ", "PACIENTE.READ" };

        foreach (var p in permissions)
        {
            dbContext.RolePermissions.Add(new RolePermission { RoleId = roleAdmin.Id, PermissionId = p.Id });
        }
        foreach (var c in recep)
        {
            dbContext.RolePermissions.Add(new RolePermission { RoleId = roleRecep.Id, PermissionId = byCode[c] });
        }
        foreach (var c in caja)
        {
            dbContext.RolePermissions.Add(new RolePermission { RoleId = roleCash.Id, PermissionId = byCode[c] });
        }
        foreach (var c in lab)
        {
            dbContext.RolePermissions.Add(new RolePermission { RoleId = roleLab.Id, PermissionId = byCode[c] });
        }
        await dbContext.SaveChangesAsync(cancellationToken);

        var admin = new User
        {
            Username = "admin",
            FullName = "Administrador NesLab",
            PasswordHash = passwordHasher.HashPbkdf2("Admin123!"),
            PasswordAlgorithm = "PBKDF2",
            IsActive = true
        };
        dbContext.Users.Add(admin);
        await dbContext.SaveChangesAsync(cancellationToken);
        dbContext.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = roleAdmin.Id });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Si en la base ya habia otro usuario (seed parcial, import, etc.) y nunca se creo <c>admin</c>, lo agrega
    /// con la misma clave que el despliegue en limpio. No pisa un <c>admin</c> existente.
    /// </summary>
    public static async Task EnsureDefaultAdminUserIfMissingAsync(
        NesLabDbContext dbContext,
        IPasswordHasher passwordHasher,
        CancellationToken cancellationToken = default)
    {
        if (await dbContext.Users.AnyAsync(
                x => x.Username.ToLower() == "admin",
                cancellationToken))
        {
            return;
        }
        var adminRole = await dbContext.Roles
            .FirstOrDefaultAsync(x => x.Code == "ADMIN", cancellationToken);
        if (adminRole is null)
        {
            return;
        }
        var admin = new User
        {
            Username = "admin",
            FullName = "Administrador NesLab",
            PasswordHash = passwordHasher.HashPbkdf2("Admin123!"),
            PasswordAlgorithm = "PBKDF2",
            IsActive = true,
        };
        dbContext.Users.Add(admin);
        await dbContext.SaveChangesAsync(cancellationToken);
        dbContext.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRole.Id });
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
