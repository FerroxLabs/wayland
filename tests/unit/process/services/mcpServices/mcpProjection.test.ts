/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { selectMcpProjection } from '@process/services/mcpServices/mcpProjection';

describe('selectMcpProjection', () => {
  it('uses the native transport only when the agent advertises it', () => {
    expect(
      selectMcpProjection(
        { name: 'Tavily', transport: { type: 'streamable_http', url: 'https://mcp.example/mcp' } },
        { stdio: true, http: true, sse: false }
      )
    ).toEqual({ kind: 'direct', transport: 'streamable_http' });

    expect(
      selectMcpProjection(
        { name: 'Legacy SSE', transport: { type: 'sse', url: 'https://mcp.example/sse' } },
        { stdio: true, http: true, sse: false }
      )
    ).toMatchObject({ kind: 'unsupported' });
  });

  it('selects the Wayland relay only for a remote transport and a stdio-capable agent', () => {
    expect(
      selectMcpProjection(
        { name: 'Beeper', transport: { type: 'http', url: 'http://localhost:23373/v0/mcp' } },
        { stdio: true, http: false, sse: false },
        { relayAvailable: true }
      )
    ).toEqual({ kind: 'relay', from: 'http', to: 'stdio' });
  });

  it('fails with a stable connector-specific reason when neither path exists', () => {
    const result = selectMcpProjection(
      { name: 'n8n', transport: { type: 'http', url: 'https://automation.example/mcp' } },
      { stdio: true, http: false, sse: false }
    );
    expect(result.kind).toBe('unsupported');
    if (result.kind === 'unsupported') {
      expect(result.reason).toContain('n8n');
      expect(result.reason).toContain('Streamable HTTP');
      expect(result.reason).toContain('relay is not available');
    }
  });

  it('never routes a local stdio server through the remote relay', () => {
    expect(
      selectMcpProjection(
        { name: 'Firecrawl', transport: { type: 'stdio', command: 'firecrawl-mcp', args: [] } },
        { stdio: false, http: true, sse: true },
        { relayAvailable: true }
      )
    ).toMatchObject({ kind: 'unsupported' });
  });
});
