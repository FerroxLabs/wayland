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

  /**
   * This asserted a REJECTION, and the bridge cannot carry one: `provider` calls
   * `fn(data).then(...)` with no `.catch`, and `invoke` is a `new Promise(resolve)`
   * with no reject, so a throwing provider leaves the renderer's await unsettled
   * forever. Executed: a resolving provider settles, a throwing one times out and
   * emits an unhandledRejection in main. The provider therefore returns its
   * failure, and this asserts the shape production actually emits (#1042 F1).
   */
  it('still shows an error toast when export fails', async () => {
    mockExportAll.mockResolvedValue({ ok: false, failed: true, errorCode: 'BACKUP_FAILED' });
    render(<BackupCard />);

    fireEvent.click(screen.getByText('settings.storagePage.exportAll'));

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.exportFailed');
    });
    expect(Message.success).not.toHaveBeenCalled();
  });

  // #1042 F2: ticking "include API keys" and leaving the passphrase blank made
  // backupExport throw, which the bridge dropped, so the Export button span
  // forever with nothing said. Name the actual mistake instead.
  it('names the missing passphrase when an export needed one', async () => {
    mockExportAll.mockResolvedValue({ ok: false, failed: true, errorCode: 'PASSPHRASE_REQUIRED' });
    render(<BackupCard />);

    fireEvent.click(screen.getByText('settings.storagePage.exportAll'));

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.exportPassphraseRequired');
    });
    expect(Message.success).not.toHaveBeenCalled();
  });

  // #1042 F2, second half: the combination cannot succeed, so stop the click.
  it('disables Export while API keys are requested with no passphrase', () => {
    render(<BackupCard />);
    const button = screen.getByText('settings.storagePage.exportAll').closest('button');

    expect(button).not.toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('settings.storagePage.exportAll').closest('button')).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('settings.storagePage.exportPassphrasePlaceholder'), {
      target: { value: 'hunter2' },
    });
    expect(screen.getByText('settings.storagePage.exportAll').closest('button')).not.toBeDisabled();
  });

  /**
   * Mutation M9 killer. On main `handleExport` had no `result.ok` check, so
   * cancelling the native save dialog showed "Legacy file export created" over a
   * file that was never written. Cancelling is not a failure either, so it must
   * produce NO toast at all.
   */
  it('says nothing at all when the native save dialog is cancelled', async () => {
    mockExportAll.mockResolvedValue({ ok: false });
    render(<BackupCard />);

    fireEvent.click(screen.getByText('settings.storagePage.exportAll'));

    await waitFor(() => expect(mockExportAll).toHaveBeenCalled());
    expect(Message.success).not.toHaveBeenCalled();
    expect(Message.error).not.toHaveBeenCalled();
    expect(Message.warning).not.toHaveBeenCalled();
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

  /**
   * #1042 F6. The private-network restriction is a fact about the WebUI route's
   * operator gate, not about restore. On desktop the archive comes from a native
   * file dialog, so showing it there reads to someone on an offline laptop as
   * "this will not work for me".
   */
  it('does not show the WebUI network restriction in the desktop restore dialog', () => {
    render(<BackupCard />);
    fireEvent.click(screen.getByText('settings.storagePage.restore'));

    // Known positive: the dialog's own warning IS rendered, so a missing network
    // clause is a real absence and not an unopened dialog.
    expect(screen.getByText('settings.storagePage.restoreWarning')).toBeInTheDocument();
    expect(screen.queryByText(/restoreWarningNetwork/)).toBeNull();
  });

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

  /**
   * Same correction as the export case above: this asserted a rejection the
   * bridge cannot transport, so it was green against a shape production never
   * emits - which is precisely why the hang shipped invisible (#1042 F1).
   */
  it('surfaces a desktop restore failure instead of silently swallowing it', async () => {
    mockImportBackup.mockResolvedValue({ ok: false, failed: true, errorCode: 'BACKUP_FAILED' });
    render(<BackupCard />);

    confirmDesktopRestore();

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.restoreFailed');
    });
  });

  /**
   * #1042 F1, the reported symptom. `decipher.final()` throws on a mistyped
   * passphrase; the bridge dropped that rejection, so the modal stayed open on
   * its spinner with no toast and the card's Restore button spun for the rest of
   * the session, even after Cancel. Name the wrong passphrase, and stop spinning.
   */
  it('names a mistyped backup passphrase and stops the spinner', async () => {
    mockImportBackup.mockResolvedValue({ ok: false, failed: true, errorCode: 'BAD_PASSPHRASE' });
    render(<BackupCard />);

    confirmDesktopRestore();

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.restoreBadPassphrase');
    });
    expect(Message.success).not.toHaveBeenCalled();
    const restoreButton = screen.getByText('settings.storagePage.restore').closest('button');
    await waitFor(() => expect(restoreButton?.className).not.toContain('arco-btn-loading'));
  });

  // Cancelling the native file picker is not a failure. It must stay silent, or
  // every cancelled restore reads as an error.
  it('says nothing at all when the restore file picker is cancelled', async () => {
    mockImportBackup.mockResolvedValue({ ok: false });
    render(<BackupCard />);

    confirmDesktopRestore();

    await waitFor(() => expect(mockImportBackup).toHaveBeenCalled());
    expect(Message.success).not.toHaveBeenCalled();
    expect(Message.error).not.toHaveBeenCalled();
    expect(Message.warning).not.toHaveBeenCalled();
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

  /**
   * #1042 F4. `applied.length === 0` was tested BEFORE `keysSkippedNoPassphrase`,
   * so a keys-only archive with no passphrase fell into restoreNothingApplied -
   * whose copy says the archive held no legacy files and that API keys live
   * somewhere a file export does not cover. Every clause of that is false here:
   * the keys ARE in the archive, one passphrase away. That is the same class of
   * harm as #1021 itself.
   */
  it('does not claim a keys-only archive was empty when no passphrase was given', async () => {
    mockImportBackup.mockResolvedValue({
      ok: true,
      safetyBackupPath: '/data/recovery/legacy-file-imports/pre-restore.zip',
      applied: [],
      outOfScope: [],
      keysSkippedNoPassphrase: true,
      fileCount: 0,
    });
    render(<BackupCard />);

    confirmDesktopRestore();

    await waitFor(() => {
      expect(Message.warning).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'settings.storagePage.restoreKeysOnlyNoPassphrase' })
      );
    });
    expect(Message.warning).not.toHaveBeenCalledWith(
      expect.objectContaining({ content: 'settings.storagePage.restoreNothingApplied' })
    );
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
