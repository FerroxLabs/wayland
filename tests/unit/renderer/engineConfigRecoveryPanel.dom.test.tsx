/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #1024 - the in-app recovery panel.
 *
 * What is pinned here, because each of these is a way the fix could silently
 * regress into the dead end the issue was filed about:
 *  - the failure renders LINE and COLUMN numbers and the PATH, and no file content;
 *  - "Show me the file" is present in EVERY state, including when the app did not
 *    understand the failure - it is the no-risk escape hatch;
 *  - the repair button is offered only when main reported an unambiguous fix;
 *  - clicking "Start over" does NOT call `regenerate`; only the confirmation does,
 *    and it passes `confirmed: true`;
 *  - a `backup-failed` result is reported as "nothing was changed" - unless it
 *    NAMES a backup, which means `config.toml` is gone and that line would be false;
 *  - a REJECTED bridge call (what all four channels do on the remote WebUI
 *    transport, where they are correctly remote-denied) surfaces as an outcome
 *    line instead of an unhandled rejection;
 *  - the resolved PATH is shown in every state, not only `invalid`, so the
 *    Doctor-vs-panel path mismatch (F5) is visible rather than silently confusing;
 *  - a not-valid-UTF-8 config offers NO automatic repair.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const stableT = (key: string, opts?: Record<string, unknown>) => (opts ? `${key}|${JSON.stringify(opts)}` : key);
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: stableT }) }));

vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) =>
    React.createElement('button', { onClick, disabled }, children),
  Spin: () => React.createElement('div', null, 'spin'),
}));

vi.mock('lucide-react', () => {
  const Icon = () => React.createElement('span');
  return { FileSearch: Icon, FolderOpen: Icon, RotateCcw: Icon, Wrench: Icon };
});

// A stand-in for the shared ConfirmDialog that exposes its onConfirm as its own
// button, so the test can prove the destructive call happens ONLY there.
vi.mock('@renderer/components/settings/shared', () => ({
  ConfirmDialog: ({ open, onConfirm, body }: { open: boolean; onConfirm: () => void; body: string }) =>
    open
      ? React.createElement('div', { 'data-testid': 'confirm' }, [
          React.createElement('span', { key: 'b' }, body),
          React.createElement('button', { key: 'c', onClick: onConfirm }, 'confirm'),
        ])
      : null,
}));

const mockInspect = vi.fn();
const mockRepair = vi.fn();
const mockRegenerate = vi.fn();
const mockReveal = vi.fn();

vi.mock('@/common/adapter/ipcBridge', () => ({
  engineConfigRecovery: {
    inspect: { invoke: () => mockInspect() },
    repair: { invoke: () => mockRepair() },
    regenerate: { invoke: (p: unknown) => mockRegenerate(p) },
    reveal: { invoke: () => mockReveal() },
  },
}));

import EngineConfigRecoveryPanel from '@renderer/components/activation/EngineConfigRecoveryPanel';

const INVALID = {
  status: 'invalid' as const,
  path: '/Users/someone/Library/Application Support/wayland-core/config.toml',
  problem: { line: 5, column: 11, reason: 'Invalid TOML document: invalid value' },
  repair: { lineBreaks: 1 },
};

beforeEach(() => {
  mockInspect.mockReset();
  mockRepair.mockReset();
  mockRegenerate.mockReset();
  mockReveal.mockReset();
  mockReveal.mockResolvedValue({ ok: true });
});

describe('EngineConfigRecoveryPanel', () => {
  it('renders the line, column and path, and no file content', async () => {
    mockInspect.mockResolvedValue(INVALID);
    const { container } = render(<EngineConfigRecoveryPanel />);

    await waitFor(() => expect(screen.getByTestId('engine-config-repair')).toBeTruthy());
    const text = container.textContent ?? '';
    expect(text).toContain('"line":5');
    expect(text).toContain('"column":11');
    expect(text).toContain(INVALID.path);
    // Content-bearing shapes must never appear: the payload carries none, and the
    // panel has no other source for them.
    expect(text).not.toContain('sk-ant');
    expect(text).not.toContain('egress_allow');
    expect(text).not.toContain('api_key');
  });

  it('always offers the reveal escape hatch, even when the config parses', async () => {
    mockInspect.mockResolvedValue({ status: 'ok', path: '/tmp/config.toml' });
    const { container } = render(<EngineConfigRecoveryPanel />);
    await waitFor(() => expect(screen.getByTestId('engine-config-reveal')).toBeTruthy());
    // No repair and no destructive action are offered when there is no problem.
    expect(screen.queryByTestId('engine-config-repair')).toBeNull();
    expect(screen.queryByTestId('engine-config-regenerate')).toBeNull();
    // F5: which file was inspected must be visible even in the `ok` state - the
    // Doctor row may have failed against a DIFFERENT path.
    expect(container.textContent).toContain('/tmp/config.toml');
  });

  it('F5: shows the inspected path in the missing state too', async () => {
    mockInspect.mockResolvedValue({ status: 'missing', path: '/tmp/named-profile/config.toml' });
    const { container } = render(<EngineConfigRecoveryPanel />);
    await waitFor(() => expect(screen.getByTestId('engine-config-reveal')).toBeTruthy());
    expect(container.textContent).toContain('/tmp/named-profile/config.toml');
  });

  it('offers no automatic repair for a file that is not valid UTF-8', async () => {
    mockInspect.mockResolvedValue({
      status: 'invalid',
      path: INVALID.path,
      encodingLossy: true,
      repair: null,
    });
    const { container } = render(<EngineConfigRecoveryPanel />);
    await waitFor(() => expect(screen.getByTestId('engine-config-reveal')).toBeTruthy());
    expect(screen.queryByTestId('engine-config-repair')).toBeNull();
    // Regenerate stays available - it is the only in-app way out of a file
    // Wayland cannot even read as text.
    expect(screen.getByTestId('engine-config-regenerate')).toBeTruthy();
    expect(container.textContent).toContain('engineConfigInvalid.notText');
    expect(container.textContent).toContain('repair.notTextUnavailable');
  });

  it('offers reveal but no repair when main found no unambiguous fix', async () => {
    mockInspect.mockResolvedValue({ ...INVALID, repair: null });
    render(<EngineConfigRecoveryPanel />);
    await waitFor(() => expect(screen.getByTestId('engine-config-reveal')).toBeTruthy());
    expect(screen.queryByTestId('engine-config-repair')).toBeNull();
    // The destructive option is still there - it is the only other way out.
    expect(screen.getByTestId('engine-config-regenerate')).toBeTruthy();
  });

  it('runs the repair and reports the backup filename', async () => {
    mockInspect.mockResolvedValueOnce(INVALID).mockResolvedValue({ status: 'ok', path: INVALID.path });
    mockRepair.mockResolvedValue({ ok: true, backupPath: '/x/config.toml.backup-20260817-142530' });
    const onRecovered = vi.fn();
    render(<EngineConfigRecoveryPanel onRecovered={onRecovered} />);

    await waitFor(() => expect(screen.getByTestId('engine-config-repair')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-repair').querySelector('button')!);

    await waitFor(() => expect(mockRepair).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.repaired'));
    expect(screen.getByTestId('engine-config-outcome').textContent).toContain('config.toml.backup-20260817-142530');
    expect(onRecovered).toHaveBeenCalledTimes(1);
  });

  it('reports a failed backup as "nothing was changed"', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockRepair.mockResolvedValue({ ok: false, reason: 'backup-failed', detail: 'EACCES' });
    const onRecovered = vi.fn();
    render(<EngineConfigRecoveryPanel onRecovered={onRecovered} />);

    await waitFor(() => expect(screen.getByTestId('engine-config-repair')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-repair').querySelector('button')!);

    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.backupFailed')
    );
    expect(onRecovered).not.toHaveBeenCalled();
  });

  /**
   * F3. The rollback-failure and restore-conflict branches are the ONLY reported
   * states in which `config.toml` may not hold the user's original bytes, and they
   * are exactly the states where main sets `backupPath`. `describe` used to read
   * `backupPath` only on the `ok` branch, so both fell through to the generic
   * writeFailed line, which names no path - the user was told the change failed
   * and never told where their config went. Main returned it; the renderer dropped
   * it. Executed before the fix, on both halves: mentionsBackup=false.
   */
  it('F3: names the backup when a FAILED result carries one', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockRepair.mockResolvedValue({
      ok: false,
      reason: 'write-failed',
      detail: 'the repaired file still does not parse',
      backupPath: '/x/config.toml.backup-20260817-142530',
    });
    render(<EngineConfigRecoveryPanel />);

    await waitFor(() => expect(screen.getByTestId('engine-config-repair')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-repair').querySelector('button')!);

    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.writeFailedWithBackup')
    );
    expect(screen.getByTestId('engine-config-outcome').textContent).toContain('config.toml.backup-20260817-142530');
  });

  it('F2/F3: a restore-conflict names the backup too', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockRepair.mockResolvedValue({
      ok: false,
      reason: 'restore-conflict',
      detail: 'EEXIST: file already exists',
      backupPath: '/x/config.toml.backup-20260817-142530',
    });
    render(<EngineConfigRecoveryPanel />);

    await waitFor(() => expect(screen.getByTestId('engine-config-repair')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-repair').querySelector('button')!);

    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.writeFailedWithBackup')
    );
    expect(screen.getByTestId('engine-config-outcome').textContent).toContain('config.toml.backup-20260817-142530');
  });

  /**
   * F3b. A `backup-failed` that NAMES a backup is the state where the move
   * succeeded and could not be undone: `config.toml` is GONE and the original
   * bytes are only at that path. Rendering "nothing was changed" there is the
   * exact misinformation this panel exists to remove, and the `backup-failed`
   * branch is tested BEFORE the generic backupPath catch-all, so ordering alone
   * would not have saved it.
   */
  it('F3b: a backup-failed that NAMES a backup must not say "nothing was changed"', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockRepair.mockResolvedValue({
      ok: false,
      reason: 'backup-failed',
      detail: 'backup could not be read back: EIO: i/o error, read',
      backupPath: '/x/config.toml.backup-20260817-215959',
    });
    render(<EngineConfigRecoveryPanel />);

    await waitFor(() => expect(screen.getByTestId('engine-config-repair')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-repair').querySelector('button')!);

    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.writeFailedWithBackup')
    );
    const text = screen.getByTestId('engine-config-outcome').textContent ?? '';
    expect(text).toContain('config.toml.backup-20260817-215959');
    expect(text).not.toContain('result.backupFailed');
  });

  it('a failure with NO backup still uses the plain writeFailed line', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockRepair.mockResolvedValue({ ok: false, reason: 'write-failed', detail: 'ENOSPC' });
    render(<EngineConfigRecoveryPanel />);

    await waitFor(() => expect(screen.getByTestId('engine-config-repair')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-repair').querySelector('button')!);

    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.writeFailed')
    );
    expect(screen.getByTestId('engine-config-outcome').textContent).not.toContain('WithBackup');
  });

  it('F4: an irregular config.toml gets its own line, pointing at Reveal', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockRepair.mockResolvedValue({
      ok: false,
      reason: 'not-a-regular-file',
      detail: 'the engine config is not a regular file, so Wayland will not replace it',
    });
    render(<EngineConfigRecoveryPanel />);

    await waitFor(() => expect(screen.getByTestId('engine-config-repair')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-repair').querySelector('button')!);

    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.notARegularFile')
    );
  });

  it('does NOT regenerate until the confirmation is accepted', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockRegenerate.mockResolvedValue({ ok: true, backupPath: '/x/config.toml.backup-1' });
    render(<EngineConfigRecoveryPanel />);

    await waitFor(() => expect(screen.getByTestId('engine-config-regenerate')).toBeTruthy());
    expect(screen.queryByTestId('confirm')).toBeNull();

    fireEvent.click(screen.getByTestId('engine-config-regenerate').querySelector('button')!);
    // The dialog is open; nothing has been called yet.
    await waitFor(() => expect(screen.getByTestId('confirm')).toBeTruthy());
    expect(mockRegenerate).not.toHaveBeenCalled();
    // The confirmation body must NAME what is lost.
    expect(screen.getByTestId('confirm').textContent).toContain('regenerate.confirmBody');

    fireEvent.click(screen.getByText('confirm'));
    await waitFor(() => expect(mockRegenerate).toHaveBeenCalledWith({ confirmed: true }));
  });

  it('F6: a REJECTED repair call becomes an outcome line, not an unhandled rejection', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockRepair.mockRejectedValue(new Error('Bridge method "engine-config-recovery.repair" is not available'));
    render(<EngineConfigRecoveryPanel />);
    await waitFor(() => expect(screen.getByTestId('engine-config-repair')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-repair').querySelector('button')!);
    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.writeFailed')
    );
  });

  it('F6: a REJECTED reveal call becomes an outcome line', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockReveal.mockRejectedValue(new Error('Bridge method "engine-config-recovery.reveal" is not available'));
    render(<EngineConfigRecoveryPanel />);
    await waitFor(() => expect(screen.getByTestId('engine-config-reveal')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-reveal').querySelector('button')!);
    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.revealFailed')
    );
  });

  it('F6: a REJECTED regenerate call becomes an outcome line', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockRegenerate.mockRejectedValue(new Error('Bridge method "engine-config-recovery.regenerate" is not available'));
    render(<EngineConfigRecoveryPanel />);
    await waitFor(() => expect(screen.getByTestId('engine-config-regenerate')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-regenerate').querySelector('button')!);
    await waitFor(() => expect(screen.getByTestId('confirm')).toBeTruthy());
    fireEvent.click(screen.getByText('confirm'));
    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.writeFailed')
    );
  });

  it('surfaces a reveal failure instead of a silent no-op', async () => {
    mockInspect.mockResolvedValue(INVALID);
    mockReveal.mockResolvedValue({ ok: false, error: 'no file manager' });
    render(<EngineConfigRecoveryPanel />);

    await waitFor(() => expect(screen.getByTestId('engine-config-reveal')).toBeTruthy());
    fireEvent.click(screen.getByTestId('engine-config-reveal').querySelector('button')!);
    await waitFor(() =>
      expect(screen.getByTestId('engine-config-outcome').textContent).toContain('result.revealFailed')
    );
  });
});
