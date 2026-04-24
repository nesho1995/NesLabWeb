import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { createSample, fetchSamples, updateSample } from './samples.api';
import type { SampleListItem } from './samples.types';

const pageSize = 20;
const tzHn = 'America/Tegucigalpa';

function parseServerDateAsUtc(value: string): Date {
  const raw = value.trim();
  if (!raw) {
    return new Date(Number.NaN);
  }
  const hasExplicitZone = /([zZ]|[+\-]\d{2}:\d{2})$/.test(raw);
  return new Date(hasExplicitZone ? raw : `${raw}Z`);
}

function dateTimeHn(iso: string | null | undefined) {
  if (!iso) {
    return '—';
  }
  const parsed = parseServerDateAsUtc(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString('es-HN', {
    timeZone: tzHn,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function SamplesPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [onlyPending, setOnlyPending] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SampleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ver, setVer] = useState(0);
  const [orderId, setOrderId] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SampleListItem | null>(null);
  const [draftNotes, setDraftNotes] = useState('');

  useEffect(() => {
    setPage(1);
  }, [search, onlyPending, fromDate, toDate]);

  useEffect(() => {
    let ok = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetchSamples(search, onlyPending, fromDate, toDate, page, pageSize);
        if (ok) {
          setRows(r.items);
          setTotal(r.totalCount);
        }
      } catch (e) {
        if (ok) {
          setError((e as Error).message);
        }
      } finally {
        if (ok) {
          setLoading(false);
        }
      }
    })();
    return () => {
      ok = false;
    };
  }, [search, onlyPending, fromDate, toDate, page, ver]);

  useEffect(() => {
    if (editing) {
      setDraftNotes(editing.notes ?? '');
    }
  }, [editing]);

  async function onRegister() {
    const o = orderId.trim();
    if (!o) {
      setError('Ingresa el id interno de la orden.');
      return;
    }
    const n = parseInt(o, 10);
    if (Number.isNaN(n) || n < 1) {
      setError('Id de orden invalido.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const note = orderNote.trim();
      await createSample(n, note ? note : undefined);
      setOrderId('');
      setOrderNote('');
      setPage(1);
      setVer((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="samples-mobile">
      <div className="pro-hero" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
        <div>
          <h1 className="pro-hero__title">Muestras y etiquetado</h1>
          <p className="pro-hero__desc" style={{ maxWidth: 640 }}>
            Cada toma de muestra vinculada a una <strong>orden de laboratorio</strong> genera un
            <strong> codigo unico</strong> (etiqueta / trazabilidad). Marca toma al recibir tubo o sangre. Siguiente
            paso en el producto: plantillas de impresion y vincular lineas concretas.
          </p>
          <CrossModuleLinks
            marginTop={10}
            items={[
              { to: '/lab/resultados', label: 'Resultados', show: hasPermission('RESULTADOS.VALIDAR') },
              { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
              { to: '/caja/cierre', label: 'Caja', show: hasPermission('CAJA.CERRAR') },
              { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
              { to: '/orders', label: 'Nueva orden', show: hasPermission('ORDEN.CREATE') },
            ]}
          />
          <CrossModuleLinks
            marginTop={8}
            items={[
              { to: '/admin/empresa-caja', label: 'Política de caja', show: hasPermission('EMPRESA.CONFIG') },
              { to: '/admin/formas-pago', label: 'Formas de pago', show: hasPermission('EMPRESA.CONFIG') },
            ]}
          />
        </div>
      </div>

      <div className="pro-card samples-mobile__register" style={{ marginBottom: 12 }}>
        <h3 className="pro-h3" style={{ margin: '0 0 10px' }}>
          Registrar muestra
        </h3>
        <p className="pro-hint" style={{ margin: '0 0 10px' }}>
          Usa el id interno de la orden (el de la factura: puedes abrir comprobante desde caja; el id aparece en la
          ruta o en listados futuros de ordenes).
        </p>
        <div className="pro-toolbar__row samples-mobile__row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="pro-field samples-mobile__order-id" style={{ width: 200 }}>
            <label>Id de orden (interno)</label>
            <input
              className="pro-input"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="p. ej. 12"
            />
          </div>
          <div className="pro-field samples-mobile__order-note" style={{ flex: 1, minWidth: 220 }}>
            <label>Nota (ayunas, contenedor, prioridad...)</label>
            <input
              className="pro-input"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              maxLength={2000}
              placeholder="Opcional"
            />
          </div>
          <div className="pro-field samples-mobile__submit" style={{ alignSelf: 'flex-end' }}>
            <button
              className="pro-button"
              type="button"
              onClick={() => void onRegister()}
              disabled={saving}
            >
              Generar codigo
            </button>
          </div>
        </div>
      </div>

      <div className="pro-toolbar samples-mobile__filters" style={{ marginBottom: 8 }}>
        <div className="pro-toolbar__row samples-mobile__row" style={{ alignItems: 'flex-end' }}>
          <div className="pro-field" style={{ flex: 1, minWidth: 200 }}>
            <label>Buscar</label>
            <input
              className="pro-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Codigo, orden, comprobante, paciente"
            />
          </div>
          <div className="pro-field samples-mobile__pending" style={{ width: 200 }}>
            <label className="pro-inline">
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(e) => setOnlyPending(e.target.checked)}
              />
              <span>Sin registro de toma</span>
            </label>
          </div>
          <div className="pro-field samples-mobile__pending" style={{ width: 180 }}>
            <label>Desde</label>
            <input
              type="date"
              className="pro-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="pro-field samples-mobile__pending" style={{ width: 180 }}>
            <label>Hasta</label>
            <input
              type="date"
              className="pro-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="pro-alert">{error}</p>}

      <div className="pro-card samples-mobile__tablecard" style={{ padding: 0, overflow: 'auto' }}>
        {loading && <p className="pro-muted" style={{ margin: 16 }}>Cargando</p>}
        {!loading && (
          <table className="pro-table samples-mobile__table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Orden / paciente</th>
                <th>Nota</th>
                <th>Toma</th>
                <th style={{ width: 200 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="pro-empty" style={{ padding: 20 }}>
                    Aun no hay muestras registradas con este criterio.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="is-mono" style={{ fontSize: 13, fontWeight: 700 }}>
                      {r.code}
                    </span>
                  </td>
                  <td>
                    <div>
                      {r.invoiceNumber && (
                        <span className="is-mono" style={{ fontSize: 12 }}>{r.invoiceNumber}</span>
                      )}{' '}
                      <span className="pro-muted" style={{ fontSize: 12 }}>
                        #{r.orderId}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, marginTop: 2 }}>{r.patientName}</div>
                    <div className="pro-muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {dateTimeHn(r.orderAtUtc)}
                    </div>
                  </td>
                  <td style={{ maxWidth: 240, fontSize: 13, wordBreak: 'break-word' }}>{r.notes ?? '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {r.collectedAtUtc ? (
                      <>
                        <span className="pro-pill is-green">Registrada</span>
                        <div className="pro-muted" style={{ marginTop: 4, fontSize: 11 }}>
                          {dateTimeHn(r.collectedAtUtc)}
                        </div>
                      </>
                    ) : (
                      <span
                        className="pro-pill"
                        style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}
                      >
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td>
                    {editing?.id === r.id ? (
                      <div style={{ display: 'grid', gap: 6, maxWidth: 200 }}>
                        <textarea
                          className="pro-input"
                          rows={2}
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          style={{ minHeight: 40, fontSize: 12, resize: 'vertical' }}
                        />
                        <button
                          className="pro-ghost is-small"
                          type="button"
                          onClick={() => setEditing(null)}
                        >
                          Cerrar
                        </button>
                        <button
                          className="pro-ghost is-small"
                          type="button"
                          onClick={async () => {
                            setSaving(true);
                            setError(null);
                            try {
                              await updateSample(r.id, { notes: draftNotes });
                              setEditing(null);
                              setVer((v) => v + 1);
                            } catch (e) {
                              setError((e as Error).message);
                            } finally {
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                        >
                          Guardar nota
                        </button>
                        {r.collectedAtUtc == null && (
                          <button
                            className="pro-button"
                            type="button"
                            style={{ minWidth: 0, height: 32, fontSize: 12 }}
                            onClick={async () => {
                              setSaving(true);
                              setError(null);
                              try {
                                await updateSample(r.id, { markCollected: true });
                                setEditing(null);
                                setVer((v) => v + 1);
                              } catch (e) {
                                setError((e as Error).message);
                              } finally {
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                          >
                            Marcar toma
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        className="pro-ghost is-small"
                        type="button"
                        onClick={() => setEditing(r)}
                      >
                        Gestionar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > pageSize && (
          <div className="pro-pagination" style={{ padding: 8 }}>
            <button
              className="pro-ghost"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </button>
            <span className="pro-muted" style={{ fontSize: 12 }}>
              Pag. {page} de {maxPage} ({total})
            </span>
            <button
              className="pro-ghost"
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= maxPage}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
