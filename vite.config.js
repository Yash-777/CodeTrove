import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@modules': path.resolve(rootDir, 'src/modules'),
      '@components': path.resolve(rootDir, 'src/components'),
      '@utils': path.resolve(rootDir, 'src/utils'),
      '@data': path.resolve(rootDir, 'src/data'),
      // Existing UsersPage imports these Firebase module paths. The adapter
      // keeps that page buildable without shipping the Firebase SDK.
      'firebase/firestore': path.resolve(rootDir, 'src/firebase/firestore.js'),
    },
  },
  esbuild: { sourcemap: process.env.VITE_GENERATE_SOURCEMAP !== 'false' },
  build: {
    outDir: 'dist',
    sourcemap: process.env.VITE_GENERATE_SOURCEMAP === 'true',
  },
  base: isGitHubPages ? '/CodeTrove/' : '/',
  server: {
    port: 5173,
    open: false,
  },
});
