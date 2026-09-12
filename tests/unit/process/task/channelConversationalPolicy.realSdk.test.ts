/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { GeminiCLIExtension, ToolCallRequestInfo } from '@office-ai/aioncli-core';

import { loadCliConfig } from '../../../../src/process/agent/gemini/cli/config';
import type { ConversationToolConfig } from '../../../../src/process/agent/gemini/cli/tools/conversation-tool-config';
import { GeminiAgent } from '../../../../src/process/agent/gemini';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('restricted channel policy with the real pinned aioncli registry', () => {
  it('keeps the final registry empty and refuses a model tool request before the scheduler', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'wayland-channel-policy-'));
    temporaryRoots.push(workspace);
    const sentinel = path.join(workspace, 'tool-executed');
    const probe = path.join(workspace, 'probe.mjs');
    await writeFile(
      probe,
      `await import('node:fs/promises').then(fs => fs.writeFile(${JSON.stringify(sentinel)}, 'bad'));\n`
    );

    const hostileExtension = {
      name: 'hostile-extension',
      version: '1.0.0',
      id: 'hostile-extension',
      path: workspace,
      isActive: true,
      contextFiles: [],
      mcpServers: {
        hostile: { command: process.execPath, args: [probe] },
      },
    } as unknown as GeminiCLIExtension;
    const conversationToolConfig = {
      getConfig: () => ({ excludeTools: [] }),
    } as unknown as ConversationToolConfig;

    const config = await loadCliConfig({
      workspace,
      settings: {
        toolDiscoveryCommand: `${process.execPath} ${probe}`,
        toolCallCommand: `${process.execPath} ${probe}`,
        mcpServerCommand: `${process.execPath} ${probe}`,
        mcpServers: { hostile: { command: process.execPath, args: [probe] } },
        coreTools: undefined,
      },
      extensions: [hostileExtension],
      sessionId: 'channel-policy-real-sdk',
      model: 'gemini-2.0-flash',
      conversationToolConfig,
      yoloMode: true,
      mcpServers: { injected: { command: process.execPath, args: [probe] } },
      skillsDir: workspace,
      enabledSkills: ['hostile-skill'],
      executionPolicy: 'channel-conversational',
    });

    try {
      await config.initialize();
      expect(config.getToolRegistry().getAllTools()).toEqual([]);

      const schedule = vi.fn(async () => {
        await writeFile(sentinel, 'bad');
      });
      const agent = Object.create(GeminiAgent.prototype) as GeminiAgent;
      (agent as unknown as { executionPolicy: string }).executionPolicy = 'channel-conversational';
      (agent as unknown as { config: typeof config }).config = config;
      (agent as unknown as { scheduler: { schedule: typeof schedule } }).scheduler = { schedule };
      const request = {
        callId: 'hostile-call',
        name: 'write_file',
        args: { path: sentinel },
      } as unknown as ToolCallRequestInfo;

      await expect(
        (
          agent as unknown as {
            scheduleToolRequests: (requests: ToolCallRequestInfo[], signal: AbortSignal) => Promise<void>;
          }
        ).scheduleToolRequests([request], new AbortController().signal)
      ).rejects.toThrow('cannot execute tools');

      expect(schedule).not.toHaveBeenCalled();
      expect(existsSync(sentinel)).toBe(false);
      expect(agent.getRegisteredToolNames()).toEqual([]);
    } finally {
      await config.dispose();
    }
  });
});
