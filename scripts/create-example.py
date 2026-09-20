"""One-time example workbook creation using the requested, locally vendored SheetJS.

Requires Python + Playwright + Chrome. Never needed when updating the ranking.
Refuses to replace an existing workbook.
"""
from pathlib import Path
import base64
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'ranking.xlsx'
if TARGET.exists():
    raise SystemExit('El Excel ya existe. No se sobrescribe.')

with sync_playwright() as runtime:
    browser = runtime.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page()
    page.add_script_tag(path=str(ROOT / 'assets/vendor/xlsx.full.min.js'))
    result = page.evaluate('''() => {
      const rows = [
        ['Nombre', '02/09', '04/09', '07/09', '09/09', '11/09', '14/09', '16/09', '18/09'],
        ['Ane', 8, 7.5, 9, 8, 8.5, 9, 8, 9.5],
        ['Maialen', 8, 8, 8.5, 8, 9, 8.5, 9, 6],
        ['Irati', 7.5, 8, 8, 8.5, 7, 9, 8, 9],
        ['June', 7, 8, '-', 9, 8.5, 8, 9, 8],
        ['Nerea', 8, 7, 8, 7.5, 8, '-', 8, 8.5],
        ['Leire', 7, 8, 8.5, 7, 7.5, 8, 8, '-'],
        ['Maddi', 7, '-', 8, 7, 8, 7.5, 8, 8],
        ['Uxue', 6, 7, 7, 8, 7.5, 7, '-', 8.5],
        ['Oihane', 7.5, 7, '-', 6, 7, 8, 7, 7.5],
        ['Ainhoa', 6.5, 7, 7, '-', 7.5, 7, 8, 7],
        ['Garazi', '-', 6, 7, 7.5, '-', 8, 8, 8.5],
        ['Naia', 6, 6.5, '-', 7, 7.5, 7, '-', 8],
      ];
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet['!cols'] = [{wch: 22}, ...rows[0].slice(1).map(() => ({wch: 13}))];
      sheet['!autofilter'] = {ref: sheet['!ref']};
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Ejemplo');
      workbook.Props = {Title: 'EIBAR - Datos de ejemplo', Comments: 'Datos ficticios. Sustituye las jugadoras y puntuaciones y renombra la hoja Ranking.'};
      return {base64: XLSX.write(workbook, {type: 'base64', bookType: 'xlsx'}), rows};
    }''')
    TARGET.write_bytes(base64.b64decode(result['base64']))
    print(f'Excel de ejemplo creado: {len(result["rows"]) - 1} jugadoras, {len(result["rows"][0]) - 1} entrenamientos.')
    browser.close()
