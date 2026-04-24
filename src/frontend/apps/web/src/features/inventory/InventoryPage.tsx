import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { useAuth } from '../auth/AuthProvider';
import { adjustReagent, createReagent, getReagentStock, updateReagent } from './inventory.api';
import type { CreateReagentInput, ReagentStockItem } from './inventory.types';

const commonUnits = ['ml', 'L', 'mg', 'g', 'kg', 'tira', 'frasco', 'kit', 'caja', 'unidad'];

const exampleReagents: Array<Pick<CreateReagentInput, 'name' | 'unit' | 'currentStock' | 'minimumStock'>> = [
  { name: 'Reactivo glucosa enzimatica', unit: 'ml', currentStock: 500, minimumStock: 120 },
  { name: 'Tiras de orina 10 parametros', unit: 'tira', currentStock: 300, minimumStock: 80 },
  { name: 'Kit hemograma 3 diff', unit: 'kit', currentStock: 18, minimumStock: 6 },
  { name: 'Control normal hematologia', unit: 'frasco', currentStock: 10, minimumStock: 3 },
  { name: 'Reactivo colesterol total', unit: 'ml', currentStock: 250, minimumStock: 70 },
  { name: 'Solucion lavado analizador', unit: 'L', currentStock: 12, minimumStock: 4 },
];

function n3(x: number) {
  return x.toLocaleString('es-HN', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

export function InventoryPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<ReagentStockItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRow, setNewRow] = useState<CreateReagentInput>({
    code: '',
    name: '',
    unit: 'unidad',
    currentStock: 0,
    minimumStock: 0,
  });
  const [draftMin, setDraftMin] = useState<Record<number, string>>({});
  const [deltaById, setDeltaById] = useState<Record<number, string>>({});
  const [customUnit, setCustomUnit] = useState('');

  const load = useCallback(async () => {
    const d = await getReagentStock(showInactive);
    setItems(d);
  }, [showInactive]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'No se pudo cargar inventario.');
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
  }, [load]);

  useEffect(() => {
    const next: Record<number, string> = {};
    for (const it of items) {
      next[it.id] = String(it.minimumStock);
    }
    setDraftMin(next);
  }, [items]);

  async function onCreate(ev: FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      setError(null);
      const unit = (newRow.unit === 'otra' ? customUnit : newRow.unit).trim() || 'unidad';
      await createReagent({ ...newRow, unit });
      setNewRow({ code: '', name: '', unit: 'unidad', currentStock: 0, minimumStock: 0 });
      setCustomUnit('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear reactivo.');
    } finally {
      setSaving(false);
    }
  }

  async function onLoadExamples() {
    setSaving(true);
    try {
      setError(null);
      for (const ex of exampleReagents) {
        await createReagent({
          code: '',
          name: ex.name,
          unit: ex.unit,
          currentStock: ex.currentStock,
          minimumStock: ex.minimumStock,
        });
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar ejemplos.');
    } finally {
      setSaving(false);
    }
  }

  async function onUpdateMin(item: ReagentStockItem) {
    const min = parseFloat((draftMin[item.id] ?? '').replace(',', '.'));
    if (!Number.isFinite(min) || min < 0) {
      setError('Minimo invalido.');
      return;
    }
    setSaving(true);
    try {
      setError(null);
      await updateReagent(item.id, {
        name: item.name,
        unit: item.unit,
        minimumStock: min,
        isActive: item.isActive,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar minimo.');
    } finally {
      setSaving(false);
    }
  }

  async function onToggleActive(item: ReagentStockItem) {
    setSaving(true);
    try {
      setError(null);
      await updateReagent(item.id, {
        name: item.name,
        unit: item.unit,
        minimumStock: item.minimumStock,
        isActive: !item.isActive,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar estado.');
    } finally {
      setSaving(false);
    }
  }

  async function onAdjust(item: ReagentStockItem) {
    const delta = parseFloat((deltaById[item.id] ?? '').replace(',', '.'));
    if (!Number.isFinite(delta) || delta === 0) {
      setError('Ajuste invalido (usa + o -).');
      return;
    }
    setSaving(true);
    try {
      setError(null);
      await adjustReagent(item.id, delta, 'Ajuste manual desde inventario');
      setDeltaById((d) => ({ ...d, [item.id]: '' }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ajustar inventario.');
    } finally {
      setSaving(false);
    }
  }

  const lowCount = items.filter((x) => x.isActive && x.isBelowMinimum).length;

  return (
    <div>
      <div className="pro-hero" style={{ marginBottom: 12 }}>
        <h1 className="pro-hero__title" style={{ fontSize: 22 }}>
          Inventario de reactivos
        </h1>
        <p className="pro-hero__desc" style={{ margin: 0 }}>
          Controla existencias para saber si puedes procesar examenes. Alertas en bajo stock y ajuste rapido de
          entradas/salidas.
        </p>
        <p className="pro-muted" style={{ margin: '8px 0 0' }}>
          Reactivos en minimo o bajo: <strong>{lowCount}</strong>
        </p>
        <p className="pro-muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
          Modo permisivo: por ahora solo alerta stock bajo, no bloquea ordenes.
        </p>
        <CrossModuleLinks
          marginTop={8}
          items={[
            { to: '/admin/catalogo-examenes', label: 'Catalogo de examenes', show: hasPermission('EMPRESA.CONFIG') },
            { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
            { to: '/caja/cierre', label: 'Cierre de caja', show: hasPermission('CAJA.CERRAR') },
          ]}
        />
      </div>

      {error ? <p className="pro-alert">{error}</p> : null}

      <div className="pro-card" style={{ marginBottom: 12, maxWidth: 980 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 className="pro-h3" style={{ margin: 0 }}>Stock actual</h2>
          <label className="pro-muted" style={{ fontSize: 13 }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={() => setShowInactive((v) => !v)}
              style={{ marginRight: 6 }}
            />
            Mostrar inactivos
          </label>
        </div>
        {loading ? (
          <p className="pro-muted" style={{ margin: 0 }}>Cargando inventario...</p>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table className="pro-list" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 4 }}>Codigo</th>
                  <th style={{ textAlign: 'left', padding: 4 }}>Reactivo</th>
                  <th style={{ textAlign: 'left', padding: 4 }}>Unidad</th>
                  <th style={{ textAlign: 'right', padding: 4 }}>Existencia</th>
                  <th style={{ textAlign: 'right', padding: 4 }}>Minimo</th>
                  <th style={{ textAlign: 'left', padding: 4 }}>Estado</th>
                  <th style={{ textAlign: 'right', padding: 4 }}>Ajuste</th>
                  <th style={{ textAlign: 'left', padding: 4 }}>Activo</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ padding: 4 }} className="is-mono">{it.code}</td>
                    <td style={{ padding: 4 }}>{it.name}</td>
                    <td style={{ padding: 4 }}>{it.unit}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{n3(it.currentStock)}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>
                      <input
                        className="pro-input"
                        style={{ maxWidth: 100, textAlign: 'right' }}
                        value={draftMin[it.id] ?? String(it.minimumStock)}
                        onChange={(e) => setDraftMin((d) => ({ ...d, [it.id]: e.target.value }))}
                        onBlur={() => void onUpdateMin(it)}
                        disabled={saving}
                      />
                    </td>
                    <td style={{ padding: 4 }}>
                      {it.isBelowMinimum && it.isActive ? (
                        <span style={{ color: '#b45309', fontWeight: 700 }}>Bajo</span>
                      ) : (
                        <span className="pro-muted">OK</span>
                      )}
                    </td>
                    <td style={{ padding: 4, textAlign: 'right' }}>
                      <input
                        className="pro-input"
                        style={{ maxWidth: 90, textAlign: 'right' }}
                        placeholder="+10 o -2"
                        value={deltaById[it.id] ?? ''}
                        onChange={(e) => setDeltaById((d) => ({ ...d, [it.id]: e.target.value }))}
                        disabled={saving}
                      />
                      <button
                        className="pro-btn"
                        type="button"
                        style={{ marginLeft: 6 }}
                        onClick={() => void onAdjust(it)}
                        disabled={saving}
                      >
                        Aplicar
                      </button>
                    </td>
                    <td style={{ padding: 4 }}>
                      <input
                        type="checkbox"
                        checked={it.isActive}
                        onChange={() => void onToggleActive(it)}
                        disabled={saving}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={onCreate} className="pro-card" style={{ maxWidth: 540 }}>
        <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>Agregar reactivo</h2>
        <p className="pro-muted" style={{ marginTop: 0, fontSize: 13 }}>
          Si dejas el codigo vacio, el sistema genera uno automatico (`REA-001`, `REA-002`, ...).
        </p>
        <input
          className="pro-input"
          value={newRow.code}
          onChange={(e) => setNewRow((x) => ({ ...x, code: e.target.value }))}
          placeholder="Codigo (ej. GLUC-001)"
        />
        <input
          className="pro-input"
          value={newRow.name}
          onChange={(e) => setNewRow((x) => ({ ...x, name: e.target.value }))}
          placeholder="Nombre del reactivo"
          style={{ marginTop: 8 }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <select
            className="pro-input"
            value={newRow.unit}
            onChange={(e) => setNewRow((x) => ({ ...x, unit: e.target.value }))}
          >
            {commonUnits.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
            <option value="otra">otra...</option>
          </select>
          {newRow.unit === 'otra' ? (
            <input
              className="pro-input"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Unidad personalizada"
            />
          ) : null}
          <input
            className="pro-input"
            type="number"
            step="0.001"
            value={newRow.currentStock}
            onChange={(e) => setNewRow((x) => ({ ...x, currentStock: parseFloat(e.target.value) || 0 }))}
            placeholder="Existencia inicial"
          />
          <input
            className="pro-input"
            type="number"
            step="0.001"
            value={newRow.minimumStock}
            onChange={(e) => setNewRow((x) => ({ ...x, minimumStock: parseFloat(e.target.value) || 0 }))}
            placeholder="Minimo"
          />
        </div>
        <button className="pro-btn" type="submit" style={{ marginTop: 10 }} disabled={saving || !newRow.name.trim()}>
          Agregar reactivo
        </button>
        <button className="pro-btn secondary" type="button" style={{ marginTop: 10, marginLeft: 8 }} disabled={saving} onClick={() => void onLoadExamples()}>
          Cargar ejemplos de prueba
        </button>
      </form>
    </div>
  );
}
