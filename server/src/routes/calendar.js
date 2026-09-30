import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';

const MAX_ICS = 50_000;

// Opt-in calendar subscription. When a user turns it on, their browser builds an
// .ics of *predicted* dates (with the event title they chose) and publishes it here
// under an unguessable URL that Google/Apple Calendar can poll. Turning it off deletes it.
export function calendarRoutes(db, { secret }) {
  const router = Router();

  router.get('/calendar', requireAuth(secret), async (req, res) => {
    const { rows } = await db.query('SELECT token FROM calendar_feeds WHERE user_id = $1', [req.userId]);
    res.json({ token: rows[0]?.token ?? null });
  });

  router.put('/calendar', requireAuth(secret), async (req, res) => {
    const { ics } = req.body;
    if (typeof ics !== 'string' || ics.length > MAX_ICS || !ics.startsWith('BEGIN:VCALENDAR')) {
      return res.status(400).json({ error: 'Malformed calendar' });
    }
    const { rows } = await db.query('SELECT token FROM calendar_feeds WHERE user_id = $1', [req.userId]);
    let token = rows[0]?.token;
    if (token) {
      await db.query('UPDATE calendar_feeds SET ics = $1 WHERE user_id = $2', [ics, req.userId]);
    } else {
      token = crypto.randomBytes(24).toString('base64url');
      await db.query('INSERT INTO calendar_feeds (user_id, token, ics) VALUES ($1, $2, $3)', [req.userId, token, ics]);
    }
    res.json({ token });
  });

  router.delete('/calendar', requireAuth(secret), async (req, res) => {
    await db.query('DELETE FROM calendar_feeds WHERE user_id = $1', [req.userId]);
    res.status(204).end();
  });

  // Public feed, reachable only by whoever holds the token.
  router.get('/feed/:token.ics', async (req, res) => {
    const { rows } = await db.query('SELECT ics FROM calendar_feeds WHERE token = $1', [req.params.token]);
    if (!rows[0]) return res.status(404).end();
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Cache-Control', 'no-store');
    res.send(rows[0].ics);
  });

  return router;
}
