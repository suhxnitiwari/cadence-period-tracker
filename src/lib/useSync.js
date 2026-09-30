import { useEffect, useRef, useState } from 'react';
import { SYNC_URL, spaceKeys, encryptRecord, decryptRecord, changedRecords, applyPulled } from './syncCore.js';

const PULL_EVERY_MS = 20_000;
const PUSH_DELAY_MS = 1_200;

export class SyncGone extends Error {}

async function call(sync, method, path, body) {
  const { token } = await spaceKeys(sync.key);
  const res = await fetch(`${SYNC_URL}/api/spaces/${sync.id}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body),
    referrerPolicy: 'no-referrer',
  });
  if (res.status === 404) throw new SyncGone();
  if (!res.ok) throw new Error(`sync ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export const createSpace = (sync) => call(sync, 'POST', '');
export const deleteSpace = (sync) => call(sync, 'DELETE', '').catch((e) => { if (!(e instanceof SyncGone)) throw e; });
export const pullRecords = (sync, since) => call(sync, 'GET', `/records?since=${since}`);

/**
 * Keeps every paired profile in step with the other phone(s): sends what changed
 * here, fetches what changed there. Returns a status per profile id.
 */
export function useSync(state, setState) {
  const [status, setStatus] = useState({});
  const stateRef = useRef(state);
  stateRef.current = state;
  const busy = useRef(new Set());

  const patchProfile = (id, fn) => setState((s) => (s.profiles[id] ? { ...s, profiles: { ...s.profiles, [id]: fn(s.profiles[id]) } } : s));
  const mark = (id, st) => setStatus((s) => ({ ...s, [id]: { ...s[id], ...st } }));

  const run = async (id, opts = {}) => {
    let pull = opts.pull ?? true;
    if (!SYNC_URL || busy.current.has(id)) return;
    const p = stateRef.current?.profiles[id];
    if (!p?.sync || p.sync.ended) return;
    busy.current.add(id);
    mark(id, { state: 'syncing' });
    try {
      const keys = await spaceKeys(p.sync.key);
      // A phone that just joined only receives until its first pull, so its empty
      // starting state can never overwrite the other phone's history.
      const fresh = Boolean(p.sync.fresh);
      if (fresh) pull = true;
      // Send what changed here.
      const changed = fresh ? [] : changedRecords(p);
      if (changed.length) {
        const records = await Promise.all(changed.map(([n, v]) => encryptRecord(keys, n, v)));
        for (let i = 0; i < records.length; i += 500) await call(p.sync, 'PUT', '/records', { records: records.slice(i, i + 500) });
        patchProfile(id, (q) => ({ ...q, sync: { ...q.sync, pushed: { ...q.sync.pushed, ...Object.fromEntries(changed.map(([n, v]) => [n, JSON.stringify(v)])) } } }));
      }
      // Fetch what changed there.
      if (pull) {
        const since = stateRef.current.profiles[id]?.sync?.seq ?? 0;
        const res = await pullRecords(p.sync, since);
        if (res.records.length) {
          const decrypted = [];
          for (const r of res.records) {
            try { decrypted.push(await decryptRecord(keys, r)); } catch { /* not ours to read: skip */ }
          }
          patchProfile(id, (q) => applyPulled(q, decrypted, res.seq));
        } else if (res.seq !== since) {
          patchProfile(id, (q) => ({ ...q, sync: { ...q.sync, seq: res.seq } }));
        }
        if (fresh) patchProfile(id, (q) => ({ ...q, sync: { ...q.sync, fresh: false } }));
      }
      mark(id, { state: 'ok', at: Date.now() });
    } catch (e) {
      if (e instanceof SyncGone) {
        // The other side stopped sharing. Everything already here stays here.
        patchProfile(id, (q) => ({ ...q, sync: { ...q.sync, ended: true } }));
        mark(id, { state: 'ended' });
      } else {
        mark(id, { state: 'offline' });
      }
    } finally {
      busy.current.delete(id);
    }
  };

  // Push soon after local changes.
  const synced = state ? Object.values(state.profiles).filter((p) => p.sync && !p.sync.ended) : [];
  const fingerprint = synced.map((p) => `${p.id}:${p.sync.fresh ? 'fresh' : changedRecords(p).length}`).join('|');
  useEffect(() => {
    if (!fingerprint) return;
    const t = setTimeout(() => synced.forEach((p) => run(p.id, { pull: false })), PUSH_DELAY_MS);
    return () => clearTimeout(t);
  }, [fingerprint]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pull on open, on focus, and every so often while the app is visible.
  const ids = synced.map((p) => p.id).join(',');
  useEffect(() => {
    if (!ids) return;
    const all = () => ids.split(',').forEach((id) => run(id));
    all();
    const t = setInterval(() => { if (!document.hidden) all(); }, PULL_EVERY_MS);
    const onVisible = () => { if (!document.hidden) all(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', all);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('online', all); };
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  return status;
}
