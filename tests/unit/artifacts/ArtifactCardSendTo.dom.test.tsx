/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * "Send to...", renderer half.
 *
 * Two claims, and the first one is the whole reason this slot was built the way
 * it was: THE BUTTON DOES NOT EXIST UNLESS THERE IS SOMEWHERE TO SEND. Claude
 * Desktop can put a destination in the primary slot because its artifact lives
 * in the cloud and every action starts with a download. Ours is already a real
 * file in the user's Documents folder, so a "Send to..." with nothing behind it
 * would be pure decoration - and this product already ships one dead click.
 *
 * The second claim is the boundary: the card sends IDS. It never sends the
 * address it just displayed, and it never sends a path. The host re-resolves
 * both against the live connector registry, so a card rendering stale or
 * hostile data cannot make the host send to somewhere the user did not
 * authorize.
 */

import type { ArtifactSendTarget, ArtifactSummary } from '@/common/types/artifacts';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ipcMock = vi.hoisted(() => ({
  open: vi.fn(),
  reveal: vi.fn(),
  saveCopy: vi.fn(),
  list: vi.fn(),
  series: vi.fn(),
  openTarget: vi.fn(),
  sendTargets: vi.fn(),
  sendTo: vi.fn(),
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
      sendTargets: { invoke: ipcMock.sendTargets },
      sendTo: { invoke: ipcMock.sendTo },
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

const EMAIL_TARGET: ArtifactSendTarget = {
  targetId: 'plugin-email-1',
  channel: 'email-imap',
  label: 'me@example.com',
  destinations: [
    { destinationId: 'team@example.com', label: 'The Team' },
    { destinationId: 'boss@example.com', label: 'boss@example.com' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  ipcMock.open.mockResolvedValue({ ok: true });
  ipcMock.reveal.mockResolvedValue({ ok: true });
  ipcMock.saveCopy.mockResolvedValue({ ok: true });
  ipcMock.series.mockResolvedValue(null);
  ipcMock.openTarget.mockResolvedValue({ applicationName: null });
  ipcMock.sendTargets.mockResolvedValue([]);
  ipcMock.sendTo.mockResolvedValue({ ok: true, sentTo: 'The Team' });
});

describe('Send to... visibility', () => {
  it('renders NO button when nothing is configured', async () => {
    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);
    // Wait for the enumeration to have settled, so this is not just "the async
    // effect has not run yet".
    await waitFor(() => expect(ipcMock.sendTargets).toHaveBeenCalled());
    expect(screen.queryByTestId('artifact-send')).toBeNull();
  });

  it('renders NO button when the host cannot answer at all', async () => {
    ipcMock.sendTargets.mockRejectedValue(new Error('bridge down'));
    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);
    await waitFor(() => expect(ipcMock.sendTargets).toHaveBeenCalled());
    expect(screen.queryByTestId('artifact-send')).toBeNull();
  });

  it('renders the button once a connector is configured', async () => {
    ipcMock.sendTargets.mockResolvedValue([EMAIL_TARGET]);
    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);
    expect(await screen.findByTestId('artifact-send')).toBeTruthy();
  });

  it('re-asks the host when the card switches to another deliverable', async () => {
    // The connector list is never cached across artifacts. It is re-read, so a
    // recipient revoked in Settings stops being offered as soon as the card
    // moves, rather than lingering until a restart.
    ipcMock.sendTargets.mockResolvedValue([EMAIL_TARGET]);
    const { rerender } = render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);
    await waitFor(() => expect(ipcMock.sendTargets).toHaveBeenCalledTimes(1));

    ipcMock.sendTargets.mockResolvedValue([]);
    rerender(<ArtifactActionBar artifact={{ ...artifact, artifactId: 'b'.repeat(32) }} onMessage={vi.fn()} />);

    await waitFor(() => expect(ipcMock.sendTargets).toHaveBeenCalledTimes(2));
    // ...and the button goes away, because the new answer is "nowhere".
    await waitFor(() => expect(screen.queryByTestId('artifact-send')).toBeNull());
  });
});

describe('Send to... the boundary', () => {
  it('sends IDS only - no address and no path cross the boundary', async () => {
    ipcMock.sendTargets.mockResolvedValue([EMAIL_TARGET]);
    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);

    fireEvent.click(await screen.findByTestId('artifact-send'));
    const rows = await screen.findAllByTestId('artifact-send-destination');
    expect(rows).toHaveLength(2);
    fireEvent.click(rows[0]);

    await waitFor(() => expect(ipcMock.sendTo).toHaveBeenCalledTimes(1));
    const payload = ipcMock.sendTo.mock.calls[0][0];
    expect(payload).toEqual({
      artifactId: artifact.artifactId,
      targetId: 'plugin-email-1',
      destinationId: 'team@example.com',
    });
    // The canonical path is on screen; it must never be in the request.
    expect(JSON.stringify(payload)).not.toContain(artifact.canonicalPath);
  });

  it('names every authorized recipient it was given', async () => {
    ipcMock.sendTargets.mockResolvedValue([EMAIL_TARGET]);
    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);
    fireEvent.click(await screen.findByTestId('artifact-send'));

    const labels = (await screen.findAllByTestId('artifact-send-destination')).map((row) => row.textContent);
    expect(labels).toEqual(['The Team', 'boss@example.com']);
  });
});

describe('Send to... outcomes', () => {
  it('reports a completed send', async () => {
    ipcMock.sendTargets.mockResolvedValue([EMAIL_TARGET]);
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(await screen.findByTestId('artifact-send'));
    fireEvent.click((await screen.findAllByTestId('artifact-send-destination'))[0]);

    await waitFor(() => expect(onMessage).toHaveBeenCalled());
    expect(onMessage.mock.calls[0][0]).toBe('success');
    expect(onMessage.mock.calls[0][1]).toContain('The Team');
  });

  it('says NOTHING when the user declined the native confirmation', async () => {
    // `ok` with no `sentTo` is a decline. A toast in either direction in front
    // of a user who just said no is a bug, not feedback.
    ipcMock.sendTargets.mockResolvedValue([EMAIL_TARGET]);
    ipcMock.sendTo.mockResolvedValue({ ok: true });
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(await screen.findByTestId('artifact-send'));
    fireEvent.click((await screen.findAllByTestId('artifact-send-destination'))[0]);

    await waitFor(() => expect(ipcMock.sendTo).toHaveBeenCalled());
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('renders a refusal instead of leaving the card silent', async () => {
    // The bridge has no rejection channel, so a refusal arrives as a RESOLVED
    // `{ok:false}`. Not rendering it is the dead-button failure mode.
    ipcMock.sendTargets.mockResolvedValue([EMAIL_TARGET]);
    ipcMock.sendTo.mockResolvedValue({ ok: false, errorCode: 'send_failed', message: 'SMTP 535' });
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(await screen.findByTestId('artifact-send'));
    fireEvent.click((await screen.findAllByTestId('artifact-send-destination'))[0]);

    await waitFor(() => expect(onMessage).toHaveBeenCalled());
    expect(onMessage.mock.calls[0][0]).toBe('error');
    expect(onMessage.mock.calls[0][1]).toContain('preview.artifactSendFailed');
  });

  it('renders a refusal even when the host returned nothing at all', async () => {
    ipcMock.sendTargets.mockResolvedValue([EMAIL_TARGET]);
    ipcMock.sendTo.mockResolvedValue(undefined);
    const onMessage = vi.fn();
    render(<ArtifactActionBar artifact={artifact} onMessage={onMessage} />);

    fireEvent.click(await screen.findByTestId('artifact-send'));
    fireEvent.click((await screen.findAllByTestId('artifact-send-destination'))[0]);

    await waitFor(() => expect(onMessage).toHaveBeenCalledWith('error', expect.any(String)));
  });

  it('closes the menu after a send, so a second click is a fresh decision', async () => {
    ipcMock.sendTargets.mockResolvedValue([EMAIL_TARGET]);
    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);

    fireEvent.click(await screen.findByTestId('artifact-send'));
    fireEvent.click((await screen.findAllByTestId('artifact-send-destination'))[0]);

    await waitFor(() => expect(screen.queryAllByTestId('artifact-send-destination')).toHaveLength(0));
  });
});
