/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9, renderer half. The claim under test is narrow and load-bearing: these
 * controls address an ARTIFACT ID and never a path, and they show the canonical
 * target the HOST resolved rather than any name the document chose.
 */

import type { ArtifactSummary } from '@/common/types/artifacts';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ipcMock = vi.hoisted(() => ({
  open: vi.fn(),
  reveal: vi.fn(),
  saveCopy: vi.fn(),
  list: vi.fn(),
  // The card also asks the host what app would open this and what its run
  // history is. Both are answered as "nothing to add" here on purpose: what
  // this file pins is that the THREE ACTIONS still address an id and still
  // report a refusal, unchanged by anything the history strip does.
  series: vi.fn(),
  openTarget: vi.fn(),
}));

/**
 * The history strip previews an earlier run in the INTERNAL viewer, which needs
 * the preview provider tree. Stubbed here so this file keeps testing what it is
 * about - that the three actions still address an id and still report a refusal
 * - rather than acquiring a dependency on the preview context to do it.
 */
vi.mock('@/renderer/hooks/file/usePreviewLauncher', () => ({
  usePreviewLauncher: () => ({ launchPreview: vi.fn(), loading: false }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    artifacts: {
      open: { invoke: ipcMock.open },
      reveal: { invoke: ipcMock.reveal },
      saveCopy: { invoke: ipcMock.saveCopy },
      list: { invoke: ipcMock.list },
      series: { invoke: ipcMock.series },
      openTarget: { invoke: ipcMock.openTarget },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  }),
}));

import ArtifactActionBar from '@renderer/pages/conversation/Preview/components/PreviewPanel/ArtifactActionBar';

const artifact: ArtifactSummary = {
  artifactId: 'a'.repeat(32),
  taskId: 'morning-brief',
  runId: 'r1',
  title: 'Morning Brief',
  fileName: 'brief.html',
  canonicalPath: '/Users/sean/Documents/Wayland/Tasks/Morning Brief/artifacts/2026-08-20/r1/brief.html',
  sizeBytes: 1024,
  runAt: '2026-08-20T09:00:00.000Z',
  declaredBy: 'market-open-report',
};

beforeEach(() => {
  vi.clearAllMocks();
  ipcMock.open.mockResolvedValue({ ok: true });
  ipcMock.reveal.mockResolvedValue({ ok: true });
  ipcMock.saveCopy.mockResolvedValue({ ok: true, savedTo: '/Users/sean/Desktop/brief.html' });
  ipcMock.series.mockResolvedValue(null);
  ipcMock.openTarget.mockResolvedValue({ applicationName: null });
});

describe('ArtifactActionBar', () => {
  it('shows the host-resolved canonical target, not a document-chosen name', () => {
    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);
    expect(screen.getByTestId('artifact-canonical-path').textContent).toBe(artifact.canonicalPath);
  });

  it('sends ONLY an artifact id for every action - no path crosses the boundary', async () => {
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(screen.getByTestId('artifact-open'));
    await waitFor(() => expect(ipcMock.open).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText('preview.artifactReveal'));
    await waitFor(() => expect(ipcMock.reveal).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText('preview.artifactSaveCopy'));
    await waitFor(() => expect(ipcMock.saveCopy).toHaveBeenCalledTimes(1));

    for (const call of [ipcMock.open, ipcMock.reveal, ipcMock.saveCopy]) {
      const payload = call.mock.calls[0][0];
      expect(payload).toEqual({ artifactId: artifact.artifactId });
      expect(JSON.stringify(payload)).not.toContain('/');
    }
  });

  it('surfaces a host REFUSAL instead of leaving a dead button', async () => {
    ipcMock.open.mockResolvedValue({ ok: false, error: 'refusing to open ".command": not an openable document type' });
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(screen.getByTestId('artifact-open'));
    await waitFor(() => expect(onMessage).toHaveBeenCalledTimes(1));
    expect(onMessage.mock.calls[0][0]).toBe('error');
    expect(onMessage.mock.calls[0][1]).toContain('.command');
  });

  /**
   * Open was the only action whose refusal was pinned. Reveal and Save a copy
   * were not: deleting their `if (!result?.ok)` branches left this suite green,
   * so two of the three buttons had no guard against becoming the dead click
   * the whole `{ ok: false }` convention exists to prevent. The bridge has no
   * rejection channel, so a refusal that nobody reads is a button that does
   * nothing at all.
   */
  it('surfaces a REVEAL refusal instead of leaving a dead button', async () => {
    ipcMock.reveal.mockResolvedValue({ ok: false, error: 'artifact is no longer on disk' });
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(screen.getByText('preview.artifactReveal'));
    await waitFor(() => expect(onMessage).toHaveBeenCalledTimes(1));
    expect(onMessage.mock.calls[0][0]).toBe('error');
    expect(onMessage.mock.calls[0][1]).toContain('no longer on disk');
  });

  it('surfaces a SAVE-A-COPY refusal, and never claims a save that did not happen', async () => {
    ipcMock.saveCopy.mockResolvedValue({ ok: false, error: 'destination is outside every allowed root' });
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(screen.getByText('preview.artifactSaveCopy'));
    await waitFor(() => expect(onMessage).toHaveBeenCalledTimes(1));
    expect(onMessage.mock.calls[0][0]).toBe('error');
    expect(onMessage.mock.calls[0][1]).toContain('outside every allowed root');
    // A refusal must never be reported as a completed save.
    expect(onMessage.mock.calls.some(([kind]) => kind === 'success')).toBe(false);
  });

  it('says nothing when the user cancels the save dialog', async () => {
    ipcMock.saveCopy.mockResolvedValue({ ok: true });
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(screen.getByText('preview.artifactSaveCopy'));
    await waitFor(() => expect(ipcMock.saveCopy).toHaveBeenCalled());
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('confirms a completed save with the destination', async () => {
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(screen.getByText('preview.artifactSaveCopy'));
    await waitFor(() => expect(onMessage).toHaveBeenCalledTimes(1));
    expect(onMessage.mock.calls[0][0]).toBe('success');
    expect(onMessage.mock.calls[0][1]).toContain('/Users/sean/Desktop/brief.html');
  });
});
