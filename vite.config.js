import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cadence never talks to a server about her data, so the production build
// forbids it outright: no third-party scripts, fonts, trackers or requests.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const csp = {
  name: 'cadence-csp',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
};

export default defineConfig({
  // GitHub Pages serves the site from /cadence-period-tracker/; locally it's /.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), csp],
  server: { port: 5173 },
});
