import { addDays, diffDays } from './dates.js';

export const FLOWS = ['spotting', 'light', 'medium', 'heavy'];
export const PERIOD_FLOWS = new Set(['light', 'medium', 'heavy']);
export const PAIN = ['none', 'mild', 'moderate', 'severe'];

export const SYMPTOMS = {
  Body: ['Cramps', 'Headache', 'Bloating', 'Sore breasts', 'Back pain', 'Acne', 'Tired', 'Nausea', 'Cravings', "Can't sleep"],
  Mood: ['Calm', 'Happy', 'Low', 'Anxious', 'Irritable', 'Teary'],
};

// Typical adult ranges used in clinical guidance (e.g. ACOG). Teens' cycles are
// often longer and less regular for the first few years, which we say out loud.
export const TYPICAL_CYCLE = [21, 35];
const MAX_PERIOD_DAYS_TYPICAL = 7;
const MISSED_LOGGING_GAP = 60;

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stdev = (xs) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
};

export function isEmptyLog(log) {
  return !log || (!log.flow && !log.pain && !(log.symptoms?.length) && !log.notes?.trim());
}

/** Consecutive bleeding days (a one-day gap is allowed) form one period. Spotting doesn't count. */
export function findPeriods(days) {
  const dates = Object.keys(days).filter((d) => PERIOD_FLOWS.has(days[d].flow)).sort();
  const periods = [];
  for (const date of dates) {
    const last = periods.at(-1);
    if (last && diffDays(date, last.end) <= 2) {
      last.end = date;
      last.days.push(date);
    } else {
      periods.push({ start: date, end: date, days: [date] });
    }
  }
  for (const p of periods) p.length = diffDays(p.end, p.start) + 1;
  return periods;
}

/**
 * Everything the app knows about a cycle history, computed from logged days.
 * Predictions are ranges sized by how much *this person's* cycles actually vary,
 * never a single confident date.
 */
export function analyze(days, settings = {}, today) {
  const periods = findPeriods(days);
  const last = periods.at(-1) ?? null;
  const ongoing = Boolean(last && diffDays(today, last.end) <= 1 && diffDays(today, last.start) >= 0);

  const cycles = [];
  for (let i = 1; i < periods.length; i++) {
    const length = diffDays(periods[i].start, periods[i - 1].start);
    cycles.push({
      start: periods[i - 1].start,
      length,
      periodLength: periods[i - 1].length,
      // A 60+ day gap usually means days weren't logged, not a real cycle.
      gap: length > MISSED_LOGGING_GAP,
    });
  }

  const recent = cycles.filter((c) => !c.gap).slice(-12);
  const lengths = recent.map((c) => c.length);
  const avgCycle = lengths.length ? mean(lengths) : null;
  const variation = lengths.length >= 2 ? stdev(lengths) : null;
  const completedPeriods = (ongoing ? periods.slice(0, -1) : periods).slice(-12);
  const avgPeriod = completedPeriods.length ? mean(completedPeriods.map((p) => p.length)) : null;

  let confidence;
  if (!lengths.length) confidence = 'estimate';
  else if (lengths.length < 3) confidence = 'learning';
  else if (variation <= 3) confidence = 'steady';
  else if (variation <= 7) confidence = 'varies';
  else confidence = 'irregular';

  const cycleLen = Math.round(avgCycle ?? settings.typicalCycle ?? 28);
  const periodLen = Math.round(avgPeriod ?? settings.typicalPeriod ?? 5);
  const spread = lengths.length >= 3 ? Math.min(10, Math.max(2, Math.round(variation))) : lengths.length ? 4 : 5;

  const predictions = [];
  if (last) {
    for (let k = 1; k <= 3; k++) {
      const expected = addDays(last.start, Math.round(k * cycleLen));
      const ovulation = addDays(expected, -14);
      predictions.push({
        expected,
        earliest: addDays(expected, -spread),
        latest: addDays(expected, spread),
        length: periodLen,
        fertile: { start: addDays(ovulation, -5), end: addDays(ovulation, 1), ovulation },
      });
    }
  }

  let status;
  if (!last) status = { phase: 'empty' };
  else if (ongoing) status = { phase: 'period', day: diffDays(today, last.start) + 1 };
  else {
    const next = predictions[0];
    const cycleDay = diffDays(today, last.start) + 1;
    if (diffDays(today, next.latest) > 0) {
      status = { phase: 'late', cycleDay, daysLate: diffDays(today, next.expected) };
    } else {
      status = {
        phase: 'waiting',
        cycleDay,
        next,
        minDays: Math.max(0, diffDays(next.earliest, today)),
        maxDays: diffDays(next.latest, today),
      };
    }
  }

  return {
    periods,
    cycles,
    lengths,
    avgCycle,
    variation,
    avgPeriod,
    confidence,
    status,
    predictions,
    flags: healthFlags({ avgCycle, variation, avgPeriod, lengths, periods, days }),
    showFertile: Boolean(settings.showFertility) && confidence !== 'irregular' && confidence !== 'estimate',
  };
}

/** Gentle, non-diagnostic notes about things worth raising with a clinician. */
function healthFlags({ avgCycle, variation, avgPeriod, lengths, periods, days }) {
  const flags = [];
  if (lengths.length >= 3 && (avgCycle < TYPICAL_CYCLE[0] || avgCycle > TYPICAL_CYCLE[1])) {
    flags.push(`Your average cycle (${Math.round(avgCycle)} days) is outside the typical ${TYPICAL_CYCLE[0]}–${TYPICAL_CYCLE[1]} day range for adults.`);
  }
  if (lengths.length >= 3 && variation > 7) {
    flags.push(`Your cycle length changes by about ${Math.round(variation)} days from cycle to cycle.`);
  }
  if (avgPeriod && periods.length >= 2 && avgPeriod > MAX_PERIOD_DAYS_TYPICAL) {
    flags.push(`Your periods last about ${Math.round(avgPeriod)} days on average. Periods longer than 7 days are worth mentioning.`);
  }
  const severe = Object.values(days).filter((d) => d.pain === 'severe').length;
  if (severe >= 3) flags.push(`You've logged severe pain on ${severe} days. Pain that stops you from doing everyday things is not something you have to put up with.`);
  return flags;
}

/**
 * Where each symptom tends to show up relative to a period. Returns plain-language
 * patterns only when there's enough data to say something honest.
 */
export function symptomPatterns(days, periods) {
  if (periods.length < 2) return [];
  const starts = periods.map((p) => p.start);
  const bySymptom = {};

  for (const [date, log] of Object.entries(days)) {
    for (const s of log.symptoms ?? []) {
      // Offset: -10..-1 = days before a period, 1..7 = day N of a period.
      const prev = starts.filter((st) => st <= date).at(-1);
      const next = starts.find((st) => st > date);
      let offset = null;
      if (prev && diffDays(date, prev) < 7) offset = diffDays(date, prev) + 1;
      else if (next && diffDays(next, date) <= 10) offset = -diffDays(next, date);
      (bySymptom[s] ??= []).push(offset);
    }
  }

  const axis = [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7];
  const patterns = [];
  for (const [symptom, offsets] of Object.entries(bySymptom)) {
    if (offsets.length < 3) continue;
    let best = { count: 0 };
    for (let i = 0; i + 2 < axis.length; i++) {
      const win = axis.slice(i, i + 3);
      const count = offsets.filter((o) => win.includes(o)).length;
      if (count > best.count) best = { count, from: win[0], to: win[2] };
    }
    if (best.count / offsets.length < 0.6) continue;
    // Report only the offsets that actually occurred inside the best window.
    const hits = offsets.filter((o) => o >= best.from && o <= best.to);
    const from = Math.min(...hits), to = Math.max(...hits);
    const span = (a, b) => (a === b ? `${a}` : `${a}–${b}`);
    let when;
    if (to < 0) when = from === to ? `about ${-to} day${to === -1 ? '' : 's'} before your period` : `${span(-to, -from)} days before your period`;
    else if (from > 0) when = from === to ? `on day ${from} of your period` : `on days ${span(from, to)} of your period`;
    else when = 'right around when your period starts';
    patterns.push({ symptom, when, count: offsets.length, share: best.count / offsets.length });
  }
  return patterns.sort((a, b) => b.count - a.count);
}

/** Share of cycles in which each symptom appeared at least once. */
export function symptomFrequency(days, periods) {
  if (periods.length < 2) return [];
  const windows = periods.slice(0, -1).map((p, i) => [p.start, periods[i + 1].start]);
  const counts = {};
  for (const [from, to] of windows) {
    const seen = new Set();
    for (const [date, log] of Object.entries(days)) {
      if (date >= from && date < to) (log.symptoms ?? []).forEach((s) => seen.add(s));
    }
    seen.forEach((s) => { counts[s] = (counts[s] ?? 0) + 1; });
  }
  return Object.entries(counts)
    .map(([symptom, n]) => ({ symptom, cycles: n, share: n / windows.length }))
    .sort((a, b) => b.cycles - a.cycles);
}
