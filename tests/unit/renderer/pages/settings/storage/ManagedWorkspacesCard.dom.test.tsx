// @vitest-environment jsdom

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
const showItemInFolder = vi.fn();
vi.mock('@/common/adapter/ipcBridge', () => ({
  workspaceRetention: { preview: { invoke: (...args: unknown[]) => preview(...args) } },
  shell: { showItemInFolder: { invoke: (...args: unknown[]) => showItemInFolder(...args) } },
}));

import ManagedWorkspacesCard from '@renderer/pages/settings/StorageSettings/ManagedWorkspacesCard';

const REPORT = {
  generatedAt: '2026-07-16T00:00:00.000Z',
  root: '/managed/work',
  canonicalRoot: '/managed/work',
  complete: false,
  authorityCompleteness: {
    conversation: 'complete',
    project: 'complete',
    schedule: 'complete',
    artifact: 'unavailable',
    receipt: 'unavailable',
    'active-process': 'complete',
  },
  summary: { discovered: 1, preserved: 1, quarantineEligible: 0, unknown: 0 },
  errors: [],
  entries: [
    {
      path: '/managed/work/claude-temp-1736900000000',
      canonicalPath: '/managed/work/claude-temp-1736900000000',
      evidence: {},
      decision: { disposition: 'preserve', classifications: ['referenced', 'scheduled'], reasons: [] },
      references: [],
      errors: [],
    },
  ],
};

describe('ManagedWorkspacesCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtime.desktop = true;
    preview.mockResolvedValue(REPORT);
    showItemInFolder.mockResolvedValue({ ok: true });
  });

  it('shows the protection contract, incompleteness, and no destructive action', async () => {
    render(<ManagedWorkspacesCard />);

    expect(await screen.findByText('Nothing here is deleted automatically')).toBeTruthy();
    expect(screen.getByText('Cleanup remains locked')).toBeTruthy();
    expect(screen.getByText(/Outputs, Receipts/)).toBeTruthy();
    expect(screen.getByText('claude-temp-1736900000000')).toBeTruthy();
    expect(screen.getByText('In use - Scheduled')).toBeTruthy();
    expect(screen.getByText('Keep')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /delete|remove|quarantine|clean/i })).toBeNull();
  });

  it('reveals a protected workspace without granting a destructive action', async () => {
    render(<ManagedWorkspacesCard />);
    await screen.findByText('claude-temp-1736900000000');

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));

    await waitFor(() => expect(showItemInFolder).toHaveBeenCalledWith('/managed/work/claude-temp-1736900000000'));
    expect(screen.queryByRole('button', { name: /delete|remove|quarantine|clean/i })).toBeNull();
  });

  it('refreshes the read-only projection on demand', async () => {
    render(<ManagedWorkspacesCard />);
    await screen.findByText('Nothing here is deleted automatically');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(2));
  });

  it('does not invoke the local-path provider in hosted WebUI', () => {
    runtime.desktop = false;
    render(<ManagedWorkspacesCard />);
    expect(screen.getByText('Managed workspace inventory is available in the desktop app.')).toBeTruthy();
    expect(preview).not.toHaveBeenCalled();
  });

  it('fails closed visibly when the inventory provider rejects', async () => {
    preview.mockRejectedValue(new Error('inventory unavailable'));
    render(<ManagedWorkspacesCard />);
    expect(
      await screen.findByText('Wayland could not prove the inventory, so every workspace remains protected.')
    ).toBeTruthy();
  });
});
