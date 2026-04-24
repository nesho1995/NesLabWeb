import { type FormEvent, useEffect, useState } from 'react';
import { getCompanyBranding, getFiscalCompany, putFiscalBranding, uploadFiscalLogo } from '../sar-fiscal/sarFiscal.api';
import { API_BASE_URL } from '../../shared/api/config';

type PrintProfile = 'standard' | 'compact' | 'thermal';

function mediaUrl(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

function esc(v: string | null | undefined) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function LabBrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [labDisplayName, setLabDisplayName] = useState('');
  const [labLogoUrl, setLabLogoUrl] = useState('');
  const [labAddress, setLabAddress] = useState('');
  const [labPhone, setLabPhone] = useState('');
  const [labEmail, setLabEmail] = useState('');
  const [defaultPrintProfile, setDefaultPrintProfile] = useState<PrintProfile>('standard');
  const [documentTitleSar, setDocumentTitleSar] = useState<string | null>(null);
  const [documentTitleInternal, setDocumentTitleInternal] = useState<string | null>(null);
  const [clasificacionActividad, setClasificacionActividad] = useState<string | null>(null);
  const [footerLines, setFooterLines] = useState<string[] | null>(null);
  const [exigirFacturaLine, setExigirFacturaLine] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        let d: Awaited<ReturnType<typeof getFiscalCompany>>;
        try {
          d = await getFiscalCompany();
        } catch {
          const b0 = await getCompanyBranding();
          d = {
            companyId: b0.companyId,
            companyName: b0.companyName,
            isActive: true,
            useCai: false,
            allowNonSarDocument: false,
            internalDocPrefix: 'REC',
            internalDocCurrent: null,
            invoicePrefix: 'INT',
            currentCorrelative: null,
            rangeStart: null,
            rangeEnd: null,
            cai: null,
            rangeLabel: null,
            caiDueDate: null,
            daysUntilCaiExpires: null,
            isCaiValid: true,
            warning: null,
            branding: b0.branding ?? null,
          };
        }
        if (!ok) return;
        const b = d.branding;
        setLabDisplayName(b?.laboratoryDisplayName?.trim() ?? d.companyName ?? '');
        setLabLogoUrl(b?.laboratoryLogoUrl?.trim() ?? '');
        setLabAddress(b?.laboratoryAddress?.trim() ?? '');
        setLabPhone(b?.laboratoryPhone?.trim() ?? '');
        setLabEmail(b?.laboratoryEmail?.trim() ?? '');
        setDefaultPrintProfile((b?.defaultPrintProfile as PrintProfile) || 'standard');
        setDocumentTitleSar(b?.documentTitleSar ?? null);
        setDocumentTitleInternal(b?.documentTitleInternal ?? null);
        setClasificacionActividad(b?.clasificacionActividad ?? null);
        setFooterLines(b?.footerLines ?? null);
        setExigirFacturaLine(b?.exigirFacturaLine ?? null);
      } catch (e) {
        if (ok) {
          setError(e instanceof Error ? e.message : 'No se pudo cargar la identidad del laboratorio.');
        }
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  async function onSave(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    setSaved(null);
    setSaving(true);
    try {
      await putFiscalBranding({
        laboratoryDisplayName: labDisplayName.trim() || null,
        laboratoryLogoUrl: labLogoUrl.trim() || null,
        laboratoryAddress: labAddress.trim() || null,
        laboratoryPhone: labPhone.trim() || null,
        laboratoryEmail: labEmail.trim() || null,
        defaultPrintProfile,
        documentTitleSar,
        documentTitleInternal,
        clasificacionActividad,
        footerLines,
        exigirFacturaLine,
      });
      setSaved('Identidad e impresión guardadas.');
      globalThis.localStorage.setItem('neslab.printProfile.default', defaultPrintProfile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  }

  async function onSelectLogo(file: File | null) {
    if (!file) return;
    setError(null);
    setSaved(null);
    setUploadingLogo(true);
    try {
      const url = await uploadFiscalLogo(file);
      setLabLogoUrl(url);
      setSaved('Logo cargado. Guarda la configuración para publicarlo en todo el sistema.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la imagen.');
    } finally {
      setUploadingLogo(false);
    }
  }

  function onPreviewPrint() {
    const w = globalThis.open('about:blank', '_blank', 'width=980,height=760');
    if (!w) {
      setError('El navegador bloqueó la ventana de vista previa. Permite popups e inténtalo de nuevo.');
      return;
    }
    const logo = mediaUrl(labLogoUrl);
    const profileClass =
      defaultPrintProfile === 'compact'
        ? 'sheet compact'
        : defaultPrintProfile === 'thermal'
          ? 'sheet thermal'
          : 'sheet';
    const now = new Date().toLocaleString('es-HN');
    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><title>Vista previa impresión</title>
<style>
body{font-family:Inter,Roboto,system-ui,sans-serif;background:#e5e7eb;margin:0;padding:16px}
.bar{max-width:980px;margin:0 auto 10px;display:flex;gap:8px;align-items:center}
.btn{height:36px;padding:0 14px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;font-weight:700;cursor:pointer}
.sheet{max-width:900px;margin:0 auto;background:#fff;border:1px solid #d1d5db;padding:16px;color:#0f172a}
.hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:2px solid #0f172a;padding-bottom:8px}
.lab{display:flex;gap:10px}.logo{width:46px;height:46px;border:1px solid #94a3b8;display:flex;align-items:center;justify-content:center}
.logo img{width:100%;height:100%;object-fit:contain}
.h1{font-size:20px;font-weight:800;margin:0}.sub{font-size:12px;color:#475569}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.box{border:1px solid #cbd5e1;padding:8px}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{border:1px solid #cbd5e1;padding:6px;font-size:12px}
th{text-transform:uppercase;font-size:11px;background:#f8fafc;text-align:left}
.n{text-align:right}
.compact{font-size:12px}.compact th,.compact td{padding:4px;font-size:11px}
.thermal{max-width:80mm;padding:8px;font-size:10px}.thermal .grid{grid-template-columns:1fr}.thermal th,.thermal td{padding:3px;font-size:10px}
@media print{body{background:#fff;padding:0}.bar{display:none}.sheet{border:0;max-width:none;margin:0;padding:0}}
</style></head><body>
<div class="bar">
  <button class="btn" onclick="window.print()">Imprimir prueba</button>
  <span style="font-size:12px;color:#475569">Perfil: ${esc(defaultPrintProfile)}</span>
</div>
<div class="${profileClass}">
  <div class="hd">
    <div class="lab">
      <div class="logo">${logo ? `<img src="${esc(logo)}" alt="logo"/>` : 'L'}</div>
      <div>
        <p class="h1">${esc(labDisplayName || 'Laboratorio')}</p>
        <p class="sub">${esc(labAddress || 'Dirección')}</p>
        <p class="sub">Tel: ${esc(labPhone || 'N/D')} · Correo: ${esc(labEmail || 'N/D')}</p>
      </div>
    </div>
    <div style="text-align:right">
      <p style="margin:0;font-weight:800">VISTA PREVIA</p>
      <p class="sub" style="margin:2px 0 0">${esc(now)}</p>
    </div>
  </div>
  <div class="grid">
    <div class="box"><strong>Paciente:</strong> Juan Pérez<br/><strong>RTN:</strong> 00000000000000</div>
    <div class="box"><strong>Comprobante:</strong> PREVIEW-001<br/><strong>Condición:</strong> Contado [X]</div>
  </div>
  <table>
    <thead><tr><th>Cant.</th><th>Descripción</th><th class="n">P. unitario</th><th class="n">Descuento</th><th class="n">Total</th></tr></thead>
    <tbody>
      <tr><td class="n">1.00</td><td>Hemograma completo</td><td class="n">L 200.00</td><td class="n">L 0.00</td><td class="n">L 200.00</td></tr>
      <tr><td class="n">1.00</td><td>Glucosa post prandial</td><td class="n">L 70.00</td><td class="n">L 0.00</td><td class="n">L 70.00</td></tr>
    </tbody>
  </table>
  <div class="grid" style="margin-top:8px">
    <div class="box"><strong>Valor en letras:</strong><br/>DOSCIENTOS SETENTA LEMPIRAS CON 00/100</div>
    <div class="box"><strong>Importe gravado 15%:</strong> L 234.78<br/><strong>ISV 15%:</strong> L 35.22<br/><strong>Total:</strong> L 270.00</div>
  </div>
</div></body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  if (loading) {
    return (
      <div className="pro-card" style={{ maxWidth: 720 }}>
        <p className="pro-muted" style={{ margin: 0 }}>Cargando identidad del laboratorio…</p>
      </div>
    );
  }

  return (
    <form className="pro-card" style={{ maxWidth: 760 }} onSubmit={onSave}>
      <h1 className="pro-hero__title" style={{ margin: '0 0 8px' }}>Identidad del laboratorio e impresión</h1>
      <p className="pro-muted" style={{ margin: '0 0 14px' }}>
        Configura nombre, logo y perfil de impresión por defecto para comprobantes y facturas.
      </p>
      {error ? <p className="pro-alert">{error}</p> : null}
      {saved ? <p className="pro-muted" style={{ color: '#047857', fontWeight: 700 }}>{saved}</p> : null}

      <div className="pro-field">
        <label>Nombre visible del laboratorio</label>
        <input className="pro-input" value={labDisplayName} onChange={(e) => setLabDisplayName(e.target.value)} maxLength={200} />
      </div>
      <div className="pro-field">
        <label>Logo del laboratorio</label>
        <input className="pro-input" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={(e) => void onSelectLogo(e.target.files?.[0] ?? null)} />
        <p className="pro-muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
          {uploadingLogo ? 'Cargando imagen…' : 'Formatos: PNG/JPG/WEBP, máximo 5 MB.'}
        </p>
        {labLogoUrl ? (
          <div style={{ marginTop: 10 }}>
            <img src={mediaUrl(labLogoUrl) ?? ''} alt="Logo del laboratorio" style={{ maxHeight: 70, maxWidth: 220, objectFit: 'contain', border: '1px solid #d1d5db', borderRadius: 8, padding: 6, background: '#fff' }} />
          </div>
        ) : null}
      </div>
      <div className="pro-field">
        <label>Dirección</label>
        <input className="pro-input" value={labAddress} onChange={(e) => setLabAddress(e.target.value)} maxLength={300} />
      </div>
      <div className="pro-field">
        <label>Teléfono</label>
        <input className="pro-input" value={labPhone} onChange={(e) => setLabPhone(e.target.value)} maxLength={50} />
      </div>
      <div className="pro-field">
        <label>Correo</label>
        <input className="pro-input" value={labEmail} onChange={(e) => setLabEmail(e.target.value)} maxLength={200} />
      </div>
      <div className="pro-field">
        <label>Perfil de impresión por defecto</label>
        <select className="pro-input" value={defaultPrintProfile} onChange={(e) => setDefaultPrintProfile(e.target.value as PrintProfile)}>
          <option value="standard">Estándar (A4/Carta)</option>
          <option value="compact">Compacto</option>
          <option value="thermal">Ticket térmico</option>
        </select>
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="pro-button" type="submit" disabled={saving || uploadingLogo}>
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
        <button
          className="pro-ghost"
          type="button"
          onClick={onPreviewPrint}
          style={{ marginLeft: 8 }}
          disabled={saving || uploadingLogo}
        >
          Probar impresión
        </button>
      </div>
    </form>
  );
}
