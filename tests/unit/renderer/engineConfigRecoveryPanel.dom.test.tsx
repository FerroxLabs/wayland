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
 *  - a `backup-failed` result is reported as "nothing was changed".
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
    render(<EngineConfigRecoveryPanel />);
    await waitFor(() => expect(screen.getByTestId('engine-config-reveal')).toBeTruthy());
    // No repair and no destructive action are offered when there is no problem.
    expect(screen.queryByTestId('engine-config-repair')).toBeNull();
    expect(screen.queryByTestId('engine-config-regenerate')).toBeNull();
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
