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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | { defaultValue?: string }) => {
      if (typeof fallback === 'string') return fallback || key;
      if (fallback && typeof fallback === 'object' && fallback.defaultValue) return fallback.defaultValue;
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
    // Reset per-test: clearAllMocks() wipes calls but NOT implementations, so a
    // test that connects Flux (registryList -> flux-router) would otherwise leak
    // "Flux connected" into later tests. Default every test to Flux disconnected.
    ipcMock.registryList.mockResolvedValue([]);
    ipcMock.setModel.mockResolvedValue({
      success: true,
      data: { modelInfo: null },
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
        },
      },
    });

    render(<AcpModelSelector conversationId='conv-1' backend='claude' />);

    await waitFor(() => {
      expect(screen.getAllByText('Claude Opus 4.6 · cc-switch').length).toBeGreaterThan(0);
    });
  });

  it('shows codex stream as the model source when stream events arrive', async () => {
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

    await waitFor(() => {
      expect(screen.getAllByText('gpt-5.4/high').length).toBeGreaterThan(0);
    });
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

  it('updates the visible model label immediately after selecting a different model', async () => {
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
        },
      },
    });
    ipcMock.setModel.mockResolvedValue({
      success: true,
      data: {
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

  it('renders the cached catalog (no first-connection tooltip) when ConfigStorage has cached models', async () => {
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

    // The cached current model surfaces in the compact label...
    await waitFor(() => {
      expect(screen.getAllByText('Qwen Max').length).toBeGreaterThan(0);
    });
    // ...and the misleading "first connection" guidance is never shown.
    expect(screen.queryByText(FIRST_CONNECTION_LABEL)).toBeNull();
  });

  it('shows Claude Code current model + switch list immediately on a new chat (no first-connection tooltip)', async () => {
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

    // Current model surfaces in the compact label immediately.
    await waitFor(() => {
      expect(screen.getAllByText('Claude Opus 4.8 · cc-switch').length).toBeGreaterThan(0);
    });
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
