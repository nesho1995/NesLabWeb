using Microsoft.EntityFrameworkCore;
using NesLab.Domain.Entities;

namespace NesLab.Infrastructure.Persistence.Seed;

/// <summary>Agrega permisos y asignaciones nuevas sin re-ejecutar el seed base.</summary>
public static class ModulePermissionSeeder
{
    private static readonly (string Code, string Name)[] NewPermissions =
    {
        ("FISCAL.READ", "Ver estado y guia fiscal SAR / empresa"),
        ("USUARIO.READ", "Listar usuarios y roles"),
        ("USUARIO.WRITE", "Crear y modificar usuarios, roles y clave"),
        ("ORDEN.READ", "Listar y ver comprobantes de orden"),
        ("MUESTRA.GESTION", "Gestionar muestras y etiquetado"),
        ("EMPRESA.CONFIG", "Configurar politica de caja y empresa"),
    };

    public static async Task EnsureAsync(NesLabDbContext db, CancellationToken cancellationToken = default)
    {
        var added = false;
        var known = await db.Permissions.Select(p => p.Code).ToListAsync(cancellationToken);
        var byCode = known.ToHashSet(StringComparer.Ordinal);
        foreach (var (code, name) in NewPermissions)
        {
            if (byCode.Contains(code))
            {
                continue;
            }
            db.Permissions.Add(new Permission { Code = code, Name = name });
            byCode.Add(code);
            added = true;
        }
        if (added)
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        var permByCode = await db.Permissions
            .AsNoTracking()
            .ToDictionaryAsync(p => p.Code, p => p.Id, StringComparer.Ordinal, cancellationToken);
        var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.Code == "ADMIN", cancellationToken);
        var recep = await db.Roles.FirstOrDefaultAsync(r => r.Code == "RECEPCION", cancellationToken);
        var caja = await db.Roles.FirstOrDefaultAsync(r => r.Code == "CAJA", cancellationToken);
        if (adminRole is not null)
        {
            await EnsureRolePermsAsync(db, adminRole.Id, NewPermissions.Select(x => x.Code), permByCode, cancellationToken);
        }
        if (recep is not null)
        {
            if (permByCode.TryGetValue("FISCAL.READ", out var f))
            {
                await EnsureOneRolePermAsync(db, recep.Id, f, cancellationToken);
            }
        }
        if (caja is not null && permByCode.TryGetValue("FISCAL.READ", out var f2))
        {
            await EnsureOneRolePermAsync(db, caja.Id, f2, cancellationToken);
        }

        if (permByCode.TryGetValue("ORDEN.READ", out var ordenReadRol))
        {
            foreach (var role in new[] { recep, caja })
            {
                if (role is not null)
                {
                    await EnsureOneRolePermAsync(db, role.Id, ordenReadRol, cancellationToken);
                }
            }
        }

        // Caja: orden y catalogo; laboratorio: muestras bajo MUESTRA.GESTION (no ORDEN.CREATE).
        if (caja is not null)
        {
            foreach (var code in new[] { "ORDEN.CREATE", "PACIENTE.READ", "EXAMEN.READ", "CAJA.CERRAR" })
            {
                if (permByCode.TryGetValue(code, out var pid))
                {
                    await EnsureOneRolePermAsync(db, caja.Id, pid, cancellationToken);
                }
            }
        }
        var labo = await db.Roles.FirstOrDefaultAsync(r => r.Code == "LABORATORIO", cancellationToken);
        if (labo is not null)
        {
            if (permByCode.TryGetValue("ORDEN.READ", out var ordenRead))
            {
                await EnsureOneRolePermAsync(db, labo.Id, ordenRead, cancellationToken);
            }
            if (permByCode.TryGetValue("MUESTRA.GESTION", out var muestraG))
            {
                await EnsureOneRolePermAsync(db, labo.Id, muestraG, cancellationToken);
            }
        }
    }

    private static async Task EnsureRolePermsAsync(
        NesLabDbContext db,
        int roleId,
        IEnumerable<string> codes,
        IReadOnlyDictionary<string, int> permByCode,
        CancellationToken cancellationToken)
    {
        var existing = await db.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .Select(rp => rp.PermissionId)
            .ToListAsync(cancellationToken);
        var ex = new HashSet<int>(existing);
        foreach (var c in codes)
        {
            if (permByCode.TryGetValue(c, out var pid) && !ex.Contains(pid))
            {
                db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = pid });
                ex.Add(pid);
            }
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureOneRolePermAsync(
        NesLabDbContext db,
        int roleId,
        int permId,
        CancellationToken cancellationToken)
    {
        if (await db.RolePermissions
                .AnyAsync(
                    x => x.RoleId == roleId && x.PermissionId == permId,
                    cancellationToken))
        {
            return;
        }
        db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permId });
        await db.SaveChangesAsync(cancellationToken);
    }
}
