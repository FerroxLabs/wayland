import { describe, expect, it } from 'vitest';
import { parseArgs, parseConfigServers, redactUrl } from '../../scripts/debug-mcp';

const server = {
  id: 'tavily',
  name: 'Tavily',
  enabled: true,
  transport: {
    type: 'http',
    url: 'https://mcp.example.test/mcp?api_key=do-not-print&region=us',
    headers: { Authorization: 'Bearer do-not-print' },
  },
  createdAt: 1,
  updatedAt: 1,
  originalJson: '{}',
};

describe('debug-mcp support tool', () => {
  it('parses explicit config and probe target', () => {
    expect(parseArgs(['probe', 'tavily', '--config', './fixture.txt'])).toMatchObject({
      command: 'probe',
      serverName: 'tavily',
    });
  });

  it('parses a doctor target without conflating it with a standalone probe', () => {
    expect(parseArgs(['doctor', 'beeper', '--config', './fixture.txt'])).toMatchObject({
      command: 'doctor',
      serverName: 'beeper',
    });
  });

  it('reads Desktop encoded config without exposing a different schema', () => {
    const json = JSON.stringify({ 'mcp.config': [server] });
    const encoded = Buffer.from(encodeURIComponent(json), 'utf8').toString('base64');
    expect(parseConfigServers(encoded)).toEqual([server]);
  });

  it('redacts every URL query value and preserves only its presence', () => {
    const redacted = redactUrl(server.transport.url);
    expect(redacted).not.toContain('do-not-print');
    expect(redacted).toContain('api_key=%3Credacted%3E');
    expect(redacted).toContain('region=%3Cpresent%3E');
  });
});
