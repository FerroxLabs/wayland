import { beforeEach, describe, expect, it, vi } from 'vitest';

// Capture all provider callbacks registered during initConversationBridge
const providerCallbacks = new Map<string, (...args: unknown[]) => unknown>();

function mockProvider(name: string) {
  return {
    provider: vi.fn((cb: (...args: unknown[]) => unknown) => {
      providerCallbacks.set(name, cb);
    }),
    emit: vi.fn(),
  };
}

// Mock ipcBridge to capture provider registrations
vi.mock('@/common', () => ({
  ipcBridge: {
    openclawConversation: {
      getRuntime: mockProvider('openclawConversation.getRuntime'),
    },
    conversation: {
      create: mockProvider('conversation.create'),
      reloadContext: mockProvider('conversation.reloadContext'),
      getAssociateConversation: mockProvider('conversation.getAssociateConversation'),
      createWithConversation: mockProvider('conversation.createWithConversation'),
      remove: mockProvider('conversation.remove'),
      update: mockProvider('conversation.update'),
      reset: mockProvider('conversation.reset'),
      warmup: mockProvider('conversation.warmup'),
      generateTitle: mockProvider('conversation.generateTitle'),
      get: mockProvider('conversation.get'),
      getWorkspace: mockProvider('conversation.getWorkspace'),
      stop: mockProvider('conversation.stop'),
      setConfig: mockProvider('conversation.setConfig'),
      getSlashCommands: mockProvider('conversation.getSlashCommands'),
      askSideQuestion: mockProvider('conversation.askSideQuestion'),
      sendMessage: mockProvider('conversation.sendMessage'),
      confirmMessage: mockProvider('conversation.confirmMessage'),
      listChanged: { emit: vi.fn() },
      listByCronJob: mockProvider('conversation.listByCronJob'),
      responseStream: { emit: vi.fn() },
      confirmation: {
        confirm: mockProvider('conversation.confirmation.confirm'),
        list: mockProvider('conversation.confirmation.list'),
      },
      approval: {
        check: mockProvider('conversation.approval.check'),
      },
    },
    preview: {
      snapshotListChanged: { emit: vi.fn() },
    },
  },
}));

// Mock all external dependencies
vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: vi.fn(() => '/mock/skills'),
  getBuiltinSkillsCopyDir: vi.fn(() => '/mock/builtin-skills'),
  getSystemDir: vi.fn(() => ({ cacheDir: '/mock/cache' })),
  ProcessChat: { conversations: [] },
}));

vi.mock('@process/utils/tray', () => ({
  refreshTrayMenu: vi.fn(),
}));

vi.mock('@process/utils', () => ({
  copyFilesToDirectory: vi.fn(async () => []),
  readDirectoryRecursive: vi.fn(async () => []),
}));

vi.mock('@process/utils/openclawUtils', () => ({
  computeOpenClawIdentityHash: vi.fn(() => 'mock-hash'),
}));

vi.mock('@/process/bridge/migrationUtils', () => ({
  migrateConversationToDatabase: vi.fn(),
}));

vi.mock('@/process/bridge/services/ConversationSideQuestionService', () => ({
  ConversationSideQuestionService: class {
    ask = vi.fn();
  },
}));

vi.mock('@/process/task/agentUtils', () => ({
  prepareFirstMessage: vi.fn(async (input: string) => input),
}));

// W4.4: mocks for the workflow step-context prepend path
const mockFindById = vi.fn();
const mockGetWorkflowSessionService = vi.fn();
const mockComposeStepContext = vi.fn();

vi.mock('@process/services/workflow/workflowSessionServiceSingleton', () => ({
  getWorkflowSessionService: () => mockGetWorkflowSessionService(),
}));

vi.mock('@process/services/workflow/composeStepContext', () => ({
  composeStepContext: (session: unknown) => mockComposeStepContext(session),
}));

// Import after mocks
const { initConversationBridge } = await import('@/process/bridge/conversationBridge');

describe('conversationBridge.sendMessage', () => {
  const mockConversationService = {
    create: vi.fn(),
    getById: vi.fn(),
    getConversation: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    getAll: vi.fn(),
    reset: vi.fn(),
    list: vi.fn(),
  } as any;

  const mockWorkerTaskManager = {
    getOrBuildTask: vi.fn(),
    getTask: vi.fn(),
    removeTask: vi.fn(),
  } as any;

  beforeEach(() => {
    providerCallbacks.clear();
    vi.clearAllMocks();
    // Default: no conversation record → no workflow context attached
    mockConversationService.getConversation.mockResolvedValue(undefined);
    mockGetWorkflowSessionService.mockReturnValue(null);
    mockFindById.mockResolvedValue(null);
    mockComposeStepContext.mockReturnValue('');
    initConversationBridge(mockConversationService, mockWorkerTaskManager);
  });

  it('returns error when params is undefined (ELECTRON-FK)', async () => {
    const handler = providerCallbacks.get('conversation.sendMessage');
    expect(handler).toBeDefined();

    // Simulate WebSocket message with missing data payload
    const result = await handler!(undefined);
    expect(result).toEqual({ success: false, msg: 'Missing request parameters' });
  });

  it('returns error when params is null', async () => {
    const handler = providerCallbacks.get('conversation.sendMessage');

    const result = await handler!(null);
    expect(result).toEqual({ success: false, msg: 'Missing request parameters' });
  });

  it('returns error when conversation task is not found', async () => {
    const handler = providerCallbacks.get('conversation.sendMessage');
    mockWorkerTaskManager.getOrBuildTask.mockRejectedValue(new Error('not found'));

    const result = await handler!({
      conversation_id: 'missing-id',
      input: 'hello',
      msg_id: 'msg-1',
      files: [],
    });

    expect(result).toEqual({ success: false, msg: 'not found' });
  });

  it('defaults non-gemini files to an empty array when files are omitted', async () => {
    const handler = providerCallbacks.get('conversation.sendMessage');
    const task = {
      type: 'acp',
      workspace: '/mock/workspace',
      sendMessage: vi.fn(async () => undefined),
    };
    mockWorkerTaskManager.getOrBuildTask.mockResolvedValue(task);

    const result = await handler!({
      conversation_id: 'acp-conversation',
      input: 'hello',
      msg_id: 'msg-1',
    });

    expect(result).toEqual({ success: true });
    expect(task.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'hello',
        files: [],
        agentContent: 'hello',
      })
    );
  });

  describe('workflow step-context prepend (W4.4, SPEC §7.2)', () => {
    const STEP_CONTEXT_BLOCK =
      '[workflow_step_context current_step="2" total_steps="3"]\nbody\n[/workflow_step_context]';

    function buildTask() {
      return {
        type: 'acp',
        workspace: '/mock/workspace',
        sendMessage: vi.fn(async () => undefined),
      };
    }

    it('leaves input unchanged when conversation has no workflowSessionId in extra', async () => {
      const handler = providerCallbacks.get('conversation.sendMessage');
      const task = buildTask();
      mockWorkerTaskManager.getOrBuildTask.mockResolvedValue(task);
      mockConversationService.getConversation.mockResolvedValue({
        id: 'c1',
        extra: { presetAssistantId: 'asst-1' },
      });

      await handler!({ conversation_id: 'c1', input: 'hi', msg_id: 'm1' });

      expect(task.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'hi', agentContent: 'hi' })
      );
      // composeStepContext must never run when there is no workflowSessionId
      expect(mockComposeStepContext).not.toHaveBeenCalled();
    });

    it('prepends WORKFLOW_STEP_CONTEXT when conversation.extra.workflowSessionId resolves', async () => {
      const handler = providerCallbacks.get('conversation.sendMessage');
      const task = buildTask();
      mockWorkerTaskManager.getOrBuildTask.mockResolvedValue(task);
      const session = { id: 'ws-1', current_step: 2, total_steps: 3, steps: [] };
      mockConversationService.getConversation.mockResolvedValue({
        id: 'c1',
        extra: { workflowSessionId: 'ws-1' },
      });
      mockGetWorkflowSessionService.mockReturnValue({ findById: mockFindById });
      mockFindById.mockResolvedValue(session);
      mockComposeStepContext.mockReturnValue(STEP_CONTEXT_BLOCK);

      await handler!({ conversation_id: 'c1', input: 'do step 2', msg_id: 'm1' });

      expect(mockFindById).toHaveBeenCalledWith('ws-1');
      expect(mockComposeStepContext).toHaveBeenCalledWith(session);
      expect(task.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: `${STEP_CONTEXT_BLOCK}\n\ndo step 2`,
          agentContent: `${STEP_CONTEXT_BLOCK}\n\ndo step 2`,
        })
      );
    });

    it('soft-fails (no prepend) when the workflow service singleton is not wired', async () => {
      const handler = providerCallbacks.get('conversation.sendMessage');
      const task = buildTask();
      mockWorkerTaskManager.getOrBuildTask.mockResolvedValue(task);
      mockConversationService.getConversation.mockResolvedValue({
        id: 'c1',
        extra: { workflowSessionId: 'ws-1' },
      });
      mockGetWorkflowSessionService.mockReturnValue(null);

      await handler!({ conversation_id: 'c1', input: 'hi', msg_id: 'm1' });

      expect(mockComposeStepContext).not.toHaveBeenCalled();
      expect(task.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'hi', agentContent: 'hi' })
      );
    });

    it('does not prepend when composeStepContext returns empty (e.g. current_step === 0)', async () => {
      const handler = providerCallbacks.get('conversation.sendMessage');
      const task = buildTask();
      mockWorkerTaskManager.getOrBuildTask.mockResolvedValue(task);
      mockConversationService.getConversation.mockResolvedValue({
        id: 'c1',
        extra: { workflowSessionId: 'ws-1' },
      });
      mockGetWorkflowSessionService.mockReturnValue({ findById: mockFindById });
      mockFindById.mockResolvedValue({ id: 'ws-1', current_step: 0, total_steps: 3, steps: [] });
      mockComposeStepContext.mockReturnValue('');

      await handler!({ conversation_id: 'c1', input: 'hi', msg_id: 'm1' });

      expect(mockComposeStepContext).toHaveBeenCalled();
      expect(task.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'hi', agentContent: 'hi' })
      );
    });

    it('soft-fails (no prepend, warn fired) when findById throws', async () => {
      const handler = providerCallbacks.get('conversation.sendMessage');
      const task = buildTask();
      mockWorkerTaskManager.getOrBuildTask.mockResolvedValue(task);
      mockConversationService.getConversation.mockResolvedValue({
        id: 'c1',
        extra: { workflowSessionId: 'ws-boom' },
      });
      mockGetWorkflowSessionService.mockReturnValue({ findById: mockFindById });
      mockFindById.mockRejectedValue(new Error('db down'));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await handler!({ conversation_id: 'c1', input: 'hi', msg_id: 'm1' });

      expect(result).toEqual({ success: true });
      expect(task.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'hi', agentContent: 'hi' })
      );
      expect(warnSpy).toHaveBeenCalledWith(
        '[conversationBridge] failed to prepend WORKFLOW_STEP_CONTEXT:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });
  });
});
