/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * REMOVE FROM LIST. A TOMBSTONE, NOT AN UNLINK.
 *
 * "Delete it" was unreachable in this product and was not even on the cut list.
 * Today the only way to get rid of a report is to delete it in Finder, which
 * turns the row into a red Missing one that can never be dismissed - and
 * RENAMING it in Finder mints a fresh artifact id and orphans the old row
 * forever. The rail grows dead rows and nothing can remove them.
 *
 * THE VERB IS DELIBERATELY NOT "DELETE THE FILE". Deleting a user's real report
 * off disk on a mis-click is unrecoverable, nobody asked for it, and Finder
 * already does it. What was broken was dismissing a ROW, and that is what this
 * fixes, at a fraction of the blast radius.
 *
 * The mechanism is one append-only tombstone line and ONE chokepoint in
 * `readArtifactLedger`, which every surface and every action already reads
 * through - so a forgotten row disappears from the rail, the card, the series
 * view and all five actions at once, and cannot resurface inside a run-history
 * block. A later sweep that re-registers the same file brings the row back,
 * which is correct: the deliverable exists again.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  forgetArtifact,
  openArtifact,
  previewArtifact,
  refreshChatArtifact,
  listArtifacts,
  type ArtifactHostEffects,
} from '@process/services/artifacts/artifactActions';
import {
  artifactLedgerPath,
  readArtifactLedger,
  registerArtifacts,
  type ArtifactRecord,
} from '@process/services/artifacts/artifactLedger';

let root = '';
let workspace = '';
let ledgerPath = '';

async function registerOne(relative: string, body: string, runId = 'c1'): Promise<ArtifactRecord> {
  const target = path.join(workspace, ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
  const result = await registerArtifacts({
    ledgerPath,
    workspace,
    runDir: workspace,
    taskId: `chat:${runId}`,
    runId,
    declaredBy: 'Forget Test',
    declarations: [{ path: relative }],
  });
  expect(result.rejected).toEqual([]);
  return result.registered[0];
}

const effects = (): ArtifactHostEffects => ({
  readLedger: () => readArtifactLedger(ledgerPath),
  confine: async (target: string) => target,
  launch: async () => ({ ok: true }),
  reveal: async () => ({ ok: true }),
  chooseSaveDestination: async () => null,
});

const idsInLedger = async (): Promise<string[]> => (await readArtifactLedger(ledgerPath)).map((r) => r.artifactId);

beforeEach(async () => {
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-forget-')));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = artifactLedgerPath(path.join(root, 'data'));
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('forgetArtifact removes the row', () => {
  it('drops the forgotten row and leaves every other row untouched', async () => {
    const gone = await registerOne('artifacts/chat/c1/gone.md', 'a');
    const kept = await registerOne('artifacts/chat/c1/kept.md', 'b');
    // The known POSITIVE: both are there before anything is forgotten, so an
    // empty result below cannot be a reader that dropped everything.
    expect(await idsInLedger()).toEqual(expect.arrayContaining([gone.artifactId, kept.artifactId]));

    expect(await forgetArtifact(gone.artifactId, effects(), ledgerPath)).toEqual({ ok: true });

    const remaining = await idsInLedger();
    expect(remaining).not.toContain(gone.artifactId);
    expect(remaining).toContain(kept.artifactId);
  });

  it('does not touch the file on disk - the row goes, the report stays', async () => {
    const record = await registerOne('artifacts/chat/c1/gone.md', 'still here');
    const target = path.join(workspace, 'artifacts', 'chat', 'c1', 'gone.md');

    await forgetArtifact(record.artifactId, effects(), ledgerPath);

    expect(await fs.readFile(target, 'utf8')).toBe('still here');
  });

  it('removes the row from the LISTING, which is the surface the user is looking at', async () => {
    const gone = await registerOne('artifacts/chat/c1/gone.md', 'a');
    await registerOne('artifacts/chat/c1/kept.md', 'b');

    await forgetArtifact(gone.artifactId, effects(), ledgerPath);

    const listing = await listArtifacts(effects());
    expect(listing.artifacts.map((a) => a.fileName)).toEqual(['kept.md']);
    expect(listing.unreadableEntries).toBe(0);
  });

  it('is idempotent, and forgetting an unknown id is not an error', async () => {
    await registerOne('artifacts/chat/c1/kept.md', 'b');
    expect(await forgetArtifact('a'.repeat(32), effects(), ledgerPath)).toEqual({ ok: true });
    // No corruption: the surviving row still reads back cleanly.
    expect((await readArtifactLedger(ledgerPath)).length).toBe(1);
  });

  it('refuses a malformed id rather than appending it to the ledger', async () => {
    const before = await fs.readFile(ledgerPath, 'utf8').catch(() => '');
    expect(await forgetArtifact('../../etc/passwd', effects(), ledgerPath)).toEqual({
      ok: false,
      error: 'unknown artifact',
    });
    expect(await fs.readFile(ledgerPath, 'utf8').catch(() => '')).toBe(before);
  });
});

describe('a forgotten artifact is unknown to every action', () => {
  it('refuses open, preview and refresh once the row is gone', async () => {
    const record = await registerOne('artifacts/chat/c1/gone.md', 'a');
    // The known POSITIVE first: all three work while the row exists.
    expect((await openArtifact(record.artifactId, effects())).ok).toBe(true);
    expect((await previewArtifact(record.artifactId, effects())).kind).toBe('text');
    expect((await refreshChatArtifact(record.artifactId, effects(), ledgerPath)).ok).toBe(true);

    await forgetArtifact(record.artifactId, effects(), ledgerPath);

    expect(await openArtifact(record.artifactId, effects())).toEqual({ ok: false, error: 'unknown artifact' });
    expect(await previewArtifact(record.artifactId, effects())).toEqual({ kind: 'none', reason: 'unavailable' });
    expect(await refreshChatArtifact(record.artifactId, effects(), ledgerPath)).toEqual({
      ok: false,
      error: 'unknown artifact',
    });
  });
});

describe('the tombstone is ordered, not absolute', () => {
  it('brings the row back when a later sweep re-registers the same file', async () => {
    const record = await registerOne('artifacts/chat/c1/report.md', 'v1');
    await forgetArtifact(record.artifactId, effects(), ledgerPath);
    expect(await idsInLedger()).not.toContain(record.artifactId);

    // The deterministic id means a re-registration of the same file in the same
    // run is the SAME artifact id - so this really is the row coming back, not
    // a different row that looks like it.
    const again = await registerOne('artifacts/chat/c1/report.md', 'v2');
    expect(again.artifactId).toBe(record.artifactId);

    expect(await idsInLedger()).toContain(record.artifactId);
  });
});

describe('the tombstone cannot damage the ledger', () => {
  it('keeps every real row when a forget line is corrupt', async () => {
    const kept = await registerOne('artifacts/chat/c1/kept.md', 'b');
    await fs.appendFile(ledgerPath, '{"kind":"forget"}\n', 'utf8');
    await fs.appendFile(ledgerPath, '{"kind":"forget","artifactId":42}\n', 'utf8');
    await fs.appendFile(ledgerPath, '{"kind":"forget",\n', 'utf8');

    const entries = await readArtifactLedger(ledgerPath);

    expect(entries.map((r) => r.artifactId)).toEqual([kept.artifactId]);
  });

  it('counts a corrupt forget line as unreadable rather than silently ignoring it', async () => {
    await registerOne('artifacts/chat/c1/kept.md', 'b');
    await fs.appendFile(ledgerPath, '{"kind":"forget"}\n', 'utf8');

    const listing = await listArtifacts(effects());
    // listArtifacts reads through readLedgerEntries when supplied; this fake
    // supplies only readLedger, so assert the count on the reader directly.
    expect(listing.artifacts).toHaveLength(1);
    const { readArtifactLedgerEntries } = await import('@process/services/artifacts/artifactLedger');
    expect((await readArtifactLedgerEntries(ledgerPath)).unreadableEntries).toBe(1);
  });

  it('a forget line for an id that never existed changes nothing', async () => {
    const kept = await registerOne('artifacts/chat/c1/kept.md', 'b');
    await fs.appendFile(ledgerPath, `{"kind":"forget","artifactId":"${'9'.repeat(32)}"}\n`, 'utf8');

    expect((await readArtifactLedger(ledgerPath)).map((r) => r.artifactId)).toEqual([kept.artifactId]);
  });
});
