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

  // #940: the six workflows that build check FerroxLabs/waylandmcp out to
  // ./waylandmcp INSIDE the workspace, because actions/checkout refuses any
  // `path` above github.workspace. If that candidate ever stops being first,
  // CI silently reverts to bundling nothing (or, worse, a stale ~/dev tree).
  it('resolves the in-workspace CI checkout first', () => {
    const candidates = gate.mcpSourceCandidates('imap-mcp', {});
    expect(candidates[0]).toBe(path.join(REPO_ROOT, 'waylandmcp', 'packages', 'imap-mcp'));
    // The sibling layouts local dev relies on must survive alongside it.
    expect(candidates).toContain(path.resolve(REPO_ROOT, '..', '..', 'waylandmcp', 'packages', 'imap-mcp'));
    expect(candidates).toContain(path.resolve(REPO_ROOT, '..', 'waylandmcp', 'packages', 'imap-mcp'));
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
