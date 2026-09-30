import { addDays, diffDays } from './dates.js';

// 'yes' = bleeding, heaviness not recorded (e.g. days filled in by "My period ended").
export const FLOWS = ['spotting', 'light', 'medium', 'heavy', 'yes'];
export const PERIOD_FLOWS = new Set(['light', 'medium', 'heavy', 'yes']);
const FLOW_RANK = { yes: 1, light: 1, medium: 2, heavy: 3 };

export const PAIN = ['none', 'mild', 'moderate', 'severe'];
export const PAIN_LABELS = { none: 'None', mild: 'A little', moderate: 'Medium', severe: 'A lot' };

export const SYMPTOMS = {
  Bleeding: ['Clots', 'Unexpected bleeding'],
  Body: ['Cramps', 'Headache', 'Back pain', 'Sore chest', 'Bloating', 'Nausea', 'Diarrhea', 'Constipation', 'Acne', 'Discharge', 'Dizzy', 'Tired', 'Cravings'],
  Feelings: ['Happy', 'Calm', 'Energetic', 'Sad', 'Anxious', 'Irritable', 'Sensitive', 'Angry', 'Low energy'],
  Life: ['Slept well', 'Slept badly', 'Sports or exercise', 'Pain medicine', 'Heating pad'],
};

// "Did your period affect school today?"
export const SCHOOL_IMPACT = [['none', 'No'], ['little', 'A little'], ['lot', 'A lot'], ['home', 'I went home or stayed home']];


// From ACOG guidance on the menstrual cycle as a vital sign in girls and
// adolescents: in the first years after a first period, cycles of roughly
// 21–45 days are typical.
export const EARLY_CYCLE = [21, 45];
const LONG_GAP = 90; // over ~3 months without a period is worth a check-in
const MAX_TYPICAL_PERIOD = 7;

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stdev = (xs) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
};
/** The usual range: with 5+ values, the single highest and lowest are left out. */
export function typicalRange(xs) {
  const sorted = [...xs].sort((a, b) => a - b);
  const trimmed = sorted.length >= 5 ? sorted.slice(1, -1) : sorted;
  return [trimmed[0], trimmed.at(-1)];
}

const FEELING_WORDS = new Set(['Happy', 'Calm', 'Energetic', 'Sad', 'Anxious', 'Irritable', 'Sensitive', 'Angry', 'Tired', 'Dizzy']);
const PHRASES = { Headache: 'headaches', 'Low energy': 'low energy', 'Sore chest': 'a sore chest', 'Unexpected bleeding': 'unexpected bleeding', 'Slept badly': 'bad sleep', 'Slept well': 'good sleep' };
/** "Tired" → "feeling tired", "Headache" → "headaches", "Cramps" → "cramps". */
export function symptomPhrase(s) {
  if (PHRASES[s]) return PHRASES[s];
  if (FEELING_WORDS.has(s)) return `feeling ${s.toLowerCase()}`;
  return s.toLowerCase();
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function isEmptyLog(log) {
  return !log || (!log.flow && !log.pain && !log.school && !(log.symptoms?.length) && !log.notes?.trim());
}

/**
 * The last day of an open period we can actually vouch for: the latest day she
 * logged bleeding, or the day after (so skipping one day of logging is fine).
 */
export function confirmedThrough(days, openPeriod, today) {
  let last = openPeriod;
  for (let d = openPeriod; d <= today; d = addDays(d, 1)) if (PERIOD_FLOWS.has(days[d]?.flow)) last = d;
  return addDays(last, 1) < today ? addDays(last, 1) : today;
}

/**
 * Logged days plus the open period's days, but never beyond what she's
 * confirmed. We don't invent bleeding: if she stops logging, we ask instead.
 */
export function withOpenPeriod(days, openPeriod, today) {
  if (!openPeriod || openPeriod > today) return days;
  const out = { ...days };
  const through = confirmedThrough(days, openPeriod, today);
  for (let d = openPeriod; d <= through; d = addDays(d, 1)) {
    if (!PERIOD_FLOWS.has(out[d]?.flow)) out[d] = { ...out[d], flow: 'yes' };
  }
  return out;
}

/** Consecutive bleeding days (a one-day pause is allowed) form one period. Spotting alone doesn't count. */
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
  for (const p of periods) {
    p.length = diffDays(p.end, p.start) + 1;
    // A start date remembered during setup tells us when, not how long.
    p.estimated = p.days.every((d) => days[d].estimated);
  }
  return periods;
}

/**
 * What we can honestly say about her cycle. Predictions are always ranges, and
 * they only narrow once there's enough consistent history to justify it.
 */
export function analyze(rawDays, { openPeriod = null } = {}, today) {
  const days = withOpenPeriod(rawDays, openPeriod, today);
  const periods = findPeriods(days);
  const last = periods.at(-1) ?? null;
  const needsCheck = Boolean(openPeriod && openPeriod <= today && confirmedThrough(rawDays, openPeriod, today) < today);
  const ongoing = Boolean(last && !needsCheck && (openPeriod ? openPeriod <= today : diffDays(today, last.end) <= 1) && last.start <= today);

  const cycles = [];
  for (let i = 1; i < periods.length; i++) {
    const length = diffDays(periods[i].start, periods[i - 1].start);
    cycles.push({ start: periods[i - 1].start, length, periodLength: periods[i - 1].length, long: length > LONG_GAP });
  }

  const recent = cycles.filter((c) => !c.long).slice(-6);
  const lengths = recent.map((c) => c.length);
  const avgCycle = lengths.length ? mean(lengths) : null;
  const variation = lengths.length >= 2 ? stdev(lengths) : null;
  const complete = (ongoing ? periods.slice(0, -1) : periods).filter((p) => !p.estimated).slice(-6);
  const periodLengths = complete.map((p) => p.length);

  // 🌱 Learning → 🌿 Getting to know you → 🌷 Strong pattern
  let confidence;
  if (!lengths.length) confidence = 'first';
  else if (lengths.length < 3) confidence = 'learning';
  else if (lengths.length >= 4 && variation <= 3) confidence = 'strong';
  else confidence = 'knowing';

  // The likely window for the next period.
  let next = null;
  if (last) {
    let earliest, latest;
    if (!lengths.length) {
      [earliest, latest] = EARLY_CYCLE;
    } else if (lengths.length < 3) {
      earliest = Math.min(...lengths) - 4;
      latest = Math.max(...lengths) + 4;
    } else {
      const spread = Math.min(12, Math.max(3, Math.round(1.5 * variation)));
      earliest = Math.round(avgCycle) - spread;
      latest = Math.round(avgCycle) + spread;
    }
    earliest = Math.max(15, earliest);
    next = { earliest: addDays(last.start, earliest), latest: addDays(last.start, latest) };
  }

  let status;
  if (!last) status = { phase: 'none' };
  else if (needsCheck) status = { phase: 'stillGoing', start: openPeriod, lastSure: last.end };
  else if (ongoing) status = { phase: 'period', day: diffDays(today, last.start) + 1, start: last.start };
  else {
    const since = diffDays(today, last.start);
    if (since > LONG_GAP) status = { phase: 'longGap', since };
    else if (today < next.earliest) status = { phase: 'waiting', since, minDays: diffDays(next.earliest, today), maxDays: diffDays(next.latest, today) };
    else if (today <= next.latest) status = { phase: 'window', since };
    // Past the window: never "LATE". Early cycles often run long or skip.
    else status = { phase: 'notYet', since };
  }

  return {
    days, periods, cycles, lengths, avgCycle, variation, periodLengths, confidence, status, next,
    patterns: findPatterns(days, periods, ongoing),
    common: commonSymptoms(days),
    stillChanging: lengths.length >= 3 && variation > 7,
    changes: findChanges(cycles, periods, ongoing, days),
    checkIns: checkIns({ lengths, periodLengths, status, days }),
  };
}

/**
 * Gentle, non-diagnostic notes about things worth mentioning to a parent,
 * guardian or doctor. Framed as "worth a check-in", never as something wrong.
 */
function checkIns({ lengths, periodLengths, status, days }) {
  const notes = [];
  if (status.phase === 'longGap') {
    notes.push(`It’s been over 3 months since your last period started. That can happen, especially in the first few years, but it’s a good thing to mention to a doctor.`);
  }
  if (lengths.filter((l) => l < EARLY_CYCLE[0]).length >= 2) {
    notes.push('A few of your periods have come less than 3 weeks apart.');
  }
  if (lengths.length >= 3 && mean(lengths) > EARLY_CYCLE[1]) {
    notes.push('Your periods usually come more than 6 weeks apart.');
  }
  if (periodLengths.filter((l) => l > MAX_TYPICAL_PERIOD).length >= 2) {
    notes.push('Some of your periods have lasted more than 7 days.');
  }
  const missed = Object.values(days).filter((d) => ['lot', 'home'].includes(d.school)).length;
  if (missed >= 2) notes.push(`Your period got in the way of school a lot on ${plural(missed, 'day')}. That’s worth telling someone about, because it doesn’t have to be that way.`);
  const aLot = Object.values(days).filter((d) => d.pain === 'severe').length;
  if (aLot >= 3) notes.push(`You’ve logged “a lot” of pain on ${plural(aLot, 'day')}. Period pain that gets in the way of school or fun is worth talking about, because there are ways to help.`);
  return notes;
}

/** Plain-language personal patterns, only when there's enough data to say them honestly. */
export function findPatterns(days, periods, ongoing = false) {
  const patterns = [];
  const done = (ongoing ? periods.slice(0, -1) : periods).filter((p) => !p.estimated).slice(-6);

  // "Your periods usually last 4–6 days."
  if (done.length >= 3) {
    const [lo, hi] = typicalRange(done.map((p) => p.length));
    patterns.push({
      id: 'length',
      text: lo === hi ? `Your periods usually last ${lo} days.` : hi - lo <= 3 ? `Your periods usually last ${lo}–${hi} days.` : `Your last ${done.length} periods lasted between ${lo} and ${hi} days.`,
    });
  }

  // "Your heaviest day is usually Day 2."
  const heaviest = done
    .map((p) => {
      let best = null;
      p.days.forEach((d) => {
        const r = FLOW_RANK[days[d].flow] ?? 0;
        if (days[d].flow !== 'yes' && (!best || r > best.r)) best = { r, day: diffDays(d, p.start) + 1 };
      });
      return best && best.r >= 2 ? best.day : null;
    })
    .filter(Boolean);
  if (heaviest.length >= 3) {
    const counts = {};
    heaviest.forEach((d) => { counts[d] = (counts[d] ?? 0) + 1; });
    const [day, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (n / heaviest.length >= 0.5) patterns.push({ id: 'heaviest', text: `Your heaviest day is usually Day ${day}.` });
  }

  // Symptoms on the first days of recent periods, and just before them.
  const recent = periods.slice(-5);
  const symptoms = new Set(Object.values(days).flatMap((d) => d.symptoms ?? []));
  for (const s of symptoms) {
    const has = (d) => days[d]?.symptoms?.includes(s);
    if (recent.length >= 3) {
      const early = recent.filter((p) => has(p.start) || has(addDays(p.start, 1)));
      if (early.length >= 3 && early.length / recent.length >= 0.6) {
        patterns.push({ id: `early-${s}`, symptom: s, text: `You’ve logged ${symptomPhrase(s)} during the first two days of ${early.length === recent.length ? `your last ${recent.length}` : `${early.length} of your last ${recent.length}`} periods.` });
        continue;
      }
    }
    const withBefore = periods.slice(1).slice(-5);
    if (withBefore.length >= 2) {
      const before = withBefore.filter((p) => [1, 2, 3].some((k) => has(addDays(p.start, -k))));
      if (before.length >= 2 && before.length / withBefore.length >= 0.6) {
        patterns.push({ id: `before-${s}`, symptom: s, text: `You often log ${symptomPhrase(s)} in the few days before your period.` });
      }
    }
  }
  return patterns;
}

/** "Is my body doing something different than usual?" Compares recent cycles with her own baseline. */
export const CONFIDENCE = {
  first: { emoji: '🌱', label: 'Learning', note: 'We’re still learning your cycle. This is a wide guess based on one period.' },
  learning: { emoji: '🌱', label: 'Learning', note: 'We’re still learning your cycle, so the range is wide on purpose.' },
  knowing: { emoji: '🌿', label: 'Getting to know you', note: 'Cadence is starting to learn your rhythm. Cycles often vary, so there’s still a range.' },
  strong: { emoji: '🌷', label: 'Strong pattern', note: 'Your cycles have been steady, so the range is narrower.' },
};

const FEELINGS_AND_LIFE = new Set([...SYMPTOMS.Feelings, ...SYMPTOMS.Life]);

/** Her most-logged body symptoms. */
export function commonSymptoms(days, n = 3) {
  const counts = {};
  Object.values(days).forEach((d) => (d.symptoms ?? []).forEach((s) => { if (!FEELINGS_AND_LIFE.has(s)) counts[s] = (counts[s] ?? 0) + 1; }));
  return Object.entries(counts).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, n).map(([s, c]) => ({ symptom: s, count: c }));
}

export function findChanges(cycles, periods, ongoing, days) {
  const changes = [];
  const usable = cycles.filter((c) => !c.long);
  if (usable.length >= 6) {
    const recent = usable.slice(-3).map((c) => c.length);
    const base = usable.slice(0, -3).slice(-6).map((c) => c.length);
    const r = mean(recent), b = mean(base);
    if (r - b >= 7) changes.push(`Your last 3 cycles were longer than usual (about ${Math.round(r)} days, compared with your usual ${Math.round(b)}).`);
    else if (b - r >= 7) changes.push(`Your last 3 cycles were shorter than usual (about ${Math.round(r)} days, compared with your usual ${Math.round(b)}).`);
    else if (base.length >= 3 && stdev(recent) - stdev(base) >= 5) changes.push('Your last 3 cycles were more up-and-down than usual.');
  }
  const done = (ongoing ? periods.slice(0, -1) : periods).filter((p) => !p.estimated);
  if (done.length >= 6) {
    const r = mean(done.slice(-3).map((p) => p.length)), b = mean(done.slice(0, -3).slice(-6).map((p) => p.length));
    if (r - b >= 2) changes.push(`Your last 3 periods lasted longer than usual (about ${Math.round(r)} days, compared with ${Math.round(b)}).`);
  }
  if (done.length >= 6) {
    const painful = (p) => p.days.some((d) => ['moderate', 'severe'].includes(days[d]?.pain));
    const r = done.slice(-3).filter(painful).length, b = done.slice(0, -3).filter(painful).length / (done.length - 3);
    if (r === 3 && b < 0.5) changes.push('You’ve logged stronger cramps or pain during your last 3 periods than you usually do.');
  }
  return changes;
}
