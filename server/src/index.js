import { createDb } from './db.js';
import { createApp } from './app.js';

const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:4173').split(',').map((s) => s.trim()).filter(Boolean);
const db = await createDb();
const port = Number(process.env.PORT) || 4000;
createApp(db, { origins }).listen(port, () => console.log(`Cadence sync relay on :${port} for ${origins.join(', ')}`));
