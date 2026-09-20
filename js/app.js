import { loadExcel } from './excel.js';
import './rules.js';
import { buildRanking } from './ranking.js';
import { openPlayer } from './player-detail.js';
import { escapeHTML as esc, format, initials, movementBadge } from './ui.js';
const status = document.getElementById('status');
const dashboard = document.getElementById('dashboard');
let ranking = [], trainings = [];
const today = new Date();
const seasonStart = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
document.getElementById('season').textContent = `TEMPORADA ${seasonStart} / ${String(seasonStart + 1).slice(-2)}`;
function renderSummary() {
  const cards = [['01', 'Jugadoras', ranking.length, 'Un equipo, un objetivo'], ['02', 'Entrenamientos', trainings.length, 'Sesiones registradas'], ['03', 'Asistencias', ranking.reduce((sum, player) => sum + player.attended, 0), 'Esfuerzos que suman'], ['04', 'Último entrenamiento', trainings.at(-1), 'Última sesión registrada']];
  document.getElementById('summary').innerHTML = cards.map(([number, label, value, note]) => `<article class="summary-card"><div class="summary-label">${label}<span>${number}</span></div><strong>${esc(value)}</strong><p>${note}</p></article>`).join('');
}
function renderPodium() {
  const visualOrder = ranking.slice(0, 5);
  document.getElementById('podium').innerHTML = visualOrder.map(player => `<button class="podium-card place-${player.position}" data-player="${player.id}" aria-label="Ver ficha de ${esc(player.name)}, posición ${player.position}"><span class="podium-rank">${String(player.position).padStart(2, '0')}<span> / </span></span><span class="podium-avatar">${esc(initials(player.name))}</span><span class="podium-name">${esc(player.name)}</span><span class="podium-score">${format(player.points)} <small>pts</small></span><span class="podium-attendance">${player.attended} entrenos</span><span class="podium-line" aria-hidden="true"></span></button>`).join('');
}
function renderTable() {
  document.getElementById('player-count').textContent = `${ranking.length} jugadoras`;
  document.getElementById('ranking-rows').innerHTML = ranking.map(player => `<div class="ranking-row ${player.top5 ? 'top-five' : ''} ${player.position === 5 ? 'top-boundary' : ''}" role="row" data-player="${player.id}"><span class="position" role="cell">${String(player.position).padStart(2, '0')}</span><span class="player-cell" role="cell"><span class="table-avatar" aria-hidden="true">${esc(initials(player.name))}</span><button class="player-button" data-player="${player.id}" aria-label="Ver estadísticas de ${esc(player.name)}">${esc(player.name)}</button>${player.top5 ? '<span class="top-badge row-top-badge">TOP 5</span>' : ''}</span><span class="points-cell" role="cell">${format(player.points)}</span><span class="attendance-cell" role="cell">${player.attended}</span><span role="cell">${movementBadge(player.movement)}</span></div>`).join('');
}
document.addEventListener('click', event => {
  const target = event.target.closest('[data-player]');
  if (!target) return;
  const player = ranking.find(item => item.id === target.dataset.player);
  if (player) openPlayer(player, ranking, trainings);
});
async function start() {
  dashboard.hidden = true;
  status.hidden = false;
  status.textContent = 'Cargando clasificación...';
  try {
    const data = await loadExcel();
    trainings = data.trainings;
    document.getElementById('example-note')?.remove();
    if (data.example) {
      const note = document.createElement('p');
      note.id = 'example-note'; note.className = 'example-note';
      note.textContent = 'Datos de ejemplo · Sustituye los datos del Excel y renombra la primera hoja como Ranking para empezar.';
      dashboard.before(note);
    }
    if (!trainings.length || !data.players.length) { status.textContent = 'Todavía no hay datos de entrenamientos.'; return; }
    ranking = buildRanking(data.players, trainings.length);
    renderSummary(); renderPodium(); renderTable();
    status.hidden = true;
    dashboard.hidden = false;
  } catch (error) {
    console.error('No se ha podido cargar el ranking:', error);
    status.innerHTML = '<strong>No se han podido cargar los datos del ranking.</strong><p>Comprueba que el archivo data/ranking.xlsx existe y tiene el formato correcto.</p><button type="button" class="retry-button">Volver a intentar</button>';
    status.querySelector('button').addEventListener('click', start);
  }
}
start();
