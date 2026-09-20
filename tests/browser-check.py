"""Run against a local HTTP server: python tests/browser-check.py.

Dev-only: Python, Playwright and locally installed Chrome. Not used by the website.
"""
from pathlib import Path
import json
import mimetypes
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'tests' / 'artifacts'
ARTIFACTS.mkdir(exist_ok=True)
BASE = 'http://127.0.0.1:8000/'

with sync_playwright() as runtime:
    browser = runtime.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width':1440, 'height':1000}, device_scale_factor=1)
    errors = []
    requests = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.on('request', lambda request: requests.append(request.url))
    page.goto(BASE)
    page.locator('#dashboard').wait_for(state='visible')
    calculations = page.evaluate("async () => (await import('./tests/calculations.js')).runCalculationTests()")
    assert page.locator('#ranking-rows [role=row]').count() == 12
    assert page.locator('#ranking-rows .top-five').count() == 5
    assert page.locator('.podium-card').count() == 5
    assert page.locator('#example-note').is_visible()
    assert all(url.startswith(BASE) for url in requests), requests
    layouts = []
    for width in [375, 430, 768, 1024, 1440]:
        page.set_viewport_size({'width':width, 'height':1000})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'Overflow at {width}'
        page.screenshot(path=str(ARTIFACTS / f'ranking-{width}.png'), full_page=True)
        page.locator('.player-button').first.focus()
        page.keyboard.press('Enter')
        page.locator('#player-dialog').wait_for(state='visible')
        assert page.locator('#player-name').inner_text() == 'Ane'
        assert page.locator('canvas').count() == 3
        assert page.evaluate("document.querySelector('#player-dialog').scrollWidth <= document.querySelector('#player-dialog').clientWidth"), f'Dialog overflow at {width}'
        assert page.evaluate("Chart.getChart('position-chart').options.scales.y.reverse")
        assert page.evaluate("Chart.getChart('position-chart').options.scales.y.min === 1")
        page.screenshot(path=str(ARTIFACTS / f'player-{width}.png'))
        page.locator('#score-chart').click()
        page.wait_for_function("Chart.getChart('score-chart').tooltip.opacity > 0")
        page.locator('.chart-data summary').first.click()
        assert page.locator('.chart-data').first.locator('tbody tr').count() == 8
        page.keyboard.press('Escape')
        assert not page.locator('#player-dialog').is_visible()
        assert page.locator('.player-button').first.evaluate('(element) => element === document.activeElement')
        layouts.append(width)
    # Clicking any part of the row opens the profile, not just its name.
    page.locator('#ranking-rows .ranking-row').nth(3).locator('.points-cell').click()
    assert page.locator('#player-name').inner_text() == 'June'
    assert page.evaluate("Chart.getChart('score-chart').data.datasets[0].data[2] === null")
    assert page.evaluate("Chart.getChart('score-chart').data.datasets[0].spanGaps === false")
    assert page.evaluate("Chart.getChart('cumulative-chart').data.datasets[0].data[1] === Chart.getChart('cumulative-chart').data.datasets[0].data[2]")
    page.locator('#close-detail').click()
    # Trap focus: native modal cycles without moving to the underlying page.
    page.locator('.player-button').first.click()
    page.locator('#close-detail').focus()
    page.keyboard.press('Shift+Tab')
    assert page.evaluate("document.querySelector('#player-dialog').contains(document.activeElement)")
    page.keyboard.press('Escape')
    assert not errors, errors
    # Real touch interaction at phone size.
    touch = browser.new_context(viewport={'width':375,'height':812}, is_mobile=True, has_touch=True)
    touch_page = touch.new_page()
    touch_page.goto(BASE)
    touch_page.locator('.player-button').first.tap()
    touch_page.locator('#score-chart').tap()
    touch_page.wait_for_function("Chart.getChart('score-chart').tooltip.opacity > 0")
    touch.close()
    # Missing workbook: exact requested error state + retry.
    error_page = browser.new_page()
    error_page.route('**/data/ranking.xlsx?*', lambda route: route.fulfill(status=404, body='missing'))
    error_page.goto(BASE)
    error_page.get_by_text('No se han podido cargar los datos del ranking.', exact=True).wait_for()
    error_page.unroute('**/data/ranking.xlsx?*')
    error_page.get_by_role('button', name='Volver a intentar').click()
    error_page.locator('#dashboard').wait_for(state='visible')
    error_page.close()
    # Blank workbook and one-training workbook, generated in memory with SheetJS.
    for fixture, expected in [([['Nombre']], 'empty'), ([['Nombre','Día 1'], ['A', 0], ['B', '-']], 'single')]:
        payload = page.evaluate('''rows => {const w=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(w,XLSX.utils.aoa_to_sheet(rows),'Ranking'); return Array.from(new Uint8Array(XLSX.write(w,{type:'array',bookType:'xlsx'})));}''', fixture)
        test_page = browser.new_page()
        test_page.route('**/data/ranking.xlsx?*', lambda route, request, data=bytes(payload): route.fulfill(status=200, body=data))
        test_page.goto(BASE)
        if expected == 'empty':
            test_page.get_by_text('Todavía no hay datos de entrenamientos.', exact=True).wait_for()
        else:
            test_page.locator('#dashboard').wait_for(state='visible')
            assert test_page.locator('#ranking-rows .movement').all_text_contents() == ['—','—']
            test_page.locator('.player-button').first.click()
            assert test_page.locator('#player-name').inner_text() == 'A'
        test_page.close()
    # Emulate a Pages subdirectory while serving the exact project files.
    subpage = browser.new_page()
    subrequests = []
    def serve_subpath(route):
        from urllib.parse import urlparse, unquote
        relative = unquote(urlparse(route.request.url).path).removeprefix('/club/') or 'index.html'
        target = (ROOT / relative).resolve()
        assert target.is_relative_to(ROOT)
        route.fulfill(status=200, body=target.read_bytes(), content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
    subpage.route('**/club/**', serve_subpath)
    subpage.on('request', lambda request: subrequests.append(request.url))
    subpage.goto(BASE + 'club/')
    subpage.locator('#dashboard').wait_for(state='visible')
    subpage.locator('.player-button').first.click()
    assert subpage.locator('canvas').count() == 3
    assert all(url.startswith(BASE + 'club/') for url in subrequests), subrequests
    assert any('/club/data/ranking.xlsx?t=' in url for url in subrequests)
    subpage.close()
    print(json.dumps({'calculation_checks':len(calculations), 'responsive_widths':layouts, 'console_errors':errors, 'requests_local_only':True, 'subdirectory_routes':True, 'interaction':'keyboard, touch, charts, focus, Escape, row click, retry', 'states':'loaded, missing workbook, empty workbook, one training'}, ensure_ascii=False, indent=2))
    browser.close()
