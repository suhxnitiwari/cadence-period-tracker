import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from './db.js';
import { createApp } from './app.js';

const here = path.dirname(fileURLToPath(import.meta.url));

let secret = process.env.SESSION_SECRET;
if (!secret) {
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET must be set in production');
  secret = crypto.randomBytes(32).toString('hex');
}

const db = await createDb();
const app = createApp(db, { secret, clientDist: path.resolve(here, '../../client/dist') });
const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Cadence API listening on http://localhost:${port}`));
