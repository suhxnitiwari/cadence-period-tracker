import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newProfile } from './storage.js';
import {
  newSpace, pairFragment, parsePairFragment, spaceKeys, encryptRecord, decryptRecord,
  buildRecords, changedRecords, applyPulled, privateCategories,
} from './syncCore.js';

function her() {
  const p = newProfile({ relation: 'me' });
  p.profile = { stage: 'few' };
  p.days = {
    '2026-09-01': { flow: 'heavy', pain: 'severe', symptoms: ['Cramps', 'Sad'], school: 'home', notes: 'my diary' },
    '2026-09-02': { flow: 'medium' },
  };
  p.sync = { id: 'x', key: 'y', seq: 0, pushed: {}, shares: { pain: false, symptoms: false, school: false } };
  return p;
}
function parent() {
  const p = newProfile({ relation: 'child', name: 'Maya' });
  p.profile = { stage: 'few' };
  p.sync = { id: 'x', key: 'y', seq: 0, pushed: {} };
  return p;
}
const pull = (from, to) => applyPulled(to, Object.entries(buildRecords(from)).map(([n, v]) => ({ n, v })), 1);

test('pair links carry a 128-bit id and a 256-bit key, and parse back', () => {
  const s = newSpace();
  assert.deepEqual(parsePairFragment(`#${pairFragment(s)}`), s);
  assert.equal(parsePairFragment('#nope'), null);
});

test('records are encrypted, named by HMAC, and bound to their id', async () => {
  const keys = await spaceKeys(newSpace().key);
  const r = await encryptRecord(keys, 'day:2026-09-01', { flow: 'heavy' });
  assert.match(r.id, /^[0-9a-f]{64}$/);
  assert.doesNotMatch(atob(r.data), /heavy|2026/);
  assert.deepEqual(await decryptRecord(keys, r), { n: 'day:2026-09-01', v: { flow: 'heavy' } });
  await assert.rejects(decryptRecord(keys, { ...r, id: 'f'.repeat(64) }));
  const other = await spaceKeys(newSpace().key);
  await assert.rejects(decryptRecord(other, r), 'a different pairing cannot read it');
});

test('by default her phone shares periods only; notes never leave', () => {
  const recs = buildRecords(her());
  assert.deepEqual(recs['day:2026-09-01'], { flow: 'heavy', estimated: null, pain: null, symptoms: null, school: null });
  assert.doesNotMatch(JSON.stringify(recs), /diary|Cramps|severe|home/);
});

test('she can choose to share pain, symptoms and school impact', () => {
  const p = her();
  p.sync.shares = { pain: true, symptoms: true, school: false };
  const d = buildRecords(p)['day:2026-09-01'];
  assert.equal(d.pain, 'severe');
  assert.deepEqual(d.symptoms, ['Cramps', 'Sad']);
  assert.equal(d.school, null);
});

test("parent's phone gets her periods, keeps its own notes, and hides what she keeps private", () => {
  let mom = parent();
  mom.days['2026-09-01'] = { notes: 'call doctor' };
  mom = pull(her(), mom);
  assert.deepEqual(mom.days['2026-09-01'], { notes: 'call doctor', flow: 'heavy' });
  assert.equal(mom.days['2026-09-02'].flow, 'medium');
  assert.deepEqual(privateCategories(mom), { pain: true, symptoms: true, school: true });
  assert.equal(mom.name, 'Maya', 'her phone never renames the profile on the parent phone');
  assert.deepEqual(changedRecords(mom), [], 'pulling does not trigger an echo');
});

test('when she stops sharing a category, the parent copy of it is cleared', () => {
  const p = her();
  p.sync.shares = { pain: true, symptoms: false, school: false };
  let mom = pull(p, parent());
  assert.equal(mom.days['2026-09-01'].pain, 'severe');
  p.sync.shares = { pain: false, symptoms: false, school: false };
  mom = applyPulled(mom, [{ n: 'day:2026-09-01', v: buildRecords(p)['day:2026-09-01'] }], 2);
  assert.equal(mom.days['2026-09-01'].pain, undefined);
});

test('a parent logging for a child with no phone: everything moves to her first phone', () => {
  const mom = parent();
  mom.days = { '2026-08-03': { flow: 'light', pain: 'mild', symptoms: ['Cramps'], notes: 'parent note' } };
  mom.openPeriod = null;
  const phone = pull(mom, (() => { const p = newProfile({ relation: 'me' }); p.profile = {}; p.sync = { pushed: {}, seq: 0 }; return p; })());
  assert.deepEqual(phone.days['2026-08-03'], { flow: 'light', pain: 'mild', symptoms: ['Cramps'] });
});

test('only changed records are sent', () => {
  const p = her();
  const first = changedRecords(p);
  assert.ok(first.length >= 4);
  p.sync.pushed = Object.fromEntries(first.map(([n, v]) => [n, JSON.stringify(v)]));
  assert.deepEqual(changedRecords(p), []);
  p.days['2026-09-02'] = { flow: 'light' };
  assert.deepEqual(changedRecords(p).map(([n]) => n), ['day:2026-09-02']);
  delete p.days['2026-09-02'];
  assert.deepEqual(changedRecords(p)[0], ['day:2026-09-02', { flow: null, estimated: null, pain: null, symptoms: null, school: null }], 'deletions sync as cleared fields');
});

test('upgrading: a v1 install becomes the "me" profile with nothing lost', async () => {
  const { migrate } = await import('./storage.js');
  const v1 = { version: 1, profile: { stage: 'few' }, days: { '2026-09-01': { flow: 'heavy', notes: 'x' } }, openPeriod: null, settings: { voice: 'simple' }, pouch: null, plans: [{ id: 1 }], calendarWindow: null, lock: { salt: 's', hash: 'h' } };
  const v2 = migrate(v1);
  assert.equal(v2.version, 2);
  assert.equal(v2.activeId, 'me');
  assert.deepEqual(v2.lock, { salt: 's', hash: 'h' });
  const me = v2.profiles.me;
  assert.equal(me.relation, 'me');
  assert.deepEqual(me.days, v1.days);
  assert.equal(me.settings.voice, 'simple');
  assert.equal(me.settings.calendarStyle, 'discreet', 'new settings get defaults');
  assert.deepEqual(me.plans, [{ id: 1 }]);
  assert.equal('lock' in me, false);
  assert.deepEqual(migrate(null).profiles, {});
  assert.deepEqual(migrate(v2), v2, 'already-migrated state is unchanged');
});
