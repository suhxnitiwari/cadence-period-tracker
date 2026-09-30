import { Router } from 'express';
import { requireAuth } from '../auth.js';

const ENTRY_ID = /^[0-9a-f]{64}$/;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_CIPHERTEXT = 20_000;
const MAX_BULK = 5_000;

function validEntry(e) {
  return e && ENTRY_ID.test(e.id ?? '')
    && typeof e.iv === 'string' && e.iv.length <= 32 && B64.test(e.iv)
    && typeof e.data === 'string' && e.data.length <= MAX_CIPHERTEXT && B64.test(e.data);
}

async function upsert(db, userId, { id, iv, data }) {
  await db.query(
    `INSERT INTO entries (user_id, entry_id, iv, ciphertext) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, entry_id) DO UPDATE SET iv = EXCLUDED.iv, ciphertext = EXCLUDED.ciphertext`,
    [userId, id, iv, data],
  );
}

// The server never sees what an entry is: not the date, not the flow, nothing.
// It just stores and returns blobs belonging to the signed-in user.
export function entryRoutes(db, { secret }) {
  const router = Router();
  router.use('/entries', requireAuth(secret));

  router.get('/entries', async (req, res) => {
    const { rows } = await db.query('SELECT entry_id, iv, ciphertext FROM entries WHERE user_id = $1', [req.userId]);
    res.json(rows.map((r) => ({ id: r.entry_id, iv: r.iv, data: r.ciphertext })));
  });

  router.put('/entries/:id', async (req, res) => {
    const entry = { id: req.params.id, iv: req.body.iv, data: req.body.data };
    if (!validEntry(entry)) return res.status(400).json({ error: 'Malformed entry' });
    await upsert(db, req.userId, entry);
    res.status(204).end();
  });

  router.delete('/entries/:id', async (req, res) => {
    await db.query('DELETE FROM entries WHERE user_id = $1 AND entry_id = $2', [req.userId, req.params.id]);
    res.status(204).end();
  });

  // Used by import.
  router.post('/entries/bulk', async (req, res) => {
    const list = req.body.entries;
    if (!Array.isArray(list) || list.length > MAX_BULK || !list.every(validEntry)) {
      return res.status(400).json({ error: 'Malformed entries' });
    }
    for (const entry of list) await upsert(db, req.userId, entry);
    res.json({ saved: list.length });
  });

  return router;
}
