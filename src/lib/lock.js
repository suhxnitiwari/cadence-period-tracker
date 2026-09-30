// Optional passcode so a sibling or friend picking up the phone can't open her diary.
// It's a lock screen, not encryption: it keeps casual eyes out on a shared device.
const enc = new TextEncoder();
const hex = (b) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');

export async function hashPasscode(code, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 200_000, hash: 'SHA-256' }, key, 256);
  return { salt, hash: hex(bits) };
}

export async function checkPasscode(code, lock) {
  return (await hashPasscode(code, lock.salt)).hash === lock.hash;
}
