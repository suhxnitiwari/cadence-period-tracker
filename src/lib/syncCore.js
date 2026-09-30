// End-to-end encrypted sync between paired phones (e.g. a parent's and a daughter's).
//
// Pairing shares one random 256-bit secret, only inside the QR code / pair link.
// From it, each phone derives: an encryption key (AES-GCM), a key that turns
// record names like "day:2026-09-30" into random-looking IDs (HMAC), and an access
// token for the relay. The relay stores ciphertext under those IDs and can read none of it.
//
// What syncs is her choice. On her own phone, periods and flow are shared;
// pain, symptoms and feelings, and school impact are only shared if she turns them on.
// Private notes never sync, in either direction.

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();

export const SYNC_URL = (import.meta.env?.VITE_SYNC_URL ?? '').replace(/\/$/, '');

const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (bytes) => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => unb64(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
const hex = (buf) => Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, '0')).join('');
const random = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

export const SHARE_OPTIONS = {
  pain: 'Pain',
  symptoms: 'Symptoms and feelings',
  school: 'How it affected school',
};
export const DEFAULT_SHARES = { pain: false, symptoms: false, school: false };

/** A brand-new sync space: a random ID and a random secret. */
export function newSpace() {
  return { id: b64url(random(16)), key: b64url(random(32)) };
}

export const pairFragment = ({ id, key }) => `${id}.${key}`;
export function parsePairFragment(hash) {
  const m = String(hash ?? '').replace(/^#/, '').match(/^([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/);
  return m ? { id: m[1], key: m[2] } : null;
}

const keyCache = new Map();
export async function spaceKeys(key) {
  if (keyCache.has(key)) return keyCache.get(key);
  const base = await subtle.importKey('raw', unb64url(key), 'HKDF', false, ['deriveBits']);
  const bits = (info) => subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(info) }, base, 256);
  const keys = {
    encKey: await subtle.importKey('raw', await bits('cadence-sync-enc'), 'AES-GCM', false, ['encrypt', 'decrypt']),
    macKey: await subtle.importKey('raw', await bits('cadence-sync-mac'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    token: hex(await bits('cadence-sync-auth')),
  };
  keyCache.set(key, keys);
  return keys;
}

export async function encryptRecord(keys, name, value) {
  const id = hex(await subtle.sign('HMAC', keys.macKey, enc.encode(name)));
  const iv = random(12);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(id) }, keys.encKey, enc.encode(JSON.stringify({ n: name, v: value })));
  return { id, iv: b64(iv), data: b64(new Uint8Array(ct)) };
}

export async function decryptRecord(keys, rec) {
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(rec.iv), additionalData: enc.encode(rec.id) }, keys.encKey, unb64(rec.data));
  return JSON.parse(dec.decode(pt));
}

/**
 * Which day fields this phone sends.
 * Her own phone: flow always; each optional category as its value when shared, or
 * null when not, so a parent's copy never keeps something she's stopped sharing.
 * A parent's phone: flow, plus any category she hasn't made private.
 */
function dayFields(p) {
  const optional = ['pain', 'symptoms', 'school'];
  if (p.relation === 'me') {
    const shares = { ...DEFAULT_SHARES, ...p.sync?.shares };
    return { send: ['flow', 'estimated', ...optional], shared: new Set(['flow', 'estimated', ...optional.filter((k) => shares[k])]) };
  }
  const hers = p.sync?.herShares;
  const allowed = optional.filter((k) => !hers || hers[k]);
  return { send: ['flow', 'estimated', ...allowed], shared: new Set(['flow', 'estimated', ...allowed]) };
}

/** Everything this phone would share for a profile, as { recordName: value }. */
export function buildRecords(p) {
  const out = {};
  const { send, shared } = dayFields(p);
  const dates = new Set([
    ...Object.keys(p.days),
    ...Object.keys(p.sync?.pushed ?? {}).filter((n) => n.startsWith('day:')).map((n) => n.slice(4)),
  ]);
  for (const date of dates) {
    const log = p.days[date] ?? {};
    const v = {};
    for (const k of send) {
      const val = shared.has(k) ? log[k] : undefined;
      v[k] = val === undefined || val === false || (Array.isArray(val) && !val.length) ? null : val;
    }
    out[`day:${date}`] = v;
  }
  out.open = { openPeriod: p.openPeriod ?? null };
  const meta = { stage: p.profile?.stage ?? null, birth: p.profile?.birth ?? null, grade: p.profile?.grade ?? null };
  if (p.name) meta.name = p.name;
  out.meta = meta;
  if (p.relation === 'me') out.shares = { ...DEFAULT_SHARES, ...p.sync?.shares };
  return out;
}

/** Records that changed since this phone last sent them. */
export function changedRecords(p) {
  const pushed = p.sync?.pushed ?? {};
  return Object.entries(buildRecords(p)).filter(([n, v]) => pushed[n] !== JSON.stringify(v));
}

/** Apply a record from the other phone. Fields it carries replace ours; null clears. */
export function applyRecord(p, name, v) {
  if (name.startsWith('day:')) {
    const date = name.slice(4);
    const day = { ...p.days[date] };
    for (const [k, val] of Object.entries(v)) {
      if (k === 'notes') continue; // never accepted from another phone
      if (val === null) delete day[k];
      else day[k] = val;
    }
    const days = { ...p.days };
    const empty = !day.flow && !day.pain && !day.school && !day.symptoms?.length && !day.notes?.trim();
    if (empty) delete days[date];
    else days[date] = day;
    return { ...p, days };
  }
  if (name === 'open') return { ...p, openPeriod: v.openPeriod ?? null };
  if (name === 'meta') {
    return {
      ...p,
      name: v.name && p.relation === 'child' ? v.name : p.name,
      profile: { ...p.profile, stage: v.stage ?? p.profile?.stage, birth: v.birth ?? p.profile?.birth ?? null, grade: v.grade ?? p.profile?.grade ?? null },
    };
  }
  if (name === 'shares' && p.relation === 'child') return { ...p, sync: { ...p.sync, herShares: v } };
  return p;
}

/**
 * Apply a batch pulled from the relay. Our own echoes are skipped, and afterwards
 * we record what our side now holds, so pulling doesn't trigger a pointless re-send.
 */
export function applyPulled(p, decrypted, seq) {
  let next = p;
  const pushed = { ...p.sync.pushed };
  for (const { n, v } of decrypted) {
    if (pushed[n] === JSON.stringify(v)) continue;
    next = applyRecord(next, n, v);
  }
  const mine = buildRecords(next);
  for (const { n } of decrypted) if (mine[n] !== undefined) pushed[n] = JSON.stringify(mine[n]);
  return { ...next, sync: { ...next.sync, pushed, seq } };
}

/** What the parent's phone can't log for her, because she keeps it private. */
export function privateCategories(p) {
  if (p?.relation !== 'child' || !p.sync?.herShares) return {};
  return Object.fromEntries(Object.keys(DEFAULT_SHARES).map((k) => [k, !p.sync.herShares[k]]));
}
