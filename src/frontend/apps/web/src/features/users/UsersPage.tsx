import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { createUser, getRoles, getUsers, setUserPassword, updateUser } from './users.api';
import type { RoleListItem, UserListItem } from './users.types';

function toggleRoleInIds(ids: number[], id: number) {
  const s = new Set(ids);
  if (s.has(id)) {
    s.delete(id);
  } else {
    s.add(id);
  }
  return Array.from(s);
}

export function UsersPage() {
  const { logout, hasPermission, user: me } = useAuth();
  const navigate = useNavigate();
  const canRead = hasPermission('USUARIO.READ');
  const canWrite = hasPermission('USUARIO.WRITE');
  const [rows, setRows] = useState<UserListItem[] | null>(null);
  const [roleCatalog, setRoleCatalog] = useState<RoleListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleIds, setNewRoleIds] = useState<number[]>([]);
  const [pwdId, setPwdId] = useState<number | null>(null);
  const [pwdText, setPwdText] = useState('');

  const load = useCallback(async (signal: AbortSignal) => {
    const [u, r] = await Promise.all([getUsers(), getRoles()]);
    if (!signal.aborted) {
      setRows(u);
      setRoleCatalog(r);
      setError(null);
    }
  }, []);

  useEffect(() => {
    if (!canRead) {
      setError('Falta permiso USUARIO.READ.');
      return;
    }
    const c = new AbortController();
    (async () => {
      try {
        await load(c.signal);
      } catch (e) {
        if (!c.signal.aborted) {
          setError(e instanceof Error ? e.message : 'No se pudo cargar el listado.');
        }
      }
    })();
    return () => c.abort();
  }, [canRead, load]);

  async function onCreate(ev: FormEvent) {
    ev.preventDefault();
    if (!canWrite) {
      return;
    }
    setActionError(null);
    if (newRoleIds.length === 0) {
      setActionError('Elija al menos un rol.');
      return;
    }
    setSaving(true);
    try {
      const u = await createUser({
        username: newUsername.trim(),
        fullName: newName.trim(),
        password: newPassword,
        roleIds: newRoleIds,
      });
      setRows((prev) => (prev ? [...prev, u].sort((a, b) => a.username.localeCompare(b.username)) : [u]));
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      setNewRoleIds([]);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Error al crear.');
    } finally {
      setSaving(false);
    }
  }

  async function onSaveEdit(ev: FormEvent) {
    ev.preventDefault();
    if (!editing || !canWrite) {
      return;
    }
    setActionError(null);
    if (editing.roleIds.length === 0) {
      setActionError('Elija al menos un rol.');
      return;
    }
    setSaving(true);
    try {
      const u = await updateUser(editing.id, {
        fullName: editing.fullName.trim(),
        isActive: editing.isActive,
        roleIds: editing.roleIds,
      });
      setRows((prev) => (prev ? prev.map((x) => (x.id === u.id ? u : x)) : [u]));
      setEditing(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function onSetPassword(ev: FormEvent) {
    ev.preventDefault();
    if (pwdId == null || !canWrite) {
      return;
    }
    setActionError(null);
    setSaving(true);
    try {
      await setUserPassword(pwdId, { newPassword: pwdText });
      setPwdId(null);
      setPwdText('');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Error al cambiar clave.');
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) {
    return (
      <div className="pro-card" style={{ maxWidth: 560 }}>
        <h1 className="pro-hero__title" style={{ margin: 0, fontSize: 20 }}>
          Usuarios
        </h1>
        <p className="pro-muted" style={{ margin: '8px 0 0' }}>
          No cuentas con el permiso USUARIO.READ para abrir este modulo.
        </p>
      </div>
    );
  }

  if (error && !rows) {
    return (
      <div className="pro-card" style={{ maxWidth: 640 }}>
        <h1 className="pro-hero__title" style={{ margin: 0, fontSize: 20 }}>
          Usuarios
        </h1>
        <p className="pro-muted" style={{ margin: '8px 0 0' }}>
          {error}
        </p>
        <p className="pro-muted" style={{ margin: '12px 0 0', fontSize: 14 }}>
          Si el mensaje indica permiso o token, cierra sesion e inicia otra vez. Tras agregar
          <strong> USUARIO.WRITE</strong> en el servidor, vuelve a entrar.
        </p>
        <p style={{ margin: '16px 0 0' }}>
          <button
            type="button"
            className="pro-ghost is-small pro-ghost--noblock"
            onClick={async () => {
              await logout();
              void navigate('/login', { replace: true });
            }}
            style={{ marginRight: 10 }}
          >
            Cerrar sesion
          </button>
        </p>
      </div>
    );
  }

  if (!rows || !roleCatalog) {
    return (
      <div className="pro-card" style={{ maxWidth: 640 }}>
        <p className="pro-muted" style={{ margin: 0 }}>
          Cargando usuarios
        </p>
        <div className="pro-shimmer" style={{ height: 8, marginTop: 10, maxWidth: 200 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="pro-hero" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
        <div>
          <h1 className="pro-hero__title">Usuarios y accesos</h1>
          <p className="pro-hero__desc" style={{ maxWidth: 600 }}>
            Los permisos se aplican en el <strong>siguiente inicio de sesion</strong>. Gestionar usuarios
            requiere <strong>USUARIO.WRITE</strong> (p. ej. rol admin tras actualizar la base).
          </p>
          <CrossModuleLinks
            marginTop={10}
            items={[
              { to: '/', label: 'Panel e inicio', show: true },
              { to: '/admin/empresa-caja', label: 'Política de caja', show: hasPermission('EMPRESA.CONFIG') },
              { to: '/admin/formas-pago', label: 'Formas de pago', show: hasPermission('EMPRESA.CONFIG') },
              { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
            ]}
          />
        </div>
      </div>
      {actionError ? <p className="pro-alert">{actionError}</p> : null}
      {canWrite ? (
        <form
          onSubmit={onCreate}
          className="pro-card"
          style={{ maxWidth: 700, marginBottom: 12 }}
        >
          <h2 className="pro-h3" style={{ margin: '0 0 6px' }}>
            Nuevo usuario
          </h2>
          <p className="pro-muted" style={{ margin: '0 0 8px', fontSize: 13 }}>Clave minimo 6 caracteres.</p>
          <div className="pro-toolbar__row" style={{ flexWrap: 'wrap' }}>
            <div className="pro-field" style={{ minWidth: 140 }}>
              <label>Usuario (login)</label>
              <input
                className="pro-input"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="pro-field" style={{ minWidth: 200, flex: 1 }}>
              <label>Nombre completo</label>
              <input
                className="pro-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="pro-field" style={{ minWidth: 140 }}>
              <label>Clave inicial</label>
              <input
                className="pro-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>
          <p style={{ margin: '8px 0 2px', fontSize: 13, fontWeight: 600 }}>Roles</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {roleCatalog.map((r) => (
              <label key={r.id} className="pro-inline" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={newRoleIds.includes(r.id)}
                  onChange={() => setNewRoleIds((s) => toggleRoleInIds(s, r.id))}
                />
                <span>
                  {r.name} <span className="pro-muted">({r.code})</span>
                </span>
              </label>
            ))}
          </div>
          <p style={{ marginTop: 10 }}>
            <button className="pro-button" type="submit" disabled={saving}>
              {saving ? 'Guardando' : 'Crear usuario'}
            </button>
          </p>
        </form>
      ) : null}
      <div className="pro-card" style={{ padding: 0, overflow: 'auto', maxWidth: 1000, marginBottom: 12 }}>
        <table
          className="pro-table"
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}
        >
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--pro-border)' }}>
              <th style={{ padding: '10px 14px' }}>Usuario</th>
              <th style={{ padding: '10px 14px' }}>Nombre</th>
              <th style={{ padding: '10px 14px' }}>Activo</th>
              <th style={{ padding: '10px 14px' }}>Roles</th>
              {canWrite ? <th style={{ padding: '10px 14px' }}>Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--pro-border)' }}>
                <td style={{ padding: '10px 14px' }}>{u.username}</td>
                <td style={{ padding: '10px 14px' }}>{u.fullName}</td>
                <td style={{ padding: '10px 14px' }}>{u.isActive ? 'Si' : 'No'}</td>
                <td style={{ padding: '10px 14px' }}>{(u.roleCodes ?? []).join(', ') || '—'}</td>
                {canWrite ? (
                  <td style={{ padding: '10px 14px' }} className="is-mono">
                    <button
                      type="button"
                      className="pro-ghost is-small pro-ghost--noblock"
                      onClick={() => {
                        setEditing({ ...u });
                        setActionError(null);
                        setPwdId(null);
                        setPwdText('');
                      }}
                    >
                      Editar
                    </button>
                    {me?.userId !== u.id ? (
                      <button
                        type="button"
                        className="pro-ghost is-small pro-ghost--noblock"
                        onClick={() => {
                          setPwdId(u.id);
                          setActionError(null);
                        }}
                        style={{ marginLeft: 8 }}
                      >
                        Clave
                      </button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && canWrite ? (
        <div className="pro-card" style={{ maxWidth: 640, marginTop: 12 }} role="dialog" aria-label="Editar usuario">
          <h2 className="pro-h3" style={{ margin: '0 0 6px' }}>
            Editar {editing.username}
          </h2>
          <form onSubmit={onSaveEdit}>
            <div className="pro-field">
              <label>Nombre completo</label>
              <input
                className="pro-input"
                value={editing.fullName}
                onChange={(e) => setEditing((x) => (x ? { ...x, fullName: e.target.value } : x))}
                required
              />
            </div>
            {me?.userId === editing.id ? null : (
              <div className="pro-field">
                <label className="pro-inline">
                  <input
                    type="checkbox"
                    checked={editing.isActive}
                    onChange={(e) => setEditing((x) => (x ? { ...x, isActive: e.target.checked } : x))}
                  />
                  <span>Usuario activo</span>
                </label>
              </div>
            )}
            <p style={{ margin: '8px 0 2px', fontSize: 13, fontWeight: 600 }}>Roles</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              {roleCatalog.map((r) => (
                <label key={r.id} className="pro-inline" style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={editing.roleIds.includes(r.id)}
                    onChange={() =>
                      setEditing((x) => {
                        if (!x) {
                          return x;
                        }
                        return { ...x, roleIds: toggleRoleInIds(x.roleIds, r.id) };
                      })
                    }
                  />
                  <span>
                    {r.name} <span className="pro-muted">({r.code})</span>
                  </span>
                </label>
              ))}
            </div>
            <button className="pro-button" type="submit" disabled={saving} style={{ marginRight: 8 }}>
              {saving ? 'Guardando' : 'Guardar'}
            </button>
            <button
              className="pro-ghost is-small pro-ghost--noblock"
              type="button"
              onClick={() => setEditing(null)}
            >
              Cerrar
            </button>
          </form>
        </div>
      ) : null}
      {pwdId != null && canWrite ? (
        <form className="pro-card" onSubmit={onSetPassword} style={{ maxWidth: 420, marginTop: 12 }}>
          <h2 className="pro-h3" style={{ margin: '0 0 6px' }}>Cambiar clave</h2>
          <div className="pro-field">
            <label>Nueva clave (min. 6)</label>
            <input
              className="pro-input"
              type="password"
              value={pwdText}
              onChange={(e) => setPwdText(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <p style={{ marginTop: 8 }}>
            <button className="pro-button" type="submit" disabled={saving}>
              Guardar
            </button>
            <button
              className="pro-ghost is-small pro-ghost--noblock"
              type="button"
              onClick={() => {
                setPwdId(null);
                setPwdText('');
              }}
              style={{ marginLeft: 8 }}
            >
              Cancelar
            </button>
          </p>
        </form>
      ) : null}
    </div>
  );
}
