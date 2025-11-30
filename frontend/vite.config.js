import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server proxy to backend so calls to `/api/*` work in dev
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});