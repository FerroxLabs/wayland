/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1042 F5: the WebUI half of #1021.
 *
 * The desktop branch was taught to report what a restore actually applied. The
 * browser branch was not: it showed `restoreSuccess` unconditionally, over an
 * HTTP route that discarded the ImportReport. So a WebUI user restoring an
 * archive from a modern install still got a confident "Restore complete" over a
 * no-op, which is verbatim the reported bug. Both surfaces now share one
 * reporter, so they cannot drift apart again.
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

vi.mock('@/common/adapter/ipcBridge', () => ({
  storage: { exportAll: { invoke: vi.fn() }, importBackup: { invoke: vi.fn() } },
}));

// The browser surface, not the desktop one. This is the branch the fix missed.
vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => false }));

const mockRestoreHttp = vi.fn();
vi.mock('@renderer/services/StorageService', () => ({
  exportBackupHttp: vi.fn(),
  restoreBackupHttp: (...a: unknown[]) => mockRestoreHttp(...a),
}));

import { Message } from '@arco-design/web-react';
import BackupCard from '@renderer/pages/settings/StorageSettings/BackupCard';

describe('BackupCard WebUI restore reporting (#1021, #1042 F5)', () => {
  beforeEach(() => vi.clearAllMocks());

  /** The browser dialog needs a chosen file and the step-up password before Restore. */
  const confirmWebuiRestore = () => {
    fireEvent.click(screen.getByText('settings.storagePage.restore'));
    // The Arco Modal renders through a portal, so this is looked up on the
    // document, not on the render container.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Known positive for the harness: the browser branch must actually render its
    // file picker, or the assertions below would never reach the request.
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput, { target: { files: [new File(['zip'], 'legacy.zip')] } });
    fireEvent.change(screen.getByPlaceholderText('settings.storagePage.restorePasswordHint'), {
      target: { value: 'operator-pw' },
    });
    fireEvent.click(screen.getByText('settings.storagePage.restoreConfirm'));
  };

  it('never reports success when a WebUI restore applied nothing', async () => {
    mockRestoreHttp.mockResolvedValue({
      safetyBackupPath: '/data/recovery/legacy-file-imports/pre-restore.zip',
      applied: [],
      outOfScope: [],
      keysSkippedNoPassphrase: false,
      fileCount: 0,
    });
    render(<BackupCard />);

    confirmWebuiRestore();

    await waitFor(() => {
      expect(Message.warning).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'settings.storagePage.restoreNothingApplied' })
      );
    });
    expect(Message.success).not.toHaveBeenCalled();
  });

  it('names what a WebUI restore applied instead of a flat success', async () => {
    mockRestoreHttp.mockResolvedValue({
      safetyBackupPath: '/data/recovery/legacy-file-imports/pre-restore.zip',
      applied: ['config', 'conversations'],
      keysSkippedNoPassphrase: false,
      fileCount: 4,
    });
    render(<BackupCard />);

    confirmWebuiRestore();

    await waitFor(() => {
      expect(Message.success).toHaveBeenCalledWith('settings.storagePage.restoreAppliedWithSafety');
    });
    expect(Message.warning).not.toHaveBeenCalled();
  });

  it('tells a WebUI user their keys-only archive needs its passphrase', async () => {
    mockRestoreHttp.mockResolvedValue({
      applied: [],
      keysSkippedNoPassphrase: true,
      fileCount: 0,
    });
    render(<BackupCard />);

    confirmWebuiRestore();

    await waitFor(() => {
      expect(Message.warning).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'settings.storagePage.restoreKeysOnlyNoPassphrase' })
      );
    });
    expect(Message.success).not.toHaveBeenCalled();
  });

  it('still maps a denied WebUI restore to its own message', async () => {
    mockRestoreHttp.mockRejectedValue(new Error('RESTORE_NOT_OPERATOR'));
    render(<BackupCard />);

    confirmWebuiRestore();

    await waitFor(() => {
      expect(Message.error).toHaveBeenCalledWith('settings.storagePage.restoreNotOperator');
    });
    expect(Message.success).not.toHaveBeenCalled();
  });
});
