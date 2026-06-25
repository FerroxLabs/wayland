/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const ipcMock = vi.hoisted(() => ({
  getModelInfo: vi.fn(),
  setModel: vi.fn(),
  onResponseStream: vi.fn(() => () => {}),
  getModelConfig: vi.fn().mockResolvedValue([]),
  registryList: vi.fn(),
  registryListChanged: vi.fn(() => () => {}),
  // The unified flyout's view model resolves the curated catalog + recent usage.
  // These vendor/native cases return [] so `hasCuratedModels` is false and the
  // native Arco menu (Flux tiers + the agent's own models) is exercised.
  curatedForAgent: vi.fn().mockResolvedValue([]),
  queryRecentlyUsedModels: vi.fn().mockResolvedValue([]),
}));

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
    // useModelEffort reads/writes per-conversation effort.
    conversation: {
      get: { invoke: vi.fn().mockResolvedValue(null) },
      update: { invoke: vi.fn().mockResolvedValue(true) },
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

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

vi.mock('swr', () => ({
  default: () => ({ data: [], error: undefined, mutate: vi.fn() }),
}));

import { MemoryRouter } from 'react-router-dom';
import AcpModelSelector from '../../../src/renderer/components/agent/AcpModelSelector';

/** AcpModelSelector now calls `useNavigate` (Manage models footer), so render under a Router. */
const renderSelector = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

const NATIVE_INFO = {
  success: true,
  data: {
    modelInfo: {
      currentModelId: 'qwen-max',
      currentModelLabel: 'Qwen Max',
      availableModels: [
        { id: 'qwen-max', label: 'Qwen Max' },
        { id: 'qwen-turbo', label: 'Qwen Turbo' },
      ],
      canSwitch: true,
      source: 'models',
      sourceDetail: 'acp-models',
    },
  },
};

describe('AcpModelSelector - Flux models in the ACP picker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ipcMock.onResponseStream.mockImplementation(() => () => {});
    ipcMock.registryListChanged.mockImplementation(() => () => {});
    ipcMock.getModelConfig.mockResolvedValue([]);
    ipcMock.setModel.mockResolvedValue({ success: true, data: { modelInfo: null } });
  });

  it('shows Flux models at the top for a Flux-capable backend when Flux is connected', async () => {
    ipcMock.getModelInfo.mockResolvedValue(NATIVE_INFO);
    // flux-router is a connected provider.
    ipcMock.registryList.mockResolvedValue([{ providerId: 'flux-router' }]);

    renderSelector(<AcpModelSelector conversationId='conv-1' backend='qwen' />);

    await waitFor(() => {
      expect(screen.getAllByText('Qwen Max').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Flux Auto')).toBeTruthy();
    });
    // All four Flux tiers appear, plus the native models remain.
    expect(screen.getByText('Flux Reasoning')).toBeTruthy();
    expect(screen.getByText('Flux Standard')).toBeTruthy();
    expect(screen.getByText('Flux Fast')).toBeTruthy();
    expect(screen.getByText('Qwen Turbo')).toBeTruthy();
  });

  it('does NOT show Flux models for a vendor backend even when Flux is connected', async () => {
    ipcMock.getModelInfo.mockResolvedValue({
      success: true,
      data: {
        modelInfo: {
          currentModelId: 'copilot-model',
          currentModelLabel: 'Copilot Model',
          availableModels: [{ id: 'copilot-model', label: 'Copilot Model' }],
          canSwitch: true,
          source: 'models',
          sourceDetail: 'acp-models',
        },
      },
    });
    ipcMock.registryList.mockResolvedValue([{ providerId: 'flux-router' }]);

    // `copilot` has fluxCompat: 'vendor' - not Flux-capable.
    renderSelector(<AcpModelSelector conversationId='conv-2' backend='copilot' />);

    await waitFor(() => {
      expect(screen.getAllByText('Copilot Model').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getAllByText('Copilot Model').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Flux Auto')).toBeNull();
  });

  it('does NOT show Flux models for a Flux-capable backend when Flux is NOT connected', async () => {
    ipcMock.getModelInfo.mockResolvedValue(NATIVE_INFO);
    ipcMock.registryList.mockResolvedValue([]); // no flux-router provider

    renderSelector(<AcpModelSelector conversationId='conv-3' backend='qwen' />);

    await waitFor(() => {
      expect(screen.getAllByText('Qwen Max').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Qwen Turbo')).toBeTruthy();
    });
    expect(screen.queryByText('Flux Auto')).toBeNull();
  });

  it('selecting a Flux model sets the chat model id to the flux id', async () => {
    ipcMock.getModelInfo.mockResolvedValue(NATIVE_INFO);
    ipcMock.registryList.mockResolvedValue([{ providerId: 'flux-router' }]);

    renderSelector(<AcpModelSelector conversationId='conv-4' backend='qwen' />);

    await waitFor(() => {
      expect(screen.getAllByText('Qwen Max').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Flux Auto')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Flux Auto'));

    await waitFor(() => {
      expect(ipcMock.setModel).toHaveBeenCalledWith({ conversationId: 'conv-4', modelId: 'flux-auto' });
    });
    // Button reflects the selected Flux tier.
    await waitFor(() => {
      expect(screen.getAllByText('Flux Auto').length).toBeGreaterThan(0);
    });
  });
});
