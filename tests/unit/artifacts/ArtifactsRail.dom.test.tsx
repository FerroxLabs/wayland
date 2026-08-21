/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * The rail must never lie about what is on disk.
 *
 * Three outcomes, all in one ledger, because in real life they arrive together:
 *  - a deliverable whose file is still there renders and is actionable;
 *  - a deliverable whose file was removed OUTSIDE Wayland stays VISIBLE, marked
 *    missing, with a plain-English reason - it is the row the user came to the
 *    page to investigate, so filtering it out answers their question with a
 *    blank page;
 *  - a corrupt JSONL line produces a warning ABOVE the list and does not blank
 *    it.
 *
 * The records are produced by the REAL publication path - beginTaskRun /
 * commitTaskRun writing real files into a real temp workspace, then the real
 * `listArtifacts` reading the real ledger. Nothing here hand-writes a ledger
 * row, so the test cannot pass by agreeing with itself about a shape the
 * production code does not actually produce.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listArtifacts, type ArtifactHostEffects } from '@process/services/artifacts/artifactActions';
import {
  artifactLedgerPath,
  readArtifactLedger,
  readArtifactLedgerEntries,
} from '@process/services/artifacts/artifactLedger';
import { beginTaskRun, commitTaskRun } from '@process/services/artifacts/taskRun';
import type { ArtifactListing } from '@/common/types/artifacts';

const h = vi.hoisted(() => ({
  list: vi.fn(),
  reveal: vi.fn(),
  saveCopy: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    artifacts: {
      list: { invoke: h.list },
      reveal: { invoke: h.reveal },
      saveCopy: { invoke: h.saveCopy },
    },
  },
}));

vi.mock('@renderer/hooks/file/usePreviewLauncher', () => ({
  usePreviewLauncher: () => ({ launchPreview: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  // Keys resolve to themselves with interpolation appended, so an assertion can
  // see the count the page passed rather than a bare key.
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars && Object.keys(vars).length > 0 ? `${key}:${Object.values(vars).join(',')}` : key,
    i18n: { language: 'en-US' },
  }),
}));

let root = '';
let workspace = '';
let ledgerPath = '';

/** One whole run, published through the real begin/commit path. */
async function publishRun(series: string, contents: Record<string, string>, now: Date): Promise<void> {
  const handle = await beginTaskRun({ workspace, taskId: 'cron_rail_test', series, now });
  for (const [relative, body] of Object.entries(contents)) {
    const target = path.join(handle.stagingDir, ...relative.split('/'));
    // eslint-disable-next-line no-await-in-loop -- a couple of small files per run
    await fs.mkdir(path.dirname(target), { recursive: true });
    // eslint-disable-next-line no-await-in-loop -- see above
    await fs.writeFile(target, body, 'utf8');
  }
  await commitTaskRun(handle, { ledgerPath, declaredBy: 'Rail Test', now });
}

function effects(): ArtifactHostEffects {
  return {
    readLedger: () => readArtifactLedger(ledgerPath),
    readLedgerEntries: () => readArtifactLedgerEntries(ledgerPath),
    confine: async (target: string) => target,
    launch: async () => ({ ok: true }),
    reveal: async () => ({ ok: true }),
    chooseSaveDestination: async () => null,
  };
}

beforeEach(async () => {
  // realpath: the ledger records the realpath-collapsed workspace, and macOS
  // collapses `/var` to `/private/var`.
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-rail-')));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = artifactLedgerPath(path.join(root, 'data'));
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
  vi.clearAllMocks();
  h.reveal.mockResolvedValue({ ok: true });
  h.saveCopy.mockResolvedValue({ ok: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

/** Render the page over a listing the PRODUCTION lister built. */
async function renderRail(listing: ArtifactListing) {
  h.list.mockResolvedValue(listing);
  const { default: ArtifactsPage } = await import('@renderer/pages/artifacts/ArtifactsPage');
  render(React.createElement(ArtifactsPage));
}

describe('the artifacts rail', () => {
  it('renders the good row, keeps the missing row WITH a reason, and warns about the corrupt line', async () => {
    // Two separate days, so the grouping is exercised as well.
    await publishRun('kept', { 'brief.html': '<p>still here</p>' }, new Date('2026-08-20T09:00:00.000Z'));
    await publishRun('gone', { 'vanished.md': '# deleted later' }, new Date('2026-08-21T09:00:00.000Z'));

    // Remove one deliverable the way a user would - in Finder, behind our back.
    // Located by reading the ledger the sweep wrote, never by rebuilding the
    // path the test thinks publication should have chosen.
    const records = await readArtifactLedger(ledgerPath);
    const doomed = records.find((record) => record.relativePath.endsWith('vanished.md'));
    expect(doomed, 'the sweep must have registered vanished.md').toBeDefined();
    await fs.rm(path.resolve(doomed!.workspace, ...doomed!.relativePath.split('/')));

    // A crash can leave a half-written line; a corrupt one is the same shape.
    await fs.appendFile(ledgerPath, '{"version":1,"artifactId":"tru\n', 'utf8');

    const listing = await listArtifacts(effects());
    expect(listing.unreadableEntries).toBeGreaterThan(0);

    await renderRail(listing);

    // The good one is there and says so.
    await waitFor(() => expect(screen.getByText('brief.html')).toBeInTheDocument());

    // The missing one is STILL THERE, and says why.
    expect(screen.getByText('vanished.md')).toBeInTheDocument();
    const rows = screen.getAllByTestId('artifacts-rail-row');
    const missingRow = rows.find((row) => row.getAttribute('data-disk-status') === 'missing');
    expect(missingRow, 'the deleted deliverable must still render a row').toBeDefined();
    expect(missingRow!.textContent).toContain('preview.artifactMissingReason');

    // The corrupt line is reported above the list, and the list still has both.
    const partial = screen.getByTestId('artifacts-rail-partial');
    expect(partial.textContent).toContain('preview.artifactsRailPartial');
    expect(rows).toHaveLength(2);
    expect(screen.queryByTestId('artifacts-rail-empty')).not.toBeInTheDocument();

    // Two runs on two different days: two day headers.
    expect(screen.getAllByTestId('artifacts-rail-day')).toHaveLength(2);
  });

  it('marks a zero-byte deliverable Empty rather than Ready', async () => {
    await publishRun('blank', { 'nothing.txt': '' }, new Date('2026-08-21T09:00:00.000Z'));

    const listing = await listArtifacts(effects());
    await renderRail(listing);

    await waitFor(() => expect(screen.getByText('nothing.txt')).toBeInTheDocument());
    const row = screen.getByTestId('artifacts-rail-row');
    expect(row.getAttribute('data-disk-status')).toBe('empty');
    expect(row.textContent).toContain('preview.artifactEmptyReason');
  });

  it('reports a refused listing instead of rendering a blank page', async () => {
    // `artifacts.` is remote-denied, so on a paired WebUI the invoke REJECTS.
    h.list.mockRejectedValue(new Error('remote-forbidden'));
    const { default: ArtifactsPage } = await import('@renderer/pages/artifacts/ArtifactsPage');
    render(React.createElement(ArtifactsPage));

    await waitFor(() => expect(screen.getByTestId('artifacts-rail-failed')).toBeInTheDocument());
    expect(screen.queryByTestId('artifacts-rail-empty')).not.toBeInTheDocument();
  });

  it('says the shelf is empty when it is, without warning about anything', async () => {
    const listing = await listArtifacts(effects());
    await renderRail(listing);

    await waitFor(() => expect(screen.getByTestId('artifacts-rail-empty')).toBeInTheDocument());
    expect(screen.queryByTestId('artifacts-rail-partial')).not.toBeInTheDocument();
  });
});
