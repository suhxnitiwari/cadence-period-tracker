import { Router } from 'express';
import { requireAuth } from '../auth.js';

const TOKEN = /^[A-Za-z0-9_-]{22,64}$/;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

// The owner's browser picks the token and encrypts a small snapshot with a key
// that is only ever in the share link's #fragment (browsers never send it to servers).
export function shareRoutes(db, { secret }) {
  const router = Router();

  router.put('/shares/:token', requireAuth(secret), async (req, res) => {
    const { token } = req.params;
    const { iv, data } = req.body;
    if (!TOKEN.test(token) || typeof iv !== 'string' || iv.length > 32 || !B64.test(iv)
      || typeof data !== 'string' || data.length > 20_000 || !B64.test(data)) {
      return res.status(400).json({ error: 'Malformed share' });
    }
    const { rows } = await db.query('SELECT user_id FROM shares WHERE token = $1', [token]);
    if (rows[0] && rows[0].user_id !== req.userId) return res.status(404).json({ error: 'Not found' });
    if (rows[0]) {
      await db.query('UPDATE shares SET iv = $1, ciphertext = $2 WHERE token = $3', [iv, data, token]);
    } else {
      await db.query('INSERT INTO shares (token, user_id, iv, ciphertext) VALUES ($1, $2, $3, $4)', [token, req.userId, iv, data]);
    }
    res.status(204).end();
  });

  router.delete('/shares/:token', requireAuth(secret), async (req, res) => {
    await db.query('DELETE FROM shares WHERE token = $1 AND user_id = $2', [req.params.token, req.userId]);
    res.status(204).end();
  });

  // Public, read-only. Useless without the key in the link fragment.
  router.get('/shared/:token', async (req, res) => {
    const { rows } = await db.query('SELECT iv, ciphertext FROM shares WHERE token = $1', [req.params.token]);
    if (!rows[0]) return res.status(404).json({ error: 'This link was turned off or never existed.' });
    res.set('Cache-Control', 'no-store');
    res.json({ iv: rows[0].iv, data: rows[0].ciphertext });
  });

  return router;
}
