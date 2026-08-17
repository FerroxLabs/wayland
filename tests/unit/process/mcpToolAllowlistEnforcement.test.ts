/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #998 — the MCP Library's per-tool switches must not lie.
 *
 * `IMcpServer.allowedTools` only restricts an agent when the LAUNCH
 * configuration handed to that agent carries the list. Before this suite,
 * exactly one backend did that (Codex, via `enabled_tools`) while the UI
 * presented the switch as universal, so a user who switched a destructive tool
 * off on Wayland Core kept a fully callable tool.
 *
 * These tests pin BOTH halves of the honest contract:
 *
 *  1. Every backend named in `TOOL_ALLOWLIST_ENFORCING_BACKENDS` really does
 *     emit the allowlist, so nothing can be added to that list (and therefore
 *     to the MCP Library's "enforced on …" banner) without the plumbing.
 *  2. The backends that provably cannot carry a tool list — Wayland Core's
 *     launch profile and the ACP `session/new` array, neither of which has a
 *     per-tool field — are NOT claimed as enforcing. That claim is what the UI
 *     renders, so this is the regression guard on the honesty of the control.
 */

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TOOL_ARRAY_CAP,
  PROVIDER_TOOL_LIMITS,
  TOOL_ALLOWLIST_ENFORCING_BACKENDS,
  backendEnforcesToolAllowlist,
  resolveModelToolCap,
} from '@/common/mcp';
import type { IMcpServer } from '@/common/config/storage';
import {
  buildAcpSessionMcpServers,
  buildWCoreSessionMcpServers,
  buildWCoreUserStdioMcpServers,
} from '@process/agent/acp/mcpSessionConfig';
import { appendDesktopMcpProfile } from '@process/agent/wcore/envBuilder';
import { buildCodexMcpServerTable } from '@process/task/codexConfig';
import { buildGeminiStdioMcpConfig } from '@process/task/GeminiAgentManager';

const KEPT = 'search_files';
const DISABLED = 'delete_everything';

const stdioTransport = {
  type: 'stdio',
  command: 'uvx',
  args: ['google-workspace-mcp'],
} as Extract<IMcpServer['transport'], { type: 'stdio' }>;

/** One connector with a strict allowlist: the destructive tool is switched OFF. */
const scopedServer = (over: Partial<IMcpServer> = {}): IMcpServer =>
  ({
    id: 'srv-1',
    name: 'workspace',
    enabled: true,
    status: 'connected',
    source: 'library',
    transport: stdioTransport,
    allowedTools: [KEPT],
    tools: [{ name: KEPT }, { name: DISABLED }],
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }) as IMcpServer;

const ACP_CAPS = { stdio: true, http: true, sse: true } as const;

describe('#998 backends that DO enforce the per-tool switch', () => {
  it('codex writes the allowlist as enabled_tools and omits the disabled tool', () => {
    const table = buildCodexMcpServerTable([scopedServer()]);

    expect(table.workspace.enabled_tools).toEqual([KEPT]);
    expect(table.workspace.enabled_tools).not.toContain(DISABLED);
  });

  it('codex omits enabled_tools entirely when no allowlist is set (undefined => all)', () => {
    const table = buildCodexMcpServerTable([scopedServer({ allowedTools: undefined })]);

    expect(table.workspace).not.toHaveProperty('enabled_tools');
  });

  it('gemini carries the allowlist as includeTools so the runtime drops the disabled tool', () => {
    const config = buildGeminiStdioMcpConfig(stdioTransport, 'Google Workspace', [KEPT]);

    expect(config.includeTools).toEqual([KEPT]);
    expect(config.includeTools).not.toContain(DISABLED);
  });

  it('gemini omits includeTools when no allowlist is set, and emits [] for "none"', () => {
    expect(buildGeminiStdioMcpConfig(stdioTransport, undefined, undefined)).not.toHaveProperty('includeTools');
    // An empty list must survive as an empty list: aioncli-core treats an absent
    // includeTools as "every tool", so collapsing [] to undefined would re-enable
    // every tool the user switched off.
    expect(buildGeminiStdioMcpConfig(stdioTransport, undefined, []).includeTools).toEqual([]);
  });
});

describe('#998 backends that CANNOT enforce it must not claim to', () => {
  it('the wcore launch profile is server-level only - no tool names reach it', () => {
    const profile = appendDesktopMcpProfile(null, ['workspace']);

    expect(profile).toContain('mcp_servers = ["workspace"]');
    expect(profile).not.toContain(KEPT);
    expect(profile).not.toContain(DISABLED);
  });

  it('the wcore stdio injection carries no tool list', () => {
    const [injected] = buildWCoreUserStdioMcpServers([scopedServer()]);

    expect(injected.name).toBe('workspace');
    expect(Object.keys(injected)).toEqual(
      expect.not.arrayContaining(['allowedTools', 'enabled_tools', 'includeTools'])
    );
  });

  it('the ACP session/new array carries no tool list', () => {
    const [injected] = buildAcpSessionMcpServers([scopedServer()], ACP_CAPS);

    expect(injected.name).toBe('workspace');
    expect(Object.keys(injected)).toEqual(
      expect.not.arrayContaining(['allowedTools', 'enabled_tools', 'includeTools'])
    );
  });

  it('wcore and the ACP backends are absent from the enforcing set', () => {
    for (const backend of ['wcore', 'claude', 'qwen', 'wnano', 'grok', 'kimi', 'opencode', 'copilot']) {
      expect(backendEnforcesToolAllowlist(backend)).toBe(false);
    }
    expect(backendEnforcesToolAllowlist(undefined)).toBe(false);
  });

  it('the enforcing set is exactly the backends whose launch config carries the list', () => {
    // Guards the UI banner: adding a backend here without the plumbing below
    // restores the lying control this issue is about.
    expect([...TOOL_ALLOWLIST_ENFORCING_BACKENDS].toSorted()).toEqual(['codex', 'gemini']);
    for (const backend of TOOL_ALLOWLIST_ENFORCING_BACKENDS) {
      expect(backendEnforcesToolAllowlist(backend)).toBe(true);
    }
  });

  it('buildWCoreSessionMcpServers preserves allowedTools as data but the profile never emits it', () => {
    // The selected-server list keeps the field (it is the same IMcpServer
    // record); enforcement is decided by what the PROFILE carries, which is
    // asserted above. This documents that the field's presence here is not
    // evidence of enforcement.
    const [selected] = buildWCoreSessionMcpServers([scopedServer()]);
    expect(selected.allowedTools).toEqual([KEPT]);
    expect(appendDesktopMcpProfile(null, [selected.name])).not.toContain(KEPT);
  });
});

describe('#998 the tool-count nudge is backend-aware, not OpenAI-only', () => {
  it('still reports the documented OpenAI cap', () => {
    expect(resolveModelToolCap('openai', 'gpt-5')).toBe(PROVIDER_TOOL_LIMITS['gpt-5']);
    expect(resolveModelToolCap('openai', 'some-unlisted-openai-model')).toBe(PROVIDER_TOOL_LIMITS.openai);
  });

  it('warns Anthropic and Flux users instead of returning no cap at all', () => {
    expect(resolveModelToolCap('anthropic', 'claude-sonnet-4-5')).toBe(DEFAULT_TOOL_ARRAY_CAP);
    expect(resolveModelToolCap('flux', 'flux-auto')).toBe(DEFAULT_TOOL_ARRAY_CAP);
    expect(resolveModelToolCap(undefined, undefined)).toBe(DEFAULT_TOOL_ARRAY_CAP);
  });
});
