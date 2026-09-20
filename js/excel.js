export function normalizeScore(value, player, training, warn = console.warn) {
  if (value == null || (typeof value === 'string' && ['', '-'].includes(value.trim()))) return null;
  const normalized = typeof value === 'string' ? value.trim().replace(',', '.') : value;
  const numeric = typeof normalized === 'number' ? normalized : typeof normalized === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
  if (Number.isFinite(numeric)) return numeric;
  warn(`Valor ignorado: jugadora "${player}", entrenamiento "${training}".`, value);
  return null;
}
const blank = value => value == null || String(value).trim() === '';
export function normalizeRows(rows, warn = console.warn) {
  if (!rows.length) return { trainings: [], players: [] };
  const header = rows[0];
  if (String(header[0] ?? '').trim().toLocaleLowerCase('es') !== 'nombre') throw new Error('La primera columna debe ser Nombre.');
  const width = Math.max(...rows.map(row => row.length));
  let last = width - 1;
  while (last > 0 && rows.every(row => blank(row[last]))) last--;
  const trainings = Array.from({ length: last }, (_, i) => {
    if (blank(header[i + 1])) throw new Error(`Falta la cabecera del entrenamiento en la columna ${i + 2}.`);
    const value = header[i + 1];
    return value instanceof Date ? new Intl.DateTimeFormat('es', { timeZone: 'UTC' }).format(value) : String(value).trim();
  });
  const players = [];
  rows.slice(1).forEach((row, index) => {
    if (row.every(blank)) return;
    const name = String(row[0] ?? '').trim().replace(/\s+/g, ' ');
    if (!name) { warn(`Fila ${index + 2} ignorada: falta Nombre.`); return; }
    players.push({ id: `row-${index + 2}`, name, scores: trainings.map((training, i) => normalizeScore(row[i + 1], name, training, warn)) });
  });
  return { trainings, players };
}
export function parseWorkbook(buffer, xlsx = globalThis.XLSX) {
  if (!xlsx) throw new Error('SheetJS no está disponible.');
  const workbook = xlsx.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet || !sheet['!ref']) return { trainings: [], players: [] };
  const range = xlsx.utils.decode_range(sheet['!ref']);
  range.s = { r: 0, c: 0 };
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null, range });
  // Preserve the displayed date/text of Excel headers, while keeping scores numeric.
  rows[0] = rows[0].map((value, col) => {
    const cell = sheet[xlsx.utils.encode_cell({ r: 0, c: col })];
    return cell?.t === 'd' || (cell?.t === 'n' && xlsx.SSF.is_date(cell.z ?? '')) ? xlsx.utils.format_cell(cell) : value;
  });
  return { ...normalizeRows(rows), example: workbook.SheetNames[0].toLocaleLowerCase('es').startsWith('ejemplo') };
}
export async function loadExcel() {
  const url = new URL('./data/ranking.xlsx', document.baseURI);
  url.searchParams.set('t', Date.now().toString());
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Excel: HTTP ${response.status}`);
  return parseWorkbook(await response.arrayBuffer());
}
