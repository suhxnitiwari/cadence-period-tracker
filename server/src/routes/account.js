import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { setSession, clearSession, requireAuth } from '../auth.js';

const USERNAME = /^[a-z0-9_.-]{3,32}$/;
const HEX32 = /^[0-9a-f]{32}$/;
const HEX64 = /^[0-9a-f]{64}$/;

// The client derives an auth key from the password (the password itself never
// leaves the browser). We still bcrypt that key so a database leak can't be replayed.
export function accountRoutes(db, { secret, bcryptRounds = 12, rateLimitMax = 20 }) {
  const router = Router();
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: rateLimitMax, standardHeaders: 'draft-7', legacyHeaders: false });

  const normalize = (u) => String(u ?? '').trim().toLowerCase();

  // Returns the key-derivation salt. Unknown usernames get a stable fake salt so
  // this endpoint can't be used to check whether someone has an account.
  router.get('/auth/salt/:username', authLimiter, async (req, res) => {
    const username = normalize(req.params.username);
    const { rows } = await db.query('SELECT kdf_salt FROM users WHERE username = $1', [username]);
    const salt = rows[0]?.kdf_salt
      ?? crypto.createHmac('sha256', secret).update(`salt:${username}`).digest('hex').slice(0, 32);
    res.json({ salt });
  });

  router.post('/auth/signup', authLimiter, async (req, res) => {
    const username = normalize(req.body.username);
    const { authKey, salt } = req.body;
    if (!USERNAME.test(username)) {
      return res.status(400).json({ error: 'Usernames are 3–32 characters: letters, numbers, dots, dashes, underscores.' });
    }
    if (!HEX64.test(authKey ?? '') || !HEX32.test(salt ?? '')) return res.status(400).json({ error: 'Malformed request' });

    const existing = await db.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (existing.rows.length) return res.status(409).json({ error: 'That username is taken.' });

    const hash = await bcrypt.hash(authKey, bcryptRounds);
    const { rows } = await db.query(
      'INSERT INTO users (username, auth_hash, kdf_salt) VALUES ($1, $2, $3) RETURNING id',
      [username, hash, salt],
    );
    setSession(res, rows[0].id, secret);
    res.status(201).json({ username });
  });

  router.post('/auth/login', authLimiter, async (req, res) => {
    const username = normalize(req.body.username);
    const { authKey } = req.body;
    const { rows } = await db.query('SELECT id, auth_hash FROM users WHERE username = $1', [username]);
    const ok = rows[0] && HEX64.test(authKey ?? '') && (await bcrypt.compare(authKey, rows[0].auth_hash));
    if (!ok) return res.status(401).json({ error: 'Username or password is incorrect.' });
    setSession(res, rows[0].id, secret);
    res.json({ username });
  });

  router.post('/auth/logout', (req, res) => {
    clearSession(res);
    res.status(204).end();
  });

  router.get('/auth/me', requireAuth(secret), async (req, res) => {
    const { rows } = await db.query('SELECT username FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) {
      clearSession(res);
      return res.status(401).json({ error: 'Account not found' });
    }
    res.json({ username: rows[0].username });
  });

  // Permanent, immediate deletion: the user row, every entry, share link and calendar feed.
  router.delete('/account', requireAuth(secret), async (req, res) => {
    await db.query('DELETE FROM shares WHERE user_id = $1', [req.userId]);
    await db.query('DELETE FROM calendar_feeds WHERE user_id = $1', [req.userId]);
    await db.query('DELETE FROM entries WHERE user_id = $1', [req.userId]);
    await db.query('DELETE FROM users WHERE id = $1', [req.userId]);
    clearSession(res);
    res.status(204).end();
  });

  return router;
}
