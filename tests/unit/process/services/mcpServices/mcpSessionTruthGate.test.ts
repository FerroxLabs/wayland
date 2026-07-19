import { describe, expect, it } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import {
  bindMcpPrepublicationProbeTruth,
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

describe('MCP pre-publication probe truth', () => {
  it('binds successful reachability and authentication without claiming publication', () => {
    const result = bindMcpPrepublicationProbeTruth(
      definitionServer('secret'),
      { success: true, tools: [{ name: 'tavily_search' }] },
      42
    );

    expect(result).toEqual({
      success: true,
      tools: [{ name: 'tavily_search' }],
      prepublication: {
        version: 'wayland-mcp-prepublication/1',
        serverId: 'tavily-id',
        serverName: 'Tavily MCP',
        serverUpdatedAt: 1,
        observedAt: 42,
        state: 'probed',
        authentication: 'validated',
        probe: 'succeeded',
        toolCount: 1,
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/published|registered|chat-ready|toolsearch/i);
  });

  it('keeps authentication-required distinct from probe failure', () => {
    expect(
      bindMcpPrepublicationProbeTruth(
        definitionServer('secret'),
        { success: false, needsAuth: true, authMethod: 'oauth', error: '401' },
        43
      ).prepublication
    ).toMatchObject({
      state: 'authentication-required',
      authentication: 'required',
      probe: 'not-completed',
      authMethod: 'oauth',
    });
    expect(
      bindMcpPrepublicationProbeTruth(definitionServer('secret'), { success: false, error: 'spawn failed' }, 44)
        .prepublication
    ).toMatchObject({ state: 'probe-failed', authentication: 'unavailable', probe: 'failed' });
  });

  it.each([
    [{ success: true }, 'tools array'],
    [{ success: true, tools: [], needsAuth: true }, 'contradicts'],
    [{ success: true, tools: [], authMethod: 'oauth' }, 'contradicts'],
    [{ success: false }, 'non-empty error'],
    [{ success: false, error: 'failed', tools: [] }, 'cannot report tools'],
    [{ success: true, tools: [], published: true }, 'unknown field'],
    [{ success: true, tools: [{ name: 'same' }, { name: 'same' }] }, 'duplicate tool'],
    [{ success: true, tools: [{ name: 'tool', chatReady: true }] }, 'unknown field'],
    [{ success: true, tools: [], needsAuth: 'yes' }, 'needsAuth must be boolean'],
    [{ success: false, needsAuth: true, error: 401 }, 'error must be a string'],
    [{ success: false, needsAuth: true, wwwAuthenticate: {} }, 'wwwAuthenticate must be a string'],
    [{ success: false, error: 'failed', authMethod: 'oauth' }, 'requires needsAuth=true'],
    [
      Object.assign(Object.create({ inherited: true }) as Record<string, unknown>, { success: true, tools: [] }),
      'plain object',
    ],
  ])('rejects malformed or authority-widening adapter evidence %#', (raw, expected) => {
    expect(() => bindMcpPrepublicationProbeTruth(definitionServer('secret'), raw as never, 45)).toThrow(expected);
  });
});
