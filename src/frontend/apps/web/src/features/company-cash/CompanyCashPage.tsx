import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { getCompanyCashSettings, putCompanyCashSettings } from './companyCash.api';

export function CompanyCashPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [cashPettyCashEnabled, setCashPettyCashEnabled] = useState(true);
  const [cashPettyCashDefault, setCashPettyCashDefault] = useState(0);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        setSaved(null);
        const d = await getCompanyCashSettings();
        if (!ok) {
          return;
        }
        setCompanyId(d.companyId);
        setCashPettyCashEnabled(d.cashPettyCashEnabled);
        setCashPettyCashDefault(Number(d.cashPettyCashDefault));
      } catch (e) {
        if (ok) {
          setLoadError(e instanceof Error ? e.message : 'No se pudo cargar la politica de caja.');
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
  }, []);

  if (loading) {
    return (
      <div className="pro-card" style={{ maxWidth: 560 }}>
        <p className="pro-muted" style={{ margin: 0 }}>
          Cargando politica de caja de la empresa
        </p>
        <div className="pro-shimmer" style={{ height: 8, marginTop: 12, maxWidth: 220 }} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pro-card" style={{ maxWidth: 560, borderColor: 'rgba(220, 38, 38, 0.35)' }}>
        <h1 className="pro-hero__title" style={{ margin: 0, fontSize: 20 }}>
          No se pudo leer la configuracion
        </h1>
        <p className="pro-muted" style={{ margin: '10px 0 0' }}>{loadError}</p>
      </div>
    );
  }

  async function onSave(ev: FormEvent) {
    ev.preventDefault();
    setSaved(null);
    setSaveError(null);
    setSaving(true);
    try {
      const monto = Math.max(0, Number(cashPettyCashDefault) || 0);
      const d = await putCompanyCashSettings({
        cashShiftsPerDay: 1,
        cashPettyCashEnabled,
        cashPettyCashDefault: monto,
      });
      setCompanyId(d.companyId);
      setCashPettyCashEnabled(d.cashPettyCashEnabled);
      setCashPettyCashDefault(Number(d.cashPettyCashDefault));
      setSaved('Cambios guardados correctamente.');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="pro-hero" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
        <div>
          <h1 className="pro-hero__title">Politica de caja (por empresa)</h1>
          <p className="pro-hero__desc" style={{ marginBottom: 0 }}>
            Aplica a la <strong>empresa de la sesion actual</strong>. Incluye configuracion de caja chica
            para apoyar apertura y cierre diario.
          </p>
          <p className="pro-muted" style={{ margin: '10px 0 0', fontSize: 14 }}>
            <Link to="/admin/formas-pago" className="pro-content-link">
              Formas de pago
            </Link>
            <span> — definen que entra al arqueo; deben alinearse a este flujo.</span>
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
      </div>

      {saveError ? (
        <div
          className="pro-card"
          style={{
            marginBottom: 12,
            maxWidth: 640,
            borderColor: 'rgba(220, 38, 38, 0.35)',
            background: 'rgba(254, 226, 226, 0.35)',
          }}
        >
          <p className="pro-muted" style={{ margin: 0, color: '#991b1b' }}>{saveError}</p>
        </div>
      ) : null}
      {saved ? (
        <div
          className="pro-card"
          style={{
            marginBottom: 12,
            maxWidth: 640,
            background: 'rgba(16, 185, 129, 0.08)',
            borderColor: 'rgba(5, 150, 105, 0.35)',
          }}
        >
          <p className="pro-muted" style={{ margin: 0, color: '#047857' }}>{saved}</p>
        </div>
      ) : null}

      <form onSubmit={onSave} className="pro-card" style={{ maxWidth: 640 }} aria-label="Parametros de caja chica">
        {companyId !== null ? (
          <p className="pro-muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
            Empresa (sesion) ID <code style={{ fontFamily: 'var(--pro-font-mono)' }}>{companyId}</code>
          </p>
        ) : null}

        <div className="pro-cb" style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={cashPettyCashEnabled}
              onChange={(ev) => setCashPettyCashEnabled(ev.target.checked)}
            />
            <span>
              <strong>Usar caja chica</strong>
              <span className="pro-muted" style={{ display: 'block', fontSize: 13, fontWeight: 400 }}>
                Fondo para dar cambio en el flujo de apertura/cierre (se puede apagar si no aplica).
              </span>
            </span>
          </label>
        </div>

        <label
          style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}
          htmlFor="petty"
        >
          Monto sugerido o base (HNL)
        </label>
        <p className="pro-muted" style={{ margin: '0 0 6px', fontSize: 13 }}>
          Referencia al abrir caja; el operador podra ajustar el valor real al implementar cierre.
        </p>
        <input
          id="petty"
          className="pro-input"
          type="number"
          min={0}
          step="0.01"
          value={Number.isNaN(cashPettyCashDefault) ? '' : cashPettyCashDefault}
          onChange={(ev) => setCashPettyCashDefault(parseFloat(ev.target.value) || 0)}
          disabled={!cashPettyCashEnabled}
          style={{ maxWidth: 160, marginBottom: 8 }}
        />

        <p className="pro-muted" style={{ margin: '0 0 12px', fontSize: 12 }}>
          Monto caja chica mayor o igual a cero.
        </p>

        <div className="pro-actions-row" style={{ marginTop: 8 }}>
          <button className="pro-btn" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar politica'}
          </button>
        </div>
      </form>
    </div>
  );
}
