/** Plantilla: columnas A = Examen, B = Precio (hoja 1, formato .xlsx). */
export async function downloadExampleCatalogTemplate(): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const data: (string | number)[][] = [
    ['Examen', 'Precio'],
    ['Hemograma completo', 150],
    ['Glicemia en ayunas', 80.5],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Catalogo');
  XLSX.writeFile(wb, 'plantilla_examenes.xlsx');
}

async function getXlsx() {
  return import('xlsx');
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) {
    return '';
  }
  return String(v).trim();
}

function parsePrice(v: unknown): number | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v) && v >= 0) {
    return v;
  }
  const t = String(v).replace(/\s/g, '').replace(',', '.');
  const n = Number.parseFloat(t);
  if (Number.isNaN(n) || !Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}

/**
 * Lee filas con dos columnas: examen (texto) y precio (número o texto local).
 * Primera fila puede ser encabezado Examen / Precio.
 */
export async function parseCatalogXlsx(file: File): Promise<{ name: string; price: number }[]> {
  const XLSX = await getXlsx();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return [];
  }
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    return [];
  }
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  }) as unknown[][];
  const out: { name: string; price: number }[] = [];
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    if (!Array.isArray(row) || row.length < 1) {
      continue;
    }
    const rawA = cellToString(row[0]);
    const colA = rawA.length > 200 ? rawA.slice(0, 200) : rawA;
    const colB = row[1];
    if (
      i === 0
      && colA.toLowerCase().includes('examen')
      && (String(colB).toLowerCase().includes('precio') || String(colB).toLowerCase().includes('monto'))
    ) {
      continue;
    }
    const price = parsePrice(colB);
    if (colA.length < 1 || price === null) {
      continue;
    }
    out.push({ name: colA, price });
  }
  return out;
}
