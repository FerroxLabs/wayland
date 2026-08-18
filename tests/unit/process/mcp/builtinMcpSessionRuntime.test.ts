/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #1015 F1 — the LIVE-SESSION proof.
 *
 * The probe was fixed to spawn Wayland's own bundled MCP servers under a resolved
 * JS runtime; the serializers that build the real chat session were not. That is
 * strictly worse than the bug it replaced: `refreshServerStatuses` persists the
 * probe's tool list, `readMcpHealth` clears its `toolCount === 0` flag, the MCP
 * Library and concierge-diag both go green — and the chat still spawns a bare
 * `node` that does not exist on a stock macOS, with nothing left to report it.
 *
 * So every live-session serializer is driven here against the SAME builtin, in
 * BOTH resolution shapes, asserting command AND env. The env half is load-bearing:
 * the dev runtime is the app binary and is only a Node runtime while
 * ELECTRON_RUN_AS_NODE=1 rides along.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import type { ResolvedJsRuntime } from '@process/utils/jsRuntime';

const PACKAGED_BUN = '/Applications/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun';
const DEV_ELECTRON = '/repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';

const mocks = vi.hoisted(() => ({ resolveJsRuntime: vi.fn<() => ResolvedJsRuntime>() }));

vi.mock('@process/utils/jsRuntime', () => ({ resolveJsRuntime: mocks.resolveJsRuntime }));

const packaged = (): ResolvedJsRuntime => ({ command: PACKAGED_BUN, env: {}, kind: 'bundled-bun' });
const dev = (): ResolvedJsRuntime => ({
  command: DEV_ELECTRON,
  env: { ELECTRON_RUN_AS_NODE: '1' },
  kind: 'electron-node',
});

import { getMcpScriptPath } from '@process/utils/mcpScriptDir';
import { buildAcpSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';
import { McpConfig } from '@process/acp/session/McpConfig';
import { buildGeminiStdioMcpConfig } from '@process/task/GeminiAgentManager';
import { applyBuiltinMcpRuntime } from '@process/services/mcpServices/builtinMcpRuntime';
import { buildClaudeStdioJsonConfig } from '@process/services/mcpServices/agents/ClaudeMcpAgent';
import { buildCodexMcpServerTable } from '@process/task/codexConfig';

/** The exact absolute path `initStorage.ensureBuiltinMcpServers` seeds. */
const SCRIPT = getMcpScriptPath('builtin-mcp-search-skills.js');

const builtinServer = (): IMcpServer => ({
  id: 'builtin-search-skills',
  name: 'wayland-search-skills',
  enabled: true,
  builtin: true,
  status: 'connected',
  transport: { type: 'stdio', command: 'node', args: [SCRIPT], env: {} },
  createdAt: 1,
  updatedAt: 1,
  originalJson: '{}',
});

const publication = {
  generation: 1,
  conversationId: 'conv-1',
  backend: 'claude' as const,
  sessionKey: 'session-1',
};

describe.each([
  ['packaged (bundled Bun)', packaged, PACKAGED_BUN, [] as Array<{ name: string; value: string }>],
  ['dev (Electron as Node)', dev, DEV_ELECTRON, [{ name: 'ELECTRON_RUN_AS_NODE', value: '1' }]],
])('live-session serializers — %s', (_label, runtime, expectedCommand, expectedEnvPairs) => {
  beforeEach(() => {
    mocks.resolveJsRuntime.mockReset();
    mocks.resolveJsRuntime.mockImplementation(runtime);
  });

  it('buildAcpSessionMcpServers (ACP session/new: Claude, Codex, Wayland Core)', () => {
    const [emitted] = buildAcpSessionMcpServers([builtinServer()], { stdio: true, http: false, sse: false });
    expect(emitted).toEqual({
      type: 'stdio',
      name: 'wayland-search-skills',
      command: expectedCommand,
      args: [SCRIPT],
      env: expectedEnvPairs,
    });
    expect(emitted).not.toMatchObject({ command: 'node' });
  });

  it('McpConfig.fromStorageConfig (live Claude/Codex ACP projection)', () => {
    const [emitted] = McpConfig.fromStorageConfig([builtinServer()], { publication });
    expect(emitted).toEqual({
      name: 'wayland-search-skills',
      command: expectedCommand,
      args: [SCRIPT],
      env: expectedEnvPairs,
    });
  });

  it('buildGeminiStdioMcpConfig (in-process aioncli-core fork runtime)', () => {
    const emitted = buildGeminiStdioMcpConfig(
      builtinServer().transport as Extract<IMcpServer['transport'], { type: 'stdio' }>
    );
    expect(emitted.command).toBe(expectedCommand);
    expect(emitted.args).toEqual([SCRIPT]);
    expect(emitted.env).toEqual(Object.fromEntries(expectedEnvPairs.map((e) => [e.name, e.value])));
  });

  it('agent-CLI publication chokepoint feeds the resolved tuple to ClaudeMcpAgent', () => {
    // McpService.syncMcpToAgents applies applyBuiltinMcpRuntime before any agent
    // serializes, so all eight publication targets inherit the correct runtime.
    const published = JSON.parse(buildClaudeStdioJsonConfig(applyBuiltinMcpRuntime(builtinServer())));
    expect(published).toEqual({
      command: expectedCommand,
      args: [SCRIPT],
      env: Object.fromEntries(expectedEnvPairs.map((e) => [e.name, e.value])),
    });
  });

  it('Codex session config.toml table carries the resolved tuple', () => {
    // AcpAgentManager.loadCodexSessionMcpServers applies the same rewrite before
    // buildCodexMcpServerTable writes the session's [mcp_servers] table.
    const table = buildCodexMcpServerTable([applyBuiltinMcpRuntime(builtinServer())]);
    const entry = table['wayland-search-skills'];
    expect(entry.command).toBe(expectedCommand);
    expect(entry.args).toEqual([SCRIPT]);
    if (expectedEnvPairs.length > 0) {
      expect(entry.env).toEqual({ ELECTRON_RUN_AS_NODE: '1' });
    }
  });
});

describe('a user-owned server sharing our basename is never re-pointed (#1015 F2)', () => {
  beforeEach(() => {
    mocks.resolveJsRuntime.mockReset();
    mocks.resolveJsRuntime.mockImplementation(packaged);
  });

  const hijackCandidate = (): IMcpServer => ({
    ...builtinServer(),
    id: 'user-owned',
    name: 'my-skills',
    builtin: false,
    transport: { type: 'stdio', command: 'node', args: ['/Users/me/tools/builtin-mcp-search-skills.js'], env: {} },
  });

  it('reaches the session spawning exactly what the user configured', () => {
    const [emitted] = buildAcpSessionMcpServers([hijackCandidate()], { stdio: true, http: false, sse: false });
    expect(emitted).toEqual({
      type: 'stdio',
      name: 'my-skills',
      command: 'node',
      args: ['/Users/me/tools/builtin-mcp-search-skills.js'],
      env: [],
    });
    expect(mocks.resolveJsRuntime).not.toHaveBeenCalled();
  });
});
