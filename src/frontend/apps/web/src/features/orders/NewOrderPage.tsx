import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { fetchExams } from '../lab-exams/labExams.api';
import type { LabExamListItem } from '../lab-exams/labExams.types';
import { createOrder, getActivePaymentMethods, getCompanyFiscal, getOrderDiscounts } from './newOrder.api';
import type {
  CompanyFiscalStatus,
  CreateOrderRequest,
  CreateOrderResult,
  DiscountItem,
  PaymentMethodListItem,
} from './orders.types';
import { fetchPatients } from '../patients/patients.api';
import type { PatientListItem } from '../patients/patients.types';
import { getInventoryOverview } from '../inventory/inventory.api';
import type { InventoryOverview } from '../inventory/inventory.types';
import { enqueuePendingOrder } from '../../shared/offline/orderOutbox';

function newIdemKey() {
  return globalThis.crypto?.randomUUID?.() ?? `k-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function newTempVoucher() {
  return `TMP-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function parseNumSafe(s: string): number {
  const n = Number(String(s).replace(',', '.'));
  if (Number.isNaN(n)) {
    return 0;
  }
  return n;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(n);
}

export function NewOrderPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const can = hasPermission('ORDEN.CREATE');
  const idBase = useId();

  const [fiscal, setFiscal] = useState<CompanyFiscalStatus | null>(null);
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [exams, setExams] = useState<LabExamListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [patientQ, setPatientQ] = useState('');
  const [patientPage] = useState(1);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [selectedExamIds, setSelectedExamIds] = useState<Set<number>>(() => new Set());
  const [examQ, setExamQ] = useState('');
  const [discountId, setDiscountId] = useState<number | 'custom'>('custom');
  const [customDiscount, setCustomDiscount] = useState('0');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodListItem[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [isFinal, setIsFinal] = useState(true);
  const [legalName, setLegalName] = useState('');
  const [rtn, setRtn] = useState('');
  const [idem, setIdem] = useState(newIdemKey);
  /** Si la empresa permite, true = correlativo SAR, false = recibo/serie interna. */
  const [useSarInvoice, setUseSarInvoice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateOrderResult | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [inventoryOverview, setInventoryOverview] = useState<InventoryOverview | null>(null);
  const [isOnline, setIsOnline] = useState(() => globalThis.navigator?.onLine ?? true);
  const [offlineQueuedCode, setOfflineQueuedCode] = useState<string | null>(null);

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

  useEffect(() => {
    let c = true;
    (async () => {
      setLoadError(null);
      try {
        const [f, d, pm] = await Promise.all([
          getCompanyFiscal(),
          getOrderDiscounts(),
          getActivePaymentMethods().catch(() => [] as PaymentMethodListItem[]),
        ]);
        if (c) {
          setFiscal(f);
          setDiscounts(d);
          if (d.length) {
            setDiscountId(d[0].id);
          }
          if (pm.length) {
            setPaymentMethods(pm);
            const pre = pm.find((x) => x.code === 'EFECTIVO') ?? pm[0];
            setPaymentMethodId(pre.id);
          }
        }
        const e = await fetchExams('', false, 1, 200);
        if (c) {
          setExams(e.items);
        }
        const inv = await getInventoryOverview().catch(() => null);
        if (c) {
          setInventoryOverview(inv);
        }
      } catch (err) {
        if (c) {
          setLoadError((err as Error).message);
        }
      }
    })();
    return () => {
      c = false;
    };
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    let c = true;
    t = setTimeout(() => {
      (async () => {
        if (!can) {
          return;
        }
        setListErr(null);
        try {
          const r = await fetchPatients(patientQ, false, patientPage);
          if (c) {
            setPatients(r.items);
          }
        } catch (err) {
          if (c) {
            setListErr((err as Error).message);
          }
        }
      })();
    }, 300);
    return () => {
      c = false;
      clearTimeout(t);
    };
  }, [can, patientPage, patientQ]);

  const { percent, discountName } = useMemo(() => {
    if (discountId === 'custom') {
      const p = Math.min(100, Math.max(0, parseNumSafe(customDiscount)));
      return { percent: p, discountName: 'Personalizado' };
    }
    const d = discounts.find((x) => x.id === discountId);
    return { percent: d?.percent ?? 0, discountName: d?.name ?? '—' };
  }, [customDiscount, discountId, discounts]);

  const visibleExams = useMemo(() => {
    const q = examQ.trim().toLowerCase();
    if (!q) {
      return exams;
    }
    return exams.filter((x) => x.name.toLowerCase().includes(q) || x.code.toLowerCase().includes(q));
  }, [examQ, exams]);

  const selectedExamNames = useMemo(
    () => exams.filter((x) => selectedExamIds.has(x.id)).map((x) => x.name),
    [exams, selectedExamIds]
  );

  const methodRequiresReceived = useMemo(
    () => paymentMethods.find((m) => m.id === paymentMethodId)?.requiresAmountReceived ?? false,
    [paymentMethods, paymentMethodId]
  );

  const onToggleExam = useCallback((id: number) => {
    setSelectedExamIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can) {
      return;
    }
    setError(null);
    setResult(null);
    setOfflineQueuedCode(null);
    if (!selectedPatient) {
      setError('Seleccione un paciente.');
      return;
    }
    if (selectedExamIds.size === 0) {
      setError('Elija al menos un examen.');
      return;
    }
    if (percent < 0 || percent > 100) {
      setError('El descuento no es valido.');
      return;
    }
    const method = paymentMethods.find((m) => m.id === paymentMethodId);
    if (!method) {
      setError('Forma de pago no valida. Recargue la pagina o configure formas de pago (admin).');
      return;
    }
    let ar: number | null = null;
    if (method.requiresAmountReceived) {
      ar = parseNumSafe(amountReceived);
      if (ar < 0.01) {
        setError('Indique monto recibido (forma de pago con vuelto).');
        return;
      }
    }
    if (!isFinal) {
      if (legalName.trim().length < 2) {
        setError('Razon social requerida para crédito fiscal.');
        return;
      }
      if (rtn.replace(/\D/g, '').length !== 14) {
        setError('El RTN debe tener 14 digitos.');
        return;
      }
    }
    const dualSar = fiscal && fiscal.useCai && fiscal.allowNonSarDocument;
    if (!isOnline && fiscal?.useCai && !fiscal.allowNonSarDocument) {
      setError(
        'Sin internet no se puede emitir CAI en esta empresa. Habilite comprobante interno o espere conexion.'
      );
      return;
    }
    const useSarInvoiceFinal = dualSar ? (isOnline ? useSarInvoice : false) : null;
    const body: CreateOrderRequest = {
      patientId: selectedPatient.id,
      discountPercent: percent,
      discountTypeLabel: discountName,
      lines: Array.from(selectedExamIds).map((labExamId) => ({ labExamId })),
      paymentMethod: method.name,
      paymentMethodId: method.id,
      amountReceived: ar,
      isFinalConsumer: isFinal,
      clientLegalName: isFinal ? null : legalName.trim(),
      clientRtn: isFinal ? null : rtn.replace(/\D/g, ''),
      ...(dualSar ? { useSarInvoice: useSarInvoiceFinal } : {}),
    };
    if (!isOnline) {
      const tempCode = newTempVoucher();
      enqueuePendingOrder({
        tempId: tempCode,
        createdAtIso: new Date().toISOString(),
        patientName: selectedPatient.fullName,
        requestedCai: !!useSarInvoice,
        payload: {
          ...body,
          // Offline se guarda como interno/provisional para operar sin riesgo fiscal.
          ...(dualSar ? { useSarInvoice: false } : {}),
        },
        idempotencyKey: idem,
      });
      setOfflineQueuedCode(tempCode);
      setIdem(newIdemKey());
      return;
    }
    setIsSubmitting(true);
    try {
      const r = await createOrder(body, idem);
      setResult(r);
      setIdem(newIdemKey());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!can) {
    return (
      <div className="pro-card">
        <p className="pro-muted">No tiene permiso ORDEN.CREATE.</p>
      </div>
    );
  }

  return (
    <div className="pro-page">
      <div className="pro-hero" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="pro-hero__title" style={{ fontSize: 24 }}>
            Nueva orden y facturacion
          </h1>
          <p className="pro-muted" style={{ margin: '6px 0 0' }}>
            Flujo hondureno: ISV, RTN, consumidor final y correlativo fiscal/interno segun configuracion.
          </p>
        </div>
      </div>
      <CrossModuleLinks
        marginTop={4}
        items={[
          { to: '/patients', label: 'Pacientes', show: hasPermission('PACIENTE.READ') },
          { to: '/lab-exams', label: 'Catalogo de examenes', show: hasPermission('EXAMEN.READ') },
          { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
          { to: '/caja/cierre', label: 'Cierre de caja', show: hasPermission('CAJA.CERRAR') },
          { to: '/lab/resultados', label: 'Resultados', show: hasPermission('RESULTADOS.VALIDAR') },
          { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
          { to: '/sar', label: 'Cumplimiento SAR', show: hasPermission('FISCAL.READ') },
          { to: '/admin/empresa-caja', label: 'Política de caja', show: hasPermission('EMPRESA.CONFIG') },
          { to: '/admin/formas-pago', label: 'Formas de pago', show: hasPermission('EMPRESA.CONFIG') },
          { to: '/admin/inventario-reactivos', label: 'Inventario reactivos', show: hasPermission('EMPRESA.CONFIG') },
        ]}
      />
      {!isOnline && (
        <div
          className="pro-card"
          style={{
            marginTop: 10,
            borderColor: 'rgba(217, 119, 6, 0.45)',
            background: 'rgba(255, 251, 235, 0.9)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: '#92400e' }}>Modo sin internet</p>
          <p className="pro-muted" style={{ margin: '6px 0 0', color: '#92400e' }}>
            Se emitira comprobante <strong>provisional/interno</strong>. Si necesita CAI, el comprobante correcto se
            enviara cuando el sistema este arriba y la transaccion quede validada.
          </p>
        </div>
      )}

      {inventoryOverview && (
        <div
          className="pro-card"
          style={{
            marginTop: 12,
            marginBottom: 12,
            borderColor:
              inventoryOverview.lowStockReagents > 0 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(16, 185, 129, 0.35)',
            background:
              inventoryOverview.lowStockReagents > 0 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(16, 185, 129, 0.08)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 800 }}>
            Semaforo inventario: {inventoryOverview.lowStockReagents > 0 ? 'Amarillo' : 'Verde'}
          </p>
          <p className="pro-muted" style={{ margin: '6px 0 0' }}>
            Reactivos activos: <strong>{inventoryOverview.activeReagents}</strong> · bajos: {' '}
            <strong>{inventoryOverview.lowStockReagents}</strong>. No bloquea facturacion, solo alerta.
          </p>
          {inventoryOverview.lowStockNames.length > 0 ? (
            <p className="pro-muted" style={{ margin: '6px 0 0' }}>
              Ejemplos en bajo: {inventoryOverview.lowStockNames.join(', ')}
            </p>
          ) : null}
        </div>
      )}

      {loadError && <p className="pro-alert" role="alert">{loadError}</p>}

      {fiscal && (
        <div className="pro-fiscal" role="status">
          <div className="pro-fiscal__row">
            <span className="pro-muted">Modo</span>
            <strong>{fiscal.useCai ? 'SAR (CAI)' : 'SIN control SAR'}</strong>
            <span className="pro-muted"> | </span>
            {fiscal.useCai && (!fiscal.allowNonSarDocument || useSarInvoice) && (
              <>
                <span className="pro-muted">Proximo (SAR)</span>
                <strong className="is-mono">
                  {fiscal.invoicePrefix}-{String((fiscal.currentCorrelative ?? 0) + 1).padStart(8, '0')}
                </strong>
              </>
            )}
            {fiscal.useCai && fiscal.allowNonSarDocument && !useSarInvoice && (
              <>
                <span className="pro-muted">Proximo (interno)</span>
                <strong className="is-mono">
                  {fiscal.internalDocPrefix || 'REC'}-
                  {String((fiscal.internalDocCurrent ?? 0) + 1).padStart(8, '0')}
                </strong>
              </>
            )}
            {!fiscal.useCai && (
              <span className="pro-muted">Referencia al guardar (SIN control SAR, correlativo local)</span>
            )}
          </div>
          {fiscal.warning && <div className="pro-fiscal__warn">{fiscal.warning}</div>}
        </div>
      )}

      {result && (
        <div className="pro-card" style={{ marginBottom: 16, borderColor: '#a7f3d0' }}>
          <h2 className="pro-hero__title" style={{ fontSize: 18, margin: 0 }}>
            Orden registrada
          </h2>
          <p className="pro-kpi__value" style={{ margin: '6px 0' }}>
            Factura <strong className="is-mono">{result.invoiceNumber}</strong> — total {formatMoney(result.total)}
            {result.change != null && result.change > 0 && (
              <>
                {' '}
                — cambio {formatMoney(result.change)}
              </>
            )}
          </p>
          <p className="pro-muted" style={{ margin: 0, fontSize: 12 }}>
            ISV {formatMoney(result.isv)} | Desc. {formatMoney(result.discountAmount)} |{' '}
            {result.caiMode ? 'SAR' : 'SIN control SAR'}
          </p>
          {!result.caiMode ? (
            <p className="pro-muted" style={{ margin: '6px 0 0', fontSize: 12, color: '#92400e' }}>
              Comprobante provisional/interno. Si aplica CAI, se regulariza y envia al validar conexion.
            </p>
          ) : null}
          <div className="pro-voucher-actions" style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link
              to={`/orders/voucher/${result.orderId}`}
              className="pro-button pro-button--as-link"
            >
              Ver comprobante
            </Link>
            {selectedPatient?.phone ? (
              <a
                className="pro-button pro-button--as-link"
                href={`https://wa.me/${selectedPatient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hola ${selectedPatient.fullName}, su comprobante de laboratorio esta listo: ${globalThis.location.origin}/orders/voucher/${result.orderId}`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Enviar por WhatsApp
              </a>
            ) : null}
            <a
              className="pro-button pro-button--as-link"
              href={`mailto:?subject=${encodeURIComponent('Comprobante de laboratorio')}&body=${encodeURIComponent(
                `Adjuntamos/compartimos su comprobante: ${globalThis.location.origin}/orders/voucher/${result.orderId}`
              )}`}
            >
              Enviar por correo
            </a>
          </div>
          <p className="pro-muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
            Envio al paciente solo si el paciente lo solicita.
          </p>
        </div>
      )}
      {offlineQueuedCode ? (
        <div className="pro-card" style={{ marginBottom: 16, borderColor: '#fde68a', background: '#fffbeb' }}>
          <h2 className="pro-hero__title" style={{ fontSize: 18, margin: 0 }}>
            Orden guardada en cola offline
          </h2>
          <p className="pro-kpi__value" style={{ margin: '6px 0' }}>
            Comprobante provisional <strong className="is-mono">{offlineQueuedCode}</strong>
          </p>
          <p className="pro-muted" style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
            No se enviara al paciente automaticamente. Si requiere factura CAI, podra venir por ella otro dia o
            enviarse solo cuando el paciente lo solicite tras validar el sistema en linea.
          </p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="pro-form-grid">
        <div className="pro-card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
            Paciente
          </h2>
          <div className="pro-field">
            <label htmlFor={`${idBase}-p`}>Busqueda</label>
            <input
              className="pro-input"
              id={`${idBase}-p`}
              value={patientQ}
              onChange={(ev) => {
                setPatientQ(ev.target.value);
              }}
              autoComplete="off"
            />
          </div>
          {selectedPatient && (
            <p>
              <strong>Seleccionado:</strong> {selectedPatient.fullName} (id {selectedPatient.id})
            </p>
          )}
          {listErr && <p className="pro-alert">{listErr}</p>}
          <ul className="pro-list" aria-label="Resultados paciente">
            {patients.map((p) => (
              <li key={p.id}>
                <button type="button" className="pro-ghost" onClick={() => setSelectedPatient(p)}>
                  {p.fullName}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pro-card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
            Examenes
          </h2>
          <div className="pro-field" style={{ marginBottom: 8 }}>
            <label>Buscar examen</label>
            <input
              className="pro-input"
              value={examQ}
              onChange={(ev) => setExamQ(ev.target.value)}
              placeholder="Nombre o código"
              autoComplete="off"
            />
          </div>
          <div className="pro-exam-pick" role="group" aria-label="Examen">
            {visibleExams.map((x) => (
              <label key={x.id} className="pro-cb">
                <input
                  type="checkbox"
                  checked={selectedExamIds.has(x.id)}
                  onChange={() => onToggleExam(x.id)}
                />
                {x.name} <span className="pro-muted">— {formatMoney(x.price)}</span>
              </label>
            ))}
            {visibleExams.length === 0 && <p className="pro-muted">No hay exámenes para ese filtro.</p>}
          </div>
          {selectedExamNames.length > 0 && inventoryOverview && inventoryOverview.lowStockReagents > 0 ? (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 8,
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(217, 119, 6, 0.4)',
                fontSize: 13,
              }}
            >
              <strong>Alerta inventario (no bloqueante):</strong> esta orden lleva {selectedExamNames.length} examen(es) y
              actualmente hay {inventoryOverview.lowStockReagents} reactivo(s) en bajo.
              {inventoryOverview.lowStockNames.length > 0 ? (
                <span> Revisar: {inventoryOverview.lowStockNames.join(', ')}.</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="pro-card">
          <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
            Descuento
          </h2>
          <div className="pro-field">
            <label>Tipo</label>
            <select
              className="pro-input"
              value={typeof discountId === 'number' ? String(discountId) : 'custom'}
              onChange={(ev) => {
                const v = ev.target.value;
                if (v === 'custom') {
                  setDiscountId('custom');
                } else {
                  setDiscountId(Number(v));
                }
              }}
            >
              {discounts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.percent}%)
                </option>
              ))}
              <option value="custom">Otro (manual)</option>
            </select>
          </div>
          {discountId === 'custom' && (
            <div className="pro-field" style={{ marginTop: 8 }}>
              <label>Porcentaje 0-100</label>
              <input
                className="pro-input"
                inputMode="decimal"
                value={customDiscount}
                onChange={(ev) => setCustomDiscount(ev.target.value)}
              />
            </div>
          )}
        </div>

        <div className="pro-card">
          <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
            Pago
          </h2>
          <div className="pro-field">
            <label>Forma de pago</label>
            <select
              className="pro-input"
              value={paymentMethodId ?? ''}
              onChange={(ev) => setPaymentMethodId(Number(ev.target.value))}
            >
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.inPhysicalDrawer ? '(caja)' : ''}
                </option>
              ))}
            </select>
            {paymentMethods.length === 0 && (
              <p className="pro-muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
                Cargue formas de pago: migracion + reinicio de API, o pida a un admin el catalogo.
              </p>
            )}
          </div>
          {methodRequiresReceived && (
            <div className="pro-field" style={{ marginTop: 8 }}>
              <label>Monto recibido (HNL)</label>
              <input
                className="pro-input"
                inputMode="decimal"
                value={amountReceived}
                onChange={(ev) => setAmountReceived(ev.target.value)}
              />
            </div>
          )}
        </div>

        {fiscal && fiscal.useCai && fiscal.allowNonSarDocument && (
          <div className="pro-card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
              Tipo de comprobante
            </h2>
            <p className="pro-muted" style={{ margin: '0 0 8px', fontSize: 13 }}>
              El administrador habilito dos secuencias: elija factura con correlativo SAR o comprobante interno (sin bloque
              CAI de esta resolucion).
            </p>
            <div className="pro-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="pro-cb" style={{ margin: 0 }}>
                <input
                  type="radio"
                  name={`${idBase}-sar`}
                  checked={useSarInvoice}
                  onChange={() => {
                    setUseSarInvoice(true);
                  }}
                />
                <span>Factura / comprobante con correlativo SAR (CAI)</span>
              </label>
              <label className="pro-cb" style={{ margin: 0 }}>
                <input
                  type="radio"
                  name={`${idBase}-sar`}
                  checked={!useSarInvoice}
                  onChange={() => {
                    setUseSarInvoice(false);
                  }}
                />
                <span>Comprobante interno (serie propia, sin asignar CAI de esta tanda)</span>
              </label>
            </div>
          </div>
        )}

        <div className="pro-card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
            Dato de facturacion
          </h2>
          <label className="pro-cb" style={{ marginBottom: 10, display: 'block' }}>
            <input type="checkbox" checked={isFinal} onChange={() => setIsFinal((f) => !f)} />
            Consumidor final
          </label>
          {!isFinal && (
            <div className="pro-cols">
              <div className="pro-field">
                <label>Razon social</label>
                <input className="pro-input" value={legalName} onChange={(ev) => setLegalName(ev.target.value)} />
              </div>
              <div className="pro-field">
                <label>RTN 14 digitos</label>
                <input
                  className="pro-input"
                  inputMode="numeric"
                  maxLength={16}
                  value={rtn}
                  onChange={(ev) => setRtn(ev.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pro-card" style={{ gridColumn: '1 / -1' }}>
          {error && (
            <p className="pro-alert" role="alert" style={{ marginTop: 10 }}>
              {error}
            </p>
          )}
          <div className="pro-form-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="submit" className="pro-button" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Facturar orden'}
            </button>
            {result && (
              <Link to={`/orders/voucher/${result.orderId}`} className="pro-button pro-button--as-link">
                Abrir comprobante
              </Link>
            )}
            <button
              type="button"
              className="pro-ghost"
              onClick={() => {
                setResult(null);
                setOfflineQueuedCode(null);
                setSelectedPatient(null);
                setSelectedExamIds(new Set());
                setError(null);
                setIdem(newIdemKey());
                setAmountReceived('');
                setIsFinal(true);
                setLegalName('');
                setRtn('');
                setPatientQ('');
                setUseSarInvoice(true);
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
