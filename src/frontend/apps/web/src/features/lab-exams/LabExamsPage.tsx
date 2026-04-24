import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { createExam, fetchExamById, fetchExams, updateExam } from './labExams.api';
import type { ExamParameterDraft, LabExamListItem, ResultFormat } from './labExams.types';

const PARAMETER_TEMPLATES: { key: string; label: string; rows: ExamParameterDraft[] }[] = [
  {
    key: 'hemograma',
    label: 'Hemograma básico',
    rows: [
      { name: 'Hemoglobina', sortOrder: 1, unit: 'g/dL', referenceText: '12-16', isActive: true },
      { name: 'Hematocrito', sortOrder: 2, unit: '%', referenceText: '36-46', isActive: true },
      { name: 'Leucocitos', sortOrder: 3, unit: '10^3/uL', referenceText: '4.0-10.5', isActive: true },
      { name: 'Plaquetas', sortOrder: 4, unit: '10^3/uL', referenceText: '150-450', isActive: true },
    ],
  },
  {
    key: 'bioquimica',
    label: 'Perfil bioquímico',
    rows: [
      { name: 'Glucosa', sortOrder: 1, unit: 'mg/dL', referenceText: '70-110', isActive: true },
      { name: 'Urea', sortOrder: 2, unit: 'mg/dL', referenceText: '15-45', isActive: true },
      { name: 'Creatinina', sortOrder: 3, unit: 'mg/dL', referenceText: '0.6-1.3', isActive: true },
      { name: 'Ácido úrico', sortOrder: 4, unit: 'mg/dL', referenceText: '3.5-7.2', isActive: true },
    ],
  },
  {
    key: 'orina',
    label: 'EGO / orina',
    rows: [
      { name: 'Color', sortOrder: 1, unit: '', referenceText: 'Amarillo', isActive: true },
      { name: 'Aspecto', sortOrder: 2, unit: '', referenceText: 'Claro', isActive: true },
      { name: 'Densidad', sortOrder: 3, unit: '', referenceText: '1.005-1.030', isActive: true },
      { name: 'pH', sortOrder: 4, unit: '', referenceText: '5.0-8.0', isActive: true },
    ],
  },
];

export function LabExamsPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const canWrite = hasPermission('EMPRESA.CONFIG');
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LabExamListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<LabExamListItem | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    setPage(1);
  }, [search, includeInactive]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchExams(search, includeInactive, page);
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

  useEffect(() => {
    if (!editing) {
      setCode('');
      setName('');
      setPrice('');
    } else {
      setCode(editing.code);
      setName(editing.name);
      setPrice(String(editing.price));
    }
  }, [editing]);

  const [isActive, setIsActive] = useState(true);
  const [resultFormat, setResultFormat] = useState<ResultFormat>('texto');
  const [paramRows, setParamRows] = useState<ExamParameterDraft[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  useEffect(() => {
    if (editing) {
      setIsActive(editing.isActive);
    } else {
      setIsActive(true);
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      setResultFormat('texto');
      setParamRows([]);
      return;
    }
    let stop = false;
    setLoadingDetail(true);
    void (async () => {
      try {
        const d = await fetchExamById(editing.id);
        if (stop) {
          return;
        }
        setResultFormat(d.resultFormat === 'panel' ? 'panel' : 'texto');
        setParamRows(
          d.parameters
            .filter((p) => p.isActive)
            .map((p) => ({
              name: p.name,
              sortOrder: p.sortOrder,
              unit: p.unit ?? '',
              referenceText: p.referenceText ?? '',
              isActive: p.isActive,
            }))
        );
        setCode(d.code);
        setName(d.name);
        setPrice(String(d.price));
        setIsActive(d.isActive);
      } catch {
        /* deja el nombre/precio del renglon list */
      } finally {
        if (!stop) {
          setLoadingDetail(false);
        }
      }
    })();
    return () => {
      stop = true;
    };
  }, [editing]);

  function buildParametersPayload() {
    if (resultFormat === 'texto') {
      return null;
    }
    return paramRows
      .map((r, i) => ({
        name: r.name.trim(),
        sortOrder: r.sortOrder > 0 ? r.sortOrder : i + 1,
        unit: r.unit.trim() || null,
        referenceText: r.referenceText.trim() || null,
        isActive: r.isActive,
      }))
      .filter((x) => x.name.length > 0);
  }

  function addParamRow() {
    setParamRows((prev) => [
      ...prev,
      { name: '', sortOrder: prev.length + 1, unit: '', referenceText: '', isActive: true },
    ]);
  }

  function removeParamRow(i: number) {
    setParamRows((prev) => prev.filter((_, j) => j !== i));
  }

  function applyTemplate(key: string) {
    const tpl = PARAMETER_TEMPLATES.find((x) => x.key === key);
    if (!tpl) {
      return;
    }
    setResultFormat('panel');
    setParamRows(tpl.rows.map((r) => ({ ...r })));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) {
      return;
    }
    setError(null);
    const p = parseDecimal(price);
    if (p === null) {
      setError('Precio invalido.');
      return;
    }
    const forPanel = buildParametersPayload();
    if (resultFormat === 'panel' && (forPanel?.length ?? 0) === 0) {
      setError('Con formato panel agregue al menos un parametro (nombre del dato a capturar).');
      return;
    }
    try {
      await createExam({
        code,
        name,
        price: p,
        resultFormat,
        parameters: resultFormat === 'texto' ? null : (forPanel ?? null),
      });
      setCode('');
      setName('');
      setPrice('');
      setParamRows([]);
      setResultFormat('texto');
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
    const p = parseDecimal(price);
    if (p === null) {
      setError('Precio invalido.');
      return;
    }
    const forPanel2 = buildParametersPayload();
    if (resultFormat === 'panel' && (forPanel2?.length ?? 0) === 0) {
      setError('Con formato panel debe haber al menos un parametro.');
      return;
    }
    try {
      const u = await updateExam(editing.id, {
        code,
        name,
        price: p,
        isActive,
        resultFormat,
        parameters: resultFormat === 'texto' ? null : (forPanel2 ?? null),
      });
      setRows((prev) => prev.map((r) => (r.id === u.id ? toRow(u) : r)));
      setEditing(null);
      setReload((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="pro-page">
      <div className="pro-hero">
        <div>
          <h1 className="pro-hero__title">Catálogo de exámenes</h1>
          <p className="pro-hero__desc">Mantenimiento de exámenes, códigos y precios por laboratorio (multi-empresa).</p>
          <CrossModuleLinks
            marginTop={10}
            items={[
              { to: '/patients', label: 'Pacientes', show: hasPermission('PACIENTE.READ') },
              { to: '/orders', label: 'Nueva orden', show: hasPermission('ORDEN.CREATE') },
              { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
              { to: '/lab/resultados', label: 'Resultados', show: hasPermission('RESULTADOS.VALIDAR') },
              { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
              { to: '/caja/cierre', label: 'Caja', show: hasPermission('CAJA.CERRAR') },
              { to: '/sar', label: 'Cumplimiento SAR', show: hasPermission('FISCAL.READ') },
            ]}
          />
        </div>
      </div>

      <div className="pro-toolbar" aria-label="Filtros de examenes">
        <div className="pro-toolbar__row">
          <div className="pro-field">
            <label>Búsqueda</label>
            <input
              className="pro-input"
              placeholder="Código o nombre de examen"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="pro-field" style={{ flex: '0 0 auto' }}>
            <label className="pro-inline" style={{ marginBottom: 0 }}>
              <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
              <span>Mostrar inactivos</span>
            </label>
          </div>
        </div>
      </div>

      {error && <p className="pro-alert">{error}</p>}

      {canWrite && (
        <div className="pro-panels" aria-label="Crear o editar examen">
          <form className="pro-card" onSubmit={editing ? onUpdate : onCreate} aria-label={editing ? 'Formulario de edicion' : 'Nuevo examen'}>
            <h3 className="pro-h3">{editing ? 'Editar examen' : 'Nuevo examen'}</h3>
            <div className="pro-hint" style={{ margin: '0 0 0.75rem' }}>
              Si dejas el codigo en blanco, se genera uno unico de forma automatica.
            </div>
            <div className="pro-grid-3">
              <div className="pro-field full-width">
                <label>Codigo interno</label>
                <input className="pro-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: HEM" />
              </div>
              <div className="pro-field full-width">
                <label>Nombre</label>
                <input className="pro-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="pro-field full-width">
                <label>Precio</label>
                <input className="pro-input" value={price} onChange={(e) => setPrice(e.target.value)} required />
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
            <div className="pro-field full-width" style={{ marginTop: 4 }}>
              <span className="pro-hint" style={{ display: 'block', marginBottom: 6 }}>
                Formato al cargar resultados
              </span>
              <div className="pro-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="pro-inline">
                  <input
                    type="radio"
                    name="resFmt"
                    checked={resultFormat === 'texto'}
                    onChange={() => {
                      setResultFormat('texto');
                      setParamRows([]);
                    }}
                  />
                  <span>Texto libre (un solo recuadro al registrar resultado)</span>
                </label>
                <label className="pro-inline">
                  <input
                    type="radio"
                    name="resFmt"
                    checked={resultFormat === 'panel'}
                    onChange={() => {
                      setResultFormat('panel');
                      setParamRows((p) => (p.length > 0 ? p : [{ name: '', sortOrder: 1, unit: '', referenceText: '', isActive: true }]));
                    }}
                  />
                  <span>Panel: varias filas con nombre, unidad y ref. (hemograma, perfiles, etc.)</span>
                </label>
              </div>
            </div>
            {editing && loadingDetail && <p className="pro-muted">Cargando formato del examen…</p>}
            {resultFormat === 'panel' && (
              <div className="pro-field full-width" style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Parametros a llenar</span>
                  <button type="button" className="pro-ghost is-small" onClick={addParamRow}>
                    + Agregar fila
                  </button>
                </div>
                <p className="pro-hint" style={{ margin: '0 0 0.5rem' }}>
                  El <strong>nombre</strong> es el que se usa al guardar. Unidad y referencia son guia para el laboratorista.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {PARAMETER_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.key}
                      type="button"
                      className="pro-ghost is-small"
                      onClick={() => applyTemplate(tpl.key)}
                      title="Carga estructura estándar editable"
                    >
                      Usar plantilla: {tpl.label}
                    </button>
                  ))}
                </div>
                {paramRows.map((row, i) => (
                  <div
                    key={`pr-${i}-${row.sortOrder}`}
                    className="pro-panels pro-panels--grid-2"
                    style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 6 }}
                  >
                    <div className="pro-field full-width">
                      <label>Parametro</label>
                      <input
                        className="pro-input"
                        value={row.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setParamRows((p) => p.map((q, j) => (j === i ? { ...q, name: v } : q)));
                        }}
                        placeholder="Hemoglobina"
                      />
                    </div>
                    <div className="pro-field">
                      <label>Orden</label>
                      <input
                        className="pro-input"
                        type="number"
                        value={row.sortOrder}
                        min={1}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setParamRows((p) =>
                            p.map((q, j) => (j === i ? { ...q, sortOrder: Number.isNaN(n) ? 1 : n } : q))
                          );
                        }}
                      />
                    </div>
                    <div className="pro-field">
                      <label>Unidad</label>
                      <input
                        className="pro-input"
                        value={row.unit}
                        onChange={(e) => {
                          const v = e.target.value;
                          setParamRows((p) => p.map((q, j) => (j === i ? { ...q, unit: v } : q)));
                        }}
                        placeholder="g/dL"
                      />
                    </div>
                    <div className="pro-field full-width">
                      <label>Referencia</label>
                      <input
                        className="pro-input"
                        value={row.referenceText}
                        onChange={(e) => {
                          const v = e.target.value;
                          setParamRows((p) => p.map((q, j) => (j === i ? { ...q, referenceText: v } : q)));
                        }}
                        placeholder="12-16"
                      />
                    </div>
                    <div>
                      <button type="button" className="pro-ghost is-small" onClick={() => removeParamRow(i)}>
                        Quitar fila
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        </div>
      )}
      {!canWrite && (
        <div className="pro-card">
          <p className="pro-muted" style={{ margin: 0 }}>
            Esta vista es solo de consulta. La configuración del catálogo (crear, editar, importar o limpiar)
            está en <strong>Administración &gt; Catálogo de exámenes</strong>.
          </p>
        </div>
      )}

      <div className="pro-card" aria-label="Listado de examenes">
          <h3 className="pro-h3" style={{ margin: 0, marginBottom: 12 }}>
            Listado
            {total > 0 && <span className="pro-pill">Total {total}</span>}
            {isLoading && <span className="pro-muted" style={{ marginLeft: 10 }}>Cargando</span>}
          </h3>
          <div className="pro-tablewrap">
            <table className="pro-table" aria-label="Tabla de examenes">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Formato</th>
                  <th className="is-right">Precio</th>
                  <th>Estado</th>
                  {canWrite && <th></th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={canWrite ? 6 : 5} className="pro-empty">
                      No hay examenes listados. Ajusta filtros o carga un catalogo inicial.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className={!r.isActive && includeInactive ? 'is-muted' : undefined}>
                    <td className="is-mono">{r.code}</td>
                    <td>{r.name}</td>
                    <td>
                      {r.resultFormat === 'panel' ? (
                        <span className="pro-pill" style={{ background: '#eff6ff' }}>
                          Panel
                        </span>
                      ) : (
                        <span className="pro-pill" style={{ background: '#f1f5f9' }}>
                          Texto
                        </span>
                      )}
                    </td>
                    <td className="is-right is-mono">{r.price.toFixed(2)}</td>
                    <td>{r.isActive ? <span className="pro-pill is-green">Activo</span> : <span className="pro-pill is-gray">Inactivo</span>}</td>
                    {canWrite && (
                      <td className="is-right">
                        <button className="pro-ghost is-small" type="button" onClick={() => setEditing(r)}>
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 20 && (
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
  );
}

function parseDecimal(value: string): number | null {
  const t = value.trim().replace(',', '.');
  if (!t) {
    return null;
  }
  const n = Number.parseFloat(t);
  return Number.isNaN(n) ? null : n;
}

function toRow(u: { id: number; code: string; name: string; price: number; isActive: boolean; resultFormat?: string }): LabExamListItem {
  return {
    id: u.id,
    code: u.code,
    name: u.name,
    price: u.price,
    isActive: u.isActive,
    resultFormat: u.resultFormat === 'panel' ? 'panel' : 'texto',
  };
}