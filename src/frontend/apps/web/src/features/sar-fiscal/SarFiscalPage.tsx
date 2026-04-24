import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { getFiscalCompany, putFiscalBranding, putFiscalSarConfig } from './sarFiscal.api';
import type { CompanyFiscalStatus } from './fiscal.types';

export type { CompanyFiscalStatus } from './fiscal.types';

export function SarFiscalPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const canConfigSar = hasPermission('EMPRESA.CONFIG');
  const [data, setData] = useState<CompanyFiscalStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [useCai, setUseCai] = useState(false);
  const [invoicePrefix, setInvoicePrefix] = useState('INT');
  const [invoiceStart, setInvoiceStart] = useState('');
  const [invoiceEnd, setInvoiceEnd] = useState('');
  const [cai, setCai] = useState('');
  const [rangeLabel, setRangeLabel] = useState('');
  const [caiDue, setCaiDue] = useState('');
  const [resetCorrelative, setResetCorrelative] = useState(false);
  const [allowNonSar, setAllowNonSar] = useState(false);
  const [internalDocPrefix, setInternalDocPrefix] = useState('REC');
  const [titleSar, setTitleSar] = useState('');
  const [titleInternal, setTitleInternal] = useState('');
  const [clasificacion, setClasificacion] = useState('');
  const [footerLines, setFooterLines] = useState('');
  const [exigirLine, setExigirLine] = useState('');
  const [labDisplayName, setLabDisplayName] = useState('');
  const [labLogoUrl, setLabLogoUrl] = useState('');
  const [labAddress, setLabAddress] = useState('');
  const [labPhone, setLabPhone] = useState('');
  const [labEmail, setLabEmail] = useState('');
  const [defaultPrintProfile, setDefaultPrintProfile] = useState<'standard' | 'compact' | 'thermal' | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);
  const [formErrorBranding, setFormErrorBranding] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await getFiscalCompany();
    setData(d);
    setUseCai(d.useCai);
    setInvoicePrefix(d.invoicePrefix || 'INT');
    setInvoiceStart(d.rangeStart != null ? String(d.rangeStart) : '');
    setInvoiceEnd(d.rangeEnd != null ? String(d.rangeEnd) : '');
    setCai(d.cai ?? '');
    setRangeLabel(d.rangeLabel ?? '');
    setCaiDue(d.caiDueDate ? d.caiDueDate.slice(0, 10) : '');
    setResetCorrelative(false);
    setAllowNonSar(!!d.allowNonSarDocument);
    setInternalDocPrefix((d.internalDocPrefix || 'REC').trim() || 'REC');
    const br = d.branding;
    setTitleSar(br?.documentTitleSar?.trim() ?? '');
    setTitleInternal(br?.documentTitleInternal?.trim() ?? '');
    setClasificacion(br?.clasificacionActividad?.trim() ?? '');
    setFooterLines((br?.footerLines ?? []).join('\n'));
    setExigirLine(br?.exigirFacturaLine?.trim() ?? '');
    setLabDisplayName(br?.laboratoryDisplayName?.trim() ?? '');
    setLabLogoUrl(br?.laboratoryLogoUrl?.trim() ?? '');
    setLabAddress(br?.laboratoryAddress?.trim() ?? '');
    setLabPhone(br?.laboratoryPhone?.trim() ?? '');
    setLabEmail(br?.laboratoryEmail?.trim() ?? '');
    setDefaultPrintProfile((br?.defaultPrintProfile as 'standard' | 'compact' | 'thermal' | null) ?? null);
  }, []);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (e) {
        if (ok) {
          setData(null);
          setError(e instanceof Error ? e.message : 'No se pudo cargar el estado fiscal.');
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
  }, [load]);

  async function onSaveBranding(ev: FormEvent) {
    ev.preventDefault();
    if (!canConfigSar) {
      return;
    }
    setFormErrorBranding(null);
    setSavingBranding(true);
    try {
      const fl = footerLines
        .split('\n')
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
      await putFiscalBranding({
        laboratoryDisplayName: labDisplayName.trim() || null,
        laboratoryLogoUrl: labLogoUrl.trim() || null,
        laboratoryAddress: labAddress.trim() || null,
        laboratoryPhone: labPhone.trim() || null,
        laboratoryEmail: labEmail.trim() || null,
        defaultPrintProfile,
        documentTitleSar: titleSar.trim() || null,
        documentTitleInternal: titleInternal.trim() || null,
        clasificacionActividad: clasificacion.trim() || null,
        footerLines: fl.length ? fl : null,
        exigirFacturaLine: exigirLine.trim() || null,
      });
      await load();
    } catch (e) {
      setFormErrorBranding(e instanceof Error ? e.message : 'Error al guardar textos');
    } finally {
      setSavingBranding(false);
    }
  }

  async function onSaveSar(ev: FormEvent) {
    ev.preventDefault();
    if (!canConfigSar) {
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const s = invoiceStart.trim() ? parseInt(invoiceStart, 10) : NaN;
      const f = invoiceEnd.trim() ? parseInt(invoiceEnd, 10) : NaN;
      await putFiscalSarConfig({
        useCai,
        invoicePrefix: invoicePrefix.trim() || 'INT',
        invoiceStart: useCai ? (Number.isFinite(s) ? s : null) : null,
        invoiceEnd: useCai ? (Number.isFinite(f) ? f : null) : null,
        cai: cai.trim(),
        rangeLabel: rangeLabel.trim(),
        caiDueDate: caiDue ? `${caiDue}T00:00:00.000Z` : null,
        resetCorrelativeToRangeStart: resetCorrelative,
        allowNonSarDocument: useCai ? allowNonSar : false,
        internalDocPrefix: internalDocPrefix.trim() || 'REC',
      });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="pro-card" style={{ maxWidth: 720 }}>
        <p className="pro-muted" style={{ margin: 0 }}>
          Cargando guia y estado SAR…
        </p>
        <div className="pro-shimmer" style={{ height: 8, marginTop: 12, maxWidth: 280 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pro-card" style={{ maxWidth: 720, borderColor: 'rgba(220, 38, 38, 0.35)' }}>
        <h1 className="pro-hero__title" style={{ margin: 0, fontSize: 20 }}>
          No se pudo leer el fiscal de la empresa
        </h1>
        <p className="pro-muted" style={{ margin: '10px 0 0' }}>
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <div className="pro-hero" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
        <div>
          <h1 className="pro-hero__title">Cumplimiento y SAR (Honduras)</h1>
          <p className="pro-hero__desc">
            Vista alineada a lo que el SAR espera: CAI, rango de correlativos, vencimientos e ISV en
            comprobantes. Aqui se resume el <strong>estado actual</strong> de la empresa activa, no
            reemplaza asesoria tributaria.
          </p>
          <CrossModuleLinks
            marginTop={10}
            items={[
              { to: '/orders', label: 'Nueva orden', show: hasPermission('ORDEN.CREATE') },
              { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
              { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
              { to: '/caja/cierre', label: 'Cierre de caja', show: hasPermission('CAJA.CERRAR') },
              { to: '/admin/empresa-caja', label: 'Política de caja', show: hasPermission('EMPRESA.CONFIG') },
            ]}
          />
        </div>
      </div>
      {data.warning ? (
        <div
          className="pro-card"
          style={{
            marginBottom: 12,
            background: 'rgba(251, 191, 36, 0.1)',
            borderColor: 'rgba(217, 119, 6, 0.35)',
          }}
        >
          <strong>Atencion</strong>
          <p className="pro-muted" style={{ margin: '8px 0 0' }}>
            {data.warning}
          </p>
        </div>
      ) : null}
      <div
        className="pro-grid-3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        <div className="pro-card" style={{ margin: 0 }}>
          <p className="pro-muted" style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>
            Empresa
          </p>
          <p style={{ margin: '6px 0 0', fontWeight: 800 }}>{data.companyName}</p>
          <p className="pro-muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
            {data.isActive ? 'Activa' : 'Inactiva'}
          </p>
        </div>
        <div className="pro-card" style={{ margin: 0 }}>
          <p className="pro-muted" style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>
            CAI
          </p>
          <p
            className="pro-muted"
            style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.45, wordBreak: 'break-all' }}
          >
            {data.cai?.trim() ? data.cai : 'Sin CAI registrado'}
          </p>
        </div>
        <div className="pro-card" style={{ margin: 0 }}>
          <p className="pro-muted" style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>
            Vencimiento
          </p>
          <p className="pro-muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
            {data.caiDueDate
              ? new Date(data.caiDueDate).toLocaleDateString('es-HN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/D'}
            {data.daysUntilCaiExpires != null && (
              <span>
                {` `}(
                {data.daysUntilCaiExpires >= 0
                  ? `${data.daysUntilCaiExpires} dias restantes`
                  : 'vencido'}
                )
              </span>
            )}
          </p>
        </div>
      </div>
      <div
        className="pro-card"
        style={{ marginTop: 12, maxWidth: 720, display: 'grid', gap: 10, fontSize: 14, lineHeight: 1.55 }}
      >
        <p className="pro-topbar__kicker" style={{ margin: 0 }}>
          Rango y correlativos
        </p>
        <p>
          <strong>Prefijo / serie</strong> {data.invoicePrefix} · <strong>Correlativo</strong>{' '}
          {data.currentCorrelative != null ? data.currentCorrelative : 'N/D'}
        </p>
        {data.rangeLabel != null && (
          <p>
            <strong>Rango autorizado (CAI)</strong> {data.rangeLabel}
          </p>
        )}
        {data.rangeStart != null && data.rangeEnd != null && (
          <p className="pro-muted" style={{ margin: 0 }}>
            Numeros entre {data.rangeStart} y {data.rangeEnd} mientras el CAI y la vigencia apliquen.
          </p>
        )}
        {data.useCai && data.allowNonSarDocument && (
          <p>
            <strong>Comprobante interno (sin CAI)</strong> prefijo {data.internalDocPrefix} · ultimo{' '}
            {data.internalDocCurrent != null ? data.internalDocCurrent : 'N/D'}
          </p>
        )}
        <p>
          <strong>Estado CAI (vigencia y rango)</strong>{' '}
          {data.isCaiValid ? (
            <span style={{ color: '#166534' }}>OK</span>
          ) : (
            <span style={{ color: '#b91c1c' }}>Revisar: falta dato, vencio o rango excedido</span>
          )}
        </p>
        <p className="pro-muted" style={{ margin: 0 }}>
          <strong>ISV</strong>: el impuesto al valor agregado se aplica con la tasa vigente por linea
          o por totales, segun politica y comprobante; en NesLab, las ordenes validan criterio fiscal
          (consumidor final, exonerado, crédito) antes de asignar correlativo.
        </p>
      </div>
      {canConfigSar ? (
        <form className="pro-card" onSubmit={onSaveSar} style={{ marginTop: 12, maxWidth: 640 }}>
          <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
            Configuracion SAR (empresa)
          </h2>
          <p className="pro-muted" style={{ margin: '0 0 10px', fontSize: 13 }}>
            Requiere <strong>EMPRESA.CONFIG</strong>. Al guardar, el servidor valida con las mismas
            reglas que el cobro. Use &quot;Reiniciar correlativo&quot; al cambiar de rango o CAI.
          </p>
          {formError ? <p className="pro-alert">{formError}</p> : null}
          <div className="pro-field" style={{ marginBottom: 10 }}>
            <label className="pro-inline">
              <input type="checkbox" checked={useCai} onChange={(e) => setUseCai(e.target.checked)} />
              <span>Utilizar facturacion con SAR (CAI) en esta empresa</span>
            </label>
          </div>
          <div className="pro-field">
            <label>Prefijo / serie</label>
            <input
              className="pro-input"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              maxLength={12}
            />
          </div>
          {useCai ? (
            <>
              <div className="pro-toolbar__row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                <div className="pro-field" style={{ minWidth: 120 }}>
                  <label>Correlativo inicio (autorizado)</label>
                  <input
                    className="pro-input"
                    inputMode="numeric"
                    value={invoiceStart}
                    onChange={(e) => setInvoiceStart(e.target.value.replace(/\D/g, ''))}
                    placeholder="ej. 1"
                  />
                </div>
                <div className="pro-field" style={{ minWidth: 120 }}>
                  <label>Correlativo fin</label>
                  <input
                    className="pro-input"
                    inputMode="numeric"
                    value={invoiceEnd}
                    onChange={(e) => setInvoiceEnd(e.target.value.replace(/\D/g, ''))}
                    placeholder="ej. 2000"
                  />
                </div>
              </div>
              <div className="pro-field">
                <label>Texto (CAI / rango en comprobante)</label>
                <input className="pro-input" value={cai} onChange={(e) => setCai(e.target.value)} maxLength={500} />
              </div>
              <div className="pro-field">
                <label>Etiqueta o descripcion de rango (opcional)</label>
                <input
                  className="pro-input"
                  value={rangeLabel}
                  onChange={(e) => setRangeLabel(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="pro-field">
                <label>Vencimiento del CAI (fecha local)</label>
                <input className="pro-input" type="date" value={caiDue} onChange={(e) => setCaiDue(e.target.value)} />
              </div>
              <div className="pro-field" style={{ marginTop: 8 }}>
                <label className="pro-inline">
                  <input
                    type="checkbox"
                    checked={allowNonSar}
                    onChange={(e) => setAllowNonSar(e.target.checked)}
                  />
                  <span>Permitir comprobante interno (otra secuencia, sin bloque SAR) ademas de la factura CAI</span>
                </label>
                <p className="pro-muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
                  En caja, el operador podra elegir factura con correlativo SAR o nota interna. Si no marca esto, solo
                  facturacion SAR.
                </p>
              </div>
              {allowNonSar && (
                <div className="pro-field" style={{ marginTop: 8 }}>
                  <label>Prefijo serie interna (ej. REC)</label>
                  <input
                    className="pro-input"
                    value={internalDocPrefix}
                    onChange={(e) => setInternalDocPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    maxLength={20}
                  />
                </div>
              )}
              <div className="pro-field">
                <label className="pro-inline">
                  <input
                    type="checkbox"
                    checked={resetCorrelative}
                    onChange={(e) => setResetCorrelative(e.target.checked)}
                  />
                  <span>Reiniciar correlativo al inicio del rango (proxima = inicio del SAR)</span>
                </label>
              </div>
            </>
          ) : null}
          <div style={{ marginTop: 10 }}>
            <button type="submit" className="pro-button" disabled={saving}>
              {saving ? 'Guardando' : 'Guardar configuracion fiscal'}
            </button>
          </div>
        </form>
      ) : null}
      {canConfigSar ? (
        <form className="pro-card" onSubmit={onSaveBranding} style={{ marginTop: 12, maxWidth: 640 }}>
          <h2 className="pro-h3" style={{ margin: '0 0 8px' }}>
            Textos del comprobante (venta a otros laboratorios)
          </h2>
          <p className="pro-muted" style={{ margin: '0 0 10px', fontSize: 13 }}>
            Sin diseno ni imagenes obligatorias: titulos, clasificacion y pie. Se aplica a factura SAR y a comprobante
            interno segun el caso. Lo esencial de CAI/RTN/ISV sigue saliendo de la configuracion SAR.
          </p>
          {formErrorBranding ? <p className="pro-alert">{formErrorBranding}</p> : null}
          <div className="pro-field">
            <label>Nombre visible del laboratorio</label>
            <input className="pro-input" value={labDisplayName} onChange={(e) => setLabDisplayName(e.target.value)} maxLength={200} />
          </div>
          <div className="pro-field">
            <label>Logo (URL pública o data:image/base64)</label>
            <input className="pro-input" value={labLogoUrl} onChange={(e) => setLabLogoUrl(e.target.value)} maxLength={4000} />
          </div>
          <div className="pro-field">
            <label>Dirección del laboratorio (override en comprobante)</label>
            <input className="pro-input" value={labAddress} onChange={(e) => setLabAddress(e.target.value)} maxLength={300} />
          </div>
          <div className="pro-field">
            <label>Teléfono del laboratorio (override)</label>
            <input className="pro-input" value={labPhone} onChange={(e) => setLabPhone(e.target.value)} maxLength={50} />
          </div>
          <div className="pro-field">
            <label>Correo del laboratorio</label>
            <input className="pro-input" value={labEmail} onChange={(e) => setLabEmail(e.target.value)} maxLength={200} />
          </div>
          <div className="pro-field">
            <label>Titulo cuando es factura SAR (CAI)</label>
            <input className="pro-input" value={titleSar} onChange={(e) => setTitleSar(e.target.value)} maxLength={200} />
          </div>
          <div className="pro-field">
            <label>Titulo comprobante interno (sin bloque SAR)</label>
            <input
              className="pro-input"
              value={titleInternal}
              onChange={(e) => setTitleInternal(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="pro-field">
            <label>Clasificacion de actividad (texto libre)</label>
            <input className="pro-input" value={clasificacion} onChange={(e) => setClasificacion(e.target.value)} maxLength={300} />
          </div>
          <div className="pro-field">
            <label>Lineas de pie (una por renglon)</label>
            <textarea
              className="pro-input"
              rows={4}
              value={footerLines}
              onChange={(e) => setFooterLines(e.target.value)}
              style={{ minHeight: 88, resize: 'vertical' }}
            />
          </div>
          <div className="pro-field">
            <label>Linea comercial (ej. exija comprobante de pago / fiscal)</label>
            <input className="pro-input" value={exigirLine} onChange={(e) => setExigirLine(e.target.value)} maxLength={500} />
          </div>
          <div style={{ marginTop: 10 }}>
            <button type="submit" className="pro-button" disabled={savingBranding}>
              {savingBranding ? 'Guardando' : 'Guardar textos de comprobante'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
