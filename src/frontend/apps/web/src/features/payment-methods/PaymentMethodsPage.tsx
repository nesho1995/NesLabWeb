import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { createPaymentMethod, getAllPaymentMethods, updatePaymentMethod } from './paymentMethods.api';
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from './paymentMethods.types';
import type { PaymentMethodListItem } from '../orders/orders.types';

export function PaymentMethodsPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [items, setItems] = useState<PaymentMethodListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newRow, setNewRow] = useState<CreatePaymentMethodInput>({
    code: '',
    name: '',
    sortOrder: 100,
    inPhysicalDrawer: false,
    requiresAmountReceived: false,
  });
  const [textDraft, setTextDraft] = useState<Record<number, { name: string; sortOrder: number }>>({});

  const load = useCallback(async () => {
    const d = await getAllPaymentMethods();
    setItems(d);
  }, []);

  useEffect(() => {
    let c = true;
    (async () => {
      try {
        setLoadError(null);
        await load();
      } catch (e) {
        if (c) {
          setLoadError(e instanceof Error ? e.message : 'Error');
        }
      }
    })();
    return () => {
      c = false;
    };
  }, [load]);

  useEffect(() => {
    const o: Record<number, { name: string; sortOrder: number }> = {};
    for (const m of items) {
      o[m.id] = { name: m.name, sortOrder: m.sortOrder };
    }
    setTextDraft(o);
  }, [items]);

  async function onAdd(ev: FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      await createPaymentMethod(newRow);
      setNewRow((x) => ({ ...x, code: '', name: '', sortOrder: (x.sortOrder ?? 0) + 10 }));
      await load();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'No se pudo agregar');
    } finally {
      setSaving(false);
    }
  }

  async function patchItem(id: number, patch: UpdatePaymentMethodInput) {
    setSaving(true);
    try {
      setLoadError(null);
      await updatePaymentMethod(id, patch);
      await load();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  }

  function commitNameSort(m: PaymentMethodListItem) {
    const t = textDraft[m.id];
    if (!t) {
      return;
    }
    if (t.name === m.name && t.sortOrder === m.sortOrder) {
      return;
    }
    void patchItem(m.id, {
      name: t.name.trim() || m.name,
      sortOrder: t.sortOrder,
      isActive: m.isActive,
      inPhysicalDrawer: m.inPhysicalDrawer,
      requiresAmountReceived: m.requiresAmountReceived,
    });
  }

  if (loadError && items.length === 0) {
    return (
      <div className="pro-card" style={{ maxWidth: 640, borderColor: 'rgba(220,38,38,0.35)' }}>
        <p>{loadError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="pro-hero" style={{ marginBottom: 12 }}>
        <h1 className="pro-hero__title" style={{ fontSize: 22 }}>
          Formas de pago (empresa)
        </h1>
        <p className="pro-hero__desc" style={{ margin: 0 }}>
          Catalogo por empresa: afecta nuevas ordenes, comprobantes y cierre. <strong>Caja fisica</strong> define que
          montos arquean con efectivo; <strong>monto recibido</strong> activa vuelto (típico efectivo).
        </p>
        <p className="pro-muted" style={{ margin: '10px 0 0', fontSize: 14 }}>
          <Link to="/admin/empresa-caja" className="pro-content-link">
            Configuracion de caja
          </Link>
          <span> — caja chica y metodos que entran al arqueo.</span>
        </p>
        <CrossModuleLinks
          marginTop={8}
          items={[
            { to: '/caja/cierre', label: 'Caja', show: hasPermission('CAJA.CERRAR') },
            { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
            { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
            { to: '/admin/users', label: 'Usuarios', show: hasPermission('USUARIO.READ') },
          ]}
        />
      </div>
      {loadError ? <p className="pro-alert">{loadError}</p> : null}
      <div className="pro-card" style={{ marginBottom: 12, maxWidth: 900 }}>
        <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
          Formas actuales
        </h2>
        <div style={{ overflow: 'auto' }}>
          <table className="pro-list" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 4 }}>Codigo</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Nombre</th>
                <th style={{ textAlign: 'right', padding: 4 }}>Orden</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Caja</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Monto</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Activo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td style={{ padding: 4 }} className="is-mono">
                    {m.code}
                  </td>
                  <td style={{ padding: 4 }}>
                    <input
                      className="pro-input"
                      style={{ minWidth: 140, fontSize: 14 }}
                      value={textDraft[m.id]?.name ?? m.name}
                      onChange={(e) =>
                        setTextDraft((d) => ({
                          ...d,
                          [m.id]: {
                            name: e.target.value,
                            sortOrder: d[m.id]?.sortOrder ?? m.sortOrder,
                          },
                        }))
                      }
                      onBlur={() => commitNameSort(m)}
                      disabled={saving}
                    />
                  </td>
                  <td style={{ padding: 4, textAlign: 'right' }}>
                    <input
                      className="pro-input"
                      type="number"
                      style={{ maxWidth: 88, textAlign: 'right' }}
                      value={textDraft[m.id]?.sortOrder ?? m.sortOrder}
                      onChange={(e) =>
                        setTextDraft((d) => ({
                          ...d,
                          [m.id]: {
                            name: d[m.id]?.name ?? m.name,
                            sortOrder: parseInt(e.target.value, 10) || 0,
                          },
                        }))
                      }
                      onBlur={() => commitNameSort(m)}
                      disabled={saving}
                    />
                  </td>
                  <td style={{ padding: 4 }}>
                    <input
                      type="checkbox"
                      checked={m.inPhysicalDrawer}
                      onChange={() =>
                        void patchItem(m.id, {
                          name: m.name,
                          sortOrder: m.sortOrder,
                          isActive: m.isActive,
                          inPhysicalDrawer: !m.inPhysicalDrawer,
                          requiresAmountReceived: m.requiresAmountReceived,
                        })
                      }
                      disabled={saving}
                    />
                  </td>
                  <td style={{ padding: 4 }}>
                    <input
                      type="checkbox"
                      checked={m.requiresAmountReceived}
                      onChange={() =>
                        void patchItem(m.id, {
                          name: m.name,
                          sortOrder: m.sortOrder,
                          isActive: m.isActive,
                          inPhysicalDrawer: m.inPhysicalDrawer,
                          requiresAmountReceived: !m.requiresAmountReceived,
                        })
                      }
                      disabled={saving}
                    />
                  </td>
                  <td style={{ padding: 4 }}>
                    <input
                      type="checkbox"
                      checked={m.isActive}
                      onChange={() =>
                        void patchItem(m.id, {
                          name: m.name,
                          sortOrder: m.sortOrder,
                          isActive: !m.isActive,
                          inPhysicalDrawer: m.inPhysicalDrawer,
                          requiresAmountReceived: m.requiresAmountReceived,
                        })
                      }
                      disabled={saving}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pro-muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
          Caja fis. = entra al arqueo. Vuelto = pide monto recibido.
        </p>
      </div>
      <form onSubmit={onAdd} className="pro-card" style={{ maxWidth: 500 }}>
        <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
          Agregar
        </h2>
        <p className="pro-muted" style={{ fontSize: 13 }}>Codigo unico (A-Z, numeros, guion p.ej. POS, QR-VALE)</p>
        <input
          className="pro-input"
          value={newRow.code}
          onChange={(e) => setNewRow((x) => ({ ...x, code: e.target.value }))}
          placeholder="Codigo"
        />
        <input
          className="pro-input"
          value={newRow.name}
          onChange={(e) => setNewRow((x) => ({ ...x, name: e.target.value }))}
          placeholder="Nombre en pantalla"
          style={{ marginTop: 8 }}
        />
        <input
          className="pro-input"
          type="number"
          value={newRow.sortOrder}
          onChange={(e) => setNewRow((x) => ({ ...x, sortOrder: parseInt(e.target.value, 10) || 0 }))}
          style={{ maxWidth: 100, marginTop: 8 }}
        />
        <div className="pro-cb" style={{ marginTop: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={newRow.inPhysicalDrawer}
              onChange={() => setNewRow((x) => ({ ...x, inPhysicalDrawer: !x.inPhysicalDrawer }))}
            />
            Suma a caja fisica (arqueo)
          </label>
        </div>
        <div className="pro-cb" style={{ marginTop: 4 }}>
          <label>
            <input
              type="checkbox"
              checked={newRow.requiresAmountReceived}
              onChange={() => setNewRow((x) => ({ ...x, requiresAmountReceived: !x.requiresAmountReceived }))}
            />
            Requiere monto recibido / vuelto
          </label>
        </div>
        <button className="pro-btn" type="submit" style={{ marginTop: 8 }} disabled={saving || !newRow.code?.trim()}>
          Agregar forma
        </button>
      </form>
    </div>
  );
}
