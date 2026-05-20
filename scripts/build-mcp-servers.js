#!/usr/bin/env node
/**
 * Build builtin MCP server scripts as fully self-contained CJS bundles.
 *
 * electron-vite's externalizeDepsPlugin leaves all npm packages as require()
 * calls, which works for Electron's main process (ASAR virtual FS patches
 * require()) but fails when an external `node` process runs the script from
 * app.asar.unpacked — there is no ASAR support there.
 *
 * This script uses esbuild's programmatic API (instead of CLI flags) to avoid
 * shell-quoting issues with special characters in --define values.
 */

const esbuild = require('esbuild');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

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
  ]);
}

main().catch((err) => {
  console.error('MCP server build failed:', err);
  process.exit(1);
});
