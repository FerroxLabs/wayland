/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-01 Task 1 (RED): the new private `writeGlobalMcpProfile`/
 * `restoreGlobalMcpProfile` methods on `WCoreAgent`, reached directly (no
 * process spawn) via the `new WCoreAgent(...) as unknown as {...}` cast
 * pattern already proven in `tests/unit/wcoreProjectConfig.security.test.ts`.
 *
 * `targetDir` stands in for a resolved `WAYLAND_HOME` - a fresh `mkdtempSync`
 * dir, never the real profiles root.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'smol-toml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WCoreAgent } from '@process/agent/wcore';
import type { TProviderWithModel } from '@/common/config/storage';
import { WCORE_DESKTOP_MCP_PROFILE } from '@process/agent/wcore/envBuilder';
import { DesktopProfileSpliceError } from '@process/agent/wcore/desktopProfileSplice';

function makeModel(): TProviderWithModel {
  return {
    id: 'test-provider',
    platform: 'openai',
    name: 'Test Provider',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'test-key',
    useModel: 'gpt-5.1',
  };
}

/**
 * Construct a WCoreAgent and reach its private
 * writeGlobalMcpProfile/restoreGlobalMcpProfile/writeProjectConfig methods
 * directly, without spawning a process.
 */
function makeAgent(workspace: string): {
  writeGlobalMcpProfile: (targetDir: string, serverNames: readonly string[]) => void;
  restoreGlobalMcpProfile: () => void;
  writeProjectConfig: (content: string) => void;
} {
  const agent = new WCoreAgent({
    workspace,
    model: makeModel(),
    onStreamEvent: () => {},
  });
  return agent as unknown as {
    writeGlobalMcpProfile: (targetDir: string, serverNames: readonly string[]) => void;
    restoreGlobalMcpProfile: () => void;
    writeProjectConfig: (content: string) => void;
  };
}

describe('WCoreAgent global MCP profile splice (K-01)', () => {
  let workspace: string;
  let targetDir: string;

  beforeEach(() => {
    workspace = mkdtempSync(join(tmpdir(), 'wcore-ws-'));
    targetDir = mkdtempSync(join(tmpdir(), 'wcore-global-'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(workspace, { recursive: true, force: true });
    rmSync(targetDir, { recursive: true, force: true });
  });

  it('1. writes a fresh config.toml with the given server names and removes it entirely on restore', () => {
    const agent = makeAgent(workspace);
    const configPath = join(targetDir, 'config.toml');
    expect(existsSync(configPath)).toBe(false);

    agent.writeGlobalMcpProfile(targetDir, ['tavily', 'firecrawl']);

    expect(existsSync(configPath)).toBe(true);
    const parsed = parse(readFileSync(configPath, 'utf-8')) as {
      profiles?: Record<string, { mcp_servers?: string[] }>;
    };
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]?.mcp_servers).toEqual(['firecrawl', 'tavily']);

    // Mirrors ProjectConfigTransaction's "no original existed" branch.
    agent.restoreGlobalMcpProfile();
    expect(existsSync(configPath)).toBe(false);
  });

  it('2. preserves real pre-existing content (including a comment) verbatim and restores byte-for-byte', () => {
    const configPath = join(targetDir, 'config.toml');
    const original = ['# real user config', '[providers.anthropic]', 'base_url = "https://api.anthropic.com"', ''].join(
      '\n'
    );
    writeFileSync(configPath, original, 'utf-8');

    const agent = makeAgent(workspace);
    agent.writeGlobalMcpProfile(targetDir, ['tavily']);

    const written = readFileSync(configPath, 'utf-8');
    expect(written).toContain('# real user config');
    expect(written).toContain('[providers.anthropic]');
    const parsed = parse(written) as { profiles?: Record<string, { mcp_servers?: string[] }> };
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]?.mcp_servers).toEqual(['tavily']);

    agent.restoreGlobalMcpProfile();
    expect(readFileSync(configPath, 'utf-8')).toBe(original);
  });

  it('3. PRF-07: a user edit made DURING the launch window survives restore untouched', () => {
    const configPath = join(targetDir, 'config.toml');
    const original = ['[providers.anthropic]', 'base_url = "https://api.anthropic.com"', ''].join('\n');
    writeFileSync(configPath, original, 'utf-8');

    const agent = makeAgent(workspace);
    agent.writeGlobalMcpProfile(targetDir, ['tavily']);

    // Simulate an external save mid-window: the user hand-edits config.toml
    // while Desktop's session is still running, directly overwriting the
    // published bytes.
    const userEdited = [
      '[providers.anthropic]',
      'base_url = "https://api.anthropic.com"',
      '',
      '# edited by hand',
      '',
    ].join('\n');
    writeFileSync(configPath, userEdited, 'utf-8');

    agent.restoreGlobalMcpProfile();

    // Hash-ownership (same machinery already proven in
    // projectConfigTransaction.test.ts): the on-disk bytes no longer match
    // what this agent published, so restore leaves the user's edited bytes
    // alone instead of reverting to the pre-write snapshot.
    expect(readFileSync(configPath, 'utf-8')).toBe(userEdited);
  });

  it('4. throws DesktopProfileSpliceError on an unparseable pre-existing global file and leaves it completely untouched', () => {
    const configPath = join(targetDir, 'config.toml');
    const garbage = 'this is = not [valid\nunterminated = "string\n';
    writeFileSync(configPath, garbage, 'utf-8');

    const agent = makeAgent(workspace);
    expect(() => agent.writeGlobalMcpProfile(targetDir, ['tavily'])).toThrow(DesktopProfileSpliceError);

    // Untouched: no partial write, no transaction marker/backup files left
    // behind - the deliberate "never discard the user's real config" posture.
    expect(readFileSync(configPath, 'utf-8')).toBe(garbage);
    expect(existsSync(`${configPath}.wayland-desktop.transaction.json`)).toBe(false);
    expect(existsSync(`${configPath}.wayland-desktop.backup`)).toBe(false);
  });

  it('5. PRF-08: the workspace write path never gains a profiles.__wayland_desktop_session key', () => {
    const agent = makeAgent(workspace);
    const workspaceConfigPath = join(workspace, '.wayland-core.toml');

    // The narrowed startWithProjectConfigLease now passes writeProjectConfig
    // ONLY genuinely project-scoped content - never the profile fragment.
    agent.writeProjectConfig('[providers.openai.compat]\nmax_tokens_field = "max_completion_tokens"\n');

    const written = readFileSync(workspaceConfigPath, 'utf-8');
    const parsed = parse(written) as { profiles?: Record<string, unknown> };
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]).toBeUndefined();
  });
});
