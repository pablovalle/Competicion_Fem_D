import { escapeHTML, format } from './ui.js';
let activeCharts = [];
export function destroyCharts() { activeCharts.forEach(chart => chart.destroy()); activeCharts = []; }
export function chartCard(id, title, subtitle, labels, values, position = false) {
  return `<section class="chart-card"><div class="chart-heading"><h3>${title}</h3><p>${subtitle}</p></div><div class="chart-container"><canvas id="${id}" role="img" aria-label="${title}. Consulta los valores en los datos del gráfico."></canvas></div><details class="chart-data"><summary>Ver datos del gráfico</summary><div class="chart-table-wrap"><table><caption class="sr-only">${title}</caption><thead><tr><th>Entrenamiento</th><th>${position ? 'Posición' : 'Puntos'}</th></tr></thead><tbody>${labels.map((label, i) => `<tr><th scope="row">${escapeHTML(label)}</th><td>${values[i] == null ? 'Ausente' : `${format(values[i])}${position ? 'ª' : ''}`}</td></tr>`).join('')}</tbody></table></div></details></section>`;
}
function lineChart(id, labels, values, options = {}) {
  const position = options.position;
  const dataset = { label: options.label, data: values, borderColor: options.color ?? '#234c79', backgroundColor: options.fill ? 'rgba(35,76,121,.055)' : '#fff', fill: Boolean(options.fill), pointBackgroundColor: '#fff', pointBorderWidth: 2, pointRadius: labels.length > 50 ? 2 : 3.5, pointHoverRadius: 6, pointHitRadius: 16, borderWidth: 2.5, tension: 0.18, spanGaps: false };
  const datasets = [dataset];
  if (options.average != null) datasets.push({ label: 'Media', data: labels.map(() => options.average), borderColor: '#8290a3', borderWidth: 1, borderDash: [5, 5], pointRadius: 0, pointHitRadius: 0 });
  activeCharts.push(new globalThis.Chart(document.getElementById(id), {
    type: 'line', data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: options.average != null, position: 'bottom', labels: { usePointStyle: true, pointStyle: 'line', boxWidth: 18, font: { size: 11 } } }, tooltip: { backgroundColor: '#142c4e', padding: 12, displayColors: false, callbacks: { label: context => `${context.dataset.label}: ${format(context.parsed.y)}${position ? 'ª' : ' pts'}`, afterBody: items => values[items[0]?.dataIndex] == null ? ['Ausente · sin puntuación'] : [] } } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 6, maxRotation: 0, autoSkip: true, color: '#66758a', font: { size: 10 }, callback(value) { const label = String(this.getLabelForValue(value)); return label.length > 14 ? `${label.slice(0, 12)}…` : label; } } },
        y: { reverse: Boolean(position), min: position ? 1 : undefined, max: position ? Math.max(options.playerCount, 2) : undefined, beginAtZero: !position, border: { display: false }, grid: { color: '#edf0f4' }, ticks: { maxTicksLimit: 5, precision: position ? 0 : undefined, color: '#66758a', font: { size: 10 }, callback: value => `${format(value)}${position ? 'ª' : ''}` } },
      },
    },
  }));
}
export function renderCharts(player, stats, trainings, playerCount) {
  destroyCharts();
  lineChart('score-chart', trainings, player.scores, { label: 'Puntuación', average: player.attended ? stats.average : null });
  lineChart('position-chart', trainings, player.positions, { label: 'Posición', position: true, playerCount, color: '#b52c4c' });
  lineChart('cumulative-chart', trainings, stats.cumulative, { label: 'Acumulado', fill: true });
}
