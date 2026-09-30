// Everything lives in this browser's IndexedDB. There is no account and no
// server that receives her data. Export/import is the backup.
const DB = 'cadence-local';
const STORE = 'state';
const KEY = 'v1';

export const EMPTY_STATE = {
  version: 1,
  profile: null, // set by onboarding: { stage, goals }
  days: {},
  openPeriod: null,
  settings: { customSymptoms: [], reminderTitle: 'Might want your pouch tomorrow 🎒', voice: 'standard', calendarStyle: 'discreet' },
  pouch: null, // null = default checklist
  plans: [], // "My life": { id, title, emoji, start, end }
  calendarWindow: null, // what she last added to her calendar: { cycleKey, earliest, latest, style, sequence }
  lock: null, // optional passcode: { salt, hash }
};

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
  const saved = await tx('readonly', (s) => s.get(KEY));
  return saved ? { ...EMPTY_STATE, ...saved, settings: { ...EMPTY_STATE.settings, ...saved.settings } } : EMPTY_STATE;
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
