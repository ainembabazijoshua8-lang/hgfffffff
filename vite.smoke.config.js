import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    ssr: 'scripts/smoke-render.jsx',
    outDir: '.smoke',
    emptyOutDir: true,
    rollupOptions: {
      output: { entryFileNames: 'smoke.js', format: 'es' },
    },
  },
});