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
    Message: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), loading: vi.fn(() => vi.fn()) },
  };
});

const mockExportAll = vi.fn();
const mockImportBackup = vi.fn();
vi.mock('@/common/adapter/ipcBridge', () => ({
  storage: {
    exportAll: { invoke: (...a: unknown[]) => mockExportAll(...a) },
    importBackup: { invoke: (...a: unknown[]) => mockImportBackup(...a) },
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

  /**
   * Desktop restore now goes through a confirmation dialog so the passphrase
   * can be collected (#1021): without one the importer silently drops the
   * archive's encrypted keys. Drive the dialog, then assert the outcome.
   */
  const confirmDesktopRestore = () => {
    fireEvent.click(screen.getByText('settings.storagePage.restore'));
    fireEvent.click(screen.getByText('settings.storagePage.restoreConfirm'));
  };

  it('reports the durable safety path after a desktop restore', async () => {
    mockImportBackup.mockResolvedValue({
      ok: true,
      safetyBackupPath: '/data/recovery/legacy-file-imports/pre-restore.zip',
      applied: ['config', 'conversations'],
    });
    render(<BackupCard />);

    confirmDesktopRestore();

    await waitFor(() => {
      expect(Message.success).toHaveBeenCalledWith('settings.storagePage.restoreAppliedWithSafety');
    });
  });

  it('surfaces a desktop restore failure instead of silently swallowing it', async () => {
    mockImportBackup.mockRejectedValue(new Error('disk full'));
    render(<BackupCard />);

    confirmDesktopRestore();

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.restoreFailed');
    });
  });

  // #1021: the archive read and staged cleanly and moved nothing, because the
  // reporter's chats, projects and keys all live in the primary database this
  // legacy export never covers. Claiming success here is silent data loss.
  it('never reports success when a desktop restore applied nothing', async () => {
    mockImportBackup.mockResolvedValue({
      ok: true,
      safetyBackupPath: '/data/recovery/legacy-file-imports/pre-restore.zip',
      applied: [],
      outOfScope: [],
      keysSkippedNoPassphrase: false,
      fileCount: 0,
    });
    render(<BackupCard />);

    confirmDesktopRestore();

    await waitFor(() => {
      expect(Message.warning).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'settings.storagePage.restoreNothingApplied' })
      );
    });
    expect(Message.success).not.toHaveBeenCalled();
  });

  it('says so when the archive carried keys the restore could not unlock', async () => {
    mockImportBackup.mockResolvedValue({
      ok: true,
      applied: ['config'],
      keysSkippedNoPassphrase: true,
      fileCount: 1,
    });
    render(<BackupCard />);

    confirmDesktopRestore();

    await waitFor(() => {
      expect(Message.warning).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'settings.storagePage.restoreKeysSkipped' })
      );
    });
    expect(Message.success).not.toHaveBeenCalled();
  });

  it('passes the entered passphrase through to the desktop importer', async () => {
    mockImportBackup.mockResolvedValue({ ok: true, applied: ['config', 'keys.json'] });
    render(<BackupCard />);

    fireEvent.click(screen.getByText('settings.storagePage.restore'));
    fireEvent.change(screen.getByPlaceholderText('settings.storagePage.restorePassphraseHint'), {
      target: { value: 'hunter2' },
    });
    fireEvent.click(screen.getByText('settings.storagePage.restoreConfirm'));

    await waitFor(() => {
      expect(mockImportBackup).toHaveBeenCalledWith({ passphrase: 'hunter2' });
    });
  });

  // The export offers "include API keys" on an install that has no legacy keys
  // file, so the archive it produces carries none. Saying "export created" and
  // nothing else is how the reporter of #1021 ended up with a keyless archive
  // they believed held their keys.
  it('warns when an export was asked for keys it could not find', async () => {
    mockExportAll.mockResolvedValue({
      ok: true,
      path: '/tmp/backup.zip',
      includesKeys: false,
      keysRequestedButAbsent: true,
    });
    render(<BackupCard />);

    fireEvent.click(screen.getByText('settings.storagePage.exportAll'));

    await waitFor(() => {
      expect(Message.warning).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'settings.storagePage.exportNoKeys' })
      );
    });
    expect(Message.success).not.toHaveBeenCalled();
  });
});
