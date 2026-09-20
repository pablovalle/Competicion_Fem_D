import { playerStatistics } from './statistics.js';
import { chartCard, renderCharts, destroyCharts } from './charts.js';
import { escapeHTML as esc, format, signed, initials, movementBadge } from './ui.js';
const dialog = document.getElementById('player-dialog');
let previousFocus;
const metric = (label, value, description = '') => `<div class="detail-metric"><dt>${label}</dt><dd>${value}</dd>${description ? `<small>${description}</small>` : ''}</div>`;
export function openPlayer(player, ranking, trainings) {
  previousFocus = document.activeElement;
  const stats = playerStatistics(player, ranking, trainings);
  const trend = stats.trend;
  document.getElementById('player-content').innerHTML = `
    <header class="player-header"><div class="player-avatar">${esc(initials(player.name))}</div><p class="eyebrow">CADA ENTRENO, UN PASO MÁS</p><h2 id="player-name">${esc(player.name)}</h2><div class="player-tags"><span>${player.position}ª posición</span>${movementBadge(player.movement)}${player.top5 ? '<span class="top-badge">TOP 5</span>' : ''}</div></header>
    <div class="detail-body"><dl class="primary-metrics">${metric('Puntos totales', format(player.points))}${metric('Entrenos asistidos', format(player.attended))}${metric('Media de puntuación', format(stats.average))}${metric('Distancia al Top 5', signed(stats.distance), stats.distance == null ? 'Sin sexta clasificada' : player.top5 ? 'Puntos respecto a la sexta' : 'Puntos respecto a la quinta')}</dl>
    <p class="detail-note">La distancia mide puntos; los empates se resuelven por asistencias y nombre.</p>
    <div class="streak-grid"><div><span>Racha de entrenamientos</span><strong>${stats.streaks.current} <small>consecutivos</small></strong></div><div><span>Mejor racha</span><strong>${stats.streaks.best} <small>entrenamientos</small></strong></div><div><span>Tendencia de puntuación</span><strong class="trend-${trend.direction}">${trend.arrow} ${trend.label}</strong></div></div>
    ${chartCard('score-chart', 'Evolución de puntuación', 'Tu puntuación en cada sesión · las ausencias dejan un hueco', trainings, player.scores)}
    ${chartCard('position-chart', 'Evolución en la clasificación', 'Cuanto más arriba, mejor posición', trainings, player.positions, true)}
    ${chartCard('cumulative-chart', 'Puntos acumulados', 'Todo el esfuerzo que llevas sumado', trainings, stats.cumulative)}
    <section class="recent-section"><h3>Últimos 5 entrenamientos</h3><div class="recent-scores">${stats.recent.map((score, i) => `<div class="recent-item ${score == null ? 'absent' : ''}"><span>${esc(trainings.slice(-5)[i])}</span><strong>${score == null ? '<abbr title="Ausente">AUS</abbr>' : format(score)}</strong></div>`).join('')}</div></section>
    <section class="additional-section"><h3>Tu entrenamiento, al detalle</h3><dl class="additional-metrics">${metric('Posición actual', `${player.position}ª`)}${metric('Mejor puntuación', format(stats.best), stats.bestTraining == null ? '' : esc(stats.bestTraining))}${metric('Peor puntuación', format(stats.worst))}${metric('Última puntuación', format(stats.latest), stats.latest == null ? 'Ausente en el último entrenamiento' : esc(trainings.at(-1)))}${metric('Puntos últimos 5 entrenamientos', format(stats.recentPoints))}${metric('Media últimos 5 entrenamientos asistidos', format(stats.recentMean))}${metric('Regularidad', stats.regularity, 'Desviación de tus puntuaciones')}${metric('Media del equipo', format(stats.teamMean), 'Todas las puntuaciones registradas')}${metric('Diferencia respecto a la media del equipo', signed(stats.teamDifference))}</dl></section>
    <section class="history-section"><h3>Historial de entrenamientos <span>${trainings.length}</span></h3><ol class="history-list">${trainings.map((training, i) => `<li><span><small>SESIÓN ${String(i + 1).padStart(2, '0')}</small>${esc(training)}</span><strong class="${player.scores[i] == null ? 'absence-text' : ''}">${player.scores[i] == null ? 'Ausente' : `${format(player.scores[i])} <small>pts</small>`}</strong></li>`).reverse().join('')}</ol></section>
    </div>`;
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('dialog-open');
  dialog.scrollTop = 0;
  document.getElementById('close-detail').focus();
  renderCharts(player, stats, trainings, ranking.length);
}
document.getElementById('close-detail').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { destroyCharts(); document.body.classList.remove('dialog-open'); previousFocus?.focus(); });
