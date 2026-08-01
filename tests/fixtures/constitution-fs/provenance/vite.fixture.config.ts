import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('src'),
      '@common': resolve('src/common'),
      '@process': resolve('src/process'),
      '@renderer': resolve('src/renderer'),
    },
  },
});
