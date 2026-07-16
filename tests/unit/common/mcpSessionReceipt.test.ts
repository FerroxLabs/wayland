/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  createMcpSessionState,
  recordDesktopMcpSessionFailure,
  reduceMcpSessionTerminal,
} from '@/common/mcp/sessionReceipt';

describe('MCP session receipt reducer', () => {
  it('records exact named tools without releasing another server', () => {
    const initial = createMcpSessionState('launch-1', ['tavily', 'firecrawl'], 10);
    const next = reduceMcpSessionTerminal(
      initial,
      { type: 'mcp_ready', data: { name: 'tavily', tools: ['tavily_search', 'tavily_extract'] } },
      20
    );

    expect(next.receipts.tavily).toMatchObject({ status: 'ready', tools: ['tavily_search', 'tavily_extract'] });
    expect(next.receipts.firecrawl).toBeUndefined();
  });

  it('records a named runtime failure and preserves prior receipts', () => {
    const ready = reduceMcpSessionTerminal(createMcpSessionState('launch-1', ['tavily', 'firecrawl']), {
      type: 'mcp_ready',
      data: { name: 'tavily', tools: ['search'] },
    });
    const failed = reduceMcpSessionTerminal(ready, {
      type: 'mcp_failed',
      data: { name: 'firecrawl', reason: 'credential rejected' },
    });

    expect(failed.receipts.tavily.status).toBe('ready');
    expect(failed.receipts.firecrawl).toMatchObject({ status: 'failed', reason: 'credential rejected' });
  });

  it('ignores a terminal receipt for a connector outside this launch allowlist', () => {
    const initial = createMcpSessionState('launch-1', ['tavily']);
    const next = reduceMcpSessionTerminal(
      initial,
      { type: 'mcp_ready', data: { name: 'firecrawl', tools: ['firecrawl_scrape'] } },
      20
    );

    expect(next).toBe(initial);
    expect(next.receipts.firecrawl).toBeUndefined();
  });

  it('fails closed when Desktop cannot publish trusted startup config', () => {
    const failed = recordDesktopMcpSessionFailure(
      createMcpSessionState('launch-1', ['beeper']),
      'beeper',
      'config is read-only',
      30
    );
    expect(failed.receipts.beeper).toEqual({
      status: 'failed',
      serverName: 'beeper',
      reason: 'config is read-only',
      observedAt: 30,
      source: 'desktop',
    });
  });
});
