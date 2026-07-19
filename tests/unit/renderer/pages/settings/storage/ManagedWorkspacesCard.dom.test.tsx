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
    provenance: 'unavailable',
    snapshot: 'unavailable',
  },
  summary: { discovered: 1, preserved: 1, reviewCandidate: 0, unknown: 0 },
  errors: [],
  entries: [
    {
      path: '/managed/work/claude-temp-1736900000000',
      canonicalPath: '/managed/work/claude-temp-1736900000000',
      evidence: {
        managedProvenance: false,
        inventoryComplete: false,
        referenceCount: 1,
        scheduleCount: 1,
        activeProcessCount: null,
        artifactCount: null,
        userPromoted: null,
        userContent: 'absent',
        modified: false,
        abandonedForMs: 2678400000,
        retentionWindowMs: 2592000000,
      },
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

  it('fails closed visibly when the process returns a malformed expanded report', async () => {
    preview.mockResolvedValue({ ...REPORT, unexpectedAuthority: true });
    render(<ManagedWorkspacesCard />);
    expect(
      await screen.findByText('Wayland could not prove the inventory, so every workspace remains protected.')
    ).toBeTruthy();
  });

  it('renders active work in human language', async () => {
    preview.mockResolvedValue({
      ...REPORT,
      entries: [
        {
          ...REPORT.entries[0],
          decision: { disposition: 'preserve', classifications: ['active'], reasons: [] },
        },
      ],
    });
    render(<ManagedWorkspacesCard />);
    expect(await screen.findByText('Active work')).toBeTruthy();
    expect(screen.queryByText('active')).toBeNull();
  });

  it('labels an empty abandoned shell only for later human review', async () => {
    preview.mockResolvedValue({
      ...REPORT,
      complete: true,
      authorityCompleteness: {
        conversation: 'complete',
        project: 'complete',
        schedule: 'complete',
        artifact: 'complete',
        receipt: 'complete',
        'active-process': 'complete',
        provenance: 'complete',
        snapshot: 'complete',
      },
      summary: { discovered: 1, preserved: 0, reviewCandidate: 1, unknown: 0 },
      entries: [
        {
          ...REPORT.entries[0],
          evidence: {
            managedProvenance: true,
            inventoryComplete: true,
            referenceCount: 0,
            scheduleCount: 0,
            activeProcessCount: 0,
            artifactCount: 0,
            userPromoted: false,
            userContent: 'absent',
            modified: false,
            abandonedForMs: 2678400000,
            retentionWindowMs: 2592000000,
          },
          decision: {
            disposition: 'review-candidate',
            classifications: ['empty-abandoned'],
            reasons: ['complete evidence proves an empty app-managed shell beyond the retention window'],
          },
        },
      ],
    });

    render(<ManagedWorkspacesCard />);

    expect(await screen.findByText('Later human review')).toBeTruthy();
    expect(screen.getByText('Review later - no action available')).toBeTruthy();
    expect(screen.getByText(/complete evidence proves an empty app-managed shell/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /delete|remove|quarantine|clean|prune/i })).toBeNull();
  });

  it('rejects an unproven review candidate even when its shape is valid', async () => {
    preview.mockResolvedValue({
      ...REPORT,
      summary: { discovered: 1, preserved: 0, reviewCandidate: 1, unknown: 0 },
      entries: [
        {
          ...REPORT.entries[0],
          decision: {
            disposition: 'review-candidate',
            classifications: ['empty-abandoned'],
            reasons: ['shape alone is not authority'],
          },
        },
      ],
    });

    render(<ManagedWorkspacesCard />);
    expect(
      await screen.findByText('Wayland could not prove the inventory, so every workspace remains protected.')
    ).toBeTruthy();
  });

  it('rejects summary counts that do not exactly match the entries', async () => {
    preview.mockResolvedValue({
      ...REPORT,
      summary: { discovered: 999, preserved: 999, reviewCandidate: 0, unknown: 0 },
    });
    render(<ManagedWorkspacesCard />);
    expect(
      await screen.findByText('Wayland could not prove the inventory, so every workspace remains protected.')
    ).toBeTruthy();
  });
});
