/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * C8 Q2 build condition: `<provider>:<model>` colon ids (e.g.
 * `openai:gpt-5.6-terra`) must round-trip through the ACP model picker
 * untouched - advertise -> render -> select -> `session/set_model` echo -
 * while the picker displays the human-friendly `name`. wnano advertises
 * non-Flux models with namespaced ids so its Rust side can route
 * unambiguously; Desktop must never parse, split, or rewrite them.
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const ipcMock = vi.hoisted(() => ({
  getModelInfo: vi.fn(),
  setModel: vi.fn(),
  onResponseStream: vi.fn(() => () => {}),
  getModelConfig: vi.fn().mockResolvedValue([]),
  curatedForAgent: vi.fn().mockResolvedValue([]),
  queryRecentlyUsedModels: vi.fn().mockResolvedValue([]),
  registryList: vi.fn().mockResolvedValue([]),
  registryListChanged: vi.fn(() => () => {}),
  conversationGet: vi.fn().mockResolvedValue(null),
  conversationUpdate: vi.fn().mockResolvedValue(true),
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
    conversation: {
      get: { invoke: ipcMock.conversationGet },
      update: { invoke: ipcMock.conversationUpdate },
    },
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  modelRegistry: {
    list: { invoke: ipcMock.registryList },
    listChanged: { on: ipcMock.registryListChanged },
    curatedForAgent: { invoke: ipcMock.curatedForAgent },
  },
}));

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

import AcpModelSelector from '../../src/renderer/components/agent/AcpModelSelector';

const COLON_ID = 'openai:gpt-5.6-terra';
const COLON_LABEL = 'GPT-5.6 Terra (OpenAI)';

/** The models block wnano advertises on session/new: bare Flux id + colon ids. */
const WNANO_MODEL_INFO = {
  currentModelId: 'flux-auto',
  currentModelLabel: 'Flux Auto',
  availableModels: [
    { id: 'flux-auto', label: 'Flux Auto' },
    { id: COLON_ID, label: COLON_LABEL },
    { id: 'anthropic:claude-opus-4-8', label: 'Claude Opus 4.8 (Anthropic)' },
  ],
  canSwitch: true,
  source: 'models',
  sourceDetail: 'wnano',
};

describe('AcpModelSelector wnano colon-id round-trip (C8 Q2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ipcMock.getModelConfig.mockResolvedValue([]);
    ipcMock.registryList.mockResolvedValue([]);
    ipcMock.getModelInfo.mockResolvedValue({ success: true, data: { modelInfo: WNANO_MODEL_INFO } });
    // The agent echoes the pick back unchanged (session/set_model response).
    ipcMock.setModel.mockResolvedValue({
      success: true,
      data: { modelInfo: { ...WNANO_MODEL_INFO, currentModelId: COLON_ID, currentModelLabel: COLON_LABEL } },
    });
  });

  it('sends session/set_model with the exact colon id, untouched', async () => {
    render(<AcpModelSelector conversationId='conv-wnano' backend='wnano' />);

    await waitFor(() => {
      expect(screen.getAllByText(/Flux Auto/).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText(COLON_LABEL)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(COLON_LABEL));

    await waitFor(() => {
      expect(ipcMock.setModel).toHaveBeenCalledWith({ conversationId: 'conv-wnano', modelId: COLON_ID });
    });
  });

  it('displays the human-friendly name, not the raw colon id', async () => {
    render(<AcpModelSelector conversationId='conv-wnano' backend='wnano' />);

    await waitFor(() => {
      expect(screen.getAllByText(/Flux Auto/).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText(COLON_LABEL)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(COLON_LABEL));

    // After the agent echoes the pick, the friendly label is what renders -
    // the raw colon id never becomes the visible label.
    await waitFor(() => {
      expect(screen.getAllByText(new RegExp(COLON_LABEL.replace(/[()]/g, (c) => `\\${c}`))).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(COLON_ID)).toBeNull();
  });

  it('renders every advertised colon id as a selectable row (ids never parsed or split)', async () => {
    render(<AcpModelSelector conversationId='conv-wnano' backend='wnano' />);

    await waitFor(() => {
      expect(screen.getAllByText(/Flux Auto/).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText(COLON_LABEL)).toBeTruthy();
      expect(screen.getByText('Claude Opus 4.8 (Anthropic)')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Claude Opus 4.8 (Anthropic)'));

    await waitFor(() => {
      expect(ipcMock.setModel).toHaveBeenCalledWith({
        conversationId: 'conv-wnano',
        modelId: 'anthropic:claude-opus-4-8',
      });
    });
  });
});
