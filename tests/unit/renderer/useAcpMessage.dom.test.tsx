import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AcpModelInfo } from '@/common/types/acpTypes';
import { useAcpMessage } from '@/renderer/pages/conversation/platforms/acp/useAcpMessage';
import { getModelContextLimit } from '@/renderer/utils/model/modelContextLimits';

const mockAddOrUpdateMessage = vi.fn();
const mockConversationGetInvoke = vi.fn();
const mockGetModelInfoInvoke = vi.fn();
const mockResponseStreamOn = vi.fn(() => () => {});
let responseHandler: ((message: unknown) => void) | null = null;

vi.mock('@/renderer/pages/conversation/Messages/hooks', () => ({
  useAddOrUpdateMessage: () => mockAddOrUpdateMessage,
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      get: {
        invoke: (...args: unknown[]) => mockConversationGetInvoke(...args),
      },
    },
    acpConversation: {
      getModelInfo: {
        invoke: (...args: unknown[]) => mockGetModelInfoInvoke(...args),
      },
      responseStream: {
        on: (...args: unknown[]) => mockResponseStreamOn(...args),
      },
    },
  },
}));

describe('useAcpMessage - conversation hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    responseHandler = null;
    mockResponseStreamOn.mockImplementation((handler: (message: unknown) => void) => {
      responseHandler = handler;
      return () => {};
    });
    mockConversationGetInvoke.mockResolvedValue({
      status: 'idle',
      type: 'acp',
    });
    mockGetModelInfoInvoke.mockResolvedValue({ success: true, data: { modelInfo: null } });
  });

  it('keeps model sending locked until selection hydration resolves', async () => {
    let resolveModelInfo!: (value: unknown) => void;
    mockGetModelInfoInvoke.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveModelInfo = resolve;
        })
    );

    const { result } = renderHook(() => useAcpMessage('conv-model-hydration'));

    expect(result.current.modelSelectionState).toBe('pending');
    expect(result.current.modelSelectionReady).toBe(false);

    act(() => {
      resolveModelInfo({
        success: true,
        data: { modelInfo: { selectionState: 'provider-default' } },
      });
    });

    await waitFor(() => expect(result.current.modelSelectionReady).toBe(true));
    expect(result.current.modelSelectionState).toBe('provider-default');
  });

  it('hydrates an existing blocked model selection before enabling sends', async () => {
    mockGetModelInfoInvoke.mockResolvedValue({
      success: true,
      data: {
        modelInfo: {
          selectionState: 'blocked',
          selectionFailureCode: 'model_mismatch',
        },
      },
    });

    const { result } = renderHook(() => useAcpMessage('conv-model-blocked'));

    await waitFor(() => expect(result.current.modelSelectionState).toBe('blocked'));
    expect(result.current.modelSelectionReady).toBe(false);
    expect(result.current.modelSelectionFailureCode).toBe('model_mismatch');
  });

  it('keeps sends blocked when model-selection hydration reports a bridge failure', async () => {
    mockGetModelInfoInvoke.mockResolvedValue({ success: false, msg: 'bridge failed' });

    const { result } = renderHook(() => useAcpMessage('conv-model-bridge-failure'));

    await waitFor(() => expect(result.current.modelSelectionState).toBe('blocked'));
    expect(result.current.modelSelectionReady).toBe(false);
    expect(result.current.modelSelectionFailureCode).toBe('bridge_unavailable');
  });

  it('ignores stale model hydration after switching conversations', async () => {
    let resolveFirst!: (value: unknown) => void;
    let resolveSecond!: (value: unknown) => void;
    const readinessByRender: Array<{ id: string; ready: boolean }> = [];
    mockGetModelInfoInvoke
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          })
      );

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => {
        const state = useAcpMessage(id);
        readinessByRender.push({ id, ready: state.modelSelectionReady });
        return state;
      },
      { initialProps: { id: 'conv-model-old' } }
    );
    rerender({ id: 'conv-model-new' });

    expect(readinessByRender.find((entry) => entry.id === 'conv-model-new')?.ready).toBe(false);
    expect(result.current.modelSelectionReady).toBe(false);
    act(() => {
      resolveSecond({
        success: true,
        data: { modelInfo: { selectionState: 'confirmed' } },
      });
    });

    await waitFor(() => expect(result.current.modelSelectionState).toBe('confirmed'));
    expect(result.current.modelSelectionReady).toBe(true);

    await act(async () => {
      resolveFirst({
        success: true,
        data: {
          modelInfo: {
            selectionState: 'blocked',
            selectionFailureCode: 'model_mismatch',
          },
        },
      });
      await Promise.resolve();
    });
    expect(result.current.modelSelectionState).toBe('confirmed');
    expect(result.current.modelSelectionReady).toBe(true);
  });

  it('does not clear aiProcessing when get resolves non-running after setAiProcessing(true)', async () => {
    let resolveGet!: (value: unknown) => void;
    mockConversationGetInvoke.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        })
    );

    const { result } = renderHook(() => useAcpMessage('conv-hydrate-1'));

    await waitFor(() => {
      expect(mockConversationGetInvoke).toHaveBeenCalledWith({ id: 'conv-hydrate-1' });
    });

    result.current.setAiProcessing(true);

    resolveGet({ status: 'idle', type: 'acp' });

    await waitFor(() => {
      expect(result.current.hasHydratedRunningState).toBe(true);
    });

    expect(result.current.aiProcessing).toBe(true);
    expect(result.current.running).toBe(false);
  });

  it('sets aiProcessing when backend reports status running', async () => {
    mockConversationGetInvoke.mockResolvedValue({
      status: 'running',
      type: 'acp',
    });

    const { result } = renderHook(() => useAcpMessage('conv-running'));

    await waitFor(() => {
      expect(result.current.hasHydratedRunningState).toBe(true);
    });

    expect(result.current.aiProcessing).toBe(true);
    expect(result.current.running).toBe(true);
  });

  it('clears aiProcessing when conversation.get returns null', async () => {
    mockConversationGetInvoke.mockResolvedValue(null);

    const { result } = renderHook(() => useAcpMessage('conv-missing'));

    result.current.setAiProcessing(true);

    await waitFor(() => {
      expect(result.current.hasHydratedRunningState).toBe(true);
    });

    expect(result.current.aiProcessing).toBe(false);
    expect(result.current.running).toBe(false);
  });

  it('clears aiProcessing when switching conversation_id', async () => {
    mockConversationGetInvoke.mockResolvedValue({ status: 'idle', type: 'acp' });

    const { result, rerender } = renderHook(({ id }: { id: string }) => useAcpMessage(id), {
      initialProps: { id: 'conv-switch-a' },
    });

    await waitFor(() => expect(result.current.hasHydratedRunningState).toBe(true));

    result.current.setAiProcessing(true);
    await waitFor(() => expect(result.current.aiProcessing).toBe(true));

    rerender({ id: 'conv-switch-b' });

    await waitFor(() => {
      expect(mockConversationGetInvoke).toHaveBeenLastCalledWith({ id: 'conv-switch-b' });
    });

    await waitFor(() => expect(result.current.aiProcessing).toBe(false));
    expect(result.current.hasThinkingMessage).toBe(false);
  });

  it('tracks provider-confirmed model selection state without letting legacy events erase a block', async () => {
    const { result } = renderHook(() => useAcpMessage('conv-model-state'));
    await waitFor(() => expect(responseHandler).not.toBeNull());

    act(() => {
      responseHandler?.({
        conversation_id: 'conv-model-state',
        type: 'acp_model_info',
        data: {
          currentModelId: 'gpt-5.5',
          selectionState: 'pending',
          requestedModelId: 'gpt-5.6-sol',
        },
      });
    });
    expect(result.current.modelSelectionState).toBe('pending');
    expect(result.current.modelSelectionFailureCode).toBeNull();

    act(() => {
      responseHandler?.({
        conversation_id: 'conv-model-state',
        type: 'acp_model_info',
        data: {
          currentModelId: 'gpt-5.5',
          selectionState: 'blocked',
          selectionFailureCode: 'model_mismatch',
        },
      });
    });
    expect(result.current.modelSelectionState).toBe('blocked');
    expect(result.current.modelSelectionFailureCode).toBe('model_mismatch');

    act(() => {
      responseHandler?.({
        conversation_id: 'conv-model-state',
        type: 'acp_model_info',
        data: { currentModelId: 'gpt-5.5' },
      });
    });
    expect(result.current.modelSelectionState).toBe('blocked');
    expect(result.current.modelSelectionFailureCode).toBe('model_mismatch');

    act(() => {
      responseHandler?.({
        conversation_id: 'conv-model-state',
        type: 'acp_model_info',
        data: {
          currentModelId: 'gpt-5.6-sol',
          selectionState: 'confirmed',
        },
      });
    });
    expect(result.current.modelSelectionState).toBe('confirmed');
    expect(result.current.modelSelectionFailureCode).toBeNull();
  });
});

/**
 * Regression for #733: the ACP context-usage denominator.
 *
 * `AcpSendBox` sized the indicator from the agent-reported window only, and fell
 * back to the generic 1M DEFAULT_CONTEXT_LIMIT for EVERY model when the agent
 * reported usage without a window - so the same Claude model could show a 200K
 * max on one turn and 1M on another (the reporter's "intermittent" flip).
 *
 * The hook now mirrors the model the agent reports (`acp_model_info`) so the
 * send box can resolve the REAL window for that model instead of guessing 1M.
 * Pre-fix the hook exposed no `currentModelId` at all and these fail.
 *
 * These payloads are the REAL `AcpModelInfo` shape the producers emit
 * (`toAcpModelInfo` / `buildClaudeSlotModelInfo`): the id lives on
 * `currentModelId`. It is NOT `{ model }` - that key belongs to the separate
 * `codex_model_info` event, and asserting it here would be a vacuous guard that
 * passes while the production path stays dead.
 */
function acpModelInfo(currentModelId: string | null): AcpModelInfo {
  return {
    currentModelId,
    currentModelLabel: currentModelId,
    availableModels: [],
    canSwitch: true,
    source: 'models',
  };
}

describe('useAcpMessage - acp_model_info mirrors the current model (#733)', () => {
  /** Grab the stream handler the hook registers so tests can emit events. */
  function captureStreamHandler(): () => (message: unknown) => void {
    let handler: ((message: unknown) => void) | undefined;
    mockResponseStreamOn.mockImplementation((...args: unknown[]) => {
      handler = args[0] as (message: unknown) => void;
      return () => {};
    });
    return () => {
      if (!handler) throw new Error('responseStream.on handler was never registered');
      return handler;
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockConversationGetInvoke.mockResolvedValue({ status: 'idle', type: 'acp' });
  });

  it('captures the model id from an acp_model_info event', async () => {
    const getHandler = captureStreamHandler();
    const { result } = renderHook(() => useAcpMessage('conv-model-1'));

    await waitFor(() => expect(result.current.hasHydratedRunningState).toBe(true));
    expect(result.current.currentModelId).toBeNull();

    act(() => {
      getHandler()({
        conversation_id: 'conv-model-1',
        type: 'acp_model_info',
        data: acpModelInfo('claude-opus-4-5'),
      });
    });

    await waitFor(() => expect(result.current.currentModelId).toBe('claude-opus-4-5'));
  });

  it('captures a Claude SLOT id (what the claude backend actually reports)', async () => {
    const getHandler = captureStreamHandler();
    const { result } = renderHook(() => useAcpMessage('conv-slot'));

    await waitFor(() => expect(result.current.hasHydratedRunningState).toBe(true));

    // buildClaudeSlotModelInfo reports a bare slot, not a catalog id.
    act(() => {
      getHandler()({
        conversation_id: 'conv-slot',
        type: 'acp_model_info',
        data: acpModelInfo('haiku'),
      });
    });

    await waitFor(() => expect(result.current.currentModelId).toBe('haiku'));
  });

  it('ignores an acp_model_info for a DIFFERENT conversation', async () => {
    const getHandler = captureStreamHandler();
    const { result } = renderHook(() => useAcpMessage('conv-model-2'));

    await waitFor(() => expect(result.current.hasHydratedRunningState).toBe(true));

    act(() => {
      getHandler()({
        conversation_id: 'someone-elses-conversation',
        type: 'acp_model_info',
        data: acpModelInfo('claude-haiku-4-5'),
      });
    });

    expect(result.current.currentModelId).toBeNull();
  });

  it('ignores a malformed acp_model_info payload (no model)', async () => {
    const getHandler = captureStreamHandler();
    const { result } = renderHook(() => useAcpMessage('conv-model-3'));

    await waitFor(() => expect(result.current.hasHydratedRunningState).toBe(true));

    act(() => {
      getHandler()({ conversation_id: 'conv-model-3', type: 'acp_model_info', data: {} });
      getHandler()({ conversation_id: 'conv-model-3', type: 'acp_model_info', data: acpModelInfo(null) });
      getHandler()({ conversation_id: 'conv-model-3', type: 'acp_model_info', data: acpModelInfo('') });
    });

    expect(result.current.currentModelId).toBeNull();
  });

  it('clears the model id when the conversation changes', async () => {
    const getHandler = captureStreamHandler();
    const { result, rerender } = renderHook(({ id }: { id: string }) => useAcpMessage(id), {
      initialProps: { id: 'conv-model-a' },
    });

    await waitFor(() => expect(result.current.hasHydratedRunningState).toBe(true));

    act(() => {
      getHandler()({
        conversation_id: 'conv-model-a',
        type: 'acp_model_info',
        data: acpModelInfo('claude-opus-4-5'),
      });
    });
    await waitFor(() => expect(result.current.currentModelId).toBe('claude-opus-4-5'));

    // A stale model id would size the NEXT conversation's indicator wrongly.
    rerender({ id: 'conv-model-b' });

    await waitFor(() => expect(result.current.currentModelId).toBeNull());
  });
});

/**
 * #733 — the seeding path that makes the fix REACHABLE on the default Claude path.
 *
 * The `acp_model_info` STREAM only carries ConfigTracker.currentModelId, and Claude
 * Code's ACP wrapper advertises no model list, so NO model ever reaches the stream
 * for the `claude` backend. The meter must therefore seed from the conversation row,
 * whose `extra.currentModelId` is the AUTHORITATIVE running model (it is what the
 * manager persists and what becomes ANTHROPIC_MODEL at spawn).
 *
 * NOT the `getModelInfo` IPC: with no task yet that falls back to getStaticModelInfo(),
 * which reads the LOCAL Claude CLI config (~/.claude/settings.json / cc-switch),
 * knows nothing about this conversation's pick, and defaults to opus/sonnet — it
 * would confidently size the meter from a model the session isn't running.
 */
describe('useAcpMessage - seeds the model from the conversation row (#733)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConversationGetInvoke.mockResolvedValue({ status: 'idle', type: 'acp' });
  });

  it('seeds the persisted model so a Haiku session sizes to 200K (#733)', async () => {
    mockConversationGetInvoke.mockResolvedValue({
      status: 'idle',
      type: 'acp',
      extra: { currentModelId: 'claude-haiku-4-5' },
    });

    const { result } = renderHook(() => useAcpMessage('conv-seed-1'));

    await waitFor(() => expect(result.current.currentModelId).toBe('claude-haiku-4-5'));
    // The denominator the send box then resolves - the actual #733 symptom.
    expect(getModelContextLimit(result.current.currentModelId)).toBe(200_000);
  });

  it('seeds an Opus session to the 1M window', async () => {
    mockConversationGetInvoke.mockResolvedValue({
      status: 'idle',
      type: 'acp',
      extra: { currentModelId: 'claude-opus-4-8' },
    });

    const { result } = renderHook(() => useAcpMessage('conv-seed-2'));

    await waitFor(() => expect(result.current.currentModelId).toBe('claude-opus-4-8'));
    expect(getModelContextLimit(result.current.currentModelId)).toBe(1_000_000);
  });

  it('does not clobber a model id that already arrived on the stream', async () => {
    let resolveGet!: (value: unknown) => void;
    mockConversationGetInvoke.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        })
    );
    let handler: ((message: unknown) => void) | undefined;
    mockResponseStreamOn.mockImplementation((...args: unknown[]) => {
      handler = args[0] as (message: unknown) => void;
      return () => {};
    });

    const { result } = renderHook(() => useAcpMessage('conv-seed-3'));

    await waitFor(() => expect(handler).toBeDefined());
    act(() => {
      handler!({
        conversation_id: 'conv-seed-3',
        type: 'acp_model_info',
        data: acpModelInfo('claude-opus-4-8'),
      });
    });
    await waitFor(() => expect(result.current.currentModelId).toBe('claude-opus-4-8'));

    // A late, staler row must NOT overwrite the live stream value.
    act(() => {
      resolveGet({ status: 'idle', type: 'acp', extra: { currentModelId: 'claude-haiku-4-5' } });
    });

    await waitFor(() => expect(result.current.hasHydratedRunningState).toBe(true));
    expect(result.current.currentModelId).toBe('claude-opus-4-8');
  });

  it('leaves the model null when the row has no persisted model', async () => {
    mockConversationGetInvoke.mockResolvedValue({ status: 'idle', type: 'acp', extra: {} });

    const { result } = renderHook(() => useAcpMessage('conv-seed-4'));

    await waitFor(() => expect(result.current.hasHydratedRunningState).toBe(true));
    expect(result.current.currentModelId).toBeNull();
  });
});
