import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_API_TARGET || `http://localhost:${process.env.PORT || '8787'}`;

// Fullstack: Vite serves the React frontend in dev; the Express server
// in /server proxies /api requests so a single origin works in production too.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      // The SSR smoke test writes build output under .smoke/. Watching it
      // makes the dev server crash with EBUSY when the folder is written or
      // removed while Vite holds a handle (common under OneDrive sync).
      ignored: ['**/.smoke/**', '**/.git/**'],
    },
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // vite 8 / rolldown requires manualChunks to be a function, not an object.
        // Group React + router into a single vendor chunk for better caching.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'react';
            }
          }
        },
      },
    },
  },
});
