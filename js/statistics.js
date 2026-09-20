import { round } from './ranking.js';
const sum = values => round(values.reduce((total, value) => total + value, 0));
const mean = values => values.length ? sum(values) / values.length : 0;
export function attendanceStreaks(scores) {
  let current = 0, best = 0;
  scores.forEach(score => { current = Number.isFinite(score) ? current + 1 : 0; best = Math.max(best, current); });
  return { current, best };
}
export function scoringTrend(values) {
  if (values.length < 6) return { arrow: '—', label: 'Sin datos suficientes', direction: 'neutral' };
  const difference = round(mean(values.slice(-3)) - mean(values.slice(-6, -3)));
  return Math.abs(difference) < 0.25 ? { arrow: '→', label: 'Estable', direction: 'neutral' } : difference > 0 ? { arrow: '↑', label: 'Mejorando', direction: 'up' } : { arrow: '↓', label: 'Bajando', direction: 'down' };
}
export function regularity(values) {
  if (values.length < 3) return 'Sin datos suficientes';
  const average = mean(values);
  const deviation = Math.sqrt(mean(values.map(value => (value - average) ** 2)));
  return deviation <= 0.75 ? 'Muy regular' : deviation <= 1.5 ? 'Regular' : 'Variable';
}
export function top5Distance(player, ranking) {
  if (ranking.length < 6) return null;
  return round(player.points - ranking[player.top5 ? 5 : 4].points);
}
export function playerStatistics(player, ranking, trainings) {
  const values = player.scores.filter(Number.isFinite);
  const average = mean(values);
  const teamValues = ranking.flatMap(item => item.scores.filter(Number.isFinite));
  const teamMean = mean(teamValues);
  const best = values.length ? Math.max(...values) : null;
  let accumulated = 0;
  return {
    average, best, worst: values.length ? Math.min(...values) : null,
    latest: player.scores.at(-1) ?? null,
    bestTraining: best == null ? null : trainings[player.scores.lastIndexOf(best)],
    streaks: attendanceStreaks(player.scores), trend: scoringTrend(values),
    distance: top5Distance(player, ranking), regularity: regularity(values),
    recent: player.scores.slice(-5), recentPoints: sum(player.scores.slice(-5).filter(Number.isFinite)),
    recentMean: values.length ? mean(values.slice(-5)) : null,
    teamMean: teamValues.length ? teamMean : null, teamDifference: values.length ? average - teamMean : null,
    cumulative: player.scores.map(score => { accumulated = round(accumulated + (score ?? 0)); return accumulated; }),
  };
}
