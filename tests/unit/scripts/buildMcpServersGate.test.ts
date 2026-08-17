/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * #940: four @wayland MCP connectors (apple, imap, news, cal.com) shipped as
 * Library cards backed by no script, because scripts/build-mcp-servers.js
 * warned-and-skipped both when the sibling source tree was absent AND when the
 * bundle step threw. Nothing in CI failed, so nobody found out until users did.
 *
 * The skip is now fatal unless WAYLAND_ALLOW_MISSING_MCP=1 is set on purpose.
 * These tests pin BOTH halves: fail-closed by default, loud bypass when asked.
 */

const require_ = createRequire(import.meta.url);
const SCRIPT = path.resolve(__dirname, '../../../scripts/build-mcp-servers.js');
const REPO_ROOT = path.resolve(__dirname, '../../..');

// Requiring the script must NOT start a build - it only exports its pieces
// unless it is the process entry point.
const gate = require_(SCRIPT) as {
  ALLOW_MISSING_ENV: string;
  bundleWaylandMcp: (pkgName: string, outName: string) => Promise<void>;
  mcpSourceCandidates: (pkgName: string, env?: NodeJS.ProcessEnv) => string[];
  optionalMcpBypassEnabled: (env?: NodeJS.ProcessEnv) => boolean;
  skipOptionalMcpOrFail: (pkgName: string, detail: string, env?: NodeJS.ProcessEnv) => void;
};

/** A source root that cannot exist, so the missing-source path is deterministic. */
const MISSING_SRC = path.join(REPO_ROOT, 'does-not-exist-940', 'packages', 'imap-mcp');

/**
 * True when `candidate` IS `root` or lives underneath it.
 *
 * "path.relative(root, candidate).startsWith('..')" is not a containment test,
 * and it is wrong in both directions:
 *  - On Windows path.relative returns an ABSOLUTE path when the two paths sit
 *    on different drives, because no relative path can cross a drive root. CI
 *    checks the app out to D:\a\wayland\wayland while os.homedir() is
 *    C:\Users\runneradmin, so the homedir candidate relativises to
 *    "C:\Users\..." - obviously outside the repo, yet it does not start with
 *    "..". That is the whole windows-2022-only failure.
 *  - A path INSIDE the repo whose first segment merely begins with two dots,
 *    e.g. ROOT/..foo, relativises to "..foo" and would be waved through.
 * Compare the first path segment instead, and treat an absolute result as the
 * different-root (therefore outside) case it is.
 */
function isInsideRepo(root: string, candidate: string): boolean {
  const rel = path.relative(root, candidate);
  if (rel === '') return true; // the repo root itself
  if (path.isAbsolute(rel)) return false; // different drive/root - outside
  return rel.split(/[\\/]/)[0] !== '..';
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.WAYLAND_MCP_SRC;
  delete process.env.WAYLAND_ALLOW_MISSING_MCP;
});

describe('build-mcp-servers optional-MCP gate (#940)', () => {
  it('names the opt-out explicitly and treats only "1" as set', () => {
    expect(gate.ALLOW_MISSING_ENV).toBe('WAYLAND_ALLOW_MISSING_MCP');
    expect(gate.optionalMcpBypassEnabled({})).toBe(false);
    expect(gate.optionalMcpBypassEnabled({ WAYLAND_ALLOW_MISSING_MCP: '0' })).toBe(false);
    expect(gate.optionalMcpBypassEnabled({ WAYLAND_ALLOW_MISSING_MCP: 'true' })).toBe(false);
    expect(gate.optionalMcpBypassEnabled({ WAYLAND_ALLOW_MISSING_MCP: '1' })).toBe(true);
  });

  // #940 CONTAINMENT: every candidate must be a SIBLING of the app repo, never
  // inside it. esbuild resolves bare imports by walking node_modules upward from
  // the entry point, so a source tree inside the repo puts the app's ~2100-package
  // node_modules on that walk - a connector importing something it does not
  // declare then resolves SILENTLY against the app's copy instead of failing the
  // build. Proven by A/B: identical source bundles clean in-workspace and dies
  // with "Could not resolve" as a sibling. CI checks out to ./waylandmcp only
  // because actions/checkout cannot write above github.workspace, then moves the
  // tree to ROOT/.. before building. If an in-repo candidate is ever added back,
  // that move becomes optional and the containment silently disappears.
  it('offers only sibling candidates, never one inside the app repo', () => {
    const candidates = gate.mcpSourceCandidates('imap-mcp', {});
    expect(candidates).toContain(path.resolve(REPO_ROOT, '..', 'waylandmcp', 'packages', 'imap-mcp'));
    expect(candidates).toContain(path.resolve(REPO_ROOT, '..', '..', 'waylandmcp', 'packages', 'imap-mcp'));
    expect(candidates.filter((candidate) => isInsideRepo(REPO_ROOT, candidate))).toEqual([]);
  });

  // The containment check above is only worth having if it still FAILS on an
  // in-repo path. Pin the predicate itself, including the two shapes the old
  // "starts with .." string test got wrong.
  it('detects an in-repo path as contained, on every platform', () => {
    expect(isInsideRepo(REPO_ROOT, REPO_ROOT)).toBe(true);
    expect(isInsideRepo(REPO_ROOT, path.join(REPO_ROOT, 'waylandmcp', 'packages', 'imap-mcp'))).toBe(true);
    // Inside the repo, yet path.relative() yields "..foo".
    expect(isInsideRepo(REPO_ROOT, path.join(REPO_ROOT, '..foo'))).toBe(true);
    expect(isInsideRepo(REPO_ROOT, path.resolve(REPO_ROOT, '..', 'waylandmcp'))).toBe(false);
    // The exact windows-2022 shape, pinned on every platform: across drives no
    // relative path exists, so path.relative hands back an ABSOLUTE one. This
    // is why the old "starts with .." check read an outside path as inside.
    expect(path.win32.relative('D:\\a\\wayland\\wayland', 'C:\\Users\\runneradmin\\dev\\waylandmcp')).toBe(
      'C:\\Users\\runneradmin\\dev\\waylandmcp'
    );
  });

  it('treats WAYLAND_MCP_SRC as the single authoritative candidate', () => {
    expect(gate.mcpSourceCandidates('imap-mcp', { WAYLAND_MCP_SRC: MISSING_SRC })).toEqual([MISSING_SRC]);
  });

  it('throws (fatal) when a connector is skipped and the opt-out is NOT set', () => {
    expect(() => gate.skipOptionalMcpOrFail('imap-mcp', 'source not found', {})).toThrow(
      /@wayland\/imap-mcp was NOT bundled/
    );
    // The failure has to tell the reader how to proceed deliberately.
    expect(() => gate.skipOptionalMcpOrFail('imap-mcp', 'source not found', {})).toThrow(/WAYLAND_ALLOW_MISSING_MCP=1/);
  });

  it('warns loudly and continues when the opt-out IS set', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() =>
      gate.skipOptionalMcpOrFail('news-mcp', 'bundle step failed: boom', { WAYLAND_ALLOW_MISSING_MCP: '1' })
    ).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]?.[0]);
    expect(message).toContain('::warning::');
    expect(message).toContain('WAYLAND_ALLOW_MISSING_MCP=1 BYPASS');
    expect(message).toContain('@wayland/news-mcp was NOT bundled');
  });

  it('rejects the bundle when the source tree is missing and the opt-out is NOT set', async () => {
    process.env.WAYLAND_MCP_SRC = MISSING_SRC;
    await expect(gate.bundleWaylandMcp('imap-mcp', 'builtin-mcp-imap.mjs')).rejects.toThrow(
      /WAYLAND_ALLOW_MISSING_MCP=1/
    );
  });

  it('resolves (skips) the bundle when the source tree is missing and the opt-out IS set', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.WAYLAND_MCP_SRC = MISSING_SRC;
    process.env.WAYLAND_ALLOW_MISSING_MCP = '1';
    await expect(gate.bundleWaylandMcp('imap-mcp', 'builtin-mcp-imap.mjs')).resolves.toBeUndefined();
    expect(String(warn.mock.calls[0]?.[0])).toContain('::warning::');
  });

  it('exits NON-ZERO end to end when a connector source is missing and the opt-out is NOT set', () => {
    // The real script, run the way every build runs it. Promise.all rejects on
    // the first missing connector, so this returns long before esbuild is done.
    const result = spawnSync(process.execPath, [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      env: { ...process.env, WAYLAND_MCP_SRC: MISSING_SRC, WAYLAND_ALLOW_MISSING_MCP: '' },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('MCP server build failed');
    expect(result.stderr).toContain('WAYLAND_ALLOW_MISSING_MCP=1');
  }, 120_000);
});
