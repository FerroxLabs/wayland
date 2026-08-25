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
const { spawnSync } = require('child_process');
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
 * #940: name of the ONE env var that downgrades a missing/failed @wayland MCP
 * bundle from a build failure to a loud warning. Default is fail-closed: four
 * connectors (apple, imap, news, cal.com) silently vanished from shipped
 * installers because both skips below were unconditional warnings, and the
 * Library still advertised cards for them.
 *
 * NOTHING in CI sets it any more: every workflow that actually runs this script
 * checks FerroxLabs/waylandmcp out to ./waylandmcp first. The env var stays as
 * the deliberate, loud escape hatch for a local build without the sources - see
 * #940.
 */
const ALLOW_MISSING_ENV = 'WAYLAND_ALLOW_MISSING_MCP';

/** True only when the opt-out is explicitly set to 1. */
function optionalMcpBypassEnabled(env = process.env) {
  return env[ALLOW_MISSING_ENV] === '1';
}

/**
 * #940: a missing source tree or a failed bundle is a SHIPPING DEFECT - the
 * connector is absent from the installer while the app still offers it. Fail
 * the build unless the bypass is explicitly set, and when it is, say so loudly
 * enough to find in a CI log.
 *
 * Throws (fatal, main() exits 1) when the bypass is not set; returns when it is.
 */
function skipOptionalMcpOrFail(pkgName, detail, env = process.env) {
  const what = `@wayland/${pkgName} was NOT bundled into this build (${detail})`;
  if (!optionalMcpBypassEnabled(env)) {
    throw new Error(
      `[build-mcp-servers] ${what}. The connector would be missing from the shipped app while the ` +
        `Library still offers it (#940). Set ${ALLOW_MISSING_ENV}=1 to build without it on purpose.`
    );
  }
  console.warn(`::warning::[build-mcp-servers] ${ALLOW_MISSING_ENV}=1 BYPASS: ${what}. See #940.`);
}

/**
 * Where a @wayland/<name>-mcp source tree may live, in priority order.
 *
 * WAYLAND_MCP_SRC is an explicit override and therefore AUTHORITATIVE: when it
 * is set it is the ONLY candidate. Falling back to a different tree after an
 * operator named one silently builds something other than what was asked for -
 * the same class of quiet substitution #940 is about.
 */
function mcpSourceCandidates(pkgName, env = process.env) {
  if (env.WAYLAND_MCP_SRC) return [env.WAYLAND_MCP_SRC];
  // #940: every candidate is a SIBLING of the app repo, never inside it, and that
  // is load-bearing. esbuild resolves a bare import by walking node_modules
  // upward from the entry point, so a tree placed inside the repo would have the
  // app's ~2100-package node_modules on that walk: a connector importing
  // something it does not declare would resolve silently against the app's copy
  // instead of failing. actions/checkout cannot write above github.workspace, so
  // CI checks out to ./waylandmcp and then MOVES the tree to ROOT/.. before
  // building - see the "Relocate and install" step in the build workflows.
  return [
    path.resolve(ROOT, '..', '..', 'waylandmcp', 'packages', pkgName),
    path.resolve(ROOT, '..', 'waylandmcp', 'packages', pkgName),
    path.join(require('os').homedir(), 'dev', 'waylandmcp', 'packages', pkgName),
  ];
}

/**
 * Compile the apple-mcp Swift EventKit helper with the toolchain the package's
 * own `build:native` script uses. Kept as a default so tests can inject a
 * compiler and exercise every branch on shards where swiftc does not exist.
 */
function compileEventKitBridge({ source, output }) {
  const result = spawnSync(
    'swiftc',
    [source, '-o', output, '-framework', 'EventKit', '-framework', 'Foundation'],
    { encoding: 'utf-8' }
  );
  if (result.error) return { status: 1, stderr: String(result.error.message) };
  return { status: result.status, stderr: result.stderr || '' };
}

/**
 * Install the apple-mcp Swift EventKit helper next to the JS bundle, BUILDING
 * it when it is not already there.
 *
 * #1013: this used to copy-if-present only, and waylandmcp gitignores `dist/`,
 * so a plain CI checkout never had the binary and the connector shipped anyway.
 * 9 of its tools route through this helper - Calendar listEvents/createEvent/
 * updateEvent/deleteEvent/findFreeSlot and Reminders listReminders/
 * createReminder/completeReminder/deleteReminder - so they were dead on arrival
 * while the Library still offered them. Notes, Mail, Maps and Photos go via
 * AppleScript and were unaffected. #940 made the silence a warning; a warning
 * still ships a card advertising controls that cannot work.
 *
 * The SOURCE is committed (`native/EventKitBridge.swift`), so a checkout has
 * everything needed - nothing ever ran swiftc. Now the darwin legs do, and a
 * compile that fails (or that reports success while producing nothing) is FATAL
 * rather than a warning, so this cannot regress back to shipping green.
 *
 * Off darwin there is no EventKit to link against, so the pre-existing warning
 * stands: the helper is macOS-only and the connector is not cross-shipped.
 */
async function copyEventKitBridge(src, outMain = OUT_MAIN, options = {}) {
  const platform = options.platform ?? process.platform;
  const compile = options.compile ?? compileEventKitBridge;
  const bridge = path.join(src, 'dist', 'eventkit-bridge');
  const swiftSource = path.join(src, 'native', 'EventKitBridge.swift');

  if (!fs.existsSync(bridge) && platform === 'darwin' && fs.existsSync(swiftSource)) {
    fs.mkdirSync(path.dirname(bridge), { recursive: true });
    const { status, stderr } = compile({ source: swiftSource, output: bridge });
    if (status !== 0) {
      throw new Error(
        `[build-mcp-servers] #1013 swiftc failed to build the apple-mcp EventKit bridge ` +
          `from ${swiftSource}: ${String(stderr).trim() || `exit ${String(status)}`}`
      );
    }
    // A zero exit with no artifact is the same shipping-green failure by another
    // route, so it gets the same fatal treatment rather than falling through to
    // the warning below.
    if (!fs.existsSync(bridge)) {
      throw new Error(
        `[build-mcp-servers] #1013 swiftc reported success but produced no ${bridge} ` +
          `for the apple-mcp EventKit bridge`
      );
    }
  }

  if (fs.existsSync(bridge)) {
    fs.copyFileSync(bridge, path.join(outMain, 'eventkit-bridge'));
    fs.chmodSync(path.join(outMain, 'eventkit-bridge'), 0o755);
    return;
  }

  // Nothing to install and nothing buildable here: off darwin (no EventKit to
  // link), or a source tree that does not carry the Swift file. Say it loudly
  // enough to find in a CI log - #940 is about exactly the silence.
  console.warn(
    `::warning::[build-mcp-servers] @wayland/apple-mcp was bundled WITHOUT its Swift EventKit ` +
      `bridge (no ${bridge}). On macOS its 5 Calendar and 4 Reminders tools will fail at runtime ` +
      `while the Library still offers them; Notes/Mail/Maps/Photos are unaffected. See #1013.`
  );
}

/**
 * Bundle a @wayland/<name>-mcp package into a single self-contained .mjs file
 * in out/main/. These packages live in FerroxLabs/waylandmcp - checked out to
 * ./waylandmcp in CI, or a sibling ~/dev/waylandmcp tree locally - and ship
 * with the Electron installer (no npm registry dep).
 *
 * Sources use top-level await so the bundle must be ESM, not CJS.
 *
 * A missing source tree or a bundle failure is FATAL unless
 * `WAYLAND_ALLOW_MISSING_MCP=1` is set (#940).
 */
async function bundleWaylandMcp(pkgName, outName, opts = {}) {
  const candidates = mcpSourceCandidates(pkgName);

  const src = candidates.find((p) => fs.existsSync(path.join(p, 'src', 'index.ts')));
  if (!src) {
    skipOptionalMcpOrFail(pkgName, `source not found in any of: ${candidates.join(', ')}`);
    return;
  }

  // Say WHICH tree was bundled. Four candidates resolve silently, and a build
  // that picked up a stale ~/dev copy instead of the intended checkout is the
  // same quiet-substitution failure #940 is about - only visible if it is logged.
  console.log(`[build-mcp-servers] @wayland/${pkgName} <- ${src}`);

  // A bundle failure of one of these - e.g. a transitive dep whose nested
  // node_modules copy is incomplete on a given runner (an @opentelemetry/core
  // ESM submodule failed to resolve on windows-x64) - used to be an
  // unconditional warn-and-continue. #940: that is exactly how a connector
  // reaches users' Library as a card backed by no script, so it now fails the
  // build unless the bypass is set.
  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    skipOptionalMcpOrFail(pkgName, `bundle step failed: ${message.split('\n')[0]}`);
    return;
  }

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
      // `better-sqlite3` is a NATIVE module. esbuild can inline its JS but NOT
      // its `.node` binding; the inlined `bindings` loader then resolves
      // relative to out/main (which has no build/Release) and throws
      // "Could not locate the bindings file". Unlike the other stdio servers
      // (which transitively reference the driver but never open a DB), the diag
      // server ACTUALLY opens SQLite, so it must keep better-sqlite3 as an
      // external require() resolved at runtime from the (asarUnpacked)
      // node_modules - exactly how the Electron main process loads it.
      external: [...SHARED_OPTIONS.external, 'better-sqlite3'],
      entryPoints: [path.join(ROOT, 'src/process/resources/builtinMcp/conciergeDiagServerEntry.ts')],
      outfile: path.join(ROOT, 'out/main/builtin-mcp-concierge-diag.js'),
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
    bundleWaylandMcp('apple-mcp', 'builtin-mcp-apple.mjs', { onSuccess: copyEventKitBridge }),
  ]);
}

// Running as a script builds; being `require`d (tests) only exposes the pieces.
if (require.main === module) {
  main().catch((err) => {
    console.error('MCP server build failed:', err);
    process.exit(1);
  });
}

module.exports = {
  ALLOW_MISSING_ENV,
  bundleWaylandMcp,
  compileEventKitBridge,
  copyEventKitBridge,
  mcpSourceCandidates,
  optionalMcpBypassEnabled,
  skipOptionalMcpOrFail,
};
