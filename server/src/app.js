import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { accountRoutes } from './routes/account.js';
import { entryRoutes } from './routes/entries.js';
import { calendarRoutes } from './routes/calendar.js';
import { shareRoutes } from './routes/shares.js';

export function createApp(db, { secret, bcryptRounds, rateLimitMax, clientDist } = {}) {
  if (!secret) throw new Error('createApp needs a session secret');
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
  }));
  app.use(express.json({ limit: '15mb' }));
  app.use(cookieParser());

  // No request logging on purpose: access logs would record *when* someone logs data.
  app.use('/api', accountRoutes(db, { secret, bcryptRounds, rateLimitMax }));
  app.use('/api', entryRoutes(db, { secret }));
  app.use('/api', calendarRoutes(db, { secret }));
  app.use('/api', shareRoutes(db, { secret }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  if (clientDist && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(err.status ?? 500).json({ error: err.expose ? err.message : 'Something went wrong' });
  });

  return app;
}
