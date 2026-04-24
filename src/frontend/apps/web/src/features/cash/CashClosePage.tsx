import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { closeCashSession, getCashSessionStatus, openCashSession } from './cashSession.api';
import type { CashSessionClosedResult, CashSessionStatus } from './cashSession.types';

function money(n: number) {
  return n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CashClosePage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const canLisReportes = hasPermission('RESULTADOS.VALIDAR');
  const canEmpresaConfig = hasPermission('EMPRESA.CONFIG');
  const canMuestras = hasPermission('MUESTRA.GESTION');
  const canOrdenes = hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']);
  const canNuevaOrden = hasPermission('ORDEN.CREATE');
  const canFiscal = hasPermission('FISCAL.READ');
  const [data, setData] = useState<CashSessionStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pettyInput, setPettyInput] = useState('');
  const [declaredInput, setDeclaredInput] = useState('');
  const [notes, setNotes] = useState('0');
  const [declaredByMethod, setDeclaredByMethod] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [lastClosed, setLastClosed] = useState<CashSessionClosedResult | null>(null);

  const refresh = useCallback(async () => {
    const d = await getCashSessionStatus();
    setData(d);
    if (d.cashPettyCashEnabled) {
      setPettyInput(String(d.cashPettyCashDefault ?? 0));
    } else {
      setPettyInput('0');
    }
    if (d.open) {
      setDeclaredInput(String(d.open.expectedInDrawer));
      const next: Record<string, string> = {};
      for (const b of d.open.breakdown) {
        next[b.code] = String(b.amount);
      }
      setDeclaredByMethod(next);
    } else {
      setDeclaredInput('');
      setDeclaredByMethod({});
    }
  }, []);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        await refresh();
      } catch (e) {
        if (ok) {
          setLoadError(e instanceof Error ? e.message : 'Error al cargar caja.');
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
  }, [refresh]);

  async function onOpen() {
    if (!data) {
      return;
    }
    setActionError(null);
    setLastClosed(null);
    setBusy(true);
    try {
      const petty = data.cashPettyCashEnabled ? parseFloat(pettyInput.replace(',', '.')) || 0 : 0;
      await openCashSession(data.cashPettyCashEnabled ? petty : null);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo abrir caja.');
    } finally {
      setBusy(false);
    }
  }

  async function onClose() {
    if (!data?.open) {
      return;
    }
    setActionError(null);
    setBusy(true);
    try {
      const fromMethods =
        data.open.breakdown.length > 0
          ? data.open.breakdown
              .filter((b) => b.inPhysicalDrawer)
              .reduce((acc, b) => acc + (parseFloat((declaredByMethod[b.code] ?? '').replace(',', '.')) || 0), 0)
          : parseFloat(declaredInput.replace(',', '.')) || 0;
      const declared = Number.isFinite(fromMethods) ? fromMethods : 0;
      const r = await closeCashSession(declared, notes);
      setLastClosed(r);
      setNotes('0');
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo cerrar caja.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="pro-card" style={{ maxWidth: 640 }}>
        <p className="pro-muted" style={{ margin: 0 }}>
          Cargando turno y politica
        </p>
        <div className="pro-shimmer" style={{ height: 8, marginTop: 12, maxWidth: 200 }} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pro-card" style={{ maxWidth: 640, borderColor: 'rgba(220, 38, 38, 0.35)' }}>
        <h1 className="pro-hero__title" style={{ margin: 0, fontSize: 20 }}>
          Error
        </h1>
        <p className="pro-muted" style={{ margin: '8px 0 0' }}>{loadError}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="pro-page">
      <div className="pro-hero" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
        <div>
          <h1 className="pro-hero__title">Control y cierre de caja</h1>
          <p className="pro-hero__desc" style={{ marginBottom: 0 }}>
            Apertura y cierre con arqueo: <strong>efectivo en caja</strong> segun comprobantes con
            pago en metodos de caja fisica mas caja chica.
          </p>
          <CrossModuleLinks
            marginTop={10}
            items={[
              { to: '/lab/muestras', label: 'Muestras', show: canMuestras },
              { to: '/lab/resultados', label: 'Resultados', show: canLisReportes },
              { to: '/lab/reportes', label: 'Indicadores LIS', show: canLisReportes },
              { to: '/ordenes', label: 'Bandeja de ordenes', show: canOrdenes },
              { to: '/orders', label: 'Nueva orden', show: canNuevaOrden },
              { to: '/sar', label: 'Cumplimiento SAR', show: canFiscal },
            ]}
          />
          <CrossModuleLinks
            marginTop={8}
            items={[
              { to: '/admin/empresa-caja', label: 'Política de caja', show: canEmpresaConfig },
              { to: '/admin/formas-pago', label: 'Formas de pago', show: canEmpresaConfig },
            ]}
          />
        </div>
      </div>

      {actionError ? (
        <div
          className="pro-card"
          style={{
            marginBottom: 12,
            maxWidth: 700,
            borderColor: 'rgba(220, 38, 38, 0.4)',
            background: 'rgba(254, 226, 226, 0.35)',
          }}
        >
          <p className="pro-muted" style={{ margin: 0, color: '#991b1b' }}>{actionError}</p>
        </div>
      ) : null}

      {lastClosed ? (
        <div
          className="pro-card"
          style={{
            marginBottom: 12,
            maxWidth: 700,
            background: 'rgba(16, 185, 129, 0.08)',
            borderColor: 'rgba(5, 150, 105, 0.35)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 800 }}>Cierre registrado</p>
          <p className="pro-muted" style={{ margin: '6px 0 0' }}>
            Esperado L {money(lastClosed.expectedInDrawer)} · Declarado L {money(lastClosed.declaredCash)} ·
            Diferencia L {money(lastClosed.difference)}
          </p>
        </div>
      ) : null}

      {data.hasOpenSession && data.open ? (
        <div className="pro-card" style={{ maxWidth: 760, marginBottom: 12 }} aria-label="Caja abierta">
          <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>Caja abierta</h2>
          {!data.open.sessionTotalsMatch ? (
            <div
              style={{
                marginBottom: 10,
                padding: 10,
                borderRadius: 8,
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(217, 119, 6, 0.4)',
                fontSize: 13,
              }}
            >
              <strong>Atencion (cuadre):</strong> la suma de totales de ordenes (L {money(data.open.totalFromOrders)}) no
              coincide con la suma de pagos registrados (L {money(data.open.totalFromPayments)}). Revisa pagos
              duplicados o integridad antes de cerrar.
            </div>
          ) : null}
          <ul className="pro-muted" style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
            <li>
              Caja chica al abrir: <strong>L {money(data.open.pettyCashOpening)}</strong>
            </li>
            <li>
              Ordenes con cobro en caja fisica: <strong>{data.open.efectivoOrderCount}</strong> (de{' '}
              {data.open.orderCount} con pago en el turno)
            </li>
            <li>
              Suma linea EFECTIVO (etiqueta): L <strong>{money(data.open.sumEfectivo)}</strong> · Suma con bandera
              caja fisica: L <strong>{money(data.open.sumInPhysicalDrawer)}</strong>
            </li>
            <li>
              <strong>Esperado en gaveta</strong> = caja chica + (suma formas marcadas caja fisica): L{' '}
              {money(data.open.expectedInDrawer)}
            </li>
          </ul>
          {data.open.breakdown.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14 }}>Cuadre por forma de pago</p>
              <div className="pro-tablewrap">
                <table className="pro-table" style={{ minWidth: 680 }}>
                  <thead>
                    <tr>
                      <th>Forma</th>
                      <th style={{ textAlign: 'right' }}>Sistema</th>
                      <th style={{ textAlign: 'right' }}>Ingresado</th>
                      <th style={{ textAlign: 'right' }}>Dif.</th>
                      <th>Caja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.open.breakdown.map((b) => {
                      const entered = parseFloat((declaredByMethod[b.code] ?? '').replace(',', '.')) || 0;
                      const diff = entered - b.amount;
                      return (
                        <tr key={b.code + b.name}>
                          <td>{b.name}</td>
                          <td style={{ textAlign: 'right' }}>L {money(b.amount)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              className="pro-input"
                              type="text"
                              inputMode="decimal"
                              value={declaredByMethod[b.code] ?? ''}
                              onChange={(ev) =>
                                setDeclaredByMethod((prev) => ({ ...prev, [b.code]: ev.target.value }))
                              }
                              style={{ maxWidth: 120, textAlign: 'right', height: 38 }}
                              disabled={busy}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>L {money(diff)}</td>
                          <td>{b.inPhysicalDrawer ? 'Si' : 'No'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="pro-muted" style={{ marginTop: 8, marginBottom: 0 }}>
                El cierre usa la suma ingresada de metodos marcados como <strong>Caja = Si</strong> para el arqueo de
                gaveta.
              </p>
            </div>
          ) : null}
          <hr style={{ border: 'none', borderTop: '1px solid var(--pro-border)', margin: '16px 0' }} />
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }} htmlFor="declared">
            Efectivo contado (L)
          </label>
          <input
            id="declared"
            className="pro-input"
            type="text"
            inputMode="decimal"
            value={declaredInput}
            onChange={(ev) => setDeclaredInput(ev.target.value)}
            style={{ maxWidth: 200, marginBottom: 12 }}
            disabled={busy}
          />
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }} htmlFor="cnotes">
            Turno observacion
          </label>
          <input
            id="cnotes"
            className="pro-input"
            value={notes}
            onChange={(ev) => setNotes(ev.target.value)}
            maxLength={500}
            style={{ maxWidth: '100%', marginBottom: 12 }}
            disabled={busy}
          />
          <button className="pro-btn" type="button" onClick={() => void onClose()} disabled={busy}>
            {busy ? 'Cerrando…' : 'Registrar cierre y arqueo'}
          </button>
        </div>
      ) : null}

      {!data.hasOpenSession && data.canOpen ? (
        <div className="pro-card" style={{ maxWidth: 700, marginBottom: 12 }} aria-label="Abrir caja">
          <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>Abrir caja</h2>
          {data.cashPettyCashEnabled ? (
            <>
              <p className="pro-muted" style={{ margin: '0 0 6px', fontSize: 14 }}>
                Caja chica (vuelto). Por defecto viene de la politica de empresa; puedes ajustar.
              </p>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }} htmlFor="petty">
                Caja chica (L)
              </label>
              <input
                id="petty"
                className="pro-input"
                type="text"
                inputMode="decimal"
                value={pettyInput}
                onChange={(ev) => setPettyInput(ev.target.value)}
                style={{ maxWidth: 200, marginBottom: 12 }}
                disabled={busy}
              />
            </>
          ) : (
            <p className="pro-muted" style={{ fontSize: 14 }}>
              Caja chica deshabilitada en la politica: se abre con 0.
            </p>
          )}
          <button className="pro-btn" type="button" onClick={() => void onOpen()} disabled={busy}>
            {busy ? 'Abriendo…' : 'Abrir caja'}
          </button>
        </div>
      ) : null}

      {!data.hasOpenSession && !data.canOpen && data.blockReason ? (
        <div className="pro-card" style={{ maxWidth: 700, borderColor: 'rgba(217, 119, 6, 0.45)' }}>
          <p className="pro-muted" style={{ margin: 0, color: '#9a3412' }}>
            {data.blockReason}
          </p>
        </div>
      ) : null}
    </div>
  );
}
