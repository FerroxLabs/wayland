/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import { mcpRuntimeFingerprint, mcpSessionFingerprint } from '@/common/mcp';

function server(overrides: Partial<IMcpServer> = {}): IMcpServer {
  return {
    id: 'n8n',
    name: 'n8n',
    enabled: true,
    source: 'custom',
    transport: {
      type: 'http',
      url: 'http://localhost:5678/mcp-server/http',
      headers: { Authorization: 'Bearer secret-one' },
    },
    tools: [{ name: 'old-probe-tool' }],
    status: 'connected',
    lastConnected: 1,
    createdAt: 1,
    updatedAt: 1,
    originalJson: '{}',
    ...overrides,
  };
}

describe('mcpRuntimeFingerprint', () => {
  it('ignores probe churn that does not change session authority', () => {
    const before = server();
    const after = server({
      status: undefined,
      tools: [{ name: 'new-probe-tool' }],
      lastConnected: 999,
      updatedAt: 999,
      lastError: 'temporary failure',
    });
    expect(mcpRuntimeFingerprint([after])).toBe(mcpRuntimeFingerprint([before]));
  });

  it('changes when health crosses the session-eligibility boundary', () => {
    const baseline = mcpRuntimeFingerprint([server()]);
    expect(mcpRuntimeFingerprint([server({ status: 'error' })])).not.toBe(baseline);
    expect(mcpRuntimeFingerprint([server({ status: 'disconnected' })])).not.toBe(baseline);
    expect(mcpRuntimeFingerprint([server({ enabled: false, status: 'error' })])).toBe(
      mcpRuntimeFingerprint([server({ enabled: false, status: 'disconnected' })])
    );
  });

  it('changes for enablement, credential, tool-scope, and transport changes', () => {
    const baseline = mcpRuntimeFingerprint([server()]);
    expect(mcpRuntimeFingerprint([server({ enabled: false })])).not.toBe(baseline);
    expect(
      mcpRuntimeFingerprint([
        server({
          transport: {
            type: 'http',
            url: 'http://localhost:5678/mcp-server/http',
            headers: { Authorization: 'Bearer secret-two' },
          },
        }),
      ])
    ).not.toBe(baseline);
    expect(mcpRuntimeFingerprint([server({ allowedTools: ['search'] })])).not.toBe(baseline);
    expect(mcpRuntimeFingerprint([server({ transport: { type: 'stdio', command: 'n8n-mcp' } })])).not.toBe(baseline);
  });

  it('never exposes raw credential material', () => {
    expect(mcpRuntimeFingerprint([server()])).not.toContain('secret-one');
  });

  it('includes per-chat connector scope without persisting raw connector ids', () => {
    const runtime = mcpRuntimeFingerprint([server()]);
    const all = mcpSessionFingerprint(runtime, undefined);
    const selected = mcpSessionFingerprint(runtime, ['n8n', 'beeper']);
    expect(selected).not.toBe(all);
    expect(mcpSessionFingerprint(runtime, ['beeper', 'n8n'])).toBe(selected);
    expect(selected).not.toContain('beeper');
    expect(mcpSessionFingerprint(runtime, [])).not.toBe(all);
  });
});
