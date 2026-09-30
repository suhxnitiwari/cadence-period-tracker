import pg from 'pg';

// Two tables, and nothing personal in either: a "space" is a random ID shared by
// paired phones; records are ciphertext under HMAC IDs the server can't reverse.
// No timestamps are stored, since *when* someone logs could itself reveal cycle timing.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS spaces (
    id TEXT PRIMARY KEY,
    auth_hash TEXT NOT NULL,
    seq INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS records (
    space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    record_id TEXT NOT NULL,
    iv TEXT NOT NULL,
    data TEXT NOT NULL,
    seq INTEGER NOT NULL,
    PRIMARY KEY (space_id, record_id)
  )`,
];

export async function createDb({ connectionString = process.env.DATABASE_URL, silent = false } = {}) {
  let pool;
  if (connectionString) {
    pool = new pg.Pool({ connectionString, ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false } });
  } else {
    const { newDb } = await import('pg-mem');
    pool = new (newDb().adapters.createPg().Pool)();
    if (!silent) console.warn('No DATABASE_URL, so using an in-memory database (resets on restart).');
  }
  for (const statement of SCHEMA) await pool.query(statement);
  return pool;
}
