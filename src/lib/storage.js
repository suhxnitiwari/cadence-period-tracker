// Everything lives in this browser's IndexedDB, with no account. The only thing
// that ever leaves the device is opt-in, end-to-end encrypted sync between
// phones she (or her parent) pairs. Export/import is the backup.
const DB = 'cadence-local';
const STORE = 'state';
const KEY = 'v1';

export const DEFAULT_SETTINGS = { customSymptoms: [], reminderTitle: 'Might want your pouch tomorrow 🎒', voice: 'standard', calendarStyle: 'discreet' };

/** One person being tracked. A parent's phone can hold several (their kids, themselves). */
export function newProfile({ id = `p${Math.random().toString(36).slice(2, 10)}`, relation = 'me', name = '' } = {}) {
  return {
    id,
    relation, // 'me' = the person using this phone · 'child' = a parent logging for their child
    name,
    profile: null, // set by onboarding: { stage, goals, birth, grade }
    days: {},
    openPeriod: null,
    settings: { ...DEFAULT_SETTINGS },
    pouch: null, // null = default checklist
    plans: [], // "My life": { id, title, emoji, start, end }
    calendarWindow: null, // what was last added to a calendar: { cycleKey, earliest, latest, style, sequence }
    sync: null, // encrypted sharing with another phone (see lib/sync.js)
  };
}

export const EMPTY_STATE = { version: 2, activeId: null, profiles: {}, lock: null };

/** Version 1 stored a single person at the top level. It becomes the "me" profile. */
export function migrate(saved) {
  if (!saved) return EMPTY_STATE;
  if (saved.version === 2) {
    const profiles = Object.fromEntries(Object.entries(saved.profiles ?? {}).map(([id, p]) => [id, { ...newProfile({ id }), ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } }]));
    return { ...EMPTY_STATE, ...saved, profiles };
  }
  if (!saved.profile) return { ...EMPTY_STATE, lock: saved.lock ?? null };
  const me = { ...newProfile({ id: 'me' }), ...saved, id: 'me', relation: 'me', name: '', settings: { ...DEFAULT_SETTINGS, ...saved.settings } };
  delete me.version;
  delete me.lock;
  return { version: 2, activeId: 'me', profiles: { me }, lock: saved.lock ?? null };
}

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(req?.result); };
    t.onerror = () => { db.close(); reject(t.error); };
  }));
}

export async function loadState() {
  return migrate(await tx('readonly', (s) => s.get(KEY)));
}

export const saveState = (state) => tx('readwrite', (s) => s.put(state, KEY));
export const eraseState = () => tx('readwrite', (s) => s.clear());

/** Ask the browser not to clear this data when space is low. */
export function requestPersistence() {
  navigator.storage?.persist?.().catch(() => {});
}

/** Validates an imported backup, keeping only fields we understand. */
export function sanitizeBackup(parsed, { flows, pain }) {
  if (parsed?.app !== 'cadence' || typeof parsed.days !== 'object') throw new Error('Not a Cadence backup');
  const days = {};
  for (const [date, log] of Object.entries(parsed.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !log || typeof log !== 'object') continue;
    days[date] = {
      ...(flows.includes(log.flow) && { flow: log.flow }),
      ...(pain.includes(log.pain) && { pain: log.pain }),
      ...(Array.isArray(log.symptoms) && { symptoms: log.symptoms.filter((s) => typeof s === 'string').slice(0, 40).map((s) => s.slice(0, 40)) }),
      ...(typeof log.notes === 'string' && { notes: log.notes.slice(0, 2000) }),
      ...(log.estimated === true && { estimated: true }),
    };
  }
  return days;
}
