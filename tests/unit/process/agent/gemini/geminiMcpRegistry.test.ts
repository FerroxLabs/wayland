import { describe, expect, it } from 'vitest';
import { GeminiAgent } from '@process/agent/gemini';

describe('GeminiAgent MCP registry evidence', () => {
  it('reports only exact live MCP tools grouped by producer server', () => {
    const agent = Object.create(GeminiAgent.prototype) as GeminiAgent;
    (agent as unknown as Record<string, unknown>).config = {
      getToolRegistry: () => ({
        getAllTools: () => [
          { name: 'builtin-read' },
          { serverName: 'tavily', name: 'search' },
          { serverName: 'tavily', name: 'extract' },
          { serverName: 'tavily', name: 'search' },
          { serverName: 'firecrawl', name: 'scrape' },
          { serverName: '', name: 'ignored' },
          { serverName: 'n8n', name: '' },
        ],
      }),
    };

    expect(agent.getRegisteredMcpTools()).toEqual([
      { serverName: 'firecrawl', tools: ['scrape'] },
      { serverName: 'tavily', tools: ['extract', 'search'] },
    ]);
  });
});
