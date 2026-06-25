/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression test for B4 bug S19: the destructive "Reset everything" handler
 * used `void storage.resetAll.invoke().finally(...)` with no `.catch()`, so a
 * rejecting wipe still closed the modal with no error surfaced - the user
 * believed their data was wiped when it was not. After the fix a rejection
 * shows an error toast and the confirm modal stays open.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key, i18n: { language: 'en-US' } }),
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Message: { success: vi.fn(), error: vi.fn(), loading: vi.fn(() => vi.fn()) },
  };
});

const mockResetAll = vi.fn();
vi.mock('@/common/adapter/ipcBridge', () => ({
  storage: { resetAll: { invoke: (...a: unknown[]) => mockResetAll(...a) } },
}));

// Stub the sibling cards - they are not under test and pull their own IPC.
vi.mock('@renderer/pages/settings/StorageSettings/UsageCard', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/settings/StorageSettings/DirectoriesCard', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/settings/StorageSettings/BackupCard', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/settings/StorageSettings/SyncCard', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/settings/components/SettingsPageShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { Message } from '@arco-design/web-react';
import StorageSettings from '@renderer/pages/settings/StorageSettings/index';

const openModalAndConfirm = () => {
  // Open the danger-zone modal via its trigger button.
  fireEvent.click(screen.getByText('settings.storagePage.resetAction'));
  // Type the confirmation phrase to enable the confirm button.
  const input = document.querySelector('input') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'reset' } });
  // The confirm button is the last element labelled with the reset action.
  const actions = screen.getAllByText('settings.storagePage.resetAction');
  fireEvent.click(actions[actions.length - 1]);
};

describe('StorageSettings reset error honesty (S19)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('surfaces an error toast and keeps the modal open when resetAll rejects', async () => {
    mockResetAll.mockRejectedValue(new Error('EPERM: database locked'));
    render(<StorageSettings />);

    openModalAndConfirm();

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.resetFailed');
    });
    // Modal stays open: the confirm-body text is still rendered.
    expect(screen.getByText('settings.storagePage.resetConfirmBody')).toBeTruthy();
  });

  it('closes the modal without an error when resetAll succeeds', async () => {
    mockResetAll.mockResolvedValue(undefined);
    render(<StorageSettings />);

    openModalAndConfirm();

    await waitFor(() => {
      expect(mockResetAll).toHaveBeenCalled();
    });
    expect(Message.error).not.toHaveBeenCalled();
  });
});
