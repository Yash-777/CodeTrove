import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

// Vite is the build tool / dev server. server.proxy forwards any request
// the React app makes to a path starting with /api over to the local
// Express server (see server/index.js, started separately with
// `npm run server`) - this avoids CORS issues since the browser thinks
// it's still talking to the same origin (localhost:5173).
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const testUsersFile = path.join(rootDir, 'test-data', 'dev-users.csv');

function localTestUsersPlugin() {
  return {
    name: 'codetrove-local-test-users',
    apply: 'serve',
    configureServer(server) {
      if (server.config.mode !== 'test') return;
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/__dev/test-users.csv') return next();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.end(fs.readFileSync(testUsersFile, 'utf8'));
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'test' ? [localTestUsersPlugin()] : [])],
  esbuild: { sourcemap: process.env.VITE_GENERATE_SOURCEMAP !== 'false' },
  build: { sourcemap: process.env.VITE_GENERATE_SOURCEMAP === 'true' },
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
}));
