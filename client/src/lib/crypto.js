// End-to-end encryption. The password never leaves the browser: it's stretched
// into three keys. One (authKey) proves who you are to the server; the other two
// encrypt your data and name your entries, and never leave this device.
const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();

export const KDF_ITERATIONS = 600_000;

export const bytesToHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
export const hexToBytes = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));
export const bytesToB64 = (b) => btoa(String.fromCharCode(...b));
export const b64ToBytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const b64url = (b) => bytesToB64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const fromB64url = (s) => b64ToBytes(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));

export const randomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

export async function deriveKeys(password, saltHex, iterations = KDF_ITERATIONS) {
  const base = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations, hash: 'SHA-256' },
    base,
    768,
  ));
  return {
    authKey: bytesToHex(bits.slice(0, 32)),
    encKey: await subtle.importKey('raw', bits.slice(32, 64), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']),
    macKey: await subtle.importKey('raw', bits.slice(64, 96), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
  };
}

/** Entry IDs are HMACs, so the server can't tell which one is which date. */
export async function entryId(macKey, name) {
  return bytesToHex(new Uint8Array(await subtle.sign('HMAC', macKey, enc.encode(name))));
}

// The entry ID is bound in as associated data, so the server can't swap blobs between entries.
export async function encryptJson(key, value, aad = '') {
  const iv = randomBytes(12);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aad) }, key, enc.encode(JSON.stringify(value)));
  return { iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(ct)) };
}

export async function decryptJson(key, { iv, data }, aad = '') {
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(iv), additionalData: enc.encode(aad) }, key, b64ToBytes(data));
  return JSON.parse(dec.decode(pt));
}

// Share links: a fresh random key per trusted person, carried only in the link's #fragment.
export async function newShareKey() {
  const raw = randomBytes(32);
  return { raw: b64url(raw), key: await importShareKey(b64url(raw)) };
}

export function importShareKey(rawB64url) {
  return subtle.importKey('raw', fromB64url(rawB64url), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}
