import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite is the build tool / dev server. server.proxy forwards any request
// the React app makes to a path starting with /api over to the local
// Express server (see server/index.js, started separately with
// `npm run server`) - this avoids CORS issues since the browser thinks
// it's still talking to the same origin (localhost:5173).
export default defineConfig({
  plugins: [react()],
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
});
