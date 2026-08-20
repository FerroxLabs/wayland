/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE CARD, DRIVEN BY A REAL SERIES ON A REAL FILESYSTEM.
 *
 * The run history is the half of this round that neither Claude Desktop nor
 * Codex Desktop can show, so it is the half worth proving hardest. Nothing here
 * hand-writes a view object: every run below is published by the real
 * `beginTaskRun` / `commitTaskRun`, recorded in the real ledger, and assembled
 * by the real `buildArtifactSeriesView`. Only the IPC transport is stubbed -
 * the renderer cannot open a socket in jsdom - and it is stubbed with the
 * values the host actually computed.
 *
 * A test that mocked `listRuns` or hand-rolled a `runs: [...]` fixture would
 * prove the fixture. It would still pass if the merge rule inverted, if the
 * status of an empty run flipped, or if an earlier run's artifact id were the
 * newest run's - which is the bug that would open the wrong file.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ipcMock = vi.hoisted(() => ({
  open: vi.fn(),
  reveal: vi.fn(),
  saveCopy: vi.fn(),
  list: vi.fn(),
  series: vi.fn(),
  openTarget: vi.fn(),
  // The card also asks what connectors are configured. Answered as "none" in
  // this file, which keeps it about the run history and nothing else.
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

import type { ArtifactSeriesView, ArtifactSummary } from '@/common/types/artifacts';
import { toArtifactSummary } from '@process/services/artifacts/artifactActions';
import { artifactLedgerPath, readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { recordRunOutcome } from '@process/services/artifacts/artifactRunJournal';
import { buildArtifactSeriesView } from '@process/services/artifacts/artifactSeriesView';
import { beginTaskRun, commitTaskRun } from '@process/services/artifacts/taskRun';
import ArtifactActionBar from '@renderer/pages/conversation/Preview/components/PreviewPanel/ArtifactActionBar';

const SERIES = 'market';
const TASK = 'cron_morning_brief';

let root = '';
let workspace = '';
let seriesDir = '';
let ledgerPath = '';

async function publishRun(fileName: string, body: string, now: Date): Promise<string> {
  const handle = await beginTaskRun({ workspace, taskId: TASK, series: SERIES, now });
  await fs.writeFile(path.join(handle.stagingDir, fileName), body, 'utf8');
  await commitTaskRun(handle, { ledgerPath, declaredBy: 'Morning Brief', now });
  return handle.runId;
}

/** The summary the preview panel would hand the card, computed by the host. */
async function summaryForRun(runId: string): Promise<ArtifactSummary> {
  const record = (await readArtifactLedger(ledgerPath)).find((entry) => entry.runId === runId);
  if (!record) throw new Error(`no ledger record for ${runId}`);
  return toArtifactSummary(record);
}

async function realView(artifactId: string): Promise<ArtifactSeriesView> {
  const view = await buildArtifactSeriesView(artifactId, { readLedger: () => readArtifactLedger(ledgerPath) });
  if (!view) throw new Error('the host computed no series for a real published artifact');
  return view;
}

beforeEach(async () => {
  vi.clearAllMocks();
  ipcMock.open.mockResolvedValue({ ok: true });
  ipcMock.reveal.mockResolvedValue({ ok: true });
  ipcMock.saveCopy.mockResolvedValue({ ok: true });
  ipcMock.openTarget.mockResolvedValue({ applicationName: null });
  ipcMock.sendTargets.mockResolvedValue([]);
  ipcMock.series.mockResolvedValue(null);

  root = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-card-series-'));
  workspace = path.join(root, 'workspace');
  seriesDir = path.join(workspace, 'artifacts', SERIES);
  ledgerPath = artifactLedgerPath(path.join(root, 'data'));
  await fs.mkdir(workspace, { recursive: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('the artifact card names the app it will open with', () => {
  it('renders "Open" immediately and UPGRADES to the app name when the host answers', async () => {
    const runId = await publishRun('brief.md', 'day one', new Date('2026-08-20T07:00:00Z'));
    const artifact = await summaryForRun(runId);
    let resolveName: (value: { applicationName: string }) => void = () => {};
    ipcMock.openTarget.mockReturnValue(new Promise((resolve) => (resolveName = resolve)));

    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);

    // Before the host answers: the plain label, and NOT a spinner in the
    // primary action. The card is fully usable while the name is in flight.
    expect(screen.getByTestId('artifact-open').textContent).toContain('preview.artifactOpen');
    expect(screen.getByTestId('artifact-open')).not.toBeDisabled();

    resolveName({ applicationName: 'Preview' });
    await waitFor(() =>
      expect(screen.getByTestId('artifact-open').textContent).toContain('preview.openWithApp:{"app":"Preview"}')
    );
  });

  it('keeps the plain "Open" when the host cannot name an app honestly', async () => {
    const runId = await publishRun('brief.md', 'day one', new Date('2026-08-20T07:00:00Z'));
    render(<ArtifactActionBar artifact={await summaryForRun(runId)} onMessage={vi.fn()} />);

    await waitFor(() => expect(ipcMock.openTarget).toHaveBeenCalled());
    expect(screen.getByTestId('artifact-open').textContent).toContain('preview.artifactOpen');
    expect(screen.getByTestId('artifact-open').textContent).not.toContain('openWithApp');
  });

  it('asks about the artifact by ID, never by path', async () => {
    const runId = await publishRun('brief.md', 'day one', new Date('2026-08-20T07:00:00Z'));
    const artifact = await summaryForRun(runId);
    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);

    await waitFor(() => expect(ipcMock.openTarget).toHaveBeenCalled());
    for (const call of [ipcMock.openTarget, ipcMock.series]) {
      expect(call.mock.calls[0][0]).toEqual({ artifactId: artifact.artifactId });
      expect(JSON.stringify(call.mock.calls[0][0])).not.toContain('/');
    }
  });
});

describe('the artifact card shows the run history', () => {
  it('says this is the newest run and how many runs there are', async () => {
    await publishRun('monday.md', 'monday', new Date('2026-08-18T07:00:00Z'));
    await publishRun('tuesday.md', 'tuesday', new Date('2026-08-19T07:00:00Z'));
    const newest = await publishRun('wednesday.md', 'wednesday', new Date('2026-08-20T07:00:00Z'));
    const artifact = await summaryForRun(newest);
    ipcMock.series.mockResolvedValue(await realView(artifact.artifactId));

    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);

    await waitFor(() => expect(screen.getByTestId('artifact-series')).toBeTruthy());
    expect(screen.getByTestId('artifact-series-position').textContent).toContain('preview.artifactRunNewest');
    expect(screen.getByTestId('artifact-series-toggle').textContent).toContain('preview.artifactRunCount:{"total":3}');
    // Collapsed by default: the history is an offer, not a wall of rows.
    expect(screen.queryByTestId('artifact-series-runs')).toBeNull();
  });

  it('OPENS AN EARLIER RUN by that run\'s own artifact id, and sends no path', async () => {
    const first = await publishRun('monday.md', 'monday', new Date('2026-08-18T07:00:00Z'));
    await publishRun('tuesday.md', 'tuesday', new Date('2026-08-19T07:00:00Z'));
    const newest = await publishRun('wednesday.md', 'wednesday', new Date('2026-08-20T07:00:00Z'));
    const artifact = await summaryForRun(newest);
    const earlier = await summaryForRun(first);
    ipcMock.series.mockResolvedValue(await realView(artifact.artifactId));

    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('artifact-series-toggle')).toBeTruthy());
    fireEvent.click(screen.getByTestId('artifact-series-toggle'));

    const row = await screen.findByText('monday.md');
    fireEvent.click(row);

    await waitFor(() => expect(ipcMock.open).toHaveBeenCalledTimes(1));
    const payload = ipcMock.open.mock.calls[0][0];
    // The EARLIER run's id, not the one on screen. This is the assertion that
    // catches "open re-used the current artifact" - the bug that opens the
    // wrong day while looking completely correct.
    expect(payload).toEqual({ artifactId: earlier.artifactId });
    expect(payload.artifactId).not.toBe(artifact.artifactId);
    expect(JSON.stringify(payload)).not.toContain('/');
  });

  it('shows a FAILED run distinctly, and warns that the file on screen is not the newest', async () => {
    const good = await publishRun('monday.md', 'monday', new Date('2026-08-19T07:00:00Z'));
    await recordRunOutcome(seriesDir, {
      runId: 'rbroken-001',
      taskId: TASK,
      status: 'failed',
      message: 'engine died on start',
      now: new Date('2026-08-20T07:00:00Z'),
    });
    const artifact = await summaryForRun(good);
    ipcMock.series.mockResolvedValue(await realView(artifact.artifactId));

    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);

    await waitFor(() => expect(screen.getByTestId('artifact-series-alert')).toBeTruthy());
    expect(screen.getByTestId('artifact-series-alert').textContent).toContain('preview.artifactNewestRunFailed');
    // The deliverable on screen is explicitly an EARLIER run, not "the newest".
    expect(screen.getByTestId('artifact-series-position').textContent).toContain('preview.artifactRunEarlier');

    fireEvent.click(screen.getByTestId('artifact-series-toggle'));
    const rows = await screen.findAllByTestId('artifact-series-run');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('preview.artifactRunFailed');
    // A failed run has nothing to open, so it offers nothing.
    expect(rows[0].querySelectorAll('button')).toHaveLength(0);
    expect(rows[1].textContent).toContain('monday.md');
    expect(rows[1].textContent).toContain('preview.artifactRunCurrent');
  });

  it('marks a run that produced NO deliverable, distinctly from one that failed', async () => {
    const good = await publishRun('monday.md', 'monday', new Date('2026-08-18T07:00:00Z'));
    await recordRunOutcome(seriesDir, {
      runId: 'rempty-0001',
      taskId: TASK,
      status: 'no-output',
      now: new Date('2026-08-19T07:00:00Z'),
    });
    const artifact = await summaryForRun(good);
    ipcMock.series.mockResolvedValue(await realView(artifact.artifactId));

    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('artifact-series-toggle')).toBeTruthy());
    fireEvent.click(screen.getByTestId('artifact-series-toggle'));

    const rows = await screen.findAllByTestId('artifact-series-run');
    expect(rows[0].textContent).toContain('preview.artifactRunNoOutput');
    expect(rows[0].textContent).not.toContain('preview.artifactRunFailed');
    // ...and nothing warns that the newest run BROKE, because it did not.
    expect(screen.queryByTestId('artifact-series-alert')).toBeNull();
  });

  it('says "first run" rather than offering a history that does not exist yet', async () => {
    const only = await publishRun('brief.md', 'day one', new Date('2026-08-20T07:00:00Z'));
    const artifact = await summaryForRun(only);
    ipcMock.series.mockResolvedValue(await realView(artifact.artifactId));

    render(<ArtifactActionBar artifact={artifact} onMessage={vi.fn()} />);

    await waitFor(() => expect(screen.getByTestId('artifact-series-only')).toBeTruthy());
    expect(screen.getByTestId('artifact-series-only').textContent).toBe('preview.artifactOnlyRun');
    expect(screen.queryByTestId('artifact-series-toggle')).toBeNull();
    expect(screen.getByTestId('artifact-series-position').textContent).toContain('preview.artifactRunNewest');
  });

  it('renders the actions unchanged when the artifact is not filed in a series', async () => {
    const runId = await publishRun('brief.md', 'day one', new Date('2026-08-20T07:00:00Z'));
    ipcMock.series.mockResolvedValue(null);

    render(<ArtifactActionBar artifact={await summaryForRun(runId)} onMessage={vi.fn()} />);

    await waitFor(() => expect(ipcMock.series).toHaveBeenCalled());
    expect(screen.queryByTestId('artifact-series')).toBeNull();
    expect(screen.getByTestId('artifact-canonical-path')).toBeTruthy();
    expect(screen.getByTestId('artifact-open')).toBeTruthy();
  });
});
