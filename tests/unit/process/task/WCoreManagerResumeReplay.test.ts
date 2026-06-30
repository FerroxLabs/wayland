/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { IMessageText, IMessageToolGroup, TMessage } from '@/common/chat/chatLib';

const { mockDb, agentStart, agentInstances } = vi.hoisted(() => ({
  mockDb: {
    getConversationMessages: vi.fn(),
    getConversation: vi.fn(() => ({ success: false })),
    updateConversation: vi.fn(),
    createConversation: vi.fn(() => ({ success: true })),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  },
  agentStart: vi.fn().mockResolvedValue(undefined),
  agentInstances: [] as Array<{ injectConversationHistory: ReturnType<typeof vi.fn> }>,
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: vi.fn() },
      confirmation: {
        add: { emit: vi.fn() },
        update: { emit: vi.fn() },
        remove: { emit: vi.fn() },
      },
    },
    cron: {
      onJobCreated: { emit: vi.fn() },
      onJobRemoved: { emit: vi.fn() },
    },
    cost: {
      budgetGateBlocked: { emit: vi.fn() },
    },
  },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null },
    worker: {
      fork: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        postMessage: vi.fn(),
        kill: vi.fn(),
      })),
    },
  }),
}));

vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn(() => ({})),
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock('@process/services/database/export', () => ({
  getDatabase: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessChat: { get: vi.fn(() => Promise.resolve([])) },
  ProcessConfig: { get: vi.fn(() => Promise.resolve(false)) },
}));

vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: vi.fn(),
}));

vi.mock('@/common/utils', () => {
  let counter = 0;
  return { uuid: vi.fn(() => `uuid-${++counter}`) };
});

vi.mock('@/renderer/utils/common', () => {
  let counter = 0;
  return { uuid: vi.fn(() => `pipe-${++counter}`) };
});

vi.mock('@process/utils/mainLogger', () => ({
  mainError: vi.fn(),
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    addJob: vi.fn(async () => ({ id: 'cron-1', name: 'test', enabled: true })),
    removeJob: vi.fn(async () => {}),
    listJobsByConversation: vi.fn(async () => []),
  },
}));

vi.mock('@process/agent/wcore', () => ({
  WCoreAgent: function WCoreAgentMock(this: Record<string, unknown>) {
    const injectConversationHistory = vi.fn().mockResolvedValue(undefined);
    this.start = agentStart;
    this.stop = vi.fn();
    this.kill = vi.fn();
    this.send = vi.fn().mockResolvedValue(undefined);
    this.approveTool = vi.fn();
    this.denyTool = vi.fn();
    this.setConfig = vi.fn();
    this.setMode = vi.fn();
    this.sendCommand = vi.fn();
    this.ping = vi.fn();
    this.isAlive = true;
    this.capabilities = null;
    this.injectConversationHistory = injectConversationHistory;
    agentInstances.push({ injectConversationHistory });
  },
}));

vi.mock('@/process/task/agentUtils', () => ({
  buildSystemInstructionsWithSkillsIndex: vi.fn(async () => undefined),
  buildTurnSkillContext: vi.fn(async () => ({ advert: undefined, autoLoaded: [] })),
  consumePendingSessionSkills: vi.fn(async () => undefined),
  mergeLoadedSkillsExtra: vi.fn(async () => {}),
  resolveCapabilitiesManifest: vi.fn(async () => undefined),
}));

import { WCoreManager } from '@/process/task/WCoreManager';

const CONV_ID = 'conv-wcore-resume-replay';

function textMessage(id: string, position: 'left' | 'right', content: string): IMessageText {
  return {
    id,
    conversation_id: CONV_ID,
    type: 'text',
    position,
    content: { content },
  };
}

function editToolGroup(id: string): IMessageToolGroup {
  return {
    id,
    conversation_id: CONV_ID,
    type: 'tool_group',
    position: 'left',
    content: [
      {
        callId: 'call-edit-1',
        description: 'Edited README quickstart',
        name: 'Edit',
        renderOutputAsMarkdown: true,
        status: 'Success',
        confirmationDetails: {
          type: 'edit',
          title: 'Edit README.md',
          fileName: 'README.md',
          fileDiff: '- old\n+ new',
        },
      },
    ],
  };
}

function createManager(): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: CONV_ID,
  };
  return new WCoreManager(data as Record<string, unknown>, data.model as Record<string, unknown>);
}

describe('WCoreManager resume replay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentInstances.length = 0;
    agentStart.mockResolvedValue(undefined);
  });

  it('injects structured replay history with tool and file trajectory on resume', async () => {
    const history: TMessage[] = [
      textMessage('m1', 'right', 'Please fix the quickstart.'),
      editToolGroup('m2'),
      textMessage('m3', 'left', 'Updated README.md.'),
    ];
    mockDb.getConversationMessages.mockImplementation((_conversationId: string, _page: number, pageSize: number) => ({
      data: pageSize === 1 ? [history[0]] : history,
    }));

    const manager = createManager();
    await (manager as unknown as { agentReady: Promise<void> }).agentReady;

    expect(agentInstances).toHaveLength(1);
    expect(agentInstances[0].injectConversationHistory).toHaveBeenCalledTimes(1);
    const injected = String(agentInstances[0].injectConversationHistory.mock.calls[0][0]);
    expect(injected).toContain('[BEGIN WCORE RESUME REPLAY');
    expect(injected).toContain('historical context only');
    expect(injected).toContain('[assistant tool: Edit (Success)] Edited README quickstart');
    expect(injected).toContain('file: README.md');
    expect(injected).toContain('[assistant]: Updated README.md.');
  });
});
