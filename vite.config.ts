import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let micromarkExtensionPath: string | undefined;

try {
  require.resolve('micromark-extension-gfm');
} catch (error) {
  micromarkExtensionPath = path.resolve(
    __dirname,
    'src/lib/shims/micromarkExtensionGfm.ts'
  );
}

const alias: Record<string, string> = {
  '@': path.resolve(__dirname, 'src'),
};

if (micromarkExtensionPath) {
  alias['micromark-extension-gfm'] = micromarkExtensionPath;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias,
  },
  server: {
    headers: {
      'Service-Worker-Allowed': '/',
    },
  },
  build: {
    sourcemap: true,
  },
});
