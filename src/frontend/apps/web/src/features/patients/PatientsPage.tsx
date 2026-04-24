import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { createPatient, fetchPatients, updatePatient } from './patients.api';
import type { PatientListItem } from './patients.types';

export function PatientsPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const canWrite = hasPermission('PACIENTE.WRITE');
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PatientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PatientListItem | null>(null);
  const [reload, setReload] = useState(0);

  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setPage(1);
  }, [search, includeInactive]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchPatients(search, includeInactive, page);
        if (!cancelled) {
          setRows(res.items);
          setTotal(res.totalCount);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [includeInactive, page, search, reload]);

  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (editing) {
      setFullName(editing.fullName);
      setNationalId(editing.nationalId ?? '');
      setPhone(editing.phone ?? '');
      setIsActive(editing.isActive);
    } else {
      setFullName('');
      setNationalId('');
      setPhone('');
      setIsActive(true);
    }
  }, [editing]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) {
      return;
    }
    setError(null);
    try {
      await createPatient({ fullName, nationalId, phone });
      setFullName('');
      setNationalId('');
      setPhone('');
      setPage(1);
      setReload((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !canWrite) {
      return;
    }
    setError(null);
    try {
      const u = await updatePatient(editing.id, {
        fullName,
        nationalId,
        phone,
        isActive,
      });
      setRows((prev) => prev.map((r) => (r.id === u.id ? buildRowFrom(u, u.isActive) : r)));
      setEditing(null);
      setReload((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <div className="pro-hero">
        <div>
          <h1 className="pro-hero__title">Pacientes</h1>
          <p className="pro-hero__desc">Gestion de pacientes por empresa, con busqueda e historizacion de datos.</p>
          <CrossModuleLinks
            marginTop={10}
            items={[
              { to: '/lab-exams', label: 'Catalogo de examenes', show: hasPermission('EXAMEN.READ') },
              { to: '/orders', label: 'Nueva orden', show: hasPermission('ORDEN.CREATE') },
              { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
              { to: '/lab/resultados', label: 'Resultados', show: hasPermission('RESULTADOS.VALIDAR') },
              { to: '/caja/cierre', label: 'Caja', show: hasPermission('CAJA.CERRAR') },
              { to: '/sar', label: 'Cumplimiento SAR', show: hasPermission('FISCAL.READ') },
            ]}
          />
        </div>
        <div className="pro-toolbar__group" />
      </div>

      <div className="pro-toolbar" aria-label="Filtros de pacientes">
        <div className="pro-toolbar__row">
          <div className="pro-field" style={{ flex: 1 }}>
            <label>Busqueda</label>
            <input
              className="pro-input"
              placeholder="Nombre, identidad o telefono"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="pro-field" style={{ width: 220, alignItems: 'flex-start' }}>
            <label className="pro-inline">
              <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
              <span>Mostrar inactivos</span>
            </label>
          </div>
        </div>
      </div>

      {error && <p className="pro-alert">{error}</p>}

      <div className="pro-panels" aria-label="Crear o editar paciente">
        {canWrite && (
          <form className="pro-card" onSubmit={editing ? onUpdate : onCreate} aria-label={editing ? 'Formulario de edicion' : 'Nuevo paciente'}>
            <h3 className="pro-h3">{editing ? 'Editar paciente' : 'Nuevo paciente'}</h3>
            <div className="pro-grid-3">
              <div className="pro-field full-width">
                <label>Nombre completo</label>
                <input className="pro-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="pro-field full-width">
                <label>Identidad</label>
                <input className="pro-input" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
              </div>
              <div className="pro-field full-width">
                <label>Telefono</label>
                <input className="pro-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              {editing && (
                <div className="pro-field full-width" style={{ alignSelf: 'end' }}>
                  <label className="pro-inline">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    <span>Activo</span>
                  </label>
                </div>
              )}
            </div>
            <div className="pro-form-actions">
              {editing && (
                <button
                  className="pro-ghost"
                  type="button"
                  onClick={() => {
                    setEditing(null);
                  }}
                >
                  Cancelar
                </button>
              )}
              <button className="pro-button" type="submit">
                {editing ? 'Guardar' : 'Registrar'}
              </button>
            </div>
          </form>
        )}

        <div className="pro-card" aria-label="Listado de pacientes">
          <h3 className="pro-h3" style={{ margin: 0, marginBottom: 12 }}>
            Listado
            {total > 0 ? <span className="pro-pill">Total {total}</span> : null}
            {isLoading && <span className="pro-muted" style={{ marginLeft: 10 }}>Cargando</span>}
          </h3>
          <div className="pro-tablewrap">
            <table className="pro-table" aria-label="Tabla de pacientes">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Identidad</th>
                  <th>Telefono</th>
                    <th>Estado</th>
                    {canWrite && <th></th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={canWrite ? 5 : 4} className="pro-empty">
                      Sin resultados todavia. Ajusta los filtros o agrega un paciente.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className={!r.isActive && includeInactive ? 'is-muted' : undefined}>
                    <td>{r.fullName}</td>
                    <td>{r.nationalId || '—'}</td>
                    <td>{r.phone || '—'}</td>
                    <td>
                      {r.isActive ? <span className="pro-pill is-green">Activo</span> : <span className="pro-pill is-gray">Inactivo</span>}
                    </td>
                    {canWrite && (
                      <td className="is-right">
                        <button
                          className="pro-ghost is-small"
                          type="button"
                          onClick={() => {
                            setEditing(r);
                          }}
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 0 && total > 20 && (
            <div className="pro-pagination" aria-label="Paginacion">
              <button className="pro-ghost" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Anterior
              </button>
              <div className="pro-muted" style={{ padding: '0 10px' }}>
                Pagina {page} de {Math.max(1, Math.ceil(total / 20))}
              </div>
              <button
                className="pro-ghost"
                type="button"
                onClick={() => {
                  if (rows.length < 20) {
                    return;
                  }
                  setPage((p) => p + 1);
                }}
                disabled={rows.length < 20}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildRowFrom(
  u: {
    id: number;
    fullName: string;
    nationalId: string | null;
    phone: string | null;
    isActive: boolean;
    registeredAtUtc: string;
  },
  isActive: boolean
): PatientListItem {
  return {
    id: u.id,
    fullName: u.fullName,
    nationalId: u.nationalId,
    phone: u.phone,
    isActive,
    registeredAtUtc: u.registeredAtUtc,
  };
}
