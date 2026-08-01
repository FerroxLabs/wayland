// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { deriveMcpServerName } from '@renderer/pages/settings/components/UrlAddModal';

describe('URL-added MCP connector identity', () => {
  it('distinguishes Beeper, n8n, and arbitrary local MCP servers', () => {
    expect(deriveMcpServerName('http://localhost:23373/v0/mcp')).toBe('Beeper');
    expect(deriveMcpServerName('http://127.0.0.1:5678/mcp-server/http')).toBe('n8n');
    expect(deriveMcpServerName('http://localhost:8080/mcp')).toBe('Local MCP 8080');
  });

  it('keeps a friendly hosted-server default', () => {
    expect(deriveMcpServerName('https://mcp.tavily.com/mcp/')).toBe('Tavily');
  });
});
