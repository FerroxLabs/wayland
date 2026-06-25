/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression tests for B4 bugs S20 + F4: the Sync card action buttons
 * ("Disable" / "Sync now") used to have no try/catch and no Message import, so
 * a rejecting IPC produced an unhandled rejection with no user feedback. After
 * the fix both handlers surface success on success and an error toast on
 * failure.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Arco's responsive observer needs matchMedia in jsdom.
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
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en-US' } }),
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Message: { success: vi.fn(), error: vi.fn(), loading: vi.fn(() => vi.fn()) },
  };
});

const mockForceSync = vi.fn();
const mockDisable = vi.fn();

vi.mock('@/common/adapter/ipcBridge', () => ({
  sync: {
    forceSync: { invoke: (...a: unknown[]) => mockForceSync(...a) },
    disable: { invoke: (...a: unknown[]) => mockDisable(...a) },
  },
}));

const refresh = vi.fn().mockResolvedValue(undefined);
vi.mock('@renderer/hooks/useSyncStatus', () => ({
  useSyncStatus: () => ({ status: { enabled: true, lastSync: 0, itemsCount: 3 }, loading: false, refresh }),
}));

// Keep the desktop button as a plain pass-through button.
vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => true }));

import { Message } from '@arco-design/web-react';
import SyncCard from '@renderer/pages/settings/StorageSettings/SyncCard';

describe('SyncCard action error honesty (S20 + F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refresh.mockResolvedValue(undefined);
  });

  it('shows an error toast when "Sync now" rejects (F4)', async () => {
    mockForceSync.mockRejectedValue(new Error('network down'));
    render(<SyncCard />);

    fireEvent.click(screen.getByText('settings.storagePage.sync.syncNow'));

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.sync.syncNowFailed');
    });
    expect(Message.success).not.toHaveBeenCalled();
  });

  it('shows a success toast when "Sync now" resolves (F4)', async () => {
    mockForceSync.mockResolvedValue({ pulled: 1, pushed: 0 });
    render(<SyncCard />);

    fireEvent.click(screen.getByText('settings.storagePage.sync.syncNow'));

    await waitFor(() => {
      expect(Message.success).toHaveBeenCalledWith('settings.storagePage.sync.syncNowSuccess');
    });
  });

  it('shows an error toast when "Disable" rejects instead of silently failing (S20)', async () => {
    mockDisable.mockRejectedValue(new Error('disable failed'));
    render(<SyncCard />);

    // Open the confirm dialog, then confirm.
    fireEvent.click(screen.getByText('settings.storagePage.sync.disableButton'));
    // The confirm button carries the same label inside the dialog footer.
    const confirmButtons = screen.getAllByText('settings.storagePage.sync.disableButton');
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.sync.disableFailed');
    });
  });
});
