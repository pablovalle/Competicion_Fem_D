// This comparator is the single source of truth for every ranking, including history.
const names = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
export const round = value => Math.round((value + Number.EPSILON) * 1e10) / 1e10;
export function comparePlayers(a, b) {
  return b.points - a.points || b.attended - a.attended || names.compare(a.name, b.name) || a.name.localeCompare(b.name, 'es');
}
export function rankPlayers(players, trainingCount) {
  return players.map(player => {
    const scores = player.scores.slice(0, trainingCount).filter(Number.isFinite);
    return { ...player, points: round(scores.reduce((sum, value) => sum + value, 0)), attended: scores.length };
  }).sort(comparePlayers).map((player, index) => ({ ...player, position: index + 1, top5: index < 5 }));
}
export function buildRanking(players, trainingCount) {
  const history = Array.from({ length: trainingCount }, (_, index) => rankPlayers(players, index + 1));
  const current = history.at(-1) ?? rankPlayers(players, 0);
  const previous = new Map((history.at(-2) ?? []).map(player => [player.id, player.position]));
  const positions = new Map(players.map(player => [player.id, []]));
  history.forEach(ranking => ranking.forEach(player => positions.get(player.id).push(player.position)));
  return current.map(player => ({ ...player, movement: trainingCount > 1 ? previous.get(player.id) - player.position : null, positions: positions.get(player.id) }));
}
