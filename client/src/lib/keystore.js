// Keeps the (non-extractable) encryption keys in IndexedDB so a page refresh
// doesn't require re-entering the password. JavaScript can use these keys but
// can never read their raw bytes. Signing out wipes them.
const DB = 'cadence';
const STORE = 'keys';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export const saveKeys = (keys) => run('readwrite', (s) => s.put(keys, 'session'));
export const clearKeys = () => run('readwrite', (s) => s.clear());
export async function loadKeys() {
  try {
    return (await run('readonly', (s) => s.get('session'))) ?? null;
  } catch {
    return null;
  }
}
