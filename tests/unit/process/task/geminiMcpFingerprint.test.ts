import { describe, expect, it } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import {
  computeGeminiMcpFingerprint,
  computePreviewGeminiMcpFingerprint,
  replaceGeminiMcpWorker,
} from '@process/task/GeminiAgentManager';
import { MCP_SESSION_TRUTH_PREVIEW_ENV } from '@process/services/mcpServices/mcpSessionTruthGate';

const server = (overrides: Partial<IMcpServer> = {}): IMcpServer => ({
  id: 'tavily',
  name: 'tavily',
  source: 'custom',
  enabled: true,
  status: 'connected',
  createdAt: 1,
  updatedAt: 1,
  transport: { type: 'stdio', command: 'npx', args: ['tavily-mcp'], env: { TAVILY_API_KEY: 'old' } },
  ...overrides,
});

describe('Gemini MCP worker replacement', () => {
  it('does not start the replacement until the old worker has fully stopped', async () => {
    let releaseStop!: () => void;
    const stopComplete = new Promise<void>((resolve) => {
      releaseStop = resolve;
    });
    const order: string[] = [];
    const replacement = replaceGeminiMcpWorker(
      async () => {
        order.push('stop-start');
        await stopComplete;
        order.push('stop-complete');
      },
      () => {
        order.push('replacement-initialize');
      },
      async () => {
        order.push('replacement-start');
      }
    );

    await Promise.resolve();
    expect(order).toEqual(['stop-start']);
    releaseStop();
    await replacement;
    expect(order).toEqual(['stop-start', 'stop-complete', 'replacement-initialize', 'replacement-start']);
  });
});

describe('computeGeminiMcpFingerprint', () => {
  it('changes when credentials change without exposing the credential', () => {
    const first = computeGeminiMcpFingerprint([server()]);
    const second = computeGeminiMcpFingerprint([
      server({ transport: { type: 'stdio', command: 'npx', args: ['tavily-mcp'], env: { TAVILY_API_KEY: 'new' } } }),
    ]);

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain('old');
    expect(second).not.toContain('new');
  });

  it('changes when the exact chat connector selection changes', () => {
    const config = [server()];
    expect(computeGeminiMcpFingerprint(config, undefined)).not.toBe(computeGeminiMcpFingerprint(config, []));
    expect(computeGeminiMcpFingerprint(config, [])).not.toBe(computeGeminiMcpFingerprint(config, ['tavily']));
  });

  it('does not calculate an applied-session fingerprint outside the explicit non-production preview', () => {
    expect(computePreviewGeminiMcpFingerprint([server()], undefined, { NODE_ENV: 'development' })).toBe('');
    expect(
      computePreviewGeminiMcpFingerprint([server()], undefined, {
        NODE_ENV: 'production',
        [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1',
      })
    ).toBe('');
    expect(
      computePreviewGeminiMcpFingerprint([server()], undefined, {
        NODE_ENV: 'test',
        [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1',
      })
    ).toMatch(/^[a-f0-9]{64}$/);
  });
});
