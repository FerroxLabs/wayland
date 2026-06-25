/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression test for B4 bug F5: the "Export All" handler had an error catch
 * but no success confirmation, so a successful backup gave the user no
 * feedback. After the fix a success toast is shown on a successful export and
 * still an error toast on failure.
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
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en-US' } }),
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Message: { success: vi.fn(), error: vi.fn(), loading: vi.fn(() => vi.fn()) },
  };
});

const mockExportAll = vi.fn();
vi.mock('@/common/adapter/ipcBridge', () => ({
  storage: {
    exportAll: { invoke: (...a: unknown[]) => mockExportAll(...a) },
    importBackup: { invoke: vi.fn().mockResolvedValue(undefined) },
  },
}));

vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => true }));
vi.mock('@renderer/services/StorageService', () => ({
  exportBackupHttp: vi.fn(),
  restoreBackupHttp: vi.fn(),
}));

import { Message } from '@arco-design/web-react';
import BackupCard from '@renderer/pages/settings/StorageSettings/BackupCard';

describe('BackupCard export feedback (F5)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a success toast after a successful export', async () => {
    mockExportAll.mockResolvedValue({ ok: true, path: '/tmp/backup.zip' });
    render(<BackupCard />);

    fireEvent.click(screen.getByText('settings.storagePage.exportAll'));

    await waitFor(() => {
      expect(Message.success).toHaveBeenCalledWith('settings.storagePage.exportSuccess');
    });
    expect(Message.error).not.toHaveBeenCalled();
  });

  it('still shows an error toast when export fails', async () => {
    mockExportAll.mockRejectedValue(new Error('disk full'));
    render(<BackupCard />);

    fireEvent.click(screen.getByText('settings.storagePage.exportAll'));

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.exportFailed');
    });
    expect(Message.success).not.toHaveBeenCalled();
  });
});
