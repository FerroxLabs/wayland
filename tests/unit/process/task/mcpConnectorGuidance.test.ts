import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: (...args: unknown[]) => mockGet(...args) },
}));

import { buildMcpConnectorGuidance, resolveMcpConnectorGuidance } from '@process/task/mcpConnectorGuidance';

const server = (over: Record<string, unknown>) => ({
  id: 'x',
  name: 'srv',
  enabled: false,
  transport: { type: 'stdio', command: 'uvx', args: [] },
  createdAt: 0,
  updatedAt: 0,
  originalJson: '{}',
  ...over,
});

describe('buildMcpConnectorGuidance', () => {
  it('emits a section with guidance from enabled connectors that carry agentGuidance', () => {
    const out = buildMcpConnectorGuidance([
      server({ enabled: true, agentGuidance: 'Call start_google_auth with service_name.' }),
    ]);
    expect(out).toContain('Connected MCP connectors');
    expect(out).toContain('Call start_google_auth with service_name.');
  });

  it('returns empty string when no enabled connector has guidance', () => {
    expect(buildMcpConnectorGuidance([])).toBe('');
    // disabled connector with guidance -> ignored
    expect(buildMcpConnectorGuidance([server({ enabled: false, agentGuidance: 'note' })])).toBe('');
    // enabled connector without guidance -> ignored
    expect(buildMcpConnectorGuidance([server({ enabled: true })])).toBe('');
    // enabled connector with blank guidance -> ignored
    expect(buildMcpConnectorGuidance([server({ enabled: true, agentGuidance: '   ' })])).toBe('');
  });

  it('joins guidance from multiple enabled connectors', () => {
    const out = buildMcpConnectorGuidance([
      server({ enabled: true, agentGuidance: 'AAA' }),
      server({ enabled: true, agentGuidance: 'BBB' }),
      server({ enabled: false, agentGuidance: 'CCC' }),
    ]);
    expect(out).toContain('AAA');
    expect(out).toContain('BBB');
    expect(out).not.toContain('CCC');
  });
});

describe('resolveMcpConnectorGuidance', () => {
  beforeEach(() => mockGet.mockReset());

  it('reads mcp.config and returns the guidance section', async () => {
    mockGet.mockResolvedValue([server({ enabled: true, agentGuidance: 'guide me' })]);
    const out = await resolveMcpConnectorGuidance();
    expect(mockGet).toHaveBeenCalledWith('mcp.config');
    expect(out).toContain('guide me');
  });

  it('returns empty string when config is missing', async () => {
    mockGet.mockResolvedValue(undefined);
    expect(await resolveMcpConnectorGuidance()).toBe('');
  });

  it('never throws — returns empty string when config is malformed', async () => {
    // A non-array config makes buildMcpConnectorGuidance throw inside resolve's
    // try; the catch must swallow it so system-prompt assembly is never broken.
    mockGet.mockResolvedValue(42 as unknown);
    expect(await resolveMcpConnectorGuidance()).toBe('');
  });
});
