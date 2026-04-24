import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { useAuth } from '../auth/AuthProvider';
import { getFinanceSummary } from '../lab-reportes/labDashboard.api';
import type { FinanceSummary } from '../lab-reportes/labDashboard.types';

function moneyHnl(n: number) {
  return n.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
}

export function FinancePage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(today);
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await getFinanceSummary(fromDate, toDate);
        if (mounted) {
          setData(r);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'No se pudo leer estado financiero.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fromDate, toDate]);

  return (
    <div className="pro-page">
      <div className="pro-hero" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="pro-hero__title" style={{ fontSize: 24 }}>Estado financiero</h1>
          <p className="pro-hero__desc" style={{ margin: 0 }}>
            Resumen por rango: ordenes, pagos, cuadre de caja y metodos de pago.
          </p>
        </div>
        <button
          type="button"
          className="pro-button"
          disabled={!data || exporting}
          onClick={() => {
            if (!data) return;
            setExporting(true);
            try {
              const wb = XLSX.utils.book_new();
              const resumen = [
                ['Desde', fromDate],
                ['Hasta', toDate],
                ['Ordenes', data.ordersCount],
                ['Total ordenes', data.ordersTotal],
                ['Total pagos', data.paymentsTotal],
                ['Caja esperada', data.cashExpectedTotal],
                ['Caja declarada', data.cashDeclaredTotal],
                ['Diferencia caja', data.cashDifferenceTotal],
              ];
              XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');
              XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.json_to_sheet(
                  data.byMethod.map((m) => ({
                    Metodo: m.method,
                    Monto: m.amount,
                    CajaFisica: m.inPhysicalDrawer ? 'Si' : 'No',
                  }))
                ),
                'PorMetodo'
              );
              XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.json_to_sheet(
                  data.dailyRows.map((d) => ({
                    Fecha: d.dateHn,
                    Ordenes: d.ordersCount,
                    Entradas: d.entradas,
                    Salidas: d.salidas,
                    Neto: d.neto,
                    CajaEsperada: d.cashExpected,
                    CajaDeclarada: d.cashDeclared,
                    DiferenciaCaja: d.cashDifference,
                  }))
                ),
                'EstadoCuentaDiario'
              );
              XLSX.writeFile(wb, `estado-financiero-${fromDate}-a-${toDate}.xlsx`);
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      <div className="pro-card" style={{ maxWidth: 880, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="pro-muted" style={{ fontSize: 13 }}>
            Desde{' '}
            <input className="pro-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="pro-muted" style={{ fontSize: 13 }}>
            Hasta{' '}
            <input className="pro-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="pro-card" style={{ maxWidth: 880 }}>
          <p className="pro-muted" style={{ margin: 0 }}>Cargando estado financiero...</p>
        </div>
      ) : null}
      {error ? (
        <div className="pro-card" style={{ maxWidth: 880, borderColor: 'rgba(220, 38, 38, 0.35)' }}>
          <p className="pro-muted" style={{ margin: 0 }}>{error}</p>
        </div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <div
            className="pro-kpi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
              maxWidth: 980,
              marginBottom: 12,
            }}
          >
            <div className="pro-card">
              <p className="pro-kpi__label">Ordenes</p>
              <p className="pro-kpi__value">{data.ordersCount}</p>
            </div>
            <div className="pro-card">
              <p className="pro-kpi__label">Total ordenes</p>
              <p className="pro-kpi__value">{moneyHnl(data.ordersTotal)}</p>
            </div>
            <div className="pro-card">
              <p className="pro-kpi__label">Total pagos</p>
              <p className="pro-kpi__value">{moneyHnl(data.paymentsTotal)}</p>
            </div>
            <div className="pro-card">
              <p className="pro-kpi__label">Caja esperada</p>
              <p className="pro-kpi__value">{moneyHnl(data.cashExpectedTotal)}</p>
            </div>
            <div className="pro-card">
              <p className="pro-kpi__label">Caja declarada</p>
              <p className="pro-kpi__value">{moneyHnl(data.cashDeclaredTotal)}</p>
            </div>
            <div className="pro-card">
              <p className="pro-kpi__label">Diferencia caja</p>
              <p className="pro-kpi__value">{moneyHnl(data.cashDifferenceTotal)}</p>
            </div>
          </div>

          <div className="pro-card" style={{ maxWidth: 980 }}>
            <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>Ingresos por metodo</h2>
            {data.byMethod.length === 0 ? (
              <p className="pro-muted" style={{ margin: 0 }}>No hay pagos en el rango.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--pro-border)', padding: 4 }}>Metodo</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid var(--pro-border)', padding: 4 }}>Monto</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--pro-border)', padding: 4 }}>Caja fisica</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byMethod.map((m) => (
                    <tr key={m.method}>
                      <td style={{ padding: 4 }}>{m.method}</td>
                      <td style={{ padding: 4, textAlign: 'right' }}>{moneyHnl(m.amount)}</td>
                      <td style={{ padding: 4 }}>{m.inPhysicalDrawer ? 'Si' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="pro-card" style={{ maxWidth: 980, marginTop: 12 }}>
            <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>Estado de cuenta diario (caja/gerencia)</h2>
            {data.dailyRows.length === 0 ? (
              <p className="pro-muted" style={{ margin: 0 }}>Sin movimientos diarios en el rango.</p>
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
                    {data.dailyRows.map((d) => (
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
      ) : null}

      <div className="pro-card" style={{ maxWidth: 880, marginTop: 12 }}>
        <CrossModuleLinks
          heading="Relacionados"
          marginTop={0}
          items={[
            { to: '/caja/cierre', label: 'Cierre de caja', show: hasPermission('CAJA.CERRAR') },
            { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
            { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
            { to: '/orders', label: 'Nueva orden', show: hasPermission('ORDEN.CREATE') },
          ]}
        />
      </div>
    </div>
  );
}
