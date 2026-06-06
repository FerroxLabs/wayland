#!/usr/bin/env node
/**
 * Build builtin MCP server scripts as fully self-contained CJS bundles.
 *
 * electron-vite's externalizeDepsPlugin leaves all npm packages as require()
 * calls, which works for Electron's main process (ASAR virtual FS patches
 * require()) but fails when an external `node` process runs the script from
 * app.asar.unpacked - there is no ASAR support there.
 *
 * This script uses esbuild's programmatic API (instead of CLI flags) to avoid
 * shell-quoting issues with special characters in --define values.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_MAIN = path.join(ROOT, 'out/main');

const SHARED_OPTIONS = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  // `bun:sqlite` is a Bun built-in that Node cannot resolve. The search-skills
  // subprocess transitively imports the database driver registry, but never
  // executes the bun-specific code path; marking it external leaves the
  // require unresolved in the bundle (the registry picks a different driver
  // at runtime under Node).
  external: ['electron', 'bun:sqlite'],
  tsconfig: path.join(ROOT, 'tsconfig.json'),
  loader: { '.wasm': 'empty' },
  define: {
    // @office-ai/aioncli-core uses import.meta.url for version detection.
    // Provide a valid file: URL so fileURLToPath() does not throw at startup.
    'import.meta.url': JSON.stringify('file:///C:/placeholder'),
  },
};

/**
 * Bundle a sibling @wayland/<name>-mcp package into a single self-contained
 * .mjs file in out/main/. These packages live in ~/dev/waylandmcp and ship
 * with the Electron installer (no npm registry dep).
 *
 * Sources use top-level await so the bundle must be ESM, not CJS.
 *
 * Tolerates a missing source tree (e.g. CI without the sibling repo): logs and
 * skips so the rest of the build still completes.
 */
async function bundleWaylandMcp(pkgName, outName, opts = {}) {
  const candidates = [
    process.env.WAYLAND_MCP_SRC,
    path.resolve(ROOT, '..', '..', 'waylandmcp', 'packages', pkgName),
    path.resolve(ROOT, '..', 'waylandmcp', 'packages', pkgName),
    path.join(require('os').homedir(), 'dev', 'waylandmcp', 'packages', pkgName),
  ].filter(Boolean);

  const src = candidates.find((p) => fs.existsSync(path.join(p, 'src', 'index.ts')));
  if (!src) {
    console.warn(
      `[build-mcp-servers] @wayland/${pkgName} source not found in any of: ${candidates.join(', ')} - skipping.`,
    );
    return;
  }

  await esbuild.build({
    bundle: true,
    platform: 'node',
    format: 'esm',
    external: ['electron'],
    loader: { '.wasm': 'empty' },
    entryPoints: [path.join(src, 'src', 'index.ts')],
    outfile: path.join(OUT_MAIN, outName),
    nodePaths: [path.join(src, 'node_modules')],
    // ESM-format bundles need a working `require` for inner CJS deps that
    // dynamically pull node builtins (e.g. rss-parser → http). Without the
    // banner, esbuild emits a stub that throws "Dynamic require not
    // supported." `createRequire` makes those require() calls resolve at
    // runtime against Node's real module system.
    banner: {
      js:
        "import { createRequire as __wayland_createRequire } from 'module';\n" +
        'const require = __wayland_createRequire(import.meta.url);',
    },
  });

  if (opts.onSuccess) await opts.onSuccess(src);
}

async function main() {
  await Promise.all([
    esbuild.build({
      ...SHARED_OPTIONS,
      entryPoints: [path.join(ROOT, 'src/process/resources/builtinMcp/imageGenServer.ts')],
      outfile: path.join(ROOT, 'out/main/builtin-mcp-image-gen.js'),
    }),
    esbuild.build({
      ...SHARED_OPTIONS,
      entryPoints: [path.join(ROOT, 'src/process/resources/builtinMcp/searchSkillsServerEntry.ts')],
      outfile: path.join(ROOT, 'out/main/builtin-mcp-search-skills.js'),
    }),
    esbuild.build({
      ...SHARED_OPTIONS,
      entryPoints: [path.join(ROOT, 'src/process/team/mcp/team/teamMcpStdio.ts')],
      outfile: path.join(ROOT, 'out/main/team-mcp-stdio.js'),
    }),
    esbuild.build({
      ...SHARED_OPTIONS,
      entryPoints: [path.join(ROOT, 'src/process/team/mcp/guide/teamGuideMcpStdio.ts')],
      outfile: path.join(ROOT, 'out/main/team-guide-mcp-stdio.js'),
    }),
    // Bundled @wayland MCP servers - ship with the installer, no npm publish.
    bundleWaylandMcp('imap-mcp', 'builtin-mcp-imap.mjs'),
    bundleWaylandMcp('news-mcp', 'builtin-mcp-news.mjs'),
    bundleWaylandMcp('cal-com-mcp', 'builtin-mcp-cal-com.mjs'),
    bundleWaylandMcp('apple-mcp', 'builtin-mcp-apple.mjs', {
      onSuccess: async (src) => {
        // Copy the Swift EventKit bridge binary alongside the JS bundle.
        const bridge = path.join(src, 'dist', 'eventkit-bridge');
        if (fs.existsSync(bridge)) {
          fs.copyFileSync(bridge, path.join(OUT_MAIN, 'eventkit-bridge'));
          fs.chmodSync(path.join(OUT_MAIN, 'eventkit-bridge'), 0o755);
        }
      },
    }),
  ]);
}

main().catch((err) => {
  console.error('MCP server build failed:', err);
  process.exit(1);
});
