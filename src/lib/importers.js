import { addDays, diffDays } from './dates.js';

// "Bring my history." You shouldn't have to start over.

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** Accepts 2026-09-30, 2026/9/30, 9/30/2026, 30.09.2026, "Sep 30, 2026", "30 September 2026" and ISO timestamps. */
export function parseDate(raw, { dayFirst = false } = {}) {
  const s = String(raw ?? '').trim().replace(/^"|"$/g, '');
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return dayFirst || s.includes('.') || +m[1] > 12 ? iso(+m[3], +m[2], +m[1]) : iso(+m[3], +m[1], +m[2]);
  m = s.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})$/);
  if (m && MONTHS[m[1].toLowerCase()]) return iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  m = s.match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]*\.?,? (\d{4})$/);
  if (m && MONTHS[m[2].toLowerCase()]) return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  return null;
}

function iso(y, mo, d) {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1970 || y > 2100) return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1) return null;
  return date.toISOString().slice(0, 10);
}

function splitCsvLine(line) {
  const out = [];
  let cur = '', quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if ((ch === ',' || ch === ';' || ch === '\t') && !quoted) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

const FLOW_WORDS = [
  [/spot/i, 'spotting'], [/light|low|little/i, 'light'], [/medium|moderate|normal/i, 'medium'], [/heavy|high|super/i, 'heavy'],
];

function toFlow(value) {
  const v = String(value ?? '').trim();
  if (!v || /^(0|no|none|false|-)$/i.test(v)) return null;
  for (const [re, flow] of FLOW_WORDS) if (re.test(v)) return flow;
  if (/^(1|yes|true|x|period|bleeding)$/i.test(v)) return 'yes';
  return null;
}

/**
 * Reads a CSV from another tracker or a spreadsheet. Finds a date column and a
 * bleeding/flow column by their headers. If there's no flow column, every row
 * is treated as a bleeding day, or, with start/end columns, as a whole period.
 */
export function importCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('That file looks empty.');
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const find = (re) => header.findIndex((h) => re.test(h));
  const dateCol = find(/^(date|day)$|date|day/);
  const startCol = find(/start/);
  const endCol = find(/end/);
  const flowCol = find(/flow|period|bleed|menstrua/);
  const rows = lines.slice(1).map(splitCsvLine);
  const dayFirst = rows.some((r) => { const m = (r[dateCol] ?? '').match(/^(\d{1,2})[-/](\d{1,2})[-/]\d{4}$/); return m && +m[1] > 12; });

  const days = {};
  if (startCol >= 0 && (dateCol === startCol || dateCol < 0 || flowCol < 0)) {
    for (const r of rows) {
      const start = parseDate(r[startCol], { dayFirst });
      if (!start) continue;
      const end = endCol >= 0 ? parseDate(r[endCol], { dayFirst }) : null;
      const last = end && end >= start && diffDays(end, start) < 15 ? end : start;
      for (let d = start; d <= last; d = addDays(d, 1)) days[d] = { flow: 'yes' };
    }
  } else {
    if (dateCol < 0) throw new Error('Couldn’t find a date column.');
    for (const r of rows) {
      const date = parseDate(r[dateCol], { dayFirst });
      if (!date) continue;
      const flow = flowCol >= 0 ? toFlow(r[flowCol]) : 'yes';
      if (flow) days[date] = { flow };
    }
  }
  if (!Object.keys(days).length) throw new Error('Didn’t find any period days in that file.');
  return days;
}

/**
 * "Paste the dates your periods started", one per line or separated by commas.
 * Only the start days are recorded (marked estimated), so we learn cycle
 * lengths without inventing how long each period lasted.
 */
export function importStartDates(text) {
  const dates = text.split(/[\n;]+|,(?!\s*\d{4}(?![-/.\d]))/).map((s) => parseDate(s)).filter(Boolean);
  const days = {};
  for (const d of dates) days[d] = { flow: 'yes', estimated: true };
  return { days, count: dates.length };
}
