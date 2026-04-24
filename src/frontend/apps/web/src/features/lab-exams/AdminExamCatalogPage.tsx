import { useCallback, useRef, useState } from 'react';
import { applyExamTemplates, bulkImportExams, clearExamCatalog } from './labExams.api';
import { downloadExampleCatalogTemplate, parseCatalogXlsx } from './parseCatalogExcel';

export function AdminExamCatalogPage() {
  const [skipDup, setSkipDup] = useState(true);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [templating, setTemplating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) {
      return;
    }
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
      setError('Use un archivo de Excel (.xlsx o .xls) con dos columnas: Examen (A) y Precio (B).');
      return;
    }
    setInfo(null);
    setError(null);
    setImporting(true);
    try {
      const items = await parseCatalogXlsx(file);
      if (items.length === 0) {
        setError(
          'No se leyeron filas validas: primera hoja con A = nombre del examen y B = precio.'
        );
        return;
      }
      const r = await bulkImportExams({ items, skipDuplicates: skipDup });
      setInfo(`Importado: creados ${r.created}, omitidos ${r.skipped}. ${r.messages.join(' · ')}`.trim());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [skipDup]);

  const onClearCatalog = useCallback(async () => {
    if (!window.confirm('Eliminar del catalogo los examenes no usados en ordenes. Continuar?')) {
      return;
    }
    setError(null);
    setInfo(null);
    setClearing(true);
    try {
      const r = await clearExamCatalog();
      setInfo(r.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setClearing(false);
    }
  }, []);

  const onApplyTemplates = useCallback(async () => {
    if (!window.confirm('Aplicar plantillas estándar por nombre de examen en todo el catálogo actual. ¿Continuar?')) {
      return;
    }
    setError(null);
    setInfo(null);
    setTemplating(true);
    try {
      const r = await applyExamTemplates();
      setInfo(`Plantillas aplicadas. Actualizados ${r.updated}, omitidos ${r.skipped}.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTemplating(false);
    }
  }, []);

  return (
    <div className="pro-page">
      <div className="pro-hero">
        <div>
          <h1 className="pro-hero__title">Administración de catálogo de exámenes</h1>
          <p className="pro-hero__desc">
            Configuración administrativa del catálogo: carga masiva y limpieza de exámenes no usados.
          </p>
        </div>
      </div>

      {error && <p className="pro-alert">{error}</p>}
      {info && (
        <p className="pro-hint" style={{ color: 'var(--pro-ink)', margin: 0 }} role="status">
          {info}
        </p>
      )}

      <div className="pro-card" aria-label="Importacion masiva">
        <h3 className="pro-h3">Importar desde Excel</h3>
        <p className="pro-hint" style={{ margin: '0 0 0.75rem' }}>
          Archivo <strong>.xlsx</strong> o <strong>.xls</strong>. Columna A = examen, B = precio.
        </p>
        <div className="pro-actions-row">
          <input
            ref={fileInputRef}
            className="pro-input"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                void onFile(f);
              }
            }}
            disabled={importing || clearing}
            aria-label="Elegir archivo Excel"
          />
          <button type="button" className="pro-ghost" onClick={() => void downloadExampleCatalogTemplate()}>
            Descargar plantilla
          </button>
          <button
            type="button"
            className="pro-ghost"
            onClick={() => void onClearCatalog()}
            disabled={importing || clearing}
            title="Quita del catalogo los examenes no referenciados en ordenes; los usados se conservan"
          >
            Vaciar catalogo (no usados)
          </button>
          <button
            type="button"
            className="pro-button"
            onClick={() => void onApplyTemplates()}
            disabled={importing || clearing || templating}
            title="Genera parámetros estándar para captura de resultados por examen"
          >
            Aplicar plantillas estándar
          </button>
        </div>
        <label className="pro-inline">
          <input
            type="checkbox"
            checked={skipDup}
            onChange={(e) => setSkipDup(e.target.checked)}
            disabled={importing}
          />
          <span>Omitir filas ya existentes (nombre + precio)</span>
        </label>
        {importing && <p className="pro-muted" style={{ margin: '8px 0 0' }}>Importando...</p>}
        {clearing && <p className="pro-muted" style={{ margin: '8px 0 0' }}>Actualizando catalogo...</p>}
        {templating && <p className="pro-muted" style={{ margin: '8px 0 0' }}>Aplicando plantillas...</p>}
      </div>
    </div>
  );
}
