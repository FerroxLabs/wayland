import { describe, expect, it } from 'vitest';
import { classifyMcpHttpUrl } from '@/common/mcp/mcpUrlSafety';

describe('classifyMcpHttpUrl', () => {
  it('allows Beeper and other supported local/LAN MCP servers', () => {
    for (const url of [
      'http://localhost:23373/v0/mcp',
      'http://127.0.0.1:23373/v0/mcp',
      'http://192.168.1.20:3000/mcp',
      'http://10.0.0.5:3000/mcp',
    ]) {
      expect(classifyMcpHttpUrl(url)).toMatchObject({ safe: true });
    }
  });

  it('allows public http(s) MCP endpoints', () => {
    expect(classifyMcpHttpUrl('https://mcp.tavily.com/mcp')).toMatchObject({ safe: true });
    expect(classifyMcpHttpUrl('https://mcp.firecrawl.dev/example/v2/mcp')).toMatchObject({ safe: true });
  });

  it('blocks metadata and link-local SSRF targets for both renderer and main', () => {
    expect(classifyMcpHttpUrl('http://169.254.169.254/latest/meta-data')).toMatchObject({
      safe: false,
      reason: 'ipv4-link-local',
    });
    expect(classifyMcpHttpUrl('http://metadata.google.internal/computeMetadata/v1')).toMatchObject({
      safe: false,
      reason: 'metadata-hostname',
    });
    expect(classifyMcpHttpUrl('http://[fe80::1]/mcp')).toMatchObject({
      safe: false,
      reason: 'ipv6-link-local',
    });
  });

  it('rejects malformed and non-http URLs', () => {
    expect(classifyMcpHttpUrl('not a URL')).toMatchObject({ safe: false, reason: 'invalid-url' });
    expect(classifyMcpHttpUrl('file:///etc/passwd')).toMatchObject({ safe: false, reason: 'unsupported-scheme' });
  });
});
