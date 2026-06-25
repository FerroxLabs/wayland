/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * S17 regression: the channels modal surface (rendered in the hosted WebUI and
 * the settings modal) hard-coded only 5 channels plus a Slack/Discord pair
 * falsely marked `coming_soon` + `disabled`, while ~18 other wired channels were
 * missing entirely. Slack and Discord are fully registered, wired and
 * auto-started, so showing them as "coming soon" is dishonest.
 *
 * After the fix the modal surfaces the real registered channel roster (the same
 * set the /settings/channels page shows). This test asserts:
 *   - Slack and Discord are present and NOT `coming_soon` / disabled.
 *   - The full long-tail roster (WhatsApp, Signal, Matrix, ...) is surfaced, so
 *     the list is far longer than the old 5 + 2.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, act, cleanup, screen } from '@testing-library/react';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === 'string' ? fallback : typeof fallback === 'object' ? key : (fallback ?? key),
    i18n: { language: 'en-US' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Message: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  };
});

const mockConfigStorageGet = vi.fn();
const mockConfigStorageSet = vi.fn();
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: (...args: unknown[]) => mockConfigStorageGet(...args),
    set: (...args: unknown[]) => mockConfigStorageSet(...args),
  },
}));

let mockProviders: Array<{ id: string; name: string; model: string[] }> = [];
vi.mock('@/renderer/hooks/agent/useModelProviderList', () => ({
  useModelProviderList: () => ({
    providers: mockProviders,
    geminiModeLookup: new Map(),
    getAvailableModels: () => [],
    formatModelLabel: (_p: unknown, m?: string) => m || '',
  }),
}));

vi.mock('@/renderer/pages/conversation/platforms/gemini/useGeminiModelSelection', () => ({
  useGeminiModelSelection: ({ initialModel }: { initialModel: unknown }) => ({
    currentModel: initialModel,
    providers: mockProviders,
    geminiModeLookup: new Map(),
    formatModelLabel: () => '',
    getDisplayModelName: () => '',
    getAvailableModels: () => [],
    handleSelectModel: vi.fn(),
  }),
}));

vi.mock('@/common/adapter/ipcBridge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/common/adapter/ipcBridge')>();
  return {
    ...actual,
    channel: {
      getPluginStatus: { invoke: vi.fn().mockResolvedValue({ success: true, data: [] }) },
      pluginStatusChanged: { on: vi.fn().mockReturnValue(() => {}) },
    },
    webui: {
      getStatus: { invoke: vi.fn().mockResolvedValue({ success: false }) },
    },
  };
});

vi.mock('@/renderer/components/base/WaylandScrollArea', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../src/renderer/components/settings/SettingsModal/settingsViewContext', () => ({
  useSettingsViewMode: () => 'modal',
}));

// Expose the fields under test (status + disabled) on each rendered channel so
// the assertions can read them directly.
vi.mock('../../src/renderer/components/settings/SettingsModal/contents/channels/ChannelItem', () => ({
  default: ({ channel }: { channel: { id: string; title: string; status: string; disabled?: boolean } }) => (
    <div
      data-testid={`channel-${channel.id}`}
      data-status={channel.status}
      data-disabled={channel.disabled ? 'true' : 'false'}
    >
      {channel.title}
    </div>
  ),
}));

vi.mock('../../src/renderer/components/settings/SettingsModal/contents/channels/TelegramConfigForm', () => ({
  default: () => <div>TelegramForm</div>,
}));
vi.mock('../../src/renderer/components/settings/SettingsModal/contents/channels/LarkConfigForm', () => ({
  default: () => <div>LarkForm</div>,
}));
vi.mock('../../src/renderer/components/settings/SettingsModal/contents/channels/DingTalkConfigForm', () => ({
  default: () => <div>DingTalkForm</div>,
}));
vi.mock('../../src/renderer/components/settings/SettingsModal/contents/channels/WeixinConfigForm', () => ({
  default: () => <div>WeixinForm</div>,
}));
vi.mock('../../src/renderer/components/settings/SettingsModal/contents/channels/WecomConfigForm', () => ({
  default: () => <div>WecomForm</div>,
}));

describe('ChannelModalContent registered channel roster (S17)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProviders = [];
    mockConfigStorageGet.mockResolvedValue(null);
  });

  afterEach(async () => {
    cleanup();
    await act(async () => {
      for (let i = 0; i < 10; i++) await Promise.resolve();
    });
  });

  it('surfaces Slack and Discord as real (not coming_soon, not disabled) channels', async () => {
    const { default: ChannelModalContent } =
      await import('@/renderer/components/settings/SettingsModal/contents/channels/ChannelModalContent');

    await act(async () => {
      render(<ChannelModalContent />);
    });

    const slack = screen.getByTestId('channel-slack');
    const discord = screen.getByTestId('channel-discord');

    // The core of the bug: these were `coming_soon` + disabled despite being wired.
    expect(slack.getAttribute('data-status')).not.toBe('coming_soon');
    expect(slack.getAttribute('data-disabled')).toBe('false');
    expect(discord.getAttribute('data-status')).not.toBe('coming_soon');
    expect(discord.getAttribute('data-disabled')).toBe('false');
  });

  it('surfaces the wider registered roster, not just 5 + Slack/Discord', async () => {
    const { default: ChannelModalContent } =
      await import('@/renderer/components/settings/SettingsModal/contents/channels/ChannelModalContent');

    await act(async () => {
      render(<ChannelModalContent />);
    });

    // A sampling of channels that were entirely missing before the fix.
    for (const id of ['whatsapp', 'signal', 'matrix', 'webhook', 'line']) {
      expect(screen.getByTestId(`channel-${id}`)).toBeTruthy();
    }

    // Far more than the old 5 built-ins + 2 hardcoded entries.
    const all = screen.getAllByTestId(/^channel-/);
    expect(all.length).toBeGreaterThan(10);
  });
});
