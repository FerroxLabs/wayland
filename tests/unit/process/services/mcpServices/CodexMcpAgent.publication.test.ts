/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const { safeExecFile } = vi.hoisted(() => ({ safeExecFile: vi.fn() }));

vi.mock('@process/utils/safeExec', () => ({
  safeExecFile,
  execErrorDetail: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));

vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: () => ({}),
}));

import {
  CodexMcpAgent,
  codexGlobalPublicationUnsupportedReason,
} from '@process/services/mcpServices/agents/CodexMcpAgent';

function server(name: string, transport: IMcpServer['transport']): IMcpServer {
  return {
    id: name,
    name,
    enabled: true,
    transport,
    tools: [],
    createdAt: 1,
    updatedAt: 1,
    originalJson: '{}',
  };
}

describe('Codex MCP publication truth', () => {
  beforeEach(() => {
    safeExecFile.mockReset();
    safeExecFile.mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('rejects custom HTTP headers from the global CLI path instead of dropping credentials', async () => {
    const readwise = server('Readwise', {
      type: 'http',
      url: 'https://mcp.example.test',
      headers: { 'X-Access-Token': 'secret' },
    });

    expect(codexGlobalPublicationUnsupportedReason(readwise)).toContain('X-Access-Token');
    await expect(new CodexMcpAgent().installMcpServers([readwise])).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('cannot represent HTTP header(s): X-Access-Token'),
    });
    expect(safeExecFile).not.toHaveBeenCalled();
  });

  it('accepts bearer auth because codex mcp add has a bearer env-var form', async () => {
    const hosted = server('Hosted', {
      type: 'streamable_http',
      url: 'https://mcp.example.test',
      headers: { Authorization: 'Bearer secret' },
    });

    await expect(new CodexMcpAgent().installMcpServers([hosted])).resolves.toEqual({ success: true });
    expect(safeExecFile).toHaveBeenCalledOnce();
    expect(safeExecFile.mock.calls[0]?.[1]).toContain('--bearer-token-env-var');
  });

  it('returns failure when codex mcp add exits unsuccessfully', async () => {
    safeExecFile.mockRejectedValueOnce(new Error('codex add failed'));
    const stdio = server('Local', { type: 'stdio', command: 'node', args: ['server.js'] });

    await expect(new CodexMcpAgent().installMcpServers([stdio])).resolves.toEqual({
      success: false,
      error: 'Local: codex add failed',
    });
  });

  it('returns failure for unsupported transports instead of reporting a skipped install as success', async () => {
    const legacy = server('Legacy SSE', { type: 'sse', url: 'https://mcp.example.test/sse' });

    await expect(new CodexMcpAgent().installMcpServers([legacy])).resolves.toEqual({
      success: false,
      error: 'Legacy SSE: Codex CLI does not support sse transport type',
    });
    expect(safeExecFile).not.toHaveBeenCalled();
  });
});
