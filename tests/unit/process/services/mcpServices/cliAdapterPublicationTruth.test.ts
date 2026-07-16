/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const execMocks = vi.hoisted(() => ({ safeExec: vi.fn(), safeExecFile: vi.fn() }));

vi.mock('@process/utils/safeExec', () => ({
  ...execMocks,
  execErrorDetail: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));

vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({}) }));

import { ClaudeMcpAgent } from '@process/services/mcpServices/agents/ClaudeMcpAgent';
import { GeminiMcpAgent } from '@process/services/mcpServices/agents/GeminiMcpAgent';
import { QwenMcpAgent } from '@process/services/mcpServices/agents/QwenMcpAgent';
import { CodebuddyMcpAgent } from '@process/services/mcpServices/agents/CodebuddyMcpAgent';

function stdio(name: string): IMcpServer {
  return {
    id: name,
    name,
    enabled: true,
    transport: { type: 'stdio', command: 'node', args: ['server.js'] },
    tools: [],
    createdAt: 1,
    updatedAt: 1,
    originalJson: '{}',
  };
}

describe('CLI MCP adapter publication truth', () => {
  beforeEach(() => {
    execMocks.safeExec.mockReset();
    execMocks.safeExecFile.mockReset();
  });

  it.each([
    ['Claude', () => new ClaudeMcpAgent()],
    ['Gemini', () => new GeminiMcpAgent()],
    ['Qwen', () => new QwenMcpAgent()],
    ['CodeBuddy', () => new CodebuddyMcpAgent()],
  ])('%s reports a failed CLI add as publication failure', async (_name, createAgent) => {
    execMocks.safeExecFile.mockRejectedValueOnce(new Error('add failed'));

    await expect(createAgent().installMcpServers([stdio('Broken')])).resolves.toEqual({
      success: false,
      error: 'Broken: add failed',
    });
  });

  it('Gemini fails closed when its adapter would discard required HTTP headers', async () => {
    const server: IMcpServer = {
      ...stdio('n8n'),
      transport: {
        type: 'http',
        url: 'http://localhost:5678/mcp-server/http',
        headers: { Authorization: 'Bearer n8n-token' },
      },
    };

    await expect(new GeminiMcpAgent().installMcpServers([server])).resolves.toEqual({
      success: false,
      error: 'n8n: Gemini CLI publication cannot preserve HTTP headers in this adapter',
    });
    expect(execMocks.safeExecFile).not.toHaveBeenCalled();
  });

  it.each([
    ['Claude', () => new ClaudeMcpAgent()],
    ['Gemini', () => new GeminiMcpAgent()],
    ['Qwen', () => new QwenMcpAgent()],
    ['CodeBuddy', () => new CodebuddyMcpAgent()],
  ])('%s does not turn an adapter/config failure into successful removal', async (_name, createAgent) => {
    execMocks.safeExecFile.mockRejectedValueOnce(new Error('config locked'));
    execMocks.safeExecFile.mockRejectedValue(new Error('not found'));

    const result = await createAgent().removeMcpServer('customer-tools');
    expect(result.success).toBe(false);
    expect(result.error).toContain('config locked');
  });

  it.each([
    ['Claude', () => new ClaudeMcpAgent()],
    ['Gemini', () => new GeminiMcpAgent()],
    ['Qwen', () => new QwenMcpAgent()],
    ['CodeBuddy', () => new CodebuddyMcpAgent()],
  ])('%s treats explicit absence in every checked scope as idempotent removal', async (_name, createAgent) => {
    execMocks.safeExecFile.mockRejectedValue(new Error('not found'));
    await expect(createAgent().removeMcpServer('missing-tools')).resolves.toEqual({ success: true });
  });
});
