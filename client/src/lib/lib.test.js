import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, diffDays } from './dates.js';
import { findPeriods, analyze, symptomPatterns, symptomFrequency } from './cycles.js';
import { deriveKeys, entryId, encryptJson, decryptJson, newShareKey, importShareKey } from './crypto.js';
import { buildIcs, googleCalendarUrl } from './ics.js';
import { buildSnapshot, caregiverTips } from './share.js';

/** Log `len` medium-flow days starting at each date. */
function logPeriods(starts, len = 5, extra = {}) {
  const days = {};
  for (const s of starts) for (let i = 0; i < len; i++) days[addDays(s, i)] = { flow: 'medium', ...extra };
  return days;
}

test('date helpers cross month and DST boundaries cleanly', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-03-07', 2), '2026-03-09');
  assert.equal(diffDays('2027-01-01', '2026-12-25'), 7);
});

test('periods group consecutive days, tolerate a one-day gap, and ignore spotting', () => {
  const days = {
    '2026-09-01': { flow: 'heavy' },
    '2026-09-02': { flow: 'medium' },
    '2026-09-04': { flow: 'light' }, // one-day gap: same period
    '2026-09-15': { flow: 'spotting' }, // spotting alone isn't a period
    '2026-09-29': { flow: 'medium' },
  };
  const periods = findPeriods(days);
  assert.equal(periods.length, 2);
  assert.deepEqual([periods[0].start, periods[0].end, periods[0].length], ['2026-09-01', '2026-09-04', 4]);
});

test('no data: nothing to predict yet', () => {
  const a = analyze({}, {}, '2026-09-30');
  assert.equal(a.status.phase, 'empty');
  assert.equal(a.predictions.length, 0);
});

test('one logged period: predicts from the typical-length setting and says it is an estimate', () => {
  const a = analyze(logPeriods(['2026-09-01']), { typicalCycle: 30 }, '2026-09-10');
  assert.equal(a.confidence, 'estimate');
  assert.equal(a.predictions[0].expected, '2026-10-01');
  assert.equal(a.status.phase, 'waiting');
  assert.equal(a.showFertile, false, 'no fertile window from a guess');
});

test('steady cycles give a tight range', () => {
  const starts = ['2026-05-01', '2026-05-29', '2026-06-26', '2026-07-24', '2026-08-21'];
  const a = analyze(logPeriods(starts), {}, '2026-09-01');
  assert.equal(a.avgCycle, 28);
  assert.equal(a.confidence, 'steady');
  assert.equal(a.predictions[0].expected, '2026-09-18');
  assert.equal(diffDays(a.predictions[0].latest, a.predictions[0].earliest), 4); // ±2 minimum
  assert.equal(a.status.cycleDay, 12);
  assert.deepEqual(a.flags, []);
});

test('irregular cycles widen the range, hide the fertile window and raise a gentle flag', () => {
  const starts = ['2026-01-01', '2026-01-24', '2026-03-10', '2026-04-05', '2026-05-22', '2026-06-18'];
  const a = analyze(logPeriods(starts), { showFertility: true }, '2026-06-25');
  assert.equal(a.confidence, 'irregular');
  assert.ok(diffDays(a.predictions[0].latest, a.predictions[0].earliest) >= 16);
  assert.equal(a.showFertile, false);
  assert.ok(a.flags.some((f) => f.includes('changes by about')));
});

test('ongoing period and late period statuses', () => {
  const days = logPeriods(['2026-08-01', '2026-08-29']);
  days['2026-09-26'] = { flow: 'heavy' };
  days['2026-09-27'] = { flow: 'medium' };
  assert.deepEqual(analyze(days, {}, '2026-09-28').status, { phase: 'period', day: 3 });

  const late = analyze(logPeriods(['2026-07-01', '2026-07-29']), {}, '2026-09-01');
  assert.equal(late.status.phase, 'late');
  assert.equal(late.status.daysLate, 6); // expected Aug 26
});

test('a long unlogged gap is not counted as a cycle', () => {
  const a = analyze(logPeriods(['2026-01-01', '2026-01-29', '2026-06-01', '2026-06-29']), {}, '2026-07-05');
  assert.deepEqual(a.lengths, [28, 28]);
  assert.equal(a.cycles.filter((c) => c.gap).length, 1);
});

test('symptom patterns: headaches that come 2 days before each period', () => {
  const starts = ['2026-05-01', '2026-05-29', '2026-06-26', '2026-07-24'];
  const days = logPeriods(starts);
  for (const s of starts.slice(1)) days[addDays(s, -2)] = { symptoms: ['Headache'] };
  days['2026-06-10'] = { symptoms: ['Tired'] };
  const [p] = symptomPatterns(days, findPeriods(days));
  assert.equal(p.symptom, 'Headache');
  assert.equal(p.when, 'about 2 days before your period');

  const freq = symptomFrequency(days, findPeriods(days));
  assert.equal(freq.find((f) => f.symptom === 'Headache').cycles, 3);
});

test('keys: same password + salt gives the same keys; ciphertext round-trips and is bound to its id', async () => {
  const salt = '00112233445566778899aabbccddeeff';
  const a = await deriveKeys('correct horse', salt, 1000);
  const b = await deriveKeys('correct horse', salt, 1000);
  const c = await deriveKeys('wrong horse', salt, 1000);
  assert.equal(a.authKey, b.authKey);
  assert.notEqual(a.authKey, c.authKey);

  const id = await entryId(a.macKey, 'day:2026-09-30');
  assert.equal(id, await entryId(b.macKey, 'day:2026-09-30'));
  assert.doesNotMatch(id, /2026/);

  const blob = await encryptJson(a.encKey, { flow: 'heavy' }, id);
  assert.doesNotMatch(atob(blob.data), /heavy/);
  assert.deepEqual(await decryptJson(b.encKey, blob, id), { flow: 'heavy' });
  await assert.rejects(decryptJson(c.encKey, blob, id), 'wrong password cannot decrypt');
  await assert.rejects(decryptJson(a.encKey, blob, 'another-id'), 'blob cannot be moved to another entry');
});

test('share keys round-trip through a URL-safe string', async () => {
  const { raw, key } = await newShareKey();
  assert.match(raw, /^[A-Za-z0-9_-]{43}$/);
  const blob = await encryptJson(key, { hi: 1 }, 'tok');
  assert.deepEqual(await decryptJson(await importShareKey(raw), blob, 'tok'), { hi: 1 });
});

test('ics feed and Google Calendar link', () => {
  const a = analyze(logPeriods(['2026-08-01', '2026-08-29', '2026-09-26']), {}, '2026-09-30');
  const ics = buildIcs(a.predictions, { title: 'Reminder' });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 3);
  assert.match(ics, /SUMMARY:Reminder/);
  assert.doesNotMatch(ics, /fertile/i);
  const url = googleCalendarUrl(a.predictions[0], 'Reminder');
  assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
  assert.match(url, /dates=20261020%2F20261029/);
});

test('share snapshots contain only what the person chose to share', () => {
  const days = logPeriods(['2026-08-29']);
  days['2026-09-30'] = { flow: 'heavy', pain: 'severe', notes: 'private note', symptoms: ['Cramps'] };
  const analysis = analyze(days, {}, '2026-09-30');
  const share = { label: 'Mom', fields: ['status', 'requests'] };
  const snap = buildSnapshot({ share, analysis, days, requests: { supplies: true, talk: false }, displayName: 'Ava' });
  assert.deepEqual(Object.keys(snap).sort(), ['label', 'name', 'requests', 'status', 'updated']);
  assert.deepEqual(snap.requests, ['supplies']);
  assert.doesNotMatch(JSON.stringify(snap), /private note|Cramps/);
  assert.ok(caregiverTips(snap).some((t) => t.includes('pads')));
});
