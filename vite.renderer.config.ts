/**
 * Standalone renderer build config - no Electron dependency.
 * Used by `bun run build:renderer:web` for server/container deployments.
 * Outputs to out/renderer/ (same location as electron-vite build).
 */
import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import UnoCSS from 'unocss/vite';
import unoConfig from './uno.config.ts';

// Stamp the service-worker cache version with the app version at build time.
// public/sw.js carries a `__WAYLAND_SW_VERSION__` token; replacing it per
// release gives every deploy a unique CACHE_NAME, so the SW's activate cleanup
// purges old caches and a stale bundle can never be served after an update
// (#47). Web build only; the desktop build never registers the SW.
function swVersionInjector(): Plugin {
  const version = JSON.parse(readFileSync(resolve('package.json'), 'utf8')).version as string;
  return {
    name: 'wayland-sw-version-injector',
    apply: 'build',
    closeBundle() {
      const swPath = resolve('out/renderer/sw.js');
      if (!existsSync(swPath)) return;
      const src = readFileSync(swPath, 'utf8');
      const out = src.replace(/__WAYLAND_SW_VERSION__/g, version);
      if (out !== src) writeFileSync(swPath, out);
    },
  };
}

// Icon Park transform plugin REMOVED in Wave 4B.
// See electron.vite.config.ts for context - `IconParkHOC` no longer exists,
// the plugin's transform target became dead, and any `@icon-park/react`
// import in source silently broke Vite import-analysis. New code uses
// lucide-react.

export default defineConfig({
  base: './',
  root: resolve('src/renderer'),
  publicDir: resolve('public'),
  resolve: {
    alias: {
      '@': resolve('src'),
      '@common': resolve('src/common'),
      '@renderer': resolve('src/renderer'),
      '@process': resolve('src/process'),
      '@worker': resolve('src/process/worker'),
      streamdown: resolve('node_modules/streamdown/dist/index.js'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  plugins: [UnoCSS(unoConfig), swVersionInjector()],
  build: {
    outDir: resolve('out/renderer'),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    minify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1500,
    cssCodeSplit: true,
    rollupOptions: {
      input: { index: resolve('src/renderer/index.html') },
      external: ['node:crypto', 'crypto'],
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react-dom/') || id.includes('/react/')) return 'vendor-react';
          if (id.includes('/@arco-design/')) return 'vendor-arco';
          if (
            id.includes('/react-markdown/') ||
            id.includes('/remark-') ||
            id.includes('/rehype-') ||
            id.includes('/unified/') ||
            id.includes('/mdast-') ||
            id.includes('/hast-') ||
            id.includes('/micromark')
          )
            return 'vendor-markdown';
          if (id.includes('/react-syntax-highlighter/') || id.includes('/refractor/') || id.includes('/highlight.js/'))
            return 'vendor-highlight';
          if (
            id.includes('/monaco-editor/') ||
            id.includes('/@monaco-editor/') ||
            id.includes('/codemirror/') ||
            id.includes('/@codemirror/')
          )
            return 'vendor-editor';
          if (id.includes('/katex/')) return 'vendor-katex';
          if (id.includes('/@icon-park/')) return 'vendor-icons';
          if (id.includes('/diff2html/')) return 'vendor-diff';
          return undefined;
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'process.env.env': JSON.stringify(process.env.env),
    'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN ?? ''),
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['electron'],
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-i18next',
      'i18next',
      '@arco-design/web-react',
      '@icon-park/react',
      'react-markdown',
      'react-syntax-highlighter',
      'react-virtuoso',
      'classnames',
      'swr',
      'eventemitter3',
      'katex',
      'diff2html',
      'remark-gfm',
      'remark-math',
      'remark-breaks',
      'rehype-raw',
      'rehype-katex',
    ],
  },
});
