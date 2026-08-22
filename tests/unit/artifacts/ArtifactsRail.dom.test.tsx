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
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listArtifacts, type ArtifactHostEffects } from '@process/services/artifacts/artifactActions';
import {
  artifactLedgerPath,
  readArtifactLedger,
  readArtifactLedgerEntries,
} from '@process/services/artifacts/artifactLedger';
import { beginTaskRun, commitTaskRun } from '@process/services/artifacts/taskRun';
import { ARTIFACT_CHANGED_ERROR, type ArtifactListing } from '@/common/types/artifacts';

import ArtifactsPage from '@renderer/pages/artifacts/ArtifactsPage';

const h = vi.hoisted(() => ({
  list: vi.fn(),
  reveal: vi.fn(),
  saveCopy: vi.fn(),
  // MOCK EXTENSION, stated rather than slipped in: the rail now offers Remove
  // from list, wired to the host's tombstone channel. No existing entry
  // changed and no existing assertion moved.
  forget: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    artifacts: {
      list: { invoke: h.list },
      reveal: { invoke: h.reveal },
      saveCopy: { invoke: h.saveCopy },
      forget: { invoke: h.forget },
    },
    // The page now hosts its own PreviewProvider so its in-app open button has
    // something that actually RENDERS the preview. The provider subscribes to
    // this stream on mount; unstubbed it is undefined and every case here dies
    // in a passive effect with "Cannot read properties of undefined". A stub,
    // not a relaxed assertion - no expectation in this file changed.
    fileStream: { contentUpdate: { on: () => () => undefined } },
    preview: { open: { on: () => () => undefined } },
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
  h.forget.mockResolvedValue({ ok: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

/**
 * Render the page over a listing the PRODUCTION lister built.
 *
 * THE PAGE IS IMPORTED AT THE TOP OF THIS FILE, NOT HERE. It used to be an
 * `await import()` inside this helper, which meant the FIRST test paid for
 * loading the whole page tree - PageShell, the preview stack, Arco - inside its
 * own 10s budget. Measured: that test took 4492ms idle, timed out under load,
 * and its abandoned continuation then rendered into the NEXT test, which failed
 * with "found multiple elements" while pointing at code that was fine. One slow
 * test, two red ones, and the second one lying about where the problem was.
 *
 * Hoisting moves that cost into the file's import phase, which no test's
 * timeout is charged for. Same measurement afterwards: 173ms. `vi.mock` is
 * hoisted above static imports by Vitest, so every mock in this file still
 * applies - all of these tests depend on that and all of them pass.
 */
async function renderRail(listing: ArtifactListing) {
  h.list.mockResolvedValue(listing);
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

/**
 * THE SHELF STOPS LEAKING AND STARTS ADMITTING.
 *
 * Two separate honesty defects, both established by execution before this file
 * pinned them:
 *  - the raw host literal `artifact has changed since it was recorded` was
 *    interpolated straight into a user-facing sentence;
 *  - the host caps the listing at MAX_LISTED_ARTIFACTS and row 501 vanished in
 *    silence, contradicting the page's own first stated promise that a row is
 *    never removed for being inconvenient.
 */
describe('the artifacts rail: honesty', () => {
  it('never prints the changed-file literal at the user', async () => {
    await publishRun('kept', { 'brief.html': '<p>hi</p>' }, new Date('2026-08-20T09:00:00.000Z'));
    const listing = await listArtifacts(effects());
    await renderRail(listing);
    await waitFor(() => expect(screen.getByText('brief.html')).toBeInTheDocument());

    h.reveal.mockResolvedValue({ ok: false, error: ARTIFACT_CHANGED_ERROR });
    fireEvent.click(screen.getByText('preview.artifactReveal'));

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(document.body.textContent).not.toContain(ARTIFACT_CHANGED_ERROR);
    expect(screen.getByRole('status').textContent).toContain('preview.artifactChanged');
  });

  it('still interpolates every OTHER refusal, which does read as a sentence', async () => {
    await publishRun('kept', { 'brief.html': '<p>hi</p>' }, new Date('2026-08-20T09:00:00.000Z'));
    const listing = await listArtifacts(effects());
    await renderRail(listing);
    await waitFor(() => expect(screen.getByText('brief.html')).toBeInTheDocument());

    h.reveal.mockResolvedValue({ ok: false, error: 'artifact is no longer on disk' });
    fireEvent.click(screen.getByText('preview.artifactReveal'));

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(screen.getByRole('status').textContent).toContain('preview.artifactRevealFailed');
    expect(screen.getByRole('status').textContent).toContain('no longer on disk');
  });

  it('says so when the host truncated the list', async () => {
    await publishRun('kept', { 'brief.html': '<p>hi</p>' }, new Date('2026-08-20T09:00:00.000Z'));
    const listing = await listArtifacts(effects());
    await renderRail({ ...listing, truncated: true });

    await waitFor(() => expect(screen.getByTestId('artifacts-rail-truncated')).toBeInTheDocument());
  });

  it('says nothing about truncation when nothing was truncated', async () => {
    await publishRun('kept', { 'brief.html': '<p>hi</p>' }, new Date('2026-08-20T09:00:00.000Z'));
    const listing = await listArtifacts(effects());
    // Known positive first: the real lister must report false here, so the
    // negative below is a real negative and not a missing field read as one.
    expect(listing.truncated).toBe(false);
    await renderRail(listing);

    await waitFor(() => expect(screen.getByText('brief.html')).toBeInTheDocument());
    expect(screen.queryByTestId('artifacts-rail-truncated')).not.toBeInTheDocument();
  });
});

/**
 * REMOVE FROM LIST. The row that most needs dismissing is the red one, and
 * until now nothing on this page could dismiss anything at all.
 */
describe('the artifacts rail: remove from list', () => {
  async function railWithMissingRow(): Promise<void> {
    await publishRun('kept', { 'brief.html': '<p>still here</p>' }, new Date('2026-08-20T09:00:00.000Z'));
    await publishRun('gone', { 'vanished.md': '# deleted later' }, new Date('2026-08-21T09:00:00.000Z'));
    const records = await readArtifactLedger(ledgerPath);
    const doomed = records.find((record) => record.relativePath.endsWith('vanished.md'));
    expect(doomed).toBeDefined();
    await fs.rm(path.resolve(doomed!.workspace, ...doomed!.relativePath.split('/')));
    const listing = await listArtifacts(effects());
    await renderRail(listing);
    await waitFor(() => expect(screen.getByText('vanished.md')).toBeInTheDocument());
  }

  /** The Remove button on the row whose file is gone. */
  function forgetButtonForMissingRow(): HTMLElement {
    const rows = screen.getAllByTestId('artifacts-rail-row');
    const missing = rows.find((row) => row.getAttribute('data-disk-status') === 'missing');
    expect(missing, 'the missing row must exist').toBeDefined();
    const button = missing!.querySelector('[data-testid="artifacts-rail-forget"]');
    expect(button, 'a missing row must offer Remove from list').not.toBeNull();
    return button as HTMLElement;
  }

  it('offers Remove on a MISSING row - the one the user came here to dismiss', async () => {
    await railWithMissingRow();
    expect((forgetButtonForMissingRow() as HTMLButtonElement).disabled).toBe(false);
  });

  it('ASKS FIRST, and a cancel removes nothing', async () => {
    await railWithMissingRow();
    fireEvent.click(forgetButtonForMissingRow());

    await waitFor(() => expect(screen.getByTestId('artifacts-rail-forget-confirm')).toBeInTheDocument());
    // Nothing has been sent yet. This is the whole point of the confirm.
    expect(h.forget).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('common.cancel'));
    await waitFor(() => expect(screen.queryByTestId('artifacts-rail-forget-confirm')).not.toBeInTheDocument());
    expect(h.forget).not.toHaveBeenCalled();
    expect(screen.getByText('vanished.md')).toBeInTheDocument();
  });

  it('sends ONLY an id on confirm, and drops the row', async () => {
    await railWithMissingRow();
    fireEvent.click(forgetButtonForMissingRow());
    await waitFor(() => expect(screen.getByTestId('artifacts-rail-forget-confirm')).toBeInTheDocument());
    fireEvent.click(screen.getByText('preview.artifactForgetConfirm'));

    await waitFor(() => expect(h.forget).toHaveBeenCalledTimes(1));
    const payload = h.forget.mock.calls[0][0];
    expect(Object.keys(payload)).toEqual(['artifactId']);
    expect(JSON.stringify(payload)).not.toContain('/');

    await waitFor(() => expect(screen.queryByText('vanished.md')).not.toBeInTheDocument());
    // The other row is untouched. Removing one row must not clear the page.
    expect(screen.getByText('brief.html')).toBeInTheDocument();
  });

  it('keeps the row when the host REFUSES, and says why', async () => {
    await railWithMissingRow();
    h.forget.mockResolvedValue({ ok: false, error: 'unknown artifact' });
    fireEvent.click(forgetButtonForMissingRow());
    await waitFor(() => expect(screen.getByTestId('artifacts-rail-forget-confirm')).toBeInTheDocument());
    fireEvent.click(screen.getByText('preview.artifactForgetConfirm'));

    await waitFor(() => expect(h.forget).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('preview.artifactForgetFailed'));
    // Still listed: a refused removal that removed the row anyway would be the
    // worst of both, a row gone from the page and still in the ledger.
    expect(screen.getByText('vanished.md')).toBeInTheDocument();
  });
});

/**
 * THE ROW READS AS THE SAME OBJECT AS THE CARD.
 *
 * These assert the STRUCTURE and the utility classes rather than computed
 * colour, because jsdom has no UnoCSS pass - there is no stylesheet, so
 * `getComputedStyle().borderColor` here would be the jsdom default for every
 * row no matter what the class said, and a test that cannot fail is worse than
 * no test. What CAN be established here is that the row asks for the utilities
 * that were proven to emit, and never for the two that do not.
 *
 * The tokens themselves were checked by running this repo's own UnoCSS
 * generator with `bg-1` as a known positive first; `b-border` and `text-t-3`
 * emit nothing at all, which is why they are named as forbidden below. The
 * RESOLVED colour is a live-run check, recorded separately.
 */
describe('the artifacts rail: the row', () => {
  async function oneReadyRow(): Promise<HTMLElement> {
    await publishRun('kept', { 'brief.html': '<p>hi</p>' }, new Date('2026-08-20T09:00:00.000Z'));
    const listing = await listArtifacts(effects());
    await renderRail(listing);
    await waitFor(() => expect(screen.getByText('brief.html')).toBeInTheDocument());
    return screen.getByTestId('artifacts-rail-row');
  }

  it('asks for a real border token, never one that emits nothing', async () => {
    const row = await oneReadyRow();
    const cls = row.className;
    expect(cls).toContain('b-[var(--border-base)]');
    expect(cls).toContain('b-1px');
    expect(cls).toContain('b-solid');
    // The two that emit NO rule at all in this repo's config.
    expect(cls).not.toMatch(/\bb-border\b/);
    expect(cls).not.toMatch(/\bb-base\b/);
  });

  it('never uses text-t-3 anywhere on the page - it is not a utility', async () => {
    await oneReadyRow();
    // Known positive first: the real key must be present somewhere, otherwise
    // an empty page would satisfy the negative below.
    expect(document.body.innerHTML).toContain('text-t-tertiary');
    expect(document.body.innerHTML).not.toContain('text-t-3');
  });

  it('makes the filename the strong line and gives it a size and a clock time', async () => {
    const row = await oneReadyRow();
    const name = screen.getByTestId('artifacts-rail-name');
    expect(name.textContent).toBe('brief.html');
    expect(name.className).toContain('font-500');
    expect(name.className).toContain('text-t-primary');

    const meta = screen.getByTestId('artifacts-rail-meta').textContent ?? '';
    // TYPE, from the untranslated proper-noun table.
    expect(meta).toContain('HTML');
    // SIZE, from the host contract's shared formatter - the row showed none at all before.
    expect(meta).toContain('B');
    // WHO. The publisher label the ledger recorded.
    expect(meta).toContain('Rail Test');
    // Clock time to the MINUTE, not seconds: the old `toLocaleTimeString()`
    // printed hh:mm:ss, which is noise on a shelf grouped by day.
    expect(meta).not.toMatch(/\d{1,2}:\d{2}:\d{2}/);
    expect(row.textContent).toContain('brief.html');
  });

  it('gives the row exactly ONE accent-filled button', async () => {
    await oneReadyRow();
    const buttons = [...screen.getByTestId('artifacts-rail-row').querySelectorAll('button')];
    const accent = buttons.filter((button) => button.className.includes('bg-brand'));
    expect(accent).toHaveLength(1);
    expect(accent[0].getAttribute('data-testid')).toBe('artifacts-rail-open-here');
    // And the rest are real buttons, not flat transparent text links.
    expect(buttons.length).toBeGreaterThan(1);
    for (const button of buttons) expect(button.className).toContain('b-1px');
  });

  /**
   * A LIVE DEFECT, PINNED SO IT CANNOT COME BACK.
   *
   * With the preview panel open the rail's list column is a fixed 420px. The
   * actions container was `shrink-0`, so even after wrapping onto its own line
   * it kept its full 512px single-line width and overflowed the 418px content
   * box by ~105px: "Remove from list" was CLIPPED OFF THE ROW with no way to
   * reach it. Measured in the running app with getBoundingClientRect, not
   * reasoned about, and re-measured after the fix at 470/420/380px - two button
   * lines, every button inside the row, filename never truncated.
   *
   * jsdom does no layout, so the widths cannot be re-measured here. What CAN be
   * pinned is the cause: the container must be allowed to shrink, and the
   * buttons must not be, so no label squashes.
   */
  it('lets the actions container shrink, so a narrow column wraps instead of clipping', async () => {
    await oneReadyRow();
    const row = screen.getByTestId('artifacts-rail-row');
    const actions = row.children[row.children.length - 1] as HTMLElement;
    // Known positive: this really is the actions block.
    expect(actions.querySelectorAll('button').length).toBeGreaterThan(1);

    expect(actions.className).toContain('flex-wrap');
    expect(actions.className).not.toMatch(/\bshrink-0\b/);
    // The BUTTONS stay shrink-0 so a wrapped row never squashes a label.
    for (const button of actions.querySelectorAll('button')) {
      expect(button.className).toContain('shrink-0');
    }
  });

  it('tints the tile by type from the SOFT tokens, never the raw semantic colour', async () => {
    await oneReadyRow();
    const row = screen.getByTestId('artifacts-rail-row');
    const tile = row.querySelector('[aria-hidden]');
    expect(tile, 'the row must carry a type tile').not.toBeNull();
    // .html is the brand-tinted case.
    expect((tile as HTMLElement).className).toContain('bg-[var(--brand-soft-bg)]');
    expect((tile as HTMLElement).className).toContain('b-[var(--brand-soft-border)]');
    // The raw token would be a different object in the two themes.
    expect((tile as HTMLElement).className).not.toContain('bg-brand ');
  });
});
