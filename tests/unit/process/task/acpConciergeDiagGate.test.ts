/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Concierge diagnostics MCP gate (ACP path). The read-only concierge-diag
 * server is seeded as a builtin in mcp.config, so it bypasses per-conversation
 * scoping and would otherwise be injected into EVERY ACP assistant session.
 * `buildAcpSessionMcpServers` must gate it to the Concierge assistant via the
 * `allowConciergeDiag` flag (AcpAgentManager sets this from presetAssistantId /
 * customAgentId). This mirrors the Gemini path in GeminiAgentManager.getMcpServers.
 */

import { describe, it, expect } from 'vitest';
import { buildAcpSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';
import { BUILTIN_CONCIERGE_DIAG_ID, BUILTIN_CONCIERGE_DIAG_NAME } from '@process/resources/builtinMcp/constants';
import type { IMcpServer } from '@/common/config/storage';

const caps = { stdio: true, http: true, sse: true };

const server = (over: Partial<IMcpServer>): IMcpServer =>
  ({
    id: 'srv',
    name: 'srv',
    enabled: true,
    status: 'connected',
    transport: { type: 'stdio', command: 'node', args: [] },
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }) as IMcpServer;

// Matches the seed shape in initStorage.ensureBuiltinMcpServers.
const diag = server({
  id: BUILTIN_CONCIERGE_DIAG_ID,
  name: BUILTIN_CONCIERGE_DIAG_NAME,
  builtin: true,
  status: undefined,
  transport: { type: 'stdio', command: 'node', args: ['/abs/builtin-mcp-concierge-diag.js'], env: {} },
});
const otherBuiltin = server({
  id: 'builtin-image-gen',
  name: 'wayland-image-generation',
  builtin: true,
  status: undefined,
});
const userA = server({ id: 'a', name: 'alpha' });

describe('buildAcpSessionMcpServers — concierge-diag gate', () => {
  it('drops the concierge-diag server for a non-Concierge assistant (allowConciergeDiag=false)', () => {
    const out = buildAcpSessionMcpServers([diag, otherBuiltin, userA], caps, undefined, false);
    expect(out.map((s) => s.name).toSorted()).toEqual(['alpha', 'wayland-image-generation']);
    expect(out.some((s) => s.name === BUILTIN_CONCIERGE_DIAG_NAME)).toBe(false);
  });

  it('injects the concierge-diag server for the Concierge assistant (allowConciergeDiag=true)', () => {
    const out = buildAcpSessionMcpServers([diag, otherBuiltin, userA], caps, undefined, true);
    expect(out.map((s) => s.name).toSorted()).toEqual([
      'alpha',
      BUILTIN_CONCIERGE_DIAG_NAME,
      'wayland-image-generation',
    ]);
  });

  it('fails closed: omitting allowConciergeDiag drops the diag server', () => {
    const out = buildAcpSessionMcpServers([diag, otherBuiltin], caps);
    expect(out.some((s) => s.name === BUILTIN_CONCIERGE_DIAG_NAME)).toBe(false);
    expect(out.some((s) => s.name === 'wayland-image-generation')).toBe(true);
  });

  it('leaves non-diag servers untouched regardless of the flag', () => {
    const denied = buildAcpSessionMcpServers([otherBuiltin, userA], caps, undefined, false);
    const allowed = buildAcpSessionMcpServers([otherBuiltin, userA], caps, undefined, true);
    expect(denied.map((s) => s.name).toSorted()).toEqual(['alpha', 'wayland-image-generation']);
    expect(allowed.map((s) => s.name).toSorted()).toEqual(['alpha', 'wayland-image-generation']);
  });
});
