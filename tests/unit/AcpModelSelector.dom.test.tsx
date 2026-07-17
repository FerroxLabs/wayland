/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const ipcMock = vi.hoisted(() => ({
  getModelInfo: vi.fn(),
  setModel: vi.fn(),
  onResponseStream: vi.fn(() => () => {}),
  getModelConfig: vi.fn().mockResolvedValue([]),
  // The unified flyout view model + per-conversation effort hook the selector
  // now mounts. These resolve empty so the existing native-menu cases stand.
  curatedForAgent: vi.fn().mockResolvedValue([]),
  queryRecentlyUsedModels: vi.fn().mockResolvedValue([]),
  registryList: vi.fn().mockResolvedValue([]),
  registryListChanged: vi.fn(() => () => {}),
  conversationGet: vi.fn().mockResolvedValue(null),
  conversationUpdate: vi.fn().mockResolvedValue(true),
}));
const messageMock = vi.hoisted(() => ({
  error: vi.fn(),
}));

let responseHandler: ((message: unknown) => void) | null = null;

vi.mock('@/common', () => ({
  ipcBridge: {
    acpConversation: {
      getModelInfo: { invoke: ipcMock.getModelInfo },
      setModel: { invoke: ipcMock.setModel },
      responseStream: { on: ipcMock.onResponseStream },
    },
    mode: {
      getModelConfig: { invoke: ipcMock.getModelConfig },
    },
    usage: {
      queryRecentlyUsedModels: { invoke: ipcMock.queryRecentlyUsedModels },
    },
    conversation: {
      get: { invoke: ipcMock.conversationGet },
      update: { invoke: ipcMock.conversationUpdate },
    },
  },
}));

// useFluxConnected + useModelRegistry read `modelRegistry` directly from this module.
vi.mock('@/common/adapter/ipcBridge', () => ({
  modelRegistry: {
    list: { invoke: ipcMock.registryList },
    listChanged: { on: ipcMock.registryListChanged },
    curatedForAgent: { invoke: ipcMock.curatedForAgent },
  },
}));

// The selector now calls `useNavigate` (Manage models footer).
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Message: {
      ...actual.Message,
      error: messageMock.error,
    },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | { defaultValue?: string }) => {
      if (typeof fallback === 'string') return fallback || key;
      if (fallback && typeof fallback === 'object' && fallback.defaultValue) {
        let value = fallback.defaultValue;
        for (const [name, replacement] of Object.entries(fallback)) {
          if (name === 'defaultValue') continue;
          value = value.replace(new RegExp(`{{${name}}}`, 'g'), String(replacement));
        }
        return value;
      }
      return key;
    },
  }),
}));

vi.mock('swr', () => ({
  default: () => ({ data: [], error: undefined, mutate: vi.fn() }),
}));

import { ConfigStorage } from '@/common/config/storage';
import AcpModelSelector from '../../src/renderer/components/agent/AcpModelSelector';

const configGetMock = ConfigStorage.get as unknown as ReturnType<typeof vi.fn>;
// The i18n mock returns the raw key when no string/defaultValue fallback is
// given, so the first-connection state's button label is this key, and the
// neutral loading state's label is its defaultValue.
const FIRST_CONNECTION_LABEL = 'conversation.welcome.useCliModel';

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function codexModelInfo(currentModelId: string, selectionState: 'pending' | 'confirmed' | 'blocked' = 'confirmed') {
  const labels: Record<string, string> = {
    'gpt-5.5': 'GPT-5.5',
    'gpt-5.6-sol': 'GPT-5.6 SOL',
    'gpt-next': 'GPT Next',
  };
  return {
    currentModelId,
    currentModelLabel: labels[currentModelId] ?? currentModelId,
    availableModels: Object.entries(labels).map(([id, label]) => ({ id, label })),
    canSwitch: true,
    source: 'models' as const,
    sourceDetail: 'acp-models' as const,
    confirmationSource: 'session-models' as const,
    selectionState,
  };
}

function confirmedSelection(modelId: string) {
  return {
    success: true,
    data: {
      selection: {
        ok: true as const,
        requestedModelId: modelId,
        confirmedModelId: modelId,
        modelInfo: codexModelInfo(modelId),
        confirmationSource: 'session-models' as const,
        restarted: true,
      },
    },
  };
}

function modelInfoResponse(modelId: string) {
  return {
    success: true,
    data: { modelInfo: codexModelInfo(modelId) },
  };
}
const LOADING_LABEL = 'Loading models…';

describe('AcpModelSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    responseHandler = null;
    ipcMock.onResponseStream.mockImplementation((handler: (message: unknown) => void) => {
      responseHandler = handler;
      return () => {};
    });
    ipcMock.getModelConfig.mockResolvedValue([]);
    ipcMock.curatedForAgent.mockResolvedValue([]);
    configGetMock.mockResolvedValue(null);
    // Reset per-test: clearAllMocks() wipes calls but NOT implementations, so a
    // test that connects Flux (registryList -> flux-router) would otherwise leak
    // "Flux connected" into later tests. Default every test to Flux disconnected.
    ipcMock.registryList.mockResolvedValue([]);
    ipcMock.setModel.mockResolvedValue({
      success: true,
      data: {
        selection: {
          ok: true,
          requestedModelId: null,
          confirmedModelId: null,
          modelInfo: null,
          confirmationSource: 'provider-default',
          restarted: false,
        },
      },
    });
  });

  it('shows the model source in the compact button label', async () => {
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: {
        modelInfo: {
          currentModelId: 'claude-opus-4-6',
          currentModelLabel: 'Claude Opus 4.6',
          availableModels: [{ id: 'claude-opus-4-6', label: 'Claude Opus 4.6' }],
          canSwitch: false,
          source: 'models',
          sourceDetail: 'cc-switch',
          confirmationSource: 'session-models',
          selectionState: 'confirmed',
        },
      },
    });

    render(<AcpModelSelector conversationId='conv-1' backend='claude' />);

    await waitFor(() => {
      expect(screen.getAllByText('Claude Opus 4.6 · cc-switch').length).toBeGreaterThan(0);
    });
  });

  it('does not present an uncorrelated Codex stream model as active', async () => {
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: { modelInfo: null },
    });

    render(<AcpModelSelector conversationId='conv-1' backend='codex' />);

    responseHandler?.({
      conversation_id: 'conv-1',
      type: 'codex_model_info',
      data: { model: 'gpt-5.4/high' },
    });

    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('Use provider default'));
    expect(screen.queryByText('gpt-5.4/high')).toBeNull();
  });

  it('refreshes Claude model info when the window regains focus', async () => {
    ipcMock.getModelInfo
      .mockResolvedValueOnce({
        success: true,
        data: {
          modelInfo: {
            currentModelId: 'claude-opus-4-6',
            currentModelLabel: 'Claude Opus 4.6',
            availableModels: [
              { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
              { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
            ],
            canSwitch: true,
            source: 'models',
            sourceDetail: 'cc-switch',
            confirmationSource: 'session-models',
            selectionState: 'confirmed',
          },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          modelInfo: {
            currentModelId: 'claude-sonnet-4-5',
            currentModelLabel: 'Claude Sonnet 4.5',
            availableModels: [
              { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
              { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
            ],
            canSwitch: true,
            source: 'models',
            sourceDetail: 'cc-switch',
            confirmationSource: 'session-models',
            selectionState: 'confirmed',
          },
        },
      });

    render(<AcpModelSelector conversationId='conv-1' backend='claude' />);

    await waitFor(() => {
      expect(screen.getAllByText('Claude Opus 4.6 · cc-switch').length).toBeGreaterThan(0);
    });

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(screen.getAllByText('Claude Sonnet 4.5 · cc-switch').length).toBeGreaterThan(0);
    });
  });

  it('updates the visible model label only after the provider confirms a different model', async () => {
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: {
        modelInfo: {
          currentModelId: 'claude-opus-4-6',
          currentModelLabel: 'Claude Opus 4.6',
          availableModels: [
            { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
            { id: 'glm-5.1x', label: 'GLM 5.1x' },
          ],
          canSwitch: true,
          source: 'models',
          sourceDetail: 'cc-switch',
          confirmationSource: 'session-models',
          selectionState: 'confirmed',
        },
      },
    });
    ipcMock.setModel.mockResolvedValue({
      success: true,
      data: {
        selection: {
          ok: true,
          requestedModelId: 'glm-5.1x',
          confirmedModelId: 'glm-5.1x',
          confirmationSource: 'spawn-session',
          restarted: true,
          modelInfo: {
            currentModelId: 'glm-5.1x',
            currentModelLabel: 'GLM 5.1x',
            availableModels: [
              { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
              { id: 'glm-5.1x', label: 'GLM 5.1x' },
            ],
            canSwitch: true,
            source: 'models',
            sourceDetail: 'cc-switch',
            confirmationSource: 'spawn-session',
            selectionState: 'confirmed',
          },
        },
      },
    });

    render(<AcpModelSelector conversationId='conv-1' backend='claude' />);

    await waitFor(() => {
      expect(screen.getAllByText('Claude Opus 4.6 · cc-switch').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('GLM 5.1x')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('GLM 5.1x'));

    await waitFor(() => {
      expect(screen.getAllByText('GLM 5.1x · cc-switch').length).toBeGreaterThan(0);
    });
  });

  it('keeps the confirmed label while an exact model switch is pending', async () => {
    const pending = deferred<ReturnType<typeof confirmedSelection>>();
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: { modelInfo: codexModelInfo('gpt-5.5') },
    });
    ipcMock.setModel.mockReturnValue(pending.promise);

    render(<AcpModelSelector conversationId='conv-pending' backend='codex' />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('GPT-5.5');
    });

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(await screen.findByText('GPT-5.6 SOL'));

    expect(screen.getByRole('button').textContent).toContain('GPT-5.5');
    expect(screen.getByText('Switching to GPT-5.6 SOL…')).toBeInTheDocument();
  });

  it('keeps the confirmed label and surfaces a blocked mismatch', async () => {
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: { modelInfo: codexModelInfo('gpt-5.5') },
    });
    ipcMock.setModel.mockResolvedValue({
      success: true,
      data: {
        selection: {
          ok: false,
          requestedModelId: 'gpt-5.6-sol',
          previousConfirmedModelId: 'gpt-5.5',
          code: 'model_mismatch',
          message: 'Runtime reported gpt-5.5',
          modelInfo: {
            ...codexModelInfo('gpt-5.5', 'blocked'),
            requestedModelId: 'gpt-5.6-sol',
            selectionFailureCode: 'model_mismatch',
          },
        },
      },
    });

    render(<AcpModelSelector conversationId='conv-blocked' backend='codex' />);
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT-5.5'));
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(await screen.findByText('GPT-5.6 SOL'));

    await waitFor(() => expect(messageMock.error).toHaveBeenCalled());
    expect(screen.getByRole('button').textContent).toContain('GPT-5.5');
  });

  it('ignores a superseded selection response', async () => {
    const first = deferred<ReturnType<typeof confirmedSelection>>();
    const second = deferred<ReturnType<typeof confirmedSelection>>();
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: { modelInfo: codexModelInfo('gpt-5.5') },
    });
    ipcMock.setModel.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    render(<AcpModelSelector conversationId='conv-latest' backend='codex' />);
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT-5.5'));

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(await screen.findByText('GPT-5.6 SOL'));
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(await screen.findByText('GPT Next'));

    act(() => second.resolve(confirmedSelection('gpt-next')));
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT Next'));

    act(() => first.resolve(confirmedSelection('gpt-5.6-sol')));
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT Next'));
    expect(screen.getByRole('button').textContent).not.toContain('GPT-5.6 SOL');
  });

  it('keeps the confirmed active model when a legacy model-info snapshot arrives', async () => {
    ipcMock.getModelInfo.mockResolvedValue(modelInfoResponse('gpt-5.5'));
    render(<AcpModelSelector conversationId='conv-legacy' backend='codex' />);
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT-5.5'));

    act(() => {
      responseHandler?.({
        conversation_id: 'conv-legacy',
        type: 'acp_model_info',
        data: {
          currentModelId: 'gpt-next',
          currentModelLabel: 'GPT Next',
          availableModels: [{ id: 'gpt-next', label: 'GPT Next' }],
          canSwitch: true,
          source: 'models',
        },
      });
    });

    expect(screen.getByRole('button').textContent).toContain('GPT-5.5');
    expect(screen.getByRole('button').textContent).not.toContain('GPT Next');
  });

  it('ignores a stale model-info response after switching conversations', async () => {
    const oldResponse = deferred<ReturnType<typeof modelInfoResponse>>();
    ipcMock.getModelInfo.mockReturnValueOnce(oldResponse.promise).mockResolvedValueOnce(modelInfoResponse('gpt-next'));

    const { rerender } = render(<AcpModelSelector conversationId='conv-old' backend='codex' />);
    await waitFor(() =>
      expect(ipcMock.getModelInfo).toHaveBeenCalledWith(expect.objectContaining({ conversationId: 'conv-old' }))
    );
    rerender(<AcpModelSelector conversationId='conv-new' backend='codex' />);
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT Next'));

    await act(async () => {
      oldResponse.resolve(modelInfoResponse('gpt-5.5'));
      await oldResponse.promise;
    });
    expect(screen.getByRole('button').textContent).toContain('GPT Next');
  });

  it('keeps the newest result when Claude refresh responses arrive out of order', async () => {
    const firstRefresh = deferred<ReturnType<typeof modelInfoResponse>>();
    const secondRefresh = deferred<ReturnType<typeof modelInfoResponse>>();
    ipcMock.getModelInfo
      .mockResolvedValueOnce(modelInfoResponse('gpt-5.5'))
      .mockReturnValueOnce(firstRefresh.promise)
      .mockReturnValueOnce(secondRefresh.promise);

    render(<AcpModelSelector conversationId='conv-polls' backend='claude' />);
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT-5.5'));
    act(() => {
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('focus'));
    });

    act(() => secondRefresh.resolve(modelInfoResponse('gpt-next')));
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT Next'));
    await act(async () => {
      firstRefresh.resolve(modelInfoResponse('gpt-5.6-sol'));
      await firstRefresh.promise;
    });
    expect(screen.getByRole('button').textContent).toContain('GPT Next');
  });

  it('does not let a pre-switch reload overwrite a confirmed selection', async () => {
    const staleRefresh = deferred<ReturnType<typeof modelInfoResponse>>();
    ipcMock.getModelInfo.mockResolvedValueOnce(modelInfoResponse('gpt-5.5')).mockReturnValueOnce(staleRefresh.promise);
    ipcMock.setModel.mockResolvedValue(confirmedSelection('gpt-next'));

    render(<AcpModelSelector conversationId='conv-switch-reload' backend='claude' />);
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT-5.5'));
    act(() => window.dispatchEvent(new Event('focus')));
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(await screen.findByText('GPT Next'));
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT Next'));

    await act(async () => {
      staleRefresh.resolve(modelInfoResponse('gpt-5.5'));
      await staleRefresh.promise;
    });
    expect(screen.getByRole('button').textContent).toContain('GPT Next');
  });

  it('does not let an in-flight reload overwrite a newer transactional stream event', async () => {
    const staleRefresh = deferred<ReturnType<typeof modelInfoResponse>>();
    ipcMock.getModelInfo.mockResolvedValueOnce(modelInfoResponse('gpt-5.5')).mockReturnValueOnce(staleRefresh.promise);

    render(<AcpModelSelector conversationId='conv-stream-reload' backend='claude' />);
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT-5.5'));
    act(() => window.dispatchEvent(new Event('focus')));
    act(() => {
      responseHandler?.({
        conversation_id: 'conv-stream-reload',
        type: 'acp_model_info',
        data: codexModelInfo('gpt-next'),
      });
    });
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT Next'));

    await act(async () => {
      staleRefresh.resolve(modelInfoResponse('gpt-5.5'));
      await staleRefresh.promise;
    });
    expect(screen.getByRole('button').textContent).toContain('GPT Next');
  });

  it('offers provider default as a recovery action and sends a null model id', async () => {
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: {
        modelInfo: {
          ...codexModelInfo('gpt-5.5', 'blocked'),
          requestedModelId: 'gpt-5.6-sol',
          selectionFailureCode: 'model_mismatch',
        },
      },
    });
    ipcMock.setModel.mockResolvedValue({
      success: true,
      data: {
        selection: {
          ok: true,
          requestedModelId: null,
          confirmedModelId: null,
          modelInfo: {
            ...codexModelInfo('gpt-5.5'),
            selectionState: 'provider-default',
          },
          confirmationSource: 'provider-default',
          restarted: true,
        },
      },
    });

    render(<AcpModelSelector conversationId='conv-default' backend='codex' />);
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('GPT-5.5'));
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(await screen.findByText('Use provider default'));

    await waitFor(() => {
      expect(ipcMock.setModel).toHaveBeenCalledWith({
        conversationId: 'conv-default',
        modelId: null,
      });
    });
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('Use provider default'));
    expect(screen.getByRole('button').textContent).not.toContain('GPT-5.5');
  });

  it('renders a cached catalog without presenting its cached current model as active', async () => {
    // Live IPC reports nothing yet (manager not created) so the picker must fall
    // back to the persisted catalog instead of the alarming first-connection state.
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: { modelInfo: null },
    });
    configGetMock.mockResolvedValue({
      qwen: {
        currentModelId: 'qwen-max',
        currentModelLabel: 'Qwen Max',
        availableModels: [
          { id: 'qwen-max', label: 'Qwen Max' },
          { id: 'qwen-plus', label: 'Qwen Plus' },
        ],
        canSwitch: true,
        source: 'models',
        sourceDetail: 'qwen-cache',
      },
    });

    render(<AcpModelSelector conversationId='conv-cache' backend='qwen' />);

    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('Use provider default'));
    expect(screen.queryByText('Qwen Max')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Qwen Max')).toBeTruthy();
    expect(screen.queryByText(FIRST_CONNECTION_LABEL)).toBeNull();
  });

  it('shows the static Claude catalog without presenting its local default as confirmed', async () => {
    // Cold start: no cached catalog (Claude never reports via the models API, so
    // acp.cachedModels has no `claude` entry), but the process derives the
    // cc-switch catalog and returns it pre-connection. The picker must populate
    // immediately and offer the switch list, with no first-connection tooltip.
    configGetMock.mockResolvedValue(null);
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: {
        modelInfo: {
          currentModelId: 'opus',
          currentModelLabel: 'Claude Opus 4.8',
          availableModels: [
            { id: 'opus', label: 'Claude Opus 4.8' },
            { id: 'default', label: 'Claude Sonnet 4.5' },
            { id: 'haiku', label: 'Claude Haiku 4.5' },
          ],
          canSwitch: true,
          source: 'models',
          sourceDetail: 'cc-switch',
        },
      },
    });

    render(<AcpModelSelector conversationId='conv-claude-cold' backend='claude' />);

    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('Use provider default'));
    expect(screen.queryByText(/Claude Opus 4\.8/)).toBeNull();
    // The first-connection guidance is never shown.
    expect(screen.queryByText(FIRST_CONNECTION_LABEL)).toBeNull();

    // The backend is forwarded so the process can derive the cold-start catalog.
    expect(ipcMock.getModelInfo).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'conv-claude-cold', backend: 'claude' })
    );

    // The switch list is selectable.
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Claude Sonnet 4.5')).toBeTruthy();
      expect(screen.getByText('Claude Haiku 4.5')).toBeTruthy();
    });
  });

  it('renders the curated provider catalog as a selectable dropdown when the agent has not reported models yet (#345)', async () => {
    // No live model info and no cached catalog, but the backend maps to a
    // connected provider whose curated catalog is non-empty (codex->openai).
    // State 1b must surface that catalog as a selectable dropdown instead of
    // dead-ending on the first-connection tooltip.
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: { modelInfo: null },
    });
    configGetMock.mockResolvedValue(null);
    ipcMock.curatedForAgent.mockResolvedValue([
      {
        id: 'gpt-5.5-codex',
        providerId: 'openai',
        displayName: 'GPT-5.5 Codex',
        family: 'gpt-5',
        enabled: true,
        recommended: true,
        costInPerM: 5,
        costOutPerM: 15,
      },
    ]);

    render(<AcpModelSelector conversationId='conv-curated' backend='codex' />);

    // The picker resolves to the default-model dropdown (not the dead-end
    // first-connection tooltip): the curated registry is authoritative even
    // before the agent reports its own models.
    await waitFor(() => {
      expect(screen.getAllByText('common.defaultModel').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(FIRST_CONNECTION_LABEL)).toBeNull();

    // The dropdown is selectable and surfaces the curated model.
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('GPT-5.5 Codex')).toBeTruthy();
    });
  });

  // #550: a claude-code chat is Anthropic-native; the picker only offers Claude
  // models, so a user who wants ChatGPT/Gemini sees no path and thinks it's broken.
  // The picker must EXPLAIN the scoping and point to the honest path (start a new
  // chat + pick that agent) rather than silently omit the option.
  const CLAUDE_MODEL_INFO = {
    currentModelId: 'claude-opus-4-8',
    currentModelLabel: 'Opus 4.8',
    availableModels: [
      { id: 'claude-opus-4-8', label: 'Opus 4.8' },
      { id: 'claude-sonnet-4-5', label: 'Sonnet 4.5' },
    ],
    canSwitch: true,
    source: 'models',
    sourceDetail: 'cc-switch',
    confirmationSource: 'session-models',
    selectionState: 'confirmed',
  };
  const CLAUDE_CURATED = [
    {
      id: 'claude-opus-4-8',
      providerId: 'anthropic',
      displayName: 'Opus 4.8',
      family: 'claude',
      enabled: true,
      recommended: true,
      contextWindow: 200000,
      costInPerM: 5,
      costOutPerM: 15,
    },
  ];

  it('explains how to reach other providers from an active Claude Code chat (#550, State 3)', async () => {
    // Real #550 path: an ACTIVE claude chat with switchable models, Flux off.
    ipcMock.getModelInfo.mockResolvedValue({ success: true, data: { modelInfo: CLAUDE_MODEL_INFO } });
    configGetMock.mockResolvedValue(null);
    ipcMock.curatedForAgent.mockResolvedValue(CLAUDE_CURATED);

    render(<AcpModelSelector conversationId='conv-550' backend='claude' />);
    await waitFor(() => expect(screen.getAllByText(/Opus 4.8/).length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText(/start a new chat and pick that agent/i)).toBeTruthy();
    });
  });

  it('suppresses the "start a new chat" notice when Flux is connected (Flux tiers ARE the keep-going path) (#550)', async () => {
    // Flux connected → the flyout surfaces Flux routing tiers, so the
    // "stays on Claude models / start a new chat" guidance would contradict them.
    ipcMock.getModelInfo.mockResolvedValue({ success: true, data: { modelInfo: CLAUDE_MODEL_INFO } });
    configGetMock.mockResolvedValue(null);
    ipcMock.curatedForAgent.mockResolvedValue(CLAUDE_CURATED);
    ipcMock.registryList.mockResolvedValue([{ providerId: 'flux-router' }]);

    render(<AcpModelSelector conversationId='conv-550-flux' backend='claude' />);
    await waitFor(() => expect(screen.getAllByText(/Opus 4.8/).length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button'));
    // Flux tier surfaces; the contradictory notice must NOT.
    await waitFor(() => expect(screen.getAllByText(/Flux/).length).toBeGreaterThan(0));
    expect(screen.queryByText(/start a new chat and pick that agent/i)).toBeNull();
  });

  it('renders the connected opencode-go catalog for the OpenCode agent instead of the first-connection tooltip (#407)', async () => {
    // #407: the OpenCode agent picker permanently showed "available after first
    // connection" even with opencode-go "Connected · N models". The process now
    // maps opencode->opencode-go so curatedForAgent('opencode') returns that
    // connected catalog; the picker must surface it as a selectable dropdown
    // (State 1b) rather than dead-ending on the tooltip.
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: { modelInfo: null },
    });
    configGetMock.mockResolvedValue(null);
    ipcMock.curatedForAgent.mockResolvedValue([
      {
        id: 'deepseek-v4-pro',
        providerId: 'opencode-go',
        displayName: 'DeepSeek V4 Pro',
        family: 'deepseek',
        enabled: true,
        recommended: true,
        costInPerM: 1,
        costOutPerM: 2,
      },
    ]);

    render(<AcpModelSelector conversationId='conv-opencode' backend='opencode' />);

    await waitFor(() => {
      expect(screen.getAllByText('common.defaultModel').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(FIRST_CONNECTION_LABEL)).toBeNull();

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('DeepSeek V4 Pro')).toBeTruthy();
    });

    // The backend is forwarded so the process derives the opencode catalog.
    expect(ipcMock.curatedForAgent).toHaveBeenCalledWith(expect.objectContaining({ agentKey: 'opencode' }));
  });

  it('shows the first-connection guidance only after the cache load completes with no models', async () => {
    // No cached catalog and no live models: a backend that has genuinely never
    // connected. After the cache lookup settles, the first-connection label shows.
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: { modelInfo: null },
    });
    configGetMock.mockResolvedValue(null);

    render(<AcpModelSelector conversationId='conv-empty' backend='goose' />);

    await waitFor(() => {
      expect(screen.getAllByText(FIRST_CONNECTION_LABEL).length).toBeGreaterThan(0);
    });
    // And it is NOT the neutral loading placeholder by that point.
    expect(screen.queryByText(LOADING_LABEL)).toBeNull();
  });
});
