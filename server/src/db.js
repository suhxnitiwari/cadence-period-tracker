import pg from 'pg';

// Deliberately minimal schema. No emails, no timestamps, no plaintext health data:
// entries are opaque ciphertext keyed by an HMAC the server can't reverse.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    auth_hash TEXT NOT NULL,
    kdf_salt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS entries (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL,
    iv TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    PRIMARY KEY (user_id, entry_id)
  )`,
  // Opt-in only: a plaintext .ics of predicted dates the user chose to publish
  // so Google/Apple Calendar can subscribe to it.
  `CREATE TABLE IF NOT EXISTS calendar_feeds (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    ics TEXT NOT NULL
  )`,
  // Links for trusted people (a parent, guardian, caregiver, partner). The snapshot
  // is encrypted with a key that lives only in the link's #fragment, so the server
  // can't read shared data either.
  `CREATE TABLE IF NOT EXISTS shares (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    iv TEXT NOT NULL,
    ciphertext TEXT NOT NULL
  )`,
];

export async function createDb({ connectionString = process.env.DATABASE_URL, silent = false } = {}) {
  let pool;
  if (connectionString) {
    pool = new pg.Pool({
      connectionString,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  } else {
    const { newDb } = await import('pg-mem');
    const { Pool } = newDb().adapters.createPg();
    pool = new Pool();
    if (!silent) console.warn('No DATABASE_URL set, so using an in-memory database (data resets on restart).');
  }
  for (const statement of SCHEMA) await pool.query(statement);
  return pool;
}
