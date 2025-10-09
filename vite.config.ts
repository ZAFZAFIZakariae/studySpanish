import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const alias: Record<string, string> = {
  '@': path.resolve(__dirname, 'src'),
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias,
  },
  assetsInclude: ['**/*.txt'],
  server: {
    headers: {
      'Service-Worker-Allowed': '/',
    },
  },
  build: {
    sourcemap: true,
  },
});
