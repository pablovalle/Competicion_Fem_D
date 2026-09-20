export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const format = value => value == null ? '—' : new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
export const signed = value => value == null ? '—' : `${value > 0 ? '+' : ''}${format(value)}`;
export const initials = name => name.split(' ').filter(Boolean).slice(0, 2).map(part => [...part][0]).join('').toLocaleUpperCase('es');
export function movementBadge(movement) {
  const direction = movement == null || movement === 0 ? 'neutral' : movement > 0 ? 'up' : 'down';
  const label = movement == null ? 'Sin clasificación anterior comparable' : movement === 0 ? 'Mantiene posición' : `Ha ${movement > 0 ? 'subido' : 'bajado'} ${Math.abs(movement)} ${Math.abs(movement) === 1 ? 'posición' : 'posiciones'}`;
  const text = movement == null ? '—' : movement === 0 ? '→' : `${movement > 0 ? '↑' : '↓'} ${Math.abs(movement)}`;
  return `<span class="movement ${direction}" role="img" aria-label="${label}" title="${label}">${text}</span>`;
}
