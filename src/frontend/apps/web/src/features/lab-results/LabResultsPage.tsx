import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { fetchResultLines, updateResultLine } from './labResults.api';
import type { ResultLineItem } from './labResults.types';

type StatusFilter = 'todos' | 'pendientes' | 'validados';
type FormatFilter = 'todos' | 'texto' | 'panel';
type CompletenessFilter = 'todos' | 'incompletos-panel';
const tzHn = 'America/Tegucigalpa';

function parseServerDateAsUtc(value: string): Date {
  const raw = value.trim();
  if (!raw) {
    return new Date(Number.NaN);
  }
  const hasExplicitZone = /([zZ]|[+\-]\d{2}:\d{2})$/.test(raw);
  return new Date(hasExplicitZone ? raw : `${raw}Z`);
}

function dateTimeHn(iso: string | null | undefined) {
  if (!iso) {
    return '—';
  }
  const parsed = parseServerDateAsUtc(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString('es-HN', {
    timeZone: tzHn,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function resultPreview(line: ResultLineItem): { text: string; isEmpty: boolean } {
  if (line.resultFormat === 'texto' || !line.resultFieldDefinitions?.length) {
    const t = line.resultNotes?.trim() ?? '';
    return { text: t || '—', isEmpty: !t };
  }
  const defs = [...line.resultFieldDefinitions]
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const parts: string[] = [];
  for (const d of defs) {
    const v = (line.resultParameterValues ?? {})[d.name];
    if (v != null && String(v).trim() !== '') {
      parts.push(`${d.name}: ${v}`);
    }
  }
  const more = (line.resultNotes ?? '').trim();
  if (parts.length) {
    return {
      text: more ? `${parts.join(' · ')} | ${more}` : parts.join(' · '),
      isEmpty: false,
    };
  }
  return { text: more || '—', isEmpty: !more };
}

function panelCompletion(line: ResultLineItem): { activeCount: number; filledCount: number; isIncomplete: boolean } {
  if (line.resultFormat !== 'panel') {
    return { activeCount: 0, filledCount: 0, isIncomplete: false };
  }
  const defs = (line.resultFieldDefinitions ?? []).filter((d) => d.isActive);
  const activeCount = defs.length;
  if (activeCount === 0) {
    return { activeCount: 0, filledCount: 0, isIncomplete: !line.isValidated };
  }
  let filledCount = 0;
  for (const d of defs) {
    const v = line.resultParameterValues?.[d.name];
    if (v != null && String(v).trim() !== '') {
      filledCount += 1;
    }
  }
  return {
    activeCount,
    filledCount,
    isIncomplete: !line.isValidated && filledCount < activeCount,
  };
}

function parseRange(ref: string | null | undefined): { min: number; max: number } | null {
  const t = (ref ?? '').replace(',', '.').trim();
  const m = t.match(/(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) {
    return null;
  }
  const min = Number.parseFloat(m[1]);
  const max = Number.parseFloat(m[2]);
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return null;
  }
  return { min, max };
}

function evaluateValue(value: string | undefined, ref: string | null | undefined): 'bajo' | 'normal' | 'alto' | null {
  const v = Number.parseFloat(String(value ?? '').replace(',', '.').trim());
  if (Number.isNaN(v)) {
    return null;
  }
  const rr = parseRange(ref);
  if (!rr) {
    return null;
  }
  if (v < rr.min) {
    return 'bajo';
  }
  if (v > rr.max) {
    return 'alto';
  }
  return 'normal';
}

function evalBadge(status: 'bajo' | 'normal' | 'alto' | null) {
  if (!status) {
    return null;
  }
  if (status === 'normal') {
    return <span className="pro-pill is-green" style={{ marginLeft: 6 }}>Normal</span>;
  }
  if (status === 'alto') {
    return (
      <span className="pro-pill" style={{ marginLeft: 6, background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}>
        Alto
      </span>
    );
  }
  return (
    <span className="pro-pill" style={{ marginLeft: 6, background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }}>
      Bajo
    </span>
  );
}

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function printResultLine(line: ResultLineItem) {
  const w = globalThis.open('about:blank', '_blank', 'width=900,height=700');
  const when = new Date().toLocaleString('es-HN', { timeZone: tzHn });
  const rows =
    line.resultFormat === 'panel'
      ? [...line.resultFieldDefinitions]
          .filter((d) => d.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((d) => {
            const v = (line.resultParameterValues ?? {})[d.name] ?? '';
            const evalStatus = evaluateValue(v, d.referenceText);
            const evalText = evalStatus === null ? '—' : evalStatus.toUpperCase();
            return `<tr><td>${esc(d.name)}</td><td>${esc(v || '—')}</td><td>${esc(d.unit ?? '—')}</td><td>${esc(d.referenceText ?? '—')}</td><td>${esc(evalText)}</td></tr>`;
          })
          .join('')
      : `<tr><td colspan="5">${esc(line.resultNotes ?? '—')}</td></tr>`;
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><title>Resultado ${line.examCode}</title>
<style>
@page{size:A4;margin:12mm}
body{font-family:Inter,Roboto,system-ui,sans-serif;color:#0f172a}
.sheet{border:1px solid #cbd5e1;padding:12px 14px;border-radius:10px}
.hd{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #cbd5e1;padding-bottom:8px}
.lab{font-weight:800;font-size:18px;letter-spacing:.02em}.sub{font-size:12px;color:#475569}
.doc{font-size:20px;font-weight:800;text-align:right}
.box{border:1px dashed #94a3b8;padding:6px 8px;border-radius:8px;margin-top:6px;font-size:12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.grid p{margin:3px 0;font-size:13px}
table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border:1px solid #cbd5e1;padding:7px;text-align:left;font-size:12px;vertical-align:top}
th{background:#f8fafc;text-transform:uppercase;font-size:11px;letter-spacing:.04em}
.foot{margin-top:10px;font-size:12px}.muted{color:#475569}
@media print {.sheet{border:none;padding:0}}
</style></head><body>
<div class="sheet">
<div class="hd">
  <div>
    <div class="lab">LABORATORIO CLINICO</div>
    <div class="sub">Reporte de resultados</div>
    <div class="sub">Fecha impresión: ${esc(when)}</div>
  </div>
  <div>
    <div class="doc">RESULTADO</div>
    <div class="box">
      <div><strong>Comprobante:</strong> ${esc(line.invoiceNumber || `ORDEN-${line.orderId}`)}</div>
      <div><strong>Línea:</strong> ${line.lineId}</div>
    </div>
  </div>
</div>
<div class="grid">
  <div>
    <p><strong>Paciente:</strong> ${esc(line.patientName)}</p>
    <p><strong>Examen:</strong> ${esc(line.examName)}</p>
  </div>
  <div>
    <p><strong>Código:</strong> ${esc(line.examCode)}</p>
    <p><strong>Formato:</strong> ${esc(line.resultFormat.toUpperCase())}</p>
  </div>
</div>
<table><thead><tr><th>Parámetro</th><th>Resultado</th><th>Unidad</th><th>Referencia</th><th>Evaluación</th></tr></thead><tbody>${rows}</tbody></table>
${line.resultFormat === 'panel' && line.resultNotes ? `<div class="foot"><strong>Conclusión:</strong> ${esc(line.resultNotes)}</div>` : ''}
<div class="foot muted">Validado para entrega al paciente.</div>
</div></body></html>`;
  if (!w || !w.document) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const idoc = iframe.contentWindow?.document;
    if (!idoc) {
      iframe.remove();
      return;
    }
    idoc.open();
    idoc.write(html);
    idoc.close();
    globalThis.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      globalThis.setTimeout(() => iframe.remove(), 1200);
    }, 320);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  globalThis.setTimeout(() => {
    w.focus();
    w.print();
  }, 320);
}

export function LabResultsPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('pendientes');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('todos');
  const [completenessFilter, setCompletenessFilter] = useState<CompletenessFilter>('todos');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ResultLineItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [paramDraft, setParamDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [search, status, formatFilter, completenessFilter, fromDate, toDate]);

  useEffect(() => {
    let ok = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetchResultLines(search, status, formatFilter, completenessFilter, fromDate, toDate, page, 20);
        if (!ok) {
          return;
        }
        setRows(r.items);
        setTotal(r.totalCount);
      } catch (e) {
        if (ok) {
          setError((e as Error).message);
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
  }, [search, status, formatFilter, completenessFilter, fromDate, toDate, page, listVersion]);

  useEffect(() => {
    if (editingId === null) {
      return;
    }
    const r = rows.find((x) => x.lineId === editingId);
    if (!r) {
      return;
    }
    if (r.resultFormat === 'panel') {
      const defs = [...(r.resultFieldDefinitions ?? [])]
        .filter((p) => p.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const o: Record<string, string> = { ...(r.resultParameterValues ?? {}) };
      for (const d of defs) {
        if (o[d.name] === undefined) {
          o[d.name] = '';
        }
      }
      setParamDraft(o);
      setDraft('');
    } else {
      setParamDraft({});
      setDraft(r.resultNotes ?? '');
    }
  }, [editingId, rows]);

  async function saveLine(line: ResultLineItem, markValidated: boolean) {
    const isPanel = line.resultFormat === 'panel';
    const hasPanelValue =
      isPanel &&
      Object.values(paramDraft).some((v) => {
        const t = String(v ?? '').trim();
        return t.length > 0;
      });
    const hasNote = draft.trim().length > 0;
    if (markValidated && isPanel && !hasPanelValue && !hasNote) {
      setError('No se puede validar: en formato panel capture al menos un valor o agregue una nota.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateResultLine(line.lineId, {
        resultNotes: draft.trim() || null,
        resultParameterValues: isPanel ? paramDraft : null,
        markValidated,
      });
      setEditingId(null);
      setListVersion((v) => v + 1);
    } catch (e) {
      const actionText = markValidated ? 'validar' : 'guardar';
      setError(`No se pudo ${actionText} el resultado. ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  const pageSize = 20;
  const visibleRows = rows;
  const visibleCount = visibleRows.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="results-mobile">
      <div className="pro-hero" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
        <div>
          <h1 className="pro-hero__title">Resultados por linea de orden</h1>
          <p className="pro-hero__desc" style={{ maxWidth: 640 }}>
            Cada fila es un examen de una factura. Si el examen esta en <strong>texto</strong>, libera un area;
            si esta en <strong>panel</strong>, llena los parametros definidos en el catalogo. Luego marca
            <strong> validar</strong> cuando corresponda.
          </p>
          <CrossModuleLinks
            marginTop={10}
            items={[
              { to: '/lab/muestras', label: 'Muestras', show: hasPermission('MUESTRA.GESTION') },
              { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
              { to: '/caja/cierre', label: 'Caja', show: hasPermission('CAJA.CERRAR') },
              { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
              { to: '/orders', label: 'Nueva orden', show: hasPermission('ORDEN.CREATE') },
              { to: '/sar', label: 'Cumplimiento SAR', show: hasPermission('FISCAL.READ') },
            ]}
          />
          <CrossModuleLinks
            marginTop={8}
            items={[
              { to: '/admin/empresa-caja', label: 'Política de caja', show: hasPermission('EMPRESA.CONFIG') },
              { to: '/admin/formas-pago', label: 'Formas de pago', show: hasPermission('EMPRESA.CONFIG') },
            ]}
          />
        </div>
      </div>

      <div className="pro-toolbar results-mobile__filters" style={{ marginBottom: 8 }}>
        <div className="pro-toolbar__row results-mobile__row" style={{ alignItems: 'flex-end' }}>
          <div className="pro-field" style={{ flex: 1, minWidth: 200 }}>
            <label>Buscar</label>
            <input
              className="pro-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nº orden, comprobante, paciente, codigo, examen"
            />
          </div>
          <div className="pro-field results-mobile__field-sm" style={{ width: 200 }}>
            <label>Estado en laboratorio</label>
            <select
              className="pro-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="todos">Todos</option>
              <option value="pendientes">Pendiente de validar</option>
              <option value="validados">Validados</option>
            </select>
          </div>
          <div className="pro-field results-mobile__field-sm" style={{ width: 200 }}>
            <label>Formato</label>
            <select
              className="pro-input"
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as FormatFilter)}
            >
              <option value="todos">Todos</option>
              <option value="texto">Solo texto</option>
              <option value="panel">Solo panel</option>
            </select>
          </div>
          <div className="pro-field results-mobile__field-sm" style={{ width: 220 }}>
            <label>Situación panel</label>
            <select
              className="pro-input"
              value={completenessFilter}
              onChange={(e) => setCompletenessFilter(e.target.value as CompletenessFilter)}
            >
              <option value="todos">Todos</option>
              <option value="incompletos-panel">Pendiente e incompleto</option>
            </select>
          </div>
          <div className="pro-field results-mobile__field-sm" style={{ width: 180 }}>
            <label>Desde</label>
            <input
              type="date"
              className="pro-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="pro-field results-mobile__field-sm" style={{ width: 180 }}>
            <label>Hasta</label>
            <input
              type="date"
              className="pro-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="pro-alert">{error}</p>}

      <div className="pro-card results-mobile__tablecard" style={{ padding: 0, overflow: 'auto' }}>
        {loading && <p className="pro-muted" style={{ margin: 16 }}>Cargando…</p>}
        {!loading && (
          <table className="pro-table results-mobile__table" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th>Orden / factura</th>
                <th>Paciente</th>
                <th>Examen</th>
                <th>Formato</th>
                <th>Resultado (notas)</th>
                <th>Validacion</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="pro-empty" style={{ padding: 20 }}>
                    No hay lineas con el filtro actual. Las ordenes nuevas aparecen una vez emitidas; los examenes
                    de cada detalle se listan aqui.
                  </td>
                </tr>
              )}
              {visibleRows.map((row) => {
                const isEd = editingId === row.lineId;
                const panelMeta = panelCompletion(row);
                return (
                  <tr key={row.lineId} className={!row.isValidated && status !== 'validados' ? undefined : 'is-muted'}>
                    <td>
                      <span className="is-mono" style={{ fontSize: 12 }} title={`Orden interna ${row.orderId}`}>
                        {row.invoiceNumber || `ORDEN-${row.orderId}`}
                      </span>
                      <div className="pro-muted" style={{ fontSize: 11, marginTop: 2 }}>
                        {dateTimeHn(row.orderAtUtc)}
                      </div>
                    </td>
                    <td>{row.patientName}</td>
                    <td>
                      <span className="is-mono" style={{ fontSize: 12, display: 'block' }}>
                        {row.examCode}
                      </span>
                      {row.examName}
                    </td>
                    <td>
                      {row.resultFormat === 'panel' ? (
                        <>
                          <span className="pro-pill" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                            Panel
                          </span>
                          <div className="pro-muted" style={{ marginTop: 4, fontSize: 11 }}>
                            {panelMeta.filledCount}/{panelMeta.activeCount || 0}
                          </div>
                          {panelMeta.isIncomplete && (
                            <div style={{ marginTop: 4 }}>
                              <span
                                className="pro-pill"
                                style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                              >
                                Incompleto
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="pro-pill" style={{ background: '#f5f3ff', color: '#5b21b6', border: '1px solid #ddd6fe' }}>
                          Texto
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: 400 }}>
                      {isEd && row.resultFormat === 'panel' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
                          {[...row.resultFieldDefinitions]
                            .filter((d) => d.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((d) => (
                              <div key={d.id}>
                                <div style={{ fontSize: 11, color: 'var(--pro-muted, #64748b)', lineHeight: 1.3 }}>
                                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{d.name}</span>
                                  {d.unit && <span> {d.unit}</span>}
                                  {d.referenceText && <span> · ref. {d.referenceText}</span>}
                                </div>
                                <input
                                  className="pro-input"
                                  value={paramDraft[d.name] ?? ''}
                                  onChange={(e) =>
                                    setParamDraft((prev) => ({ ...prev, [d.name]: e.target.value }))
                                  }
                                  style={{ fontSize: 13, marginTop: 4, width: '100%' }}
                                  autoComplete="off"
                                />
                              </div>
                            ))}
                          {row.resultFieldDefinitions.filter((d) => d.isActive).length === 0 && (
                            <p className="pro-muted" style={{ fontSize: 12, margin: 0 }}>
                              Este examen no tiene parametros activos en el catalogo. Ajusta el examen o usa formato texto.
                            </p>
                          )}
                          <div>
                            <div className="pro-muted" style={{ fontSize: 11, marginBottom: 4 }}>
                              Conclusión / interpretación (opcional)
                            </div>
                            <textarea
                              className="pro-input"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              rows={2}
                              style={{ minHeight: 44, fontSize: 13, resize: 'vertical', width: '100%' }}
                              placeholder="Conclusión clínica, observaciones, recomendación, etc."
                            />
                          </div>
                        </div>
                      ) : isEd && row.resultFormat === 'texto' ? (
                        <textarea
                          className="pro-input"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={4}
                          style={{ height: 'auto', minHeight: 64, fontSize: 13, resize: 'vertical', width: '100%' }}
                          placeholder="Texto libre (valor, observacion, etc.)"
                        />
                      ) : (
                        (() => {
                          const p = resultPreview(row);
                          if (row.resultFormat !== 'panel') {
                            return (
                              <span
                                className={p.isEmpty ? 'pro-muted' : undefined}
                                style={{ fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}
                              >
                                {p.text}
                              </span>
                            );
                          }
                          const defs = [...row.resultFieldDefinitions]
                            .filter((d) => d.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder);
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {defs.map((d) => {
                                const v = row.resultParameterValues?.[d.name];
                                if (!v || !String(v).trim()) {
                                  return null;
                                }
                                return (
                                  <div key={`pv-${row.lineId}-${d.id}`} style={{ fontSize: 12 }}>
                                    <strong>{d.name}:</strong> {v}
                                    {evalBadge(evaluateValue(v, d.referenceText))}
                                  </div>
                                );
                              })}
                              {row.resultNotes && (
                                <div className="pro-muted" style={{ fontSize: 12 }}>
                                  Conclusión: {row.resultNotes}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {row.isValidated ? (
                        <>
                          <span className="pro-pill is-green">Listo</span>
                          {row.validatedByName && (
                            <div className="pro-muted" style={{ marginTop: 4 }}>
                              {row.validatedByName}
                            </div>
                          )}
                          {row.validatedAtUtc && (
                            <div className="pro-muted" style={{ marginTop: 2, fontSize: 11 }}>
                              {dateTimeHn(row.validatedAtUtc)}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="pro-pill" style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}>
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td>
                      {isEd ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <button
                            type="button"
                            className="pro-ghost is-small"
                            onClick={() => {
                              if (!saving) {
                                setEditingId(null);
                              }
                            }}
                            disabled={saving}
                          >
                            Cerrar
                          </button>
                          <button
                            type="button"
                            className="pro-ghost is-small"
                            onClick={() => void saveLine(row, false)}
                            disabled={saving}
                            style={{ background: '#f8fafc' }}
                          >
                            Guardar notas
                          </button>
                          <button
                            type="button"
                            className="pro-button"
                            style={{ minWidth: 0, fontSize: 12, height: 34 }}
                            onClick={() => void saveLine(row, true)}
                            disabled={saving}
                          >
                            Validar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <button type="button" className="pro-ghost is-small" onClick={() => setEditingId(row.lineId)}>
                            Editar
                          </button>
                          <button type="button" className="pro-ghost is-small" onClick={() => printResultLine(row)}>
                            Imprimir
                          </button>
                          <a
                            className="pro-content-link"
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `Resultado de laboratorio (${row.examName}) listo. Comprobante: ${globalThis.location.origin}/orders/voucher/${row.orderId}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 12 }}
                          >
                            WhatsApp
                          </a>
                          <a
                            className="pro-content-link"
                            href={`mailto:?subject=${encodeURIComponent(
                              `Resultado de laboratorio - ${row.examName}`
                            )}&body=${encodeURIComponent(
                              `Compartimos el resultado/comprobante: ${globalThis.location.origin}/orders/voucher/${row.orderId}`
                            )}`}
                            style={{ fontSize: 12 }}
                          >
                            Correo
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {total > pageSize && (
          <div className="pro-pagination" style={{ padding: 8 }}>
            <button className="pro-ghost" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
              Anterior
            </button>
            <span className="pro-muted" style={{ fontSize: 12 }}>
              Pag. {page} de {maxPage} ({visibleCount}/{total} lineas visibles)
            </span>
            <button
              className="pro-ghost"
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= maxPage || loading}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
