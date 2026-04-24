import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { fetchOrdersPage } from './ordersList.api';
import type { OrderListItem } from './ordersList.types';
import { getPendingOrdersCount, subscribeOrderOutboxUpdated } from '../../shared/offline/orderOutbox';

function moneyHn(n: number) {
  return n.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
}

function whenLocal(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function fiscalBadge(status: string) {
  const isOk = status.toUpperCase() === 'REGULARIZADA';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: isOk ? '#dcfce7' : '#fef3c7',
        color: isOk ? '#166534' : '#92400e',
        border: `1px solid ${isOk ? '#86efac' : '#fcd34d'}`,
      }}
    >
      {isOk ? 'Regularizada' : 'Pendiente'}
    </span>
  );
}

export function OrdersListPage() {
  const { hasPermission } = useAuth();
  const canCreateOrder = hasPermission('ORDEN.CREATE');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [fiscalFilter, setFiscalFilter] = useState<'ALL' | 'REGULARIZADA' | 'PENDIENTE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => getPendingOrdersCount());

  useEffect(() => {
    setPage(1);
  }, [search, fiscalFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchOrdersPage(search, page, pageSize, fiscalFilter);
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
  }, [search, page, pageSize, fiscalFilter, tick]);

  useEffect(() => {
    const refresh = () => setPendingSyncCount(getPendingOrdersCount());
    return subscribeOrderOutboxUpdated(refresh);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pro-page">
      <div className="pro-hero">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="pro-hero__title" style={{ fontSize: '1.25rem' }}>
            Bandeja de órdenes
          </h1>
          <p className="pro-hero__desc" style={{ marginTop: 6, marginBottom: 0 }}>
            Comprobantes de su empresa. Busque por correlativo, nombre de paciente o identificación.
          </p>
        </div>
        <div className="pro-actions-row" style={{ flexShrink: 0, margin: 0, justifyContent: 'flex-end' }}>
          {canCreateOrder && (
            <Link to="/orders" className="pro-content-link" style={{ fontWeight: 600, alignSelf: 'center' }}>
              Nueva orden
            </Link>
          )}
          <button type="button" className="pro-ghost" onClick={() => setTick((t) => t + 1)}>
            Actualizar
          </button>
        </div>
      </div>
      <CrossModuleLinks
        marginTop={10}
        items={[
          { to: '/patients', label: 'Pacientes', show: hasPermission('PACIENTE.READ') },
          { to: '/lab-exams', label: 'Catalogo de examenes', show: hasPermission('EXAMEN.READ') },
          { to: '/lab/muestras', label: 'Muestras', show: hasPermission('MUESTRA.GESTION') },
          { to: '/lab/resultados', label: 'Resultados', show: hasPermission('RESULTADOS.VALIDAR') },
          { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
          { to: '/caja/cierre', label: 'Caja', show: hasPermission('CAJA.CERRAR') },
          { to: '/sar', label: 'Cumplimiento SAR', show: hasPermission('FISCAL.READ') },
          { to: '/admin/empresa-caja', label: 'Política de caja', show: hasPermission('EMPRESA.CONFIG') },
          { to: '/admin/formas-pago', label: 'Formas de pago', show: hasPermission('EMPRESA.CONFIG') },
          { to: '/operacion/sincronizacion', label: 'Sincronizacion offline', show: hasPermission('ORDEN.CREATE') || hasPermission('CAJA.CERRAR') },
        ]}
      />
      {pendingSyncCount > 0 ? (
        <div className="pro-card" style={{ borderColor: '#fde68a', background: '#fffbeb' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#92400e' }}>
            Hay {pendingSyncCount} comprobante(s) provisional(es) pendientes de regularizar.
          </p>
          <p className="pro-muted" style={{ margin: '6px 0 0', color: '#92400e' }}>
            Mientras esten pendientes, no deben tratarse como factura fiscal final. Revise "Sincronizacion offline".
          </p>
        </div>
      ) : null}

      <div className="pro-card">
        <label className="pro-field" style={{ display: 'block', marginBottom: 0 }}>
          <span style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            Buscar
          </span>
          <input
            className="pro-input"
            style={{ display: 'block', width: '100%', maxWidth: 420, marginTop: 0 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="N° comprobante, nombre o DNI/RTN"
            autoComplete="off"
          />
        </label>
        <label className="pro-field" style={{ display: 'block', marginTop: 10, marginBottom: 0 }}>
          <span style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            Estado fiscal
          </span>
          <select
            className="pro-input"
            style={{ display: 'block', width: '100%', maxWidth: 280, marginTop: 0 }}
            value={fiscalFilter}
            onChange={(e) => setFiscalFilter(e.target.value as 'ALL' | 'REGULARIZADA' | 'PENDIENTE')}
          >
            <option value="ALL">Todos</option>
            <option value="REGULARIZADA">Regularizada</option>
            <option value="PENDIENTE">Pendiente</option>
          </select>
        </label>

        <p className="pro-muted" style={{ marginTop: 12 }}>
          {fiscalFilter === 'ALL'
            ? `Mostrando ${rows.length} de ${total} orden(es).`
            : `Filtro fiscal: ${fiscalFilter === 'REGULARIZADA' ? 'Regularizada' : 'Pendiente'} · ${total} orden(es).`}
        </p>

        {error && <p className="pro-muted">{error}</p>}

        <div className="pro-tablewrap" style={{ marginTop: 16 }}>
          <table className="pro-table" width="100%">
            <caption className="pro-muted" style={{ textAlign: 'left', marginBottom: 8 }}>
              Ordenes recientes primero
            </caption>
            <thead>
              <tr>
                <th scope="col">Comprobante</th>
                <th scope="col">Fecha</th>
                <th scope="col">Paciente</th>
                <th scope="col">Estado</th>
                <th scope="col">Estado fiscal</th>
                <th scope="col" style={{ textAlign: 'right' }}>
                  Total
                </th>
                <th scope="col">Pago</th>
                <th scope="col" style={{ textAlign: 'right' }}>
                  Lineas
                </th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="pro-muted">
                    Cargando…
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="pro-muted">
                    No se encontraron ordenes.
                  </td>
                </tr>
              )}
              {!isLoading &&
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="is-mono">{r.invoiceNumber || `ID ${r.id}`}</span>
                    </td>
                    <td>{whenLocal(r.orderAtUtc)}</td>
                    <td>
                      {r.patientName}
                      {r.patientNationalId ? (
                        <span className="pro-muted" style={{ display: 'block', fontSize: 12 }}>
                          {r.patientNationalId}
                        </span>
                      ) : null}
                    </td>
                    <td>{r.status}</td>
                    <td>{fiscalBadge(r.fiscalStatus)}</td>
                    <td style={{ textAlign: 'right' }}>{moneyHn(r.total)}</td>
                    <td>{r.paymentMethod ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>{r.lineCount}</td>
                    <td>
                      <Link
                        to={`/orders/voucher/${r.id}`}
                        className="pro-content-link"
                        state={{ fromList: true }}
                      >
                        Ver comprobante
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div
            className="pro-muted"
            style={{ margin: '0.75rem 0 0', fontSize: '0.875rem' }}
            aria-live="polite"
          >
            {total} orden{total === 1 ? '' : 'es'} {totalPages > 1 ? `· pagina ${page} de ${totalPages}` : ''}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pro-pagination" aria-label="Paginacion">
            <button
              type="button"
              className="pro-ghost pro-ghost--noblock"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <button
              type="button"
              className="pro-ghost pro-ghost--noblock"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
