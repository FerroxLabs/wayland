import { describe, expect, it } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import {
  createMcpSessionDigestKey,
  createMcpSessionExpectedServer,
  isMcpSessionTruthPreviewEnabled,
  mcpServerDefinitionDigest,
  MCP_SESSION_TRUTH_PREVIEW_ENV,
} from '@process/services/mcpServices/mcpSessionTruthGate';

const definitionServer = (apiKey: string): IMcpServer => ({
  id: 'tavily-id',
  name: 'Tavily MCP',
  enabled: true,
  source: 'custom',
  status: 'connected',
  transport: {
    type: 'stdio',
    command: '/Applications/Wayland.app/Contents/Resources/bun',
    args: ['x', '--bun', 'tavily-mcp'],
    env: { TAVILY_API_KEY: apiKey },
  },
  allowedTools: ['tavily_search'],
  createdAt: 1,
  updatedAt: 1,
  originalJson: '{}',
});

describe('MCP session-truth preview gate', () => {
  it('is disabled by default', () => {
    expect(isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'development' }, false)).toBe(false);
  });

  it('can be enabled only in an unpackaged test harness', () => {
    expect(isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'test', [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1' }, false)).toBe(
      true
    );
  });

  it('cannot be enabled in development, production, or a packaged test-shaped process', () => {
    expect(
      isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'development', [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1' }, false)
    ).toBe(false);
    expect(
      isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'production', [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1' }, false)
    ).toBe(false);
    expect(isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'test', [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1' }, true)).toBe(
      false
    );
  });
});

describe('MCP session definition identity', () => {
  it('binds credential rotation without exposing secret material', () => {
    const key = new Uint8Array(32).fill(7);
    const first = mcpServerDefinitionDigest(definitionServer('secret-one'), key);
    const second = mcpServerDefinitionDigest(definitionServer('secret-two'), key);
    expect(first).toMatch(/^hmac-sha256:[a-f0-9]{64}$/);
    expect(first).not.toBe(second);
    expect(first).not.toContain('secret-one');
  });

  it('cannot be used as a stable offline verifier across manager launches', () => {
    const definition = definitionServer('guessable-secret');
    const firstKey = createMcpSessionDigestKey();
    const secondKey = createMcpSessionDigestKey();
    const first = mcpServerDefinitionDigest(definition, firstKey);
    const second = mcpServerDefinitionDigest(definition, secondKey);

    expect(firstKey).toHaveLength(32);
    expect(secondKey).toHaveLength(32);
    expect(first).not.toBe(second);
    expect(JSON.stringify({ first, second })).not.toContain('guessable-secret');
  });

  it('creates an exact backend, transport, canonical-name, and definition binding', () => {
    expect(
      createMcpSessionExpectedServer(definitionServer('secret'), 'wcore', new Uint8Array(32).fill(7))
    ).toMatchObject({
      serverId: 'tavily-id',
      serverName: 'Tavily MCP',
      runtimeName: 'Tavily MCP',
      canonicalName: 'tavily-mcp',
      backend: 'wcore',
      transport: 'stdio',
      scope: 'conversation',
    });
  });
});
