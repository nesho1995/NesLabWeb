import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { getFinanceSummary, getLabDashboard } from './labDashboard.api';
import type { FinanceSummary, LabDashboard } from './labDashboard.types';

function moneyHnl(n: number) {
  return n.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
}

function kpiLabel(code: string) {
  if (code === 'orders-today') {
    return 'Ordenes hoy (HN)';
  }
  if (code === 'revenue-today') {
    return 'Facturacion hoy (HN, total ordenes)';
  }
  if (code === 'orders-7d') {
    return 'Ordenes ult. 7 dias (UTC)';
  }
  if (code === 'lines') {
    return 'Lineas de examen sin validar';
  }
  if (code === 'samples-pend') {
    return 'Muestras sin toma (sin fecha)';
  }
  if (code === 'samples-today') {
    return 'Muestras registradas hoy (HN)';
  }
  return code;
}

export function LabReportesPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const canEmpresaConfig = hasPermission('EMPRESA.CONFIG');
  const [d, setD] = useState<LabDashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [load, setLoad] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(today);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [showEmptyDays, setShowEmptyDays] = useState(false);
  const [methodFilter, setMethodFilter] = useState('ALL');

  const fetchDash = useCallback(async () => {
    const r = await getLabDashboard();
    setD(r);
    setErr(null);
  }, []);

  useEffect(() => {
    let c = true;
    (async () => {
      try {
        setLoad(true);
        await fetchDash();
      } catch (e) {
        if (c) {
          setErr(e instanceof Error ? e.message : 'Error al cargar indicadores.');
        }
      } finally {
        if (c) {
          setLoad(false);
        }
      }
    })();
    return () => {
      c = false;
    };
  }, [fetchDash]);

  useEffect(() => {
    let c = true;
    (async () => {
      try {
        const f = await getFinanceSummary(fromDate, toDate);
        if (c) {
          setFinance(f);
        }
      } catch {
        if (c) {
          setFinance(null);
        }
      }
    })();
    return () => {
      c = false;
    };
  }, [fromDate, toDate]);

  const visibleDailyRows = useMemo(() => {
    if (!finance) return [];
    if (showEmptyDays) return finance.dailyRows;
    return finance.dailyRows.filter((d) =>
      d.ordersCount > 0 ||
      d.entradas !== 0 ||
      d.salidas !== 0 ||
      d.neto !== 0 ||
      d.cashExpected !== 0 ||
      d.cashDeclared !== 0 ||
      d.cashDifference !== 0
    );
  }, [finance, showEmptyDays]);

  const visibleByMethod = useMemo(() => {
    if (!finance) return [];
    if (methodFilter === 'ALL') return finance.byMethod;
    return finance.byMethod.filter((m) => m.method === methodFilter);
  }, [finance, methodFilter]);

  if (load) {
    return (
      <div className="pro-card" style={{ maxWidth: 720 }}>
        <p className="pro-muted" style={{ margin: 0 }}>Cargando indicadores…</p>
        <div className="pro-shimmer" style={{ height: 8, marginTop: 12, maxWidth: 240 }} />
      </div>
    );
  }
  if (err) {
    return (
      <div className="pro-card" style={{ maxWidth: 600, borderColor: 'rgba(220, 38, 38, 0.35)' }}>
        <h1 className="pro-hero__title" style={{ fontSize: 20, margin: 0 }}>No se pudo leer</h1>
        <p className="pro-muted" style={{ margin: '8px 0 0' }}>{err}</p>
      </div>
    );
  }
  if (!d) {
    return null;
  }

  const cards: { v: string | number; code: string; money?: boolean }[] = [
    { v: d.ordersTodayHn, code: 'orders-today' },
    { v: d.revenueTodayHn, code: 'revenue-today', money: true },
    { v: d.ordersLast7DaysUtc, code: 'orders-7d' },
    { v: d.orderLinesPendingValidation, code: 'lines' },
    { v: d.samplesPendingCollection, code: 'samples-pend' },
    { v: d.samplesRegisteredTodayHn, code: 'samples-today' },
  ];

  return (
    <div>
      <div
        className="pro-hero"
        style={{ marginBottom: 16, alignItems: 'flex-start', display: 'flex', gap: 12, flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1 }}>
          <h1 className="pro-hero__title" style={{ fontSize: 24 }}>Indicadores (empresa activa)</h1>
          <p className="pro-hero__desc" style={{ margin: 0 }}>
            Resumen operativo de la empresa activa. Los datos de hoy se calculan en horario de Honduras
            (Tegucigalpa) para que coincidan con la jornada del laboratorio.
          </p>
        </div>
        <button
          type="button"
          className="pro-ghost pro-ghost--noblock"
          onClick={() => {
            setLoad(true);
            void (async () => {
              try {
                await fetchDash();
                setErr(null);
              } catch (e) {
                setErr(e instanceof Error ? e.message : 'Error al actualizar.');
              } finally {
                setLoad(false);
              }
            })();
          }}
        >
          Actualizar
        </button>
      </div>
      <div
        className="pro-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          maxWidth: 900,
        }}
      >
        {cards.map((x) => (
          <div key={x.code} className="pro-card" style={{ minHeight: 88, padding: '12px 14px' }}>
            <p className="pro-kpi__label" style={{ margin: 0, fontSize: 12 }}>
              {kpiLabel(x.code)}
            </p>
            <p className="pro-kpi__value" style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800 }}>
              {x.money && typeof x.v === 'number' ? moneyHnl(x.v) : x.v}
            </p>
          </div>
        ))}
      </div>
      <div className="pro-card" style={{ maxWidth: 720, marginBottom: 12 }} aria-label="Accesos">
        <CrossModuleLinks
          heading="Navegacion del laboratorio"
          marginTop={0}
          items={[
            { to: '/lab/resultados', label: 'Resultados', show: hasPermission('RESULTADOS.VALIDAR') },
            { to: '/lab/muestras', label: 'Muestras', show: hasPermission('MUESTRA.GESTION') },
            { to: '/caja/cierre', label: 'Caja', show: hasPermission('CAJA.CERRAR') },
            { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
            { to: '/orders', label: 'Nueva orden', show: hasPermission('ORDEN.CREATE') },
          ]}
        />
        <CrossModuleLinks
          heading="Configuración empresa"
          marginTop={14}
          items={[
            { to: '/admin/empresa-caja', label: 'Política de caja', show: canEmpresaConfig },
            { to: '/admin/formas-pago', label: 'Formas de pago', show: canEmpresaConfig },
          ]}
        />
      </div>
      <div className="pro-card" style={{ maxWidth: 720, marginTop: 14 }} aria-label="Caja de turno">
        <h2 className="pro-h3" style={{ margin: '0 0 4px' }}>Caja</h2>
        {d.cashSessionOpen ? (
          <p className="pro-muted" style={{ margin: 0 }}>
            Caja <strong>abierta</strong>
            {d.cashSessionOpenedAtUtc ? (
              <span> desde {new Date(d.cashSessionOpenedAtUtc).toLocaleString('es-HN')}</span>
            ) : null}
            . Gestionar arqueo en Caja.
          </p>
        ) : (
          <p className="pro-muted" style={{ margin: 0 }}>No hay caja abierta.</p>
        )}
      </div>
      <div className="pro-card" style={{ maxWidth: 980, marginTop: 14 }} aria-label="Estado financiero">
        <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>Estado financiero (resumen)</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <label className="pro-muted" style={{ fontSize: 13 }}>
            Desde{' '}
            <input className="pro-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="pro-muted" style={{ fontSize: 13 }}>
            Hasta{' '}
            <input className="pro-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <label className="pro-muted" style={{ fontSize: 13 }}>
            Metodo{' '}
            <select className="pro-input" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
              <option value="ALL">Todos</option>
              {(finance?.byMethod ?? []).map((m) => (
                <option key={m.method} value={m.method}>
                  {m.method}
                </option>
              ))}
            </select>
          </label>
          <label className="pro-inline pro-muted" style={{ fontSize: 13 }}>
            <input type="checkbox" checked={showEmptyDays} onChange={(e) => setShowEmptyDays(e.target.checked)} />
            Mostrar dias sin movimiento
          </label>
        </div>
        {finance ? (
          <>
            <p className="pro-muted" style={{ margin: '0 0 8px' }}>
              Ordenes: <strong>{finance.ordersCount}</strong> · Total ordenes: <strong>{moneyHnl(finance.ordersTotal)}</strong>{' '}
              · Total pagos: <strong>{moneyHnl(finance.paymentsTotal)}</strong>
            </p>
            <p className="pro-muted" style={{ margin: '0 0 8px' }}>
              Caja esperada: <strong>{moneyHnl(finance.cashExpectedTotal)}</strong> · Caja declarada:{' '}
              <strong>{moneyHnl(finance.cashDeclaredTotal)}</strong> · Diferencia cierre:{' '}
              <strong>{moneyHnl(finance.cashDifferenceTotal)}</strong>
            </p>
            {visibleByMethod.length > 0 ? (
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--pro-border)', padding: 4 }}>Metodo</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid var(--pro-border)', padding: 4 }}>Monto</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--pro-border)', padding: 4 }}>Caja</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleByMethod.map((m) => (
                    <tr key={m.method}>
                      <td style={{ padding: 4 }}>{m.method}</td>
                      <td style={{ padding: 4, textAlign: 'right' }}>{moneyHnl(m.amount)}</td>
                      <td style={{ padding: 4 }}>{m.inPhysicalDrawer ? 'Si' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="pro-muted" style={{ margin: 0 }}>Sin pagos para el filtro seleccionado.</p>
            )}
            <div style={{ marginTop: 12 }}>
              <h3 className="pro-h3" style={{ margin: '0 0 8px' }}>Estado de cuenta diario</h3>
              {visibleDailyRows.length === 0 ? (
                <p className="pro-muted" style={{ margin: 0 }}>Sin movimientos diarios para este filtro.</p>
              ) : (
                <div className="pro-tablewrap">
                  <table className="pro-table" style={{ minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th>Fecha (HN)</th>
                        <th style={{ textAlign: 'right' }}>Ordenes</th>
                        <th style={{ textAlign: 'right' }}>Entradas</th>
                        <th style={{ textAlign: 'right' }}>Salidas</th>
                        <th style={{ textAlign: 'right' }}>Neto</th>
                        <th style={{ textAlign: 'right' }}>Caja esperada</th>
                        <th style={{ textAlign: 'right' }}>Caja declarada</th>
                        <th style={{ textAlign: 'right' }}>Dif. caja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleDailyRows.map((d) => (
                        <tr key={d.dateHn}>
                          <td>{d.dateHn}</td>
                          <td style={{ textAlign: 'right' }}>{d.ordersCount}</td>
                          <td style={{ textAlign: 'right' }}>{moneyHnl(d.entradas)}</td>
                          <td style={{ textAlign: 'right' }}>{moneyHnl(d.salidas)}</td>
                          <td style={{ textAlign: 'right' }}>{moneyHnl(d.neto)}</td>
                          <td style={{ textAlign: 'right' }}>{moneyHnl(d.cashExpected)}</td>
                          <td style={{ textAlign: 'right' }}>{moneyHnl(d.cashDeclared)}</td>
                          <td style={{ textAlign: 'right' }}>{moneyHnl(d.cashDifference)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="pro-muted" style={{ margin: 0 }}>No se pudo calcular resumen financiero para ese rango.</p>
        )}
      </div>
    </div>
  );
}
