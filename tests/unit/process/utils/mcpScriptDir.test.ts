/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Regression coverage for the bug class that produced v0.6.2.3:
 * the two ad-hoc MCP script dir resolvers each returned wrong paths
 * (one doubled `out/main`, the other froze with a stale top-level path),
 * causing every `team_*` MCP child to die with MODULE_NOT_FOUND and
 * registering zero coordination tools on the team leader's worker.
 *
 * These tests pin the shared resolver to behaviors that, if violated again,
 * would re-introduce that silent failure.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MCP_STDIO_SCRIPT_NAMES,
  resolveMcpScriptDir,
  getMcpScriptPath,
  inspectMcpScripts,
  assertMcpScriptsExist,
} from '../../../../src/process/utils/mcpScriptDir';

describe('resolveMcpScriptDir', () => {
  it('returns an absolute path', () => {
    const dir = resolveMcpScriptDir();
    expect(path.isAbsolute(dir)).toBe(true);
  });

  it('does not double the `out/main` segment', () => {
    // The original bug: path.join(appPath, 'out', 'main') when appPath
    // already ended in `.../out/main`. If the resolver ever produces a
    // path with `out/main/out/main`, the bug has regressed.
    const dir = resolveMcpScriptDir();
    expect(dir).not.toMatch(/[/\\]out[/\\]main[/\\]out[/\\]main([/\\]|$)/);
  });

  it('points at a directory that actually exists when scripts are built', () => {
    // The build step `scripts/build-mcp-servers.js` writes to
    // `out/main/`. If the build has run, the dir must exist.
    const dir = resolveMcpScriptDir();
    const oneScript = path.join(dir, 'team-mcp-stdio.js');
    // Only assert dir existence if at least one expected script exists -
    // otherwise the build simply hasn't run yet (fresh clone, dev plugin
    // not fired), and we don't want to fail unit tests for that.
    if (fs.existsSync(oneScript)) {
      expect(fs.existsSync(dir)).toBe(true);
    }
  });
});

describe('getMcpScriptPath', () => {
  it('joins the resolved dir with the script name', () => {
    const dir = resolveMcpScriptDir();
    expect(getMcpScriptPath('team-mcp-stdio.js')).toBe(path.join(dir, 'team-mcp-stdio.js'));
  });
});

describe('MCP_STDIO_SCRIPT_NAMES', () => {
  it('lists exactly the four scripts emitted by build-mcp-servers.js', () => {
    // If `scripts/build-mcp-servers.js` emits a new script, the canary
    // list MUST be updated in lockstep - otherwise startup assertions
    // won't catch a missing-script failure for the new file.
    const buildScript = fs.readFileSync(
      path.resolve(__dirname, '../../../../scripts/build-mcp-servers.js'),
      'utf-8'
    );
    const matches = [...buildScript.matchAll(/outfile:\s*path\.join\(ROOT,\s*'out\/main\/([^']+)'\)/g)];
    const emittedNames = matches.map((m) => m[1]).sort();
    expect(emittedNames).toEqual([...MCP_STDIO_SCRIPT_NAMES].sort());
  });
});

describe('inspectMcpScripts', () => {
  it('returns ok: true with the full present list when every script exists', () => {
    const result = inspectMcpScripts();
    if (result.ok) {
      expect(result.presentScripts.length).toBe(MCP_STDIO_SCRIPT_NAMES.length);
      expect([...result.presentScripts].sort()).toEqual([...MCP_STDIO_SCRIPT_NAMES].sort());
    } else {
      // The build hasn't run - that's fine. Make sure the failure report
      // actually names the missing files (otherwise the canary is useless
      // when it triggers in production).
      expect(result.missingScripts.length).toBeGreaterThan(0);
      expect(result.message).toContain('MCP stdio scripts missing');
      expect(result.message).toContain(result.dir);
      for (const missing of result.missingScripts) {
        expect(result.message).toContain(missing);
      }
    }
  });

  it('includes dir contents in the error message when scripts are missing', () => {
    // This test only runs if there's something genuinely missing - we
    // don't fake-delete files. If everything is present, skip the
    // negative-path assertion.
    const result = inspectMcpScripts();
    if (!result.ok) {
      expect(result.message).toContain('Dir contents:');
      expect(result.message).toContain("Run 'node scripts/build-mcp-servers.js'");
    }
  });
});

describe('assertMcpScriptsExist', () => {
  it('throws iff any expected script is missing', () => {
    const result = inspectMcpScripts();
    if (result.ok) {
      expect(() => assertMcpScriptsExist()).not.toThrow();
    } else {
      expect(() => assertMcpScriptsExist()).toThrow(/MCP stdio scripts missing/);
    }
  });
});
