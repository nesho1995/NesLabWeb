import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { createOrder } from '../orders/newOrder.api';
import { addSyncRegularization, listSyncRegularizations, type SyncRegularizationRow } from './offlineSync.api';
import {
  getPendingOrders,
  getRegularizedOrders,
  subscribeOrderOutboxUpdated,
  syncPendingOrders,
  type PendingOrderItem,
  type RegularizedOrderItem,
} from '../../shared/offline/orderOutbox';

function when(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-HN');
  } catch {
    return iso;
  }
}

export function OfflineSyncPage() {
  const [pending, setPending] = useState<PendingOrderItem[]>([]);
  const [regularized, setRegularized] = useState<RegularizedOrderItem[]>([]);
  const [serverRows, setServerRows] = useState<SyncRegularizationRow[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => globalThis.navigator?.onLine ?? true);

  useEffect(() => {
    const load = () => {
      setPending(getPendingOrders());
      setRegularized(getRegularizedOrders(50));
    };
    const loadAll = async () => {
      load();
      if (isOnline) {
        try {
          setServerRows(await listSyncRegularizations(250));
        } catch {
          // Si falla backend, mantenemos vista local para no bloquear operativa.
        }
      }
    };
    void loadAll();
    const unsub = subscribeOrderOutboxUpdated(load);
    return unsub;
  }, [isOnline]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    globalThis.addEventListener('online', onOnline);
    globalThis.addEventListener('offline', onOffline);
    return () => {
      globalThis.removeEventListener('online', onOnline);
      globalThis.removeEventListener('offline', onOffline);
    };
  }, []);

  async function runSync() {
    if (!isOnline) {
      setMsg('Sin internet. Reconecte para sincronizar.');
      return;
    }
    setSyncing(true);
    setMsg(null);
    try {
      const r = await syncPendingOrders(
        (payload, key) => createOrder(payload, key),
        async (item, result) => {
          await addSyncRegularization({
            tempId: item.tempId,
            orderId: result.orderId,
            invoiceNumber: result.invoiceNumber,
            caiMode: result.caiMode,
            requestedCai: item.requestedCai,
            patientName: item.patientName,
            source: 'web-offline',
          });
        }
      );
      if (r.synced > 0) {
        setMsg(`Sincronizacion completada: ${r.synced} regularizada(s).`);
      } else if (r.failed > 0) {
        setMsg('No se pudo sincronizar por ahora. Reintente en unos minutos.');
      } else {
        setMsg('No hay pendientes.');
      }
    } finally {
      setSyncing(false);
      setPending(getPendingOrders());
      setRegularized(getRegularizedOrders(50));
      if (isOnline) {
        try {
          setServerRows(await listSyncRegularizations(250));
        } catch {
          // noop
        }
      }
    }
  }

  function exportRegularizationsExcel() {
    const rows = (serverRows.length > 0 ? serverRows : regularized).map((r) => ({
      Provisional: r.tempId,
      OrdenFinalId: r.orderId,
      FacturaFinal: r.invoiceNumber,
      Paciente: r.patientName,
      ModoFiscal: r.caiMode ? 'CAI' : 'Interno',
      SolicitoCAI: r.requestedCai ? 'Si' : 'No',
      FechaRegularizacion:
        'regularizedAtUtc' in r ? when(r.regularizedAtUtc) : when(r.regularizedAtIso),
      Fuente: 'source' in r ? r.source ?? 'web-offline' : 'local',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Regularizaciones');
    const day = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `bitacora_regularizaciones_${day}.xlsx`);
  }

  return (
    <div className="pro-page">
      <div className="pro-hero" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="pro-hero__title">Sincronizacion offline</h1>
          <p className="pro-hero__desc" style={{ marginBottom: 0 }}>
            Control de comprobantes provisionales y regularizacion fiscal. Operacion diaria segura sin perder datos.
          </p>
        </div>
        <button className="pro-button" type="button" onClick={() => void runSync()} disabled={syncing || !isOnline}>
          {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>
        <button className="pro-button pro-ghost" type="button" onClick={exportRegularizationsExcel}>
          Exportar bitacora Excel
        </button>
      </div>

      {!isOnline ? (
        <div className="pro-card" style={{ borderColor: '#fde68a', background: '#fffbeb', maxWidth: 980 }}>
          <p style={{ margin: 0, color: '#92400e', fontWeight: 700 }}>
            Sin internet. Las ordenes provisionales se mantienen en cola hasta reconectar.
          </p>
        </div>
      ) : null}
      {msg ? (
        <div className="pro-card" style={{ maxWidth: 980 }}>
          <p className="pro-muted" style={{ margin: 0 }}>{msg}</p>
        </div>
      ) : null}

      <div className="pro-card" style={{ maxWidth: 980 }}>
        <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
          Pendientes de regularizar ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="pro-muted" style={{ margin: 0 }}>No hay pendientes.</p>
        ) : (
          <div className="pro-tablewrap">
            <table className="pro-table" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Provisional</th>
                  <th>Paciente</th>
                  <th>Fecha</th>
                  <th>Solicita CAI</th>
                  <th>Accion al reconectar</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.tempId}>
                    <td className="is-mono">{p.tempId}</td>
                    <td>{p.patientName}</td>
                    <td>{when(p.createdAtIso)}</td>
                    <td>{p.requestedCai ? 'Si' : 'No'}</td>
                    <td>
                      {p.requestedCai
                        ? 'Regularizar a CAI (si aplica politica fiscal)'
                        : 'Mantener como interno'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pro-card" style={{ maxWidth: 980 }}>
        <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>Bitacora en sistema (servidor)</h2>
        {serverRows.length === 0 ? (
          <p className="pro-muted" style={{ margin: 0 }}>
            Sin datos del servidor aun. Al sincronizar, se registran aqui para auditoria.
          </p>
        ) : (
          <div className="pro-tablewrap">
            <table className="pro-table" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th>Provisional</th>
                  <th>Factura final</th>
                  <th>Paciente</th>
                  <th>Solicito CAI</th>
                  <th>Modo</th>
                  <th>Fecha regularizacion</th>
                </tr>
              </thead>
              <tbody>
                {serverRows.map((r) => (
                  <tr key={r.id}>
                    <td className="is-mono">{r.tempId}</td>
                    <td className="is-mono">{r.invoiceNumber}</td>
                    <td>{r.patientName}</td>
                    <td>{r.requestedCai ? 'Si' : 'No'}</td>
                    <td>{r.caiMode ? 'CAI' : 'Interno'}</td>
                    <td>{when(r.regularizedAtUtc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pro-card" style={{ maxWidth: 980 }}>
        <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>Historial de regularizaciones</h2>
        {regularized.length === 0 ? (
          <p className="pro-muted" style={{ margin: 0 }}>Sin regularizaciones aun.</p>
        ) : (
          <div className="pro-tablewrap">
            <table className="pro-table" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Provisional</th>
                  <th>Factura final</th>
                  <th>Paciente</th>
                  <th>Fecha regularizacion</th>
                  <th>Modo</th>
                </tr>
              </thead>
              <tbody>
                {regularized.map((r) => (
                  <tr key={`${r.tempId}-${r.orderId}`}>
                    <td className="is-mono">{r.tempId}</td>
                    <td className="is-mono">{r.invoiceNumber}</td>
                    <td>{r.patientName}</td>
                    <td>{when(r.regularizedAtIso)}</td>
                    <td>{r.caiMode ? 'CAI' : 'Interno'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
