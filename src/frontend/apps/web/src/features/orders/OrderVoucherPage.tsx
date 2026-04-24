import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { fetchOrderVoucher } from './orderVoucher.api';
import { getCompanyBranding } from '../sar-fiscal/sarFiscal.api';
import { API_BASE_URL } from '../../shared/api/config';
import type { OrderVoucher } from './orderVoucher.types';

const tzHn = 'America/Tegucigalpa';
const lemp = new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' });

function datePartsHn(d: string) {
  const dt = new Date(d);
  return {
    day: dt.toLocaleDateString('es-HN', { timeZone: tzHn, day: '2-digit' }),
    month: dt.toLocaleDateString('es-HN', { timeZone: tzHn, month: '2-digit' }),
    year: dt.toLocaleDateString('es-HN', { timeZone: tzHn, year: 'numeric' }),
  };
}

function fmtHn(d: string) {
  return new Date(d).toLocaleString('es-HN', { timeZone: tzHn, day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtHnLong(d: string) {
  return new Date(d).toLocaleString('es-HN', {
    timeZone: tzHn,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nowHn() {
  return new Date().toLocaleString('es-HN', {
    timeZone: tzHn,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function amountInWordsHn(v: number) {
  const safe = Number.isFinite(v) ? Math.max(0, v) : 0;
  const n = Math.floor(safe);
  const cents = Math.round((safe - n) * 100);
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const twoDigits = (x: number): string => {
    if (x < 10) return units[x];
    if (x < 20) return teens[x - 10];
    if (x < 30) return x === 20 ? 'veinte' : `veinti${units[x - 20]}`;
    const t = Math.floor(x / 10);
    const u = x % 10;
    return u === 0 ? tens[t] : `${tens[t]} y ${units[u]}`;
  };
  const threeDigits = (x: number): string => {
    if (x === 0) return '';
    if (x === 100) return 'cien';
    const h = Math.floor(x / 100);
    const rem = x % 100;
    const hText = hundreds[h];
    const remText = twoDigits(rem);
    return [hText, remText].filter(Boolean).join(' ').trim();
  };
  const intToWords = (x: number): string => {
    if (x === 0) return 'cero';
    const thousands = Math.floor(x / 1000);
    const rem = x % 1000;
    const thText = thousands > 0 ? (thousands === 1 ? 'mil' : `${threeDigits(thousands)} mil`) : '';
    const remText = threeDigits(rem);
    return [thText, remText].filter(Boolean).join(' ').trim();
  };

  const words = intToWords(n);
  return `${words} lempiras con ${String(cents).padStart(2, '0')}/100`;
}

function mediaUrl(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

export function OrderVoucherPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const { orderId: orderIdParam } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<OrderVoucher | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [printProfile, setPrintProfile] = useState<'standard' | 'compact' | 'thermal'>('standard');
  const orderId = orderIdParam ? parseInt(orderIdParam, 10) : NaN;

  const load = useCallback(async () => {
    if (Number.isNaN(orderId)) {
      setError('Orden invalida.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const voucher = await fetchOrderVoucher(orderId);
      setData(voucher);
      const ls = globalThis.localStorage.getItem('neslab.printProfile.default');
      if (ls === 'standard' || ls === 'compact' || ls === 'thermal') {
        setPrintProfile(ls);
      }
      try {
        const branding = await getCompanyBranding();
        const profile = branding.branding?.defaultPrintProfile;
        if (profile === 'standard' || profile === 'compact' || profile === 'thermal') {
          setPrintProfile(profile);
          globalThis.localStorage.setItem('neslab.printProfile.default', profile);
        }
      } catch {
        // Permisos o endpoint no disponible para este usuario: mantenemos perfil local.
      }
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canCreateOrder = hasPermission('ORDEN.CREATE');
  const followUpItems = [
    { to: '/ordenes' as const, label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
    { to: '/caja/cierre' as const, label: 'Cierre de caja', show: hasPermission('CAJA.CERRAR') },
    { to: '/lab/resultados' as const, label: 'Resultados', show: hasPermission('RESULTADOS.VALIDAR') },
    { to: '/lab/muestras' as const, label: 'Muestras', show: hasPermission('MUESTRA.GESTION') },
    { to: '/lab/reportes' as const, label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
    { to: '/patients' as const, label: 'Pacientes', show: hasPermission('PACIENTE.READ') },
    { to: '/lab-exams' as const, label: 'Catalogo de examenes', show: hasPermission('EXAMEN.READ') },
    { to: '/sar' as const, label: 'Cumplimiento SAR', show: hasPermission('FISCAL.READ') },
    { to: '/admin/empresa-caja' as const, label: 'Política de caja', show: hasPermission('EMPRESA.CONFIG') },
    { to: '/admin/formas-pago' as const, label: 'Formas de pago', show: hasPermission('EMPRESA.CONFIG') },
  ];

  const onPrint = () => {
    globalThis.print();
  };

  if (loading) {
    return (
      <div className="vprint-outer vprint-outer--loading">
        <p className="pro-muted" style={{ margin: 0 }}>
          Cargando comprobante…
        </p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="vprint-outer vprint-outer--loading">
        <p className="pro-alert" style={{ margin: 0 }}>
          {error ?? 'No se pudo cargar el comprobante.'}
        </p>
        <p style={{ marginTop: 12 }}>
          <Link to="/ordenes" className="pro-content-link">
            Volver a la bandeja
          </Link>
        </p>
        <div style={{ maxWidth: 640, marginTop: 12 }}>
          <CrossModuleLinks heading="Seguir en" marginTop={0} items={followUpItems} />
        </div>
      </div>
    );
  }

  const c = data.company;
  const dp = datePartsHn(data.orderAtUtc);
  const importeExento = 0;
  const importeExonerado = 0;
  const importeGravado15 = Math.max(0, data.subtotalExams);
  const isv15 = Math.max(0, data.isv);
  const totalFiscal = Math.max(0, data.total);
  const isCredito = data.saldo > 0.0001;
  const isContado = !isCredito;
  const totalEnLetras = amountInWordsHn(totalFiscal);
  const detailRows =
    data.lines.length > 0
      ? data.lines.map((line) => ({
      code: line.examCode,
      desc: line.description,
      qty: line.quantity.toFixed(2),
      unit: lemp.format(line.unitPrice),
      total: lemp.format(line.lineTotal),
        }))
      : [{ code: '', desc: 'Sin lineas registradas', qty: '', unit: '', total: '' }];
  return (
    <div className="vprint-outer">
      <div className="vprint-toolbar-wrap no-print">
        <div className="vprint-toolbar" role="toolbar" aria-label="Acciones de impresion">
          <label className="vprint-profile">
            <span>Perfil de impresión</span>
            <select
              value={printProfile}
              onChange={(e) => {
                const p = e.target.value as 'standard' | 'compact' | 'thermal';
                setPrintProfile(p);
                globalThis.localStorage.setItem('neslab.printProfile.default', p);
              }}
            >
              <option value="standard">Estándar (A4/Carta)</option>
              <option value="compact">Compacto</option>
              <option value="thermal">Ticket térmico</option>
            </select>
          </label>
          <button type="button" className="pro-button vprint-toolbar__btn" onClick={onPrint}>
            Imprimir
          </button>
          <button
            type="button"
            className="vprint-toolbar__secondary vprint-toolbar__btn"
            onClick={() => {
              navigate(-1);
            }}
          >
            Cerrar
          </button>
          {canCreateOrder ? (
            <Link to="/orders" className="vprint-toolbar__link no-print">
              Nueva orden
            </Link>
          ) : (
            <Link to="/ordenes" className="vprint-toolbar__link no-print">
              Bandeja
            </Link>
          )}
        </div>
      </div>
      <div className="vprint-links no-print">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <CrossModuleLinks heading="Seguir en" marginTop={0} items={followUpItems} />
        </div>
      </div>

      <div className={`vprint-paper vprint-paper--${printProfile}`} id="vprint-root">
        <header className="vprint-hd">
          <div className="vprint-hd__left">
            <div className="vprint-hd__logo" aria-hidden>
              {c.logoUrl ? <img src={mediaUrl(c.logoUrl) ?? ''} alt="" className="vprint-hd__logo-img" /> : 'L'}
            </div>
            <div>
              <h1 className="vprint-hd__name">{c.name || data.providerName}</h1>
              {c.rtn && (
                <p className="vprint-hd__meta">
                  R.T.N. <span className="vprint-mono">{c.rtn}</span>
                </p>
              )}
              {c.address && <p className="vprint-hd__meta">{c.address}</p>}
              {(c.phone && (
                <p className="vprint-hd__meta">
                  Tel. <span className="vprint-mono">{c.phone}</span>
                </p>
              )) ||
                null}
              {c.email && <p className="vprint-hd__meta">{c.email}</p>}
            </div>
          </div>
          <div className="vprint-hd__right">
            <h2 className="vprint-title">{data.documentTitle}</h2>
            <p className="vprint-hd__id">Sistema: NesLab LIS</p>
          </div>
        </header>

        <section className="vprint-grid-2 vprint-b">
          <div>
            <table className="vprint-kv">
              <tbody>
                <tr>
                  <th>Condicion</th>
                  <td>
                    Credito [{isCredito ? 'X' : ' '}] &nbsp; Contado [{isContado ? 'X' : ' '}]
                  </td>
                </tr>
                <tr>
                  <th>Dia / Mes / Ano</th>
                  <td className="vprint-mono">{dp.day} / {dp.month} / {dp.year}</td>
                </tr>
                <tr>
                  <th>No. de orden / ref.</th>
                  <td className="vprint-mono vprint-b-strong">{data.orderNumberText}</td>
                </tr>
                <tr>
                  <th>Transaccion (ID)</th>
                  <td className="vprint-mono">#{data.orderId}</td>
                </tr>
                <tr>
                  <th>Fecha</th>
                  <td>{fmtHn(data.orderAtUtc)}</td>
                </tr>
                <tr>
                  <th>Clasificacion</th>
                  <td>{data.clasificacion}</td>
                </tr>
                <tr>
                  <th>Institucion / proveedor</th>
                  <td>{data.providerName}</td>
                </tr>
                <tr>
                  <th>Paciente</th>
                  <td className="vprint-b-strong">{data.patientName}</td>
                </tr>
                {data.nationalId && (
                  <tr>
                    <th>Identidad</th>
                    <td className="vprint-mono">{data.nationalId}</td>
                  </tr>
                )}
                {data.titularName && data.titularName !== data.patientName && (
                  <tr>
                    <th>Titular (factura)</th>
                    <td>{data.titularName}</td>
                  </tr>
                )}
                <tr>
                  <th>Facturar a (nombre)</th>
                  <td>{data.clientInvoiceName}</td>
                </tr>
                <tr>
                  <th>RTN cliente</th>
                  <td className="vprint-mono">{data.clientRtn}</td>
                </tr>
                <tr>
                  <th>Metodo de pago</th>
                  <td>{data.paymentMethod || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            {data.caiMode ? (
              <div className="vprint-caja vprint-b">
                <h3 className="vprint-caja__h">Fiscal (SAR)</h3>
                <ul className="vprint-caja__list">
                  {data.cai && (
                    <li>
                      <span>CAI</span> <span className="vprint-mono">{data.cai}</span>
                    </li>
                  )}
                  {data.rango && (
                    <li>
                      <span>Rango / autorizacion</span> <span className="vprint-mono">{data.rango}</span>
                    </li>
                  )}
                  {data.caiVencText && (
                    <li>
                      <span>Vence</span> <span>{data.caiVencText}</span>
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="vprint-caja vprint-caja--muted vprint-b">
                <h3 className="vprint-caja__h">Fiscal</h3>
                <p className="vprint-hint" style={{ margin: 0 }}>
                  Este comprobante no utiliza el bloque de correlativo SAR (CAI) de la resolucion actual. Conserve
                  registro de cobro y paciente; el detalle de ISV y totales se muestra abajo.
                </p>
              </div>
            )}
            <p className="vprint-mute vprint-pt" style={{ margin: '0 0 0 0' }}>
              Impreso en: <strong>{nowHn()}</strong> · {data.emittedByName && <>Usuario: {data.emittedByName} · </>}
            </p>
          </div>
        </section>

        <section className="vprint-classic vprint-b">
          <table className="vprint-classic__table">
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Descripcion</th>
                <th className="vprint-num">P. unitario</th>
                <th className="vprint-num">Descuentos</th>
                <th className="vprint-num">Total</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row, i) => (
                <tr key={i}>
                  <td className="vprint-num">{row.qty}</td>
                  <td>{row.desc || (row.code ? `[${row.code}]` : '')}</td>
                  <td className="vprint-num">{row.unit}</td>
                  <td className="vprint-num">{i === 0 && data.discountAmount > 0 ? lemp.format(data.discountAmount) : ''}</td>
                  <td className="vprint-num">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="vprint-line-tot">
            Total servicios y / o examenes: <strong className="vprint-mono">{lemp.format(data.subtotalExams)}</strong>
          </p>
        </section>

        <section className="vprint-lower vprint-b">
          <div className="vprint-lower__left">
            <div className="vprint-box">
              <p className="vprint-box__label">No. Ord. de compra exenta</p>
              <p className="vprint-box__value">{data.caiMode ? 'N/D' : 'No aplica (sin CAI)'}</p>
            </div>
            <div className="vprint-box">
              <p className="vprint-box__label">No. const. de reg. de exonerado</p>
              <p className="vprint-box__value">{data.caiMode ? 'N/D' : 'No aplica (sin CAI)'}</p>
            </div>
            <div className="vprint-box">
              <p className="vprint-box__label">No. reg. de la SAG</p>
              <p className="vprint-box__value">{data.caiMode ? 'N/D' : 'No aplica (sin CAI)'}</p>
            </div>
            <div className="vprint-box">
              <p className="vprint-box__label">Valor en letras</p>
              <p className="vprint-box__value" style={{ textTransform: 'uppercase' }}>{totalEnLetras}</p>
            </div>
          </div>
          <div className="vprint-lower__right">
            <table className="vprint-tax">
              <tbody>
                <tr>
                  <th>Importe exonerado L.</th>
                  <td className="vprint-mono vprint-num">{lemp.format(importeExonerado)}</td>
                </tr>
                <tr>
                  <th>Importe exento L.</th>
                  <td className="vprint-mono vprint-num">{lemp.format(importeExento)}</td>
                </tr>
                <tr>
                  <th>Importe gravado 15% L.</th>
                  <td className="vprint-mono vprint-num">{lemp.format(importeGravado15)}</td>
                </tr>
                <tr>
                  <th>I.S.V. 15% L.</th>
                  <td className="vprint-mono vprint-num">{lemp.format(isv15)}</td>
                </tr>
                {data.caiMode ? null : (
                  <tr>
                    <th>Documento</th>
                    <td className="vprint-num">Interno (sin CAI)</td>
                  </tr>
                )}
                <tr className="vprint-tax__total">
                  <th>Total a pagar L.</th>
                  <td className="vprint-mono vprint-num">{lemp.format(totalFiscal)}</td>
                </tr>
              </tbody>
            </table>
            <div className="vprint-sign">
              <span>Firma</span>
            </div>
          </div>
        </section>

        {(data.voucherExigirLine || (data.voucherFooterLines && data.voucherFooterLines.length > 0)) && (
          <div className="vprint-sec vprint-b" style={{ marginTop: 8, fontSize: '0.78rem', lineHeight: 1.5 }}>
            {data.voucherExigirLine && (
              <p className="vprint-b-strong" style={{ margin: '0 0 6px' }}>
                {data.voucherExigirLine}
              </p>
            )}
            {data.voucherFooterLines?.map((line, i) => (
              <p className="vprint-mute" key={i} style={{ margin: '0 0 4px' }}>
                {line}
              </p>
            ))}
          </div>
        )}

        <footer className="vprint-foot no-print" aria-hidden>
          <span>NesLab LIS · {fmtHnLong(data.orderAtUtc)} (orden)</span>
        </footer>
        <p className="vprint-mute print-only" style={{ textAlign: 'right', fontSize: '0.7rem' }}>
          Pag. 1 de 1
        </p>
      </div>
    </div>
  );
}
