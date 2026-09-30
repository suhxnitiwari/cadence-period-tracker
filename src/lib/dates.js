// All dates are plain 'YYYY-MM-DD' strings. Math happens in UTC so daylight
// saving never shifts a day.
const DAY = 86_400_000;

export const toMs = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
export const fromMs = (ms) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (iso, n) => fromMs(toMs(iso) + n * DAY);
/** a − b, in whole days */
export const diffDays = (a, b) => Math.round((toMs(a) - toMs(b)) / DAY);

export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDate(iso, opts = { month: 'short', day: 'numeric' }) {
  return new Date(toMs(iso)).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });
}

export function formatRange(a, b) {
  if (a === b) return formatDate(a);
  const sameMonth = a.slice(0, 7) === b.slice(0, 7);
  return sameMonth
    ? `${formatDate(a)}–${formatDate(b, { day: 'numeric' })}`
    : `${formatDate(a)} – ${formatDate(b)}`;
}
