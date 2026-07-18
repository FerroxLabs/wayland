// @vitest-environment jsdom

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WaylandTransferFamilyPreview, WaylandTransferPreflight } from '@/common/types/transfer';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, arg?: string | Record<string, unknown>, fallback?: string) =>
      typeof arg === 'string' ? arg : (fallback ?? _key),
  }),
}));

const runtime = { desktop: true };
vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => runtime.desktop }));

const preview = vi.fn();
vi.mock('@/common/adapter/ipcBridge', () => ({
  waylandTransfer: { preview: { invoke: (...args: unknown[]) => preview(...args) } },
}));

import TransferCard from '@renderer/pages/settings/StorageSettings/TransferCard';

const FAMILIES: WaylandTransferFamilyPreview[] = [
  family('desktop.chats-projects', 'included'),
  family('desktop.scheduler', 'included', true),
  family('desktop.workflows-teams', 'included', true),
  family('desktop.artifacts-receipts', 'included'),
  family('desktop.webui', 'included'),
  family('desktop.preferences', 'included'),
  family('core.engine-state', 'included', true),
  family('external.backend-handles', 'reference-only'),
  family('credentials.secrets', 'reconnect-required'),
  family('updater.release-channel', 'excluded'),
  family('external.workspaces', 'blocked'),
];

function family(
  id: WaylandTransferFamilyPreview['id'],
  disposition: WaylandTransferFamilyPreview['disposition'],
  executableCapable = false
): WaylandTransferFamilyPreview {
  return {
    id,
    disposition,
    authorityIds: [],
    sensitive: false,
    executableCapable,
    estimatedBytes: 10,
    fileCount: 1,
    reason: `Reason for ${id}`,
  };
}

const REPORT: WaylandTransferPreflight = {
  contract: 'wayland-transfer-preflight/1.0',
  formatVersion: 1,
  dryRunOnly: true,
  mode: 'recovery',
  suite: 'WT-R1',
  scope: 'full',
  readyToExport: false,
  observedAt: '2026-07-19T00:00:00.000Z',
  families: FAMILIES,
  blockers: [
    {
      code: 'OWNER_CONFIRMATION_REQUIRED',
      severity: 'blocker',
      message: 'The data owner must explicitly confirm this preflight.',
    },
  ],
  warnings: [
    {
      code: 'EXECUTABLE_IMPORT_QUARANTINED',
      severity: 'warning',
      message: 'Executable-capable state remains paused.',
      logicalStateId: 'desktop.scheduler',
    },
  ],
};

describe('TransferCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtime.desktop = true;
    preview.mockResolvedValue(REPORT);
  });

  it('runs the local read-only preview only after an explicit click', async () => {
    render(<TransferCard />);

    expect(preview).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Preview my transfer' }));

    await waitFor(() => expect(preview).toHaveBeenCalledTimes(1));
    expect(preview).toHaveBeenCalledWith({
      mode: 'recovery',
      scope: 'full',
      selectedLogicalState: Object.keys({
        'desktop.chats-projects': 1,
        'desktop.scheduler': 1,
        'desktop.workflows-teams': 1,
        'desktop.artifacts-receipts': 1,
        'desktop.webui': 1,
        'desktop.preferences': 1,
        'core.engine-state': 1,
        'external.backend-handles': 1,
        'credentials.secrets': 1,
        'updater.release-channel': 1,
        'external.workspaces': 1,
      }),
      ownerConfirmed: false,
      stepUpAuthenticated: false,
      recoveryCredentialReady: false,
    });
  });

  it('shows every data family, every disposition, counts, blockers, warnings, and paused executable state', async () => {
    render(<TransferCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview my transfer' }));

    const familyList = await screen.findByLabelText('Data families');
    for (const label of [
      'Chats and Projects',
      'Schedules and automations',
      'Workflows and teams',
      'Files, outputs, and receipts',
      'Cloud and WebUI state',
      'Settings and preferences',
      'Wayland Core memory and profiles',
      'Connected agents and backends',
      'Credentials and secrets',
      'App update state',
      'External workspace files',
    ]) {
      expect(within(familyList).getByText(label)).toBeTruthy();
    }

    for (const disposition of ['Included', 'Reference only', 'Reconnect required', 'Excluded', 'Blocked']) {
      expect(within(familyList).getAllByText(disposition).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText('Paused and quarantined after import')).toHaveLength(3);
    expect(screen.getByText('The data owner must explicitly confirm this preflight.')).toBeTruthy();
    expect(screen.getByText('Executable-capable state remains paused.')).toBeTruthy();

    const summary = screen.getByLabelText('Transfer summary');
    expect(within(summary).getByText('7')).toBeTruthy();
    expect(within(summary).getByText('1')).toBeTruthy();
    expect(within(summary).getByText('3')).toBeTruthy();
  });

  it('does not call the local provider in hosted WebUI', () => {
    runtime.desktop = false;
    render(<TransferCard />);

    expect(
      screen.getByText('Transfer preview is local-only and must be opened in the Wayland desktop app.')
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Preview my transfer' })).toBeNull();
    expect(preview).not.toHaveBeenCalled();
  });

  it('fails closed visibly when the provider rejects or the inventory is incomplete', async () => {
    preview.mockRejectedValueOnce(new Error('inventory unavailable'));
    const { unmount } = render(<TransferCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview my transfer' }));
    expect(await screen.findByText('Transfer inventory could not be proven')).toBeTruthy();
    expect(screen.queryByLabelText('Data families')).toBeNull();

    unmount();
    preview.mockResolvedValueOnce({ ...REPORT, families: REPORT.families.slice(0, 10) });
    render(<TransferCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview my transfer' }));
    expect(await screen.findByText('Transfer inventory could not be proven')).toBeTruthy();
    expect(screen.queryByLabelText('Data families')).toBeNull();
  });

  it('rejects an impossible success claim and unknown dispositions', async () => {
    preview.mockResolvedValueOnce({ ...REPORT, readyToExport: true, blockers: [] });
    const { unmount } = render(<TransferCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview my transfer' }));
    expect(await screen.findByText('Transfer inventory could not be proven')).toBeTruthy();

    unmount();
    preview.mockResolvedValueOnce({
      ...REPORT,
      families: [{ ...REPORT.families[0], disposition: 'future-disposition' }, ...REPORT.families.slice(1)],
    });
    render(<TransferCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview my transfer' }));
    expect(await screen.findByText('Transfer inventory could not be proven')).toBeTruthy();
  });

  it('never presents an enabled export, recovery, or import action', async () => {
    render(<TransferCard />);

    for (const name of ['Export encrypted bundle', 'Create recovery bundle', 'Import bundle']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    expect(screen.queryByText(/export (complete|created|successful)/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Preview my transfer' }));
    await screen.findByLabelText('Data families');
    for (const name of ['Export encrypted bundle', 'Create recovery bundle', 'Import bundle']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });
});
