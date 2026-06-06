import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import UnoCSS from 'unocss/vite';
import unoConfig from './uno.config.ts';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Build builtin MCP servers after main process bundle so they survive out/main/ cleanup.
function buildMcpServersPlugin() {
  return {
    name: 'vite-plugin-build-mcp-servers',
    closeBundle() {
      execSync(`node "${resolve('scripts/build-mcp-servers.js')}"`, { stdio: 'inherit' });
    },
  };
}

// Icon Park transform plugin REMOVED in Wave 4B.
//
// Background: `IconParkHOC` was deleted in the brand-sweep commit (every
// `@icon-park/react` import was migrated to lucide-react). The plugin's
// transform rewrote a `@icon-park/react` import into
// `import IconParkHOC from '@renderer/components/IconParkHOC'`, but that
// target no longer resolves - any future `.tsx` that imports from
// `@icon-park/react` silently broke Vite import-analysis with a cryptic
// "Failed to resolve import" error (Wave 4A surfaced this when Wave 2's
// ModelsSettings files unknowingly tripped it). New source files standardize
// on lucide-react; the package itself stays in optimizeDeps.include so the
// tests that `vi.mock('@icon-park/react', …)` keep resolving.

// Common path aliases for main process and workers
const mainAliases = {
  '@': resolve('src'),
  '@common': resolve('src/common'),
  '@renderer': resolve('src/renderer'),
  '@process': resolve('src/process'),
  '@worker': resolve('src/process/worker'),
  '@xterm/headless': resolve('src/common/utils/shims/xterm-headless.ts'),
};

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  const enableSentrySourceMaps = !isDevelopment && !!process.env.SENTRY_AUTH_TOKEN;

  const sentryPluginOptions = {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: {
      filesToDeleteAfterUpload: ['./out/**/*.map'],
      rewriteSources: (source: string) => {
        // Normalize Windows backslashes and strip leading relative prefixes
        // so Sentry paths match the GitHub repo structure (e.g. src/process/...)
        return source.replace(/\\/g, '/').replace(/^(\.\.\/)+(src\/)/, '$2');
      },
    },
  };

  return {
    main: {
      plugins: [
        // externalizeDepsPlugin replaces our custom getExternalDeps() + pluginExternalizeDynamicImports.
        // 'fix-path' excluded so it gets bundled inline (only 3KB).
        externalizeDepsPlugin({ exclude: ['fix-path'] }),
        ...(isDevelopment
          ? [
              {
                name: 'dev-build-mcp-servers',
                closeBundle() {
                  execSync(`node "${resolve(__dirname, 'scripts/build-mcp-servers.js')}"`, {
                    stdio: 'inherit',
                  });
                },
              },
            ]
          : []),
        ...(!isDevelopment
          ? [
              viteStaticCopy({
                structured: false,
                // electron-vite builds main process as SSR; viteStaticCopy defaults
                // to environment: "client" and silently skips non-client environments.
                environment: 'ssr',
                targets: [
                  // Use single * glob to copy top-level items (directories) with their contents intact.
                  // Using ** would flatten all nested files into the dest root.
                  { src: 'src/process/resources/skills/*', dest: 'skills' },
                  { src: 'src/process/resources/assistant/*', dest: 'assistant' },
                  { src: 'src/renderer/assets/logos/*', dest: 'static/images' },
                ],
              }),
            ]
          : []),
        ...(enableSentrySourceMaps ? [sentryVitePlugin(sentryPluginOptions)] : []),
        ...(isDevelopment ? [buildMcpServersPlugin()] : []),
      ],
      resolve: { alias: mainAliases, extensions: ['.ts', '.tsx', '.js', '.json'] },
      build: {
        sourcemap: enableSentrySourceMaps ? 'hidden' : isDevelopment,
        reportCompressedSize: false,
        rollupOptions: {
          input: {
            index: resolve('src/index.ts'),
            // Worker entry files are output alongside index.js in out/main/.
            // BaseAgentManager.resolveWorkerDir() handles the case where code
            // splitting places it in a chunks/ subdirectory.
            gemini: resolve('src/process/worker/gemini.ts'),
            lifecycleRunner: resolve('src/process/extensions/lifecycle/lifecycleRunner.ts'),
            // Built-in MCP server entry points (compiled by scripts/build-mcp-servers.js via esbuild,
            // not vite - esbuild bundles all deps for self-contained execution by external node processes)
          },
          onwarn(warning, warn) {
            if (warning.code === 'EVAL') return;
            warn(warning);
          },
        },
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.env': JSON.stringify(process.env.env),
        'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN ?? ''),
      },
    },

    preload: {
      plugins: [externalizeDepsPlugin()],
      resolve: {
        alias: { '@': resolve('src'), '@common': resolve('src/common') },
        extensions: ['.ts', '.tsx', '.js', '.json'],
      },
      build: {
        sourcemap: false,
        reportCompressedSize: false,
        rollupOptions: {
          input: {
            index: resolve('src/preload/main.ts'),
            ambientPreload: resolve('src/preload/ambientPreload.ts'),
          },
        },
      },
    },

    renderer: {
      base: './',
      publicDir: resolve('public'),
      appType: 'mpa',
      server: {
        // Default to 5173; when occupied (e.g. another Wayland clone is running),
        // Vite auto-increments to the next available port.
        // electron-vite reads the actual port and sets ELECTRON_RENDERER_URL accordingly.
        port: 5173,
        // Explicit HMR host so Vite client connects directly to the Vite dev server,
        // not to the WebUI proxy server (which would reject the WebSocket and cause infinite reload).
        // Port is omitted so it automatically matches the server port.
        hmr: {
          host: 'localhost',
        },
      },
      resolve: {
        alias: {
          '@': resolve('src'),
          '@common': resolve('src/common'),
          '@renderer': resolve('src/renderer'),
          '@process': resolve('src/process'),
          '@worker': resolve('src/process/worker'),
          // Force ESM version of streamdown
          streamdown: resolve('node_modules/streamdown/dist/index.js'),
          // Audit Phase 2-J: redirect shiki's base64-inlined oniguruma WASM module
          // to a shim that loads onig.wasm as a separate Vite asset. This saves
          // ~600ms first-render parse + ~200kB gzipped from the lazy code-block chunk.
          // Match both the bare specifier (shiki/wasm.mjs re-export target) and the
          // resolved path (in case anything imports the dist file directly).
          '@shikijs/engine-oniguruma/wasm-inlined': resolve('src/renderer/shims/shiki-onig-wasm-shim.mjs'),
          '@shikijs/engine-oniguruma/dist/wasm-inlined.mjs': resolve('src/renderer/shims/shiki-onig-wasm-shim.mjs'),
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
        dedupe: ['react', 'react-dom', 'react-router-dom'],
      },
      plugins: [UnoCSS(unoConfig), ...(enableSentrySourceMaps ? [sentryVitePlugin(sentryPluginOptions)] : [])],
      build: {
        target: 'es2022',
        sourcemap: enableSentrySourceMaps ? 'hidden' : isDevelopment,
        minify: !isDevelopment,
        reportCompressedSize: false,
        chunkSizeWarningLimit: 1500,
        cssCodeSplit: true,
        // Audit Phase 2-J: keep Vite's default inline cutoff so any .wasm asset
        // (e.g. shiki's onig.wasm via the shim alias above) ships as a sidecar
        // file instead of being base64-inlined into the chunk that imports it.
        assetsInlineLimit: 4096,
        rollupOptions: {
          input: {
            index: resolve('src/renderer/index.html'),
            'ambient/bubble': resolve('src/renderer/ambient/bubble.html'),
          },
          external: ['node:crypto', 'crypto'],
          onwarn(warning, warn) {
            if (warning.code === 'EVAL') return;
            warn(warning);
          },
          output: {
            // Audit Phase 2-J: split the main renderer chunk by vendor family.
            // Before: a single ~1.5MB index-*.js. After: index drops below 1MB,
            // each vendor group loads independently and benefits from per-chunk caching.
            manualChunks(id: string) {
              if (!id.includes('node_modules')) return undefined;
              // CRITICAL: predicates use STRICT package-name boundaries
              // (`/node_modules/<pkg>/`) so a package like `@monaco-editor/react`
              // does NOT greedy-match the bare `/react/` substring and get
              // misclassified into vendor-react. Earlier substring-based
              // predicates created a circular vendor-react → vendor-i18n →
              // vendor-react dependency at module-init time, leaving
              // `React.createContext` as `undefined` and silently killing
              // renderer bootstrap under file:// (see HANDOFF-2026-05-19).
              const NM = /[\\/]node_modules[\\/]/;
              const pkg = (name: string) => new RegExp(`[\\\\/]node_modules[\\\\/]${name}[\\\\/]`).test(id);
              const scoped = (org: string, name?: string) =>
                name
                  ? new RegExp(`[\\\\/]node_modules[\\\\/]${org}[\\\\/]${name}[\\\\/]`).test(id)
                  : new RegExp(`[\\\\/]node_modules[\\\\/]${org}[\\\\/]`).test(id);
              if (!NM.test(id)) return undefined;

              // Core React + scheduler - no application code, no wrappers.
              if (pkg('react') || pkg('react-dom') || pkg('scheduler') || pkg('use-sync-external-store'))
                return 'vendor-react';

              // Router as a separate chunk so routing changes don't bust React's hash.
              if (pkg('react-router-dom') || pkg('react-router') || pkg('@remix-run')) return 'vendor-router';

              // i18n bucket - strictly i18next family.
              if (pkg('i18next') || pkg('react-i18next') || /[\\/]node_modules[\\/]i18next-[^/\\]+[\\/]/.test(id))
                return 'vendor-i18n';

              // Arco - both packages and CSS.
              if (scoped('@arco-design')) return 'vendor-arco';

              if (scoped('@sentry')) return 'vendor-sentry';
              if (pkg('react-virtuoso')) return 'vendor-virtuoso';

              if (
                pkg('react-markdown') ||
                /[\\/]node_modules[\\/]remark-[^/\\]+[\\/]/.test(id) ||
                /[\\/]node_modules[\\/]rehype-[^/\\]+[\\/]/.test(id) ||
                pkg('unified') ||
                /[\\/]node_modules[\\/]mdast-[^/\\]+[\\/]/.test(id) ||
                /[\\/]node_modules[\\/]hast-[^/\\]+[\\/]/.test(id) ||
                /[\\/]node_modules[\\/]micromark[^/\\]*[\\/]/.test(id)
              )
                return 'vendor-markdown';

              if (pkg('react-syntax-highlighter') || pkg('refractor') || pkg('highlight.js')) return 'vendor-highlight';

              // Editor family. NOTE: @monaco-editor/react is bundled HERE (not in
              // vendor-react) - it's a Monaco wrapper, not React core. Same for
              // @uiw/react-codemirror.
              if (
                pkg('monaco-editor') ||
                scoped('@monaco-editor') ||
                pkg('codemirror') ||
                scoped('@codemirror') ||
                scoped('@uiw')
              )
                return 'vendor-editor';

              if (pkg('katex')) return 'vendor-katex';
              if (scoped('@icon-park')) return 'vendor-icons';
              if (pkg('diff2html')) return 'vendor-diff';
              return undefined;
            },
          },
        },
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.env': JSON.stringify(process.env.env),
        'process.env.WAYLAND_MULTI_INSTANCE': JSON.stringify(process.env.WAYLAND_MULTI_INSTANCE ?? ''),
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
    },
  };
});
