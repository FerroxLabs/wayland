import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetConversation, mockAcpManager, mockGeminiManager } = vi.hoisted(() => ({
  mockGetConversation: vi.fn(),
  mockAcpManager: vi.fn(),
  mockGeminiManager: vi.fn(),
}));

vi.mock('../../src/process/services/database/SqliteConversationRepository', () => ({
  SqliteConversationRepository: class {
    getConversation = mockGetConversation;
  },
}));

vi.mock('../../src/process/task/AcpAgentManager', () => ({
  default: class {
    type = 'acp';
    kill = vi.fn();
    data: Record<string, unknown>;
    constructor(data: Record<string, unknown>) {
      this.data = data;
      mockAcpManager(data);
    }
  },
}));

vi.mock('../../src/process/task/GeminiAgentManager', () => ({
  GeminiAgentManager: class {
    type = 'gemini';
    kill = vi.fn();
    constructor(data: Record<string, unknown>) {
      mockGeminiManager(data);
    }
  },
}));

vi.mock('../../src/process/task/OpenClawAgentManager', () => ({
  default: vi.fn().mockImplementation(() => ({ type: 'openclaw-gateway', kill: vi.fn() })),
}));

import { workerTaskManager } from '../../src/process/task/workerTaskManagerSingleton';

describe('workerTaskManagerSingleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workerTaskManager.clear();
  });

  it('prefers persisted currentModelId from conversation.extra for acp tasks', async () => {
    mockGetConversation.mockResolvedValue({
      id: 'conv-extra-model',
      type: 'acp',
      model: { useModel: 'gemini-2.0-flash' },
      extra: { backend: 'gemini', currentModelId: 'gemini-2.5-pro' },
    });

    await workerTaskManager.getOrBuildTask('conv-extra-model');

    expect(mockAcpManager).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: 'conv-extra-model',
        currentModelId: 'gemini-2.5-pro',
      })
    );
  });

  it('falls back to conversation.model.useModel when no persisted currentModelId exists', async () => {
    mockGetConversation.mockResolvedValue({
      id: 'conv-model-fallback',
      type: 'acp',
      model: { useModel: 'gemini-2.0-flash' },
      extra: { backend: 'gemini' },
    });

    await workerTaskManager.getOrBuildTask('conv-model-fallback');

    expect(mockAcpManager).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: 'conv-model-fallback',
        currentModelId: 'gemini-2.0-flash',
      })
    );
  });

  it('does not apply unrelated provider models to non-gemini ACP backends', async () => {
    mockGetConversation.mockResolvedValue({
      id: 'conv-qwen-default',
      type: 'acp',
      model: { useModel: 'gemini-2.0-flash' },
      extra: { backend: 'qwen' },
    });

    await workerTaskManager.getOrBuildTask('conv-qwen-default');

    expect(mockAcpManager).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: 'conv-qwen-default',
        currentModelId: undefined,
      })
    );
  });
  it('propagates the scheduler deadline and explicit approval flag into the ACP factory', async () => {
    mockGetConversation.mockResolvedValue({
      id: 'conv-fuigo-scheduled',
      type: 'acp',
      model: { useModel: 'flux-auto' },
      extra: { workspace: '/workspace', backend: 'fuigo', yoloMode: true, unattendedHoldDeadlineMs: 1 },
    });
    await workerTaskManager.getOrBuildTask('conv-fuigo-scheduled', {
      yoloMode: false,
      unattendedHoldDeadlineMs: 123456,
    });
    expect(mockAcpManager).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: 'conv-fuigo-scheduled',
        yoloMode: false,
        unattendedHoldDeadlineMs: 123456,
      })
    );
  });

  it('threads the trusted channel execution policy only through launch options', async () => {
    mockGetConversation.mockResolvedValue({
      id: 'conv-channel',
      type: 'gemini',
      model: { useModel: 'gemini-2.0-flash' },
      extra: { executionPolicy: 'attacker-controlled', yoloMode: true },
    });

    await workerTaskManager.getOrBuildTask('conv-channel', {
      executionPolicy: 'channel-conversational',
      yoloMode: false,
    });

    expect(mockGeminiManager).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: 'conv-channel',
        executionPolicy: 'channel-conversational',
        yoloMode: false,
      })
    );
  });
});
