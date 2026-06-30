/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Regression test for the fork Gemini (@office-ai/aioncli-core) MCP injection
 * filter. Builtin servers (image generation, skill search) are seeded into
 * mcp.config with `status: undefined` and are never connection-tested. The fork
 * Gemini path previously required `status === 'connected'`, silently dropping
 * every builtin server while ACP backends (Claude, Codex, Wayland Core) injected
 * them - so `wayland_image_generation` reported "no image generation model is
 * configured" on Gemini even though the model was configured.
 */

import { describe, it, expect } from 'vitest';
import type { IMcpServer } from '../../src/common/config/storage';
import { shouldInjectSessionMcpServer } from '../../src/process/agent/acp/mcpSessionConfig';

function server(overrides: Partial<IMcpServer>): IMcpServer {
  return {
    id: 'srv',
    name: 'srv',
    enabled: true,
    transport: { type: 'stdio', command: 'node', args: [], env: {} },
    createdAt: 0,
    updatedAt: 0,
    originalJson: '{}',
    ...overrides,
  } as IMcpServer;
}

describe('shouldInjectSessionMcpServer', () => {
  it('injects an enabled builtin server with status undefined (the bug)', () => {
    expect(shouldInjectSessionMcpServer(server({ builtin: true, enabled: true, status: undefined }))).toBe(true);
  });

  it('injects an enabled builtin server with status connected', () => {
    expect(shouldInjectSessionMcpServer(server({ builtin: true, enabled: true, status: 'connected' }))).toBe(true);
  });

  it('does not inject a disabled builtin server', () => {
    expect(shouldInjectSessionMcpServer(server({ builtin: true, enabled: false, status: undefined }))).toBe(false);
  });

  it('does not inject a builtin server in an error status', () => {
    expect(shouldInjectSessionMcpServer(server({ builtin: true, enabled: true, status: 'error' }))).toBe(false);
  });

  it('injects an enabled user server that has not been probed (status undefined)', () => {
    // Uniform with the live ACP path (McpConfig.fromStorageConfig): an enabled
    // connector the user turned on but never connection-tested must still reach
    // the session. Requiring `connected` here made Gemini drop connectors that
    // Claude/Codex kept (cross-backend divergence).
    expect(shouldInjectSessionMcpServer(server({ builtin: undefined, enabled: true, status: undefined }))).toBe(true);
  });

  it('injects a connected user server', () => {
    expect(shouldInjectSessionMcpServer(server({ builtin: undefined, enabled: true, status: 'connected' }))).toBe(true);
  });

  it('does not inject a known-broken user server (disconnected/error)', () => {
    expect(shouldInjectSessionMcpServer(server({ builtin: undefined, enabled: true, status: 'disconnected' }))).toBe(
      false
    );
    expect(shouldInjectSessionMcpServer(server({ builtin: undefined, enabled: true, status: 'error' }))).toBe(false);
  });

  it('does not inject a disabled user server even when connected', () => {
    expect(shouldInjectSessionMcpServer(server({ builtin: undefined, enabled: false, status: 'connected' }))).toBe(
      false
    );
  });
});
