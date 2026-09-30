import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Cadence never talks to a server about her data, so the production build
// forbids it outright: no third-party scripts, fonts, trackers or requests.
// The one exception is the encrypted sync relay, and only if one is configured.
const csp = (syncUrl) => [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  `connect-src 'self'${syncUrl ? ` ${new URL(syncUrl).origin}` : ''}`,
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const cspPlugin = (syncUrl) => ({
  name: 'cadence-csp',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp(syncUrl)}" />`),
});

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the site from /cadence-period-tracker/; locally it's /.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), cspPlugin(loadEnv(mode, process.cwd(), 'VITE_').VITE_SYNC_URL)],
  server: { port: 5173 },
}));
