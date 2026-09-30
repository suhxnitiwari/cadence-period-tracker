import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const SPACE_ID = /^[A-Za-z0-9_-]{22}$/;
const RECORD_ID = /^[0-9a-f]{64}$/;
const TOKEN = /^[0-9a-f]{64}$/;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_RECORD = 8_000;
const MAX_BATCH = 2_000;
const MAX_RECORDS_PER_SPACE = 20_000;

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const sameHash = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function createApp(db, { origins = [], rateLimitMax = 300 } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(cors({ origin: origins, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Authorization', 'Content-Type'], maxAge: 86400 }));
  app.use(express.json({ limit: '4mb' }));
  app.use(rateLimit({ windowMs: 60_000, limit: rateLimitMax, standardHeaders: 'draft-7', legacyHeaders: false }));
  // Deliberately no request logging: access logs would record when someone logs.

  app.get('/health', (req, res) => res.json({ ok: true }));

  const token = (req) => {
    const t = (req.get('authorization') ?? '').replace(/^Bearer /, '');
    return TOKEN.test(t) ? t : null;
  };

  // Create a space. The client proves it holds the pairing secret by sending a token
  // derived from it; we keep only a hash of that token.
  app.post('/api/spaces/:id', async (req, res) => {
    const { id } = req.params;
    const t = token(req);
    if (!SPACE_ID.test(id) || !t) return res.status(400).json({ error: 'Bad request' });
    const { rows } = await db.query('SELECT 1 FROM spaces WHERE id = $1', [id]);
    if (rows.length) return res.status(409).json({ error: 'Exists' });
    await db.query('INSERT INTO spaces (id, auth_hash, seq) VALUES ($1, $2, 0)', [id, sha256(t)]);
    res.status(201).json({ seq: 0 });
  });

  // Everything below needs the space's token.
  const auth = async (req, res, next) => {
    const { id } = req.params;
    const t = token(req);
    if (!SPACE_ID.test(id) || !t) return res.status(400).json({ error: 'Bad request' });
    const { rows } = await db.query('SELECT auth_hash, seq FROM spaces WHERE id = $1', [id]);
    // Same answer for "doesn't exist" and "wrong token", so spaces can't be probed.
    if (!rows[0] || !sameHash(rows[0].auth_hash, sha256(t))) return res.status(404).json({ error: 'Not found' });
    req.space = rows[0];
    next();
  };

  app.get('/api/spaces/:id/records', auth, async (req, res) => {
    const since = Math.max(0, Number.parseInt(req.query.since, 10) || 0);
    const { rows } = await db.query(
      'SELECT record_id, iv, data, seq FROM records WHERE space_id = $1 AND seq > $2 ORDER BY seq',
      [req.params.id, since],
    );
    res.set('Cache-Control', 'no-store');
    res.json({ seq: req.space.seq, records: rows.map((r) => ({ id: r.record_id, iv: r.iv, data: r.data, seq: r.seq })) });
  });

  app.put('/api/spaces/:id/records', auth, async (req, res) => {
    const list = req.body?.records;
    const ok = Array.isArray(list) && list.length <= MAX_BATCH && list.every((r) => r && RECORD_ID.test(r.id)
      && typeof r.iv === 'string' && r.iv.length <= 24 && B64.test(r.iv)
      && typeof r.data === 'string' && r.data.length <= MAX_RECORD && B64.test(r.data));
    if (!ok) return res.status(400).json({ error: 'Bad records' });
    const { rows: [{ n }] } = await db.query('SELECT COUNT(*)::int AS n FROM records WHERE space_id = $1', [req.params.id]);
    if (n + list.length > MAX_RECORDS_PER_SPACE) return res.status(413).json({ error: 'Too many records' });

    let seq = req.space.seq;
    for (const r of list) {
      seq += 1;
      await db.query(
        `INSERT INTO records (space_id, record_id, iv, data, seq) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (space_id, record_id) DO UPDATE SET iv = EXCLUDED.iv, data = EXCLUDED.data, seq = EXCLUDED.seq`,
        [req.params.id, r.id, r.iv, r.data, seq],
      );
    }
    await db.query('UPDATE spaces SET seq = $1 WHERE id = $2', [seq, req.params.id]);
    res.json({ seq });
  });

  // Stop sharing: deletes the space and every record in it, immediately.
  app.delete('/api/spaces/:id', auth, async (req, res) => {
    await db.query('DELETE FROM records WHERE space_id = $1', [req.params.id]);
    await db.query('DELETE FROM spaces WHERE id = $1', [req.params.id]);
    res.status(204).end();
  });

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(err.status ?? 500).json({ error: err.expose ? err.message : 'Server error' }));
  return app;
}
