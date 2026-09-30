import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addDays, diffDays } from './dates.js';
import { findPeriods, analyze, withOpenPeriod, FLOWS, PAIN } from './cycles.js';
import { reminderIcs, reminderGoogleUrl, windowIcs, outlookUrl } from './ics.js';
import { importCsv, importStartDates, parseDate } from './importers.js';
import { sanitizeBackup } from './storage.js';
import { draftMessage, evidence } from './tell.js';
import { NORMAL, searchNormal } from '../content/normal.js';

const TODAY = '2026-09-30';

function logPeriods(starts, len = 5, extra = () => ({})) {
  const days = {};
  for (const s of starts) {
    const flows = ['medium', 'heavy', 'medium', 'light', 'light', 'light', 'light', 'light', 'light'];
    for (let i = 0; i < len; i++) days[addDays(s, i)] = { flow: flows[i], ...extra(i) };
  }
  return days;
}

test('dates cross month and DST boundaries cleanly', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(diffDays('2027-01-01', '2026-12-25'), 7);
});

test('periods group consecutive days, allow a one-day pause, and ignore spotting alone', () => {
  const periods = findPeriods({
    '2026-09-01': { flow: 'heavy' },
    '2026-09-02': { flow: 'medium' },
    '2026-09-04': { flow: 'light' },
    '2026-09-15': { flow: 'spotting' },
    '2026-09-29': { flow: 'yes' },
  });
  assert.equal(periods.length, 2);
  assert.deepEqual([periods[0].start, periods[0].end, periods[0].length], ['2026-09-01', '2026-09-04', 4]);
});

test('nothing logged: no prediction, no status', () => {
  const a = analyze({}, {}, TODAY);
  assert.equal(a.status.phase, 'none');
  assert.equal(a.next, null);
});

test('one period only: a wide, honest 21–45 day window, never a single date', () => {
  const a = analyze({ '2026-09-10': { flow: 'yes', estimated: true } }, {}, TODAY);
  assert.equal(a.confidence, 'first');
  assert.deepEqual(a.next, { earliest: '2026-10-01', latest: '2026-10-25' });
  assert.equal(a.status.phase, 'waiting');
  assert.deepEqual(a.periodLengths, [], 'a remembered start date says nothing about length');
});

test('two cycles: still learning, range covers what she has seen plus margin', () => {
  const a = analyze(logPeriods(['2026-07-01', '2026-08-02', '2026-09-05']), {}, '2026-09-12');
  assert.equal(a.confidence, 'learning');
  assert.deepEqual(a.lengths, [32, 34]);
  assert.equal(a.next.earliest, addDays('2026-09-05', 28));
  assert.equal(a.next.latest, addDays('2026-09-05', 38));
});

test('steady history narrows the window, but never below ±3 days', () => {
  const starts = ['2026-04-01', '2026-04-29', '2026-05-27', '2026-06-24', '2026-07-22', '2026-08-19'];
  const a = analyze(logPeriods(starts), {}, '2026-09-01');
  assert.equal(a.confidence, 'strong');
  assert.equal(diffDays(a.next.latest, a.next.earliest), 6);
});

test('varying cycles keep the window wide', () => {
  const starts = ['2026-01-01', '2026-01-26', '2026-03-12', '2026-04-08', '2026-05-20', '2026-06-18'];
  const a = analyze(logPeriods(starts), {}, '2026-06-25');
  assert.equal(a.confidence, 'knowing');
  assert.equal(a.stillChanging, true);
  assert.ok(diffDays(a.next.latest, a.next.earliest) >= 20);
});

test('after the window: a gentle "not yet", never "late"', () => {
  const a = analyze(logPeriods(['2026-06-01', '2026-06-29']), {}, '2026-08-15');
  assert.equal(a.status.phase, 'notYet');
  assert.ok(!('daysLate' in a.status));
});

test('over 3 months without a period prompts a gentle check-in', () => {
  const a = analyze(logPeriods(['2026-05-01']), {}, '2026-08-15');
  assert.equal(a.status.phase, 'longGap');
  assert.ok(a.checkIns.some((c) => c.includes('3 months')));
});

test('an open period counts days she confirms (one skipped day is fine)', () => {
  const days = { '2026-09-27': { flow: 'heavy' }, '2026-09-29': { flow: 'medium' } };
  const a = analyze(days, { openPeriod: '2026-09-27' }, TODAY);
  assert.deepEqual(a.status, { phase: 'period', day: 4, start: '2026-09-27' });
  assert.equal(Object.keys(withOpenPeriod(days, '2026-09-27', TODAY)).length, 4);
});

test('never invents bleeding: if she stops logging, ask "still on your period?"', () => {
  const days = { '2026-09-10': { flow: 'heavy' } };
  const a = analyze(days, { openPeriod: '2026-09-10' }, TODAY);
  assert.equal(a.status.phase, 'stillGoing');
  assert.equal(a.periods[0].length, 2, 'only the logged day plus one grace day, not 21 days');
});

test('change detection: recent cycles longer than her own baseline', () => {
  const starts = ['2026-01-01'];
  [28, 29, 28, 30, 28, 29, 38, 37, 39].forEach((l) => starts.push(addDays(starts.at(-1), l)));
  const a = analyze(logPeriods(starts), {}, addDays(starts.at(-1), 10));
  assert.ok(a.changes.some((c) => c.startsWith('Your last 3 cycles were longer than usual')), a.changes.join(' | '));
  const steady = analyze(logPeriods(['2026-04-01', '2026-04-29', '2026-05-27', '2026-06-24', '2026-07-22', '2026-08-19', '2026-09-16']), {}, TODAY);
  assert.deepEqual(steady.changes, []);
});

test('patterns: length range, heaviest day, first-days symptoms, before-period symptoms', () => {
  const starts = ['2026-04-01', '2026-04-30', '2026-05-31', '2026-06-29', '2026-07-30'];
  const days = logPeriods(starts, 5, (i) => (i < 2 ? { symptoms: ['Cramps'] } : {}));
  for (const s of starts.slice(1)) days[addDays(s, -2)] = { symptoms: ['Headache'] };
  const a = analyze(days, {}, '2026-08-20');
  const text = a.patterns.map((p) => p.text);
  assert.deepEqual(a.common.map((c) => c.symptom), ['Cramps', 'Headache']);
  assert.ok(text.includes('Your periods usually last 5 days.'), text.join(' | '));
  assert.ok(text.includes('Your heaviest day is usually Day 2.'));
  assert.ok(text.includes('You’ve logged cramps during the first two days of your last 5 periods.'));
  assert.ok(text.includes('You often log headaches in the few days before your period.'));
});

test('no patterns from too little data', () => {
  const a = analyze(logPeriods(['2026-08-01', '2026-08-30']), {}, TODAY);
  assert.deepEqual(a.patterns, []);
});

test('repeated "a lot" of pain is noticed, gently', () => {
  const days = logPeriods(['2026-08-01'], 3, () => ({ pain: 'severe' }));
  assert.ok(analyze(days, {}, '2026-08-10').checkIns.some((c) => c.includes('ways to help')));
});

test('pouch reminders never mention periods', () => {
  const ics = reminderIcs('2026-10-09', '🎒 Check your bag');
  assert.match(ics, /DTSTART;VALUE=DATE:20261009/);
  assert.match(ics, /BEGIN:VALARM/);
  assert.doesNotMatch(ics, /period/i);
  const url = reminderGoogleUrl('2026-10-09', 'Pack stuff');
  assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
  assert.doesNotMatch(decodeURIComponent(url), /period/i);
});

test('backup import keeps only known fields', () => {
  const days = sanitizeBackup({
    app: 'cadence',
    days: { '2026-09-01': { flow: 'heavy', pain: 'mild', symptoms: ['Cramps'], notes: 'hi', evil: '<script>' }, 'bad-date': { flow: 'heavy' } },
  }, { flows: FLOWS, pain: PAIN });
  assert.deepEqual(days, { '2026-09-01': { flow: 'heavy', pain: 'mild', symptoms: ['Cramps'], notes: 'hi' } });
  assert.throws(() => sanitizeBackup({ days: {} }, { flows: FLOWS, pain: PAIN }));
});

test('"Is this normal?" answers follow the four-part shape and search handles real phrasing', () => {
  assert.ok(NORMAL.length >= 20);
  assert.ok(NORMAL.every((q) => q.happening && q.usually && q.topic));
  const top = (q) => searchNormal(q)[0]?.id;
  assert.equal(top('My blood is brown'), 'brown-blood');
  assert.equal(top('I have clots'), 'clots');
  assert.equal(top('My period stopped yesterday and came back'), 'stop-start');
  assert.equal(top('Why do I poop more?'), 'poop');
  assert.equal(top('Why am I crying?'), 'crying');
  assert.equal(top('I got blood on my clothes'), 'blood-clothes');
  assert.equal(top('Why is there stuff in my underwear?'), 'underwear-stuff');
  assert.equal(top('my cramps really hurt'), 'cramps');
  assert.equal(top('I’m bleeding a lot'), 'bleeding-lot');
});

test('calendar window event: a range, discreet by default, stable id so updates replace it', () => {
  const a = windowIcs({ earliest: '2026-10-12', latest: '2026-10-17', cycleKey: '2026-09-14' });
  const b = windowIcs({ earliest: '2026-10-13', latest: '2026-10-19', cycleKey: '2026-09-14', sequence: 1 });
  assert.match(a, /SUMMARY:Personal/);
  assert.doesNotMatch(a, /period/i);
  assert.match(a, /DTSTART;VALUE=DATE:20261012\r\nDTEND;VALUE=DATE:20261018/);
  assert.equal(a.match(/UID:.*/)[0], b.match(/UID:.*/)[0]);
  assert.match(b, /SEQUENCE:1/);
  assert.match(windowIcs({ earliest: '2026-10-12', latest: '2026-10-17', cycleKey: 'x', style: 'direct' }), /SUMMARY:Expected period/);
  assert.match(outlookUrl({ start: '2026-10-12', end: '2026-10-17', title: 'Personal' }), /startdt=2026-10-12&enddt=2026-10-18&allday=true/);
});

test('bring my history: CSV with a flow column, CSV with start/end, pasted start dates', () => {
  const a = importCsv('Date,Flow,Notes\n2026-01-03,Heavy,\n2026-01-04,medium,x\n2026-01-05,,\n01/31/2026,light,');
  assert.deepEqual(a, { '2026-01-03': { flow: 'heavy' }, '2026-01-04': { flow: 'medium' }, '2026-01-31': { flow: 'light' } });
  const b = importCsv('period start,period end\n2026-02-01,2026-02-03\n"Mar 2, 2026",');
  assert.deepEqual(Object.keys(b), ['2026-02-01', '2026-02-02', '2026-02-03', '2026-03-02']);
  const { days, count } = importStartDates('2026-01-03\nFeb 1, 2026\n28/02/2026, 2026-03-30');
  assert.equal(count, 4);
  assert.ok(Object.values(days).every((d) => d.estimated), 'pasted dates never invent period length');
  assert.equal(parseDate('31.12.2026'), '2026-12-31');
  assert.equal(parseDate('2026-02-30'), null);
  assert.throws(() => importCsv('name,age\nx,1'));
});

// Product guardrail: this app is not a fertility, sex or pregnancy tracker.
test('no fertility, ovulation, contraception or sex-tracking features in the app', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const files = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(e.name) && !e.name.endsWith('.test.js')) files.push(p);
  });
  walk(root);
  const banned = /fertil|ovulat|contracept|conceiv|intercourse|masturbat|sex drive|sexual activity/i;
  for (const f of files) assert.ok(!banned.test(fs.readFileSync(f, 'utf8')), `${path.relative(root, f)} mentions an out-of-scope feature`);
  const late = /period is late|your period is \d+ days? late/i;
  for (const f of files) assert.ok(!late.test(fs.readFileSync(f, 'utf8')), `${path.relative(root, f)} uses frightening "late" language`);
});

test('help me tell someone: drafts use her own data only when she wants', () => {
  const days = logPeriods(['2026-07-01', '2026-07-30', '2026-08-29'], 4, (i) => (i < 2 ? { pain: 'severe' } : {}));
  days['2026-08-29'].school = 'home';
  const a = analyze(days, {}, '2026-09-10');
  const facts = evidence(a, '2026-09-10');
  assert.equal(facts.severeDays, 6);
  const msg = draftMessage({ topic: 'pain', person: 'mom', facts });
  assert.match(msg, /^Hi Mom, My cramps have been really painful\. I’ve logged a lot of pain on 6 days during my last 3 periods, and my period has really affected school on 1 day lately\. Can we talk about it\?$/);
  const without = draftMessage({ topic: 'pain', person: 'nurse', facts, useData: false });
  assert.doesNotMatch(without, /\d/);
  assert.match(without, /Could I come talk to you about it\?$/);
  assert.match(draftMessage({ topic: 'first', person: 'nurse' }), /first period/);
});

test('my life: plans that overlap the possible window get a heads-up', async () => {
  const { planOverlaps } = await import('./plans.js');
  const next = { earliest: '2026-10-12', latest: '2026-10-17' };
  const plans = [
    { id: 1, emoji: '✈️', title: 'Barcelona', start: '2026-10-16', end: '2026-10-22' },
    { id: 2, emoji: '🎓', title: 'Finals', start: '2026-10-01', end: '2026-10-05' },
    { id: 3, emoji: '🚌', title: 'Field trip', start: '2026-10-12' },
  ];
  const hits = planOverlaps(plans, next, '2026-09-30');
  assert.deepEqual(hits.map((h) => h.title), ['Barcelona', 'Field trip']);
  assert.equal(hits[1].packing, 'Pack your pouch?');
  const withCramps = planOverlaps([plans[0]], next, '2026-09-30', [{ id: 'early-Cramps' }]);
  assert.equal(withCramps[0].packing, 'Pack extra supplies in your carry-on. Your cramps are usually strongest on Days 1–2.');
});

test('usual ranges ignore a single outlier, and symptoms read naturally', async () => {
  const { typicalRange, symptomPhrase } = await import('./cycles.js');
  assert.deepEqual(typicalRange([1, 5, 5, 4, 5, 6]), [4, 5]);
  assert.deepEqual(typicalRange([4, 6]), [4, 6]);
  assert.equal(symptomPhrase('Tired'), 'feeling tired');
  assert.equal(symptomPhrase('Headache'), 'headaches');
  assert.equal(symptomPhrase('Cramps'), 'cramps');
});
