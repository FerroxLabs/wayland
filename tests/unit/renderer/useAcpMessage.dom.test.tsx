import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAcpMessage } from '@/renderer/pages/conversation/platforms/acp/useAcpMessage';

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
