/**
 * DOM tests for EmailImapConfigForm rehydration (#548).
 *
 * On reopen the form must repopulate its non-secret fields from the saved
 * config (previously it always mounted blank) and, because the app password
 * never leaves main, show the "saved - leave blank to keep" placeholder driven
 * purely by the `secretPresence` flag.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const { mockGetPluginConfig } = vi.hoisted(() => ({
  mockGetPluginConfig: vi.fn(async () => ({
    success: true,
    data: {
      id: 'email-imap',
      type: 'email-imap',
      enabled: true,
      status: 'running',
      config: {
        imapHost: 'imap.ethereal.email',
        imapPort: 993,
        imapUser: 'me@ethereal.email',
        imapTls: true,
        useSameAuth: true,
        smtpHost: 'smtp.ethereal.email',
        smtpPort: 587,
        smtpTls: true,
      },
      secretPresence: { imapPassword: true },
    },
  })),
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

// Mock i18next: t returns the default string (2nd arg) so assertions read plainly.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

// Channel IPC bridge - only getPluginConfig is exercised on mount.
vi.mock('@/common/adapter/ipcBridge', () => ({
  channel: {
    getPluginConfig: { invoke: mockGetPluginConfig },
    testPlugin: { invoke: vi.fn(async () => ({ success: true, data: { success: true } })) },
    enablePlugin: { invoke: vi.fn(async () => ({ success: true })) },
  },
}));

// Model selector pulls in ConfigStorage / ACP deps we don't need here.
vi.mock('@/renderer/components/settings/shared/forms/ChannelAgentModelSelector', () => ({
  default: () => <div data-testid='model-selector' />,
}));

import EmailImapConfigForm from '@/renderer/components/settings/SettingsModal/contents/channels/email/EmailImapConfigForm';

const noopModelSelection = {
  currentModel: undefined,
  isLoading: false,
  onSelectModel: vi.fn(),
} as any;

describe('EmailImapConfigForm rehydration (#548)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('repopulates non-secret fields from the saved config on open', async () => {
    render(<EmailImapConfigForm pluginStatus={null} modelSelection={noopModelSelection} onStatusChange={vi.fn()} />);

    // Fields are identified by their (stable) placeholders; values are the
    // rehydrated saved config.
    const imapHost = screen.getByPlaceholderText('imap.gmail.com') as HTMLInputElement;
    await waitFor(() => expect(imapHost.value).toBe('imap.ethereal.email'));

    const imapUser = screen.getByPlaceholderText('agent@example.com') as HTMLInputElement;
    expect(imapUser.value).toBe('me@ethereal.email');

    const smtpHost = screen.getByPlaceholderText('smtp.gmail.com') as HTMLInputElement;
    expect(smtpHost.value).toBe('smtp.ethereal.email');

    expect(mockGetPluginConfig).toHaveBeenCalledWith({ pluginId: 'email-imap' });
  });

  it('shows the saved-password placeholder from secretPresence without populating the secret', async () => {
    render(<EmailImapConfigForm pluginStatus={null} modelSelection={noopModelSelection} onStatusChange={vi.fn()} />);

    // The presence flag flips the password placeholder to the "keep" hint; the
    // secret itself is never sent to the renderer, so the input stays empty.
    const savedPassword = await screen.findByPlaceholderText('Saved - leave blank to keep');
    expect((savedPassword as HTMLInputElement).value).toBe('');
  });
});
