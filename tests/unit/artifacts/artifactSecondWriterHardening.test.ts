/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TWO HOLES THAT ONLY OPEN WHEN THE LEDGER GETS A SECOND WRITER.
 *
 * Until now the cron executor was the only thing that ever wrote an artifact
 * record, and it always wrote `realpath(resolve(workspace))`. Both of these
 * were therefore unreachable, and both were guarded by that fact rather than by
 * a check:
 *
 *  1. `readArtifactLedger` validated `relativePath` for absoluteness and `..`
 *     and applied NOTHING to `workspace` beyond `typeof === 'string'` - even
 *     though the two are joined to produce the absolute path every action then
 *     acts on. A clean relative path resolved against a hostile root is a
 *     hostile path.
 *  2. `saveArtifactCopy` was the only one of the four actions with no
 *     `effects.confine()` call. `openArtifact` and `revealArtifact` have had
 *     one all along.
 *
 * A chat-driven writer's workspace is whatever folder the conversation points
 * at, which is what makes both reachable.
 *
 * Nothing here relaxes an existing check. Every assertion is that a refusal
 * happens that did not happen before.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  openArtifact,
  previewArtifact,
  revealArtifact,
  saveArtifactCopy,
  listArtifactSummaries,
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

/** Register one real file through the real validator, and return its record. */
async function registerOne(relative: string, body: string): Promise<ArtifactRecord> {
  const target = path.join(workspace, ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
  const result = await registerArtifacts({
    ledgerPath,
    workspace,
    runDir: workspace,
    taskId: 'task-hardening',
    runId: 'run-hardening',
    declaredBy: 'Hardening Test',
    declarations: [{ path: relative }],
  });
  expect(result.rejected).toEqual([]);
  return result.registered[0];
}

beforeEach(async () => {
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-harden-')));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = artifactLedgerPath(path.join(root, 'data'));
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('readArtifactLedger validates the workspace root, not just the relative path', () => {
  it('keeps a record written by the real registrar', async () => {
    // The known POSITIVE. Without it, a reader that dropped EVERY record would
    // pass every refusal assertion below.
    const record = await registerOne('artifacts/brief.html', '<p>hi</p>');
    const records = await readArtifactLedger(ledgerPath);
    expect(records.map((entry) => entry.artifactId)).toContain(record.artifactId);
  });

  it.each([
    ['a relative workspace', 'workspace'],
    ['a traversing workspace', '/tmp/a/../../etc'],
    ['a dot-segment workspace', '/tmp/./a'],
    ['an empty workspace', ''],
    ['a non-string workspace', 42 as unknown as string],
  ])('drops a record with %s', async (_label, hostile) => {
    await registerOne('artifacts/brief.html', '<p>hi</p>');
    const [good] = await readArtifactLedger(ledgerPath);

    // Append a line that is valid in every OTHER respect, so the only reason it
    // can be dropped is the workspace.
    await fs.appendFile(
      ledgerPath,
      JSON.stringify({ ...good, artifactId: 'hostile-id', workspace: hostile }) + '\n',
      'utf8'
    );

    const records = await readArtifactLedger(ledgerPath);
    expect(records.map((entry) => entry.artifactId)).not.toContain('hostile-id');
    // The good record is untouched: one bad line must not empty the ledger.
    expect(records.map((entry) => entry.artifactId)).toContain(good.artifactId);
  });

  it('refuses an out-of-root record at every one of the five actions', async () => {
    await registerOne('artifacts/brief.html', '<p>hi</p>');
    const [good] = await readArtifactLedger(ledgerPath);
    await fs.appendFile(
      ledgerPath,
      JSON.stringify({ ...good, artifactId: 'hostile-id', workspace: 'relative/root' }) + '\n',
      'utf8'
    );

    const effects: ArtifactHostEffects = {
      readLedger: () => readArtifactLedger(ledgerPath),
      confine: async (target: string) => target,
      launch: async () => ({ ok: true }),
      reveal: async () => ({ ok: true }),
      chooseSaveDestination: async () => path.join(root, 'copy.html'),
    };

    // The record never reaches an action, so each resolves it to "unknown".
    expect((await openArtifact('hostile-id', effects)).ok).toBe(false);
    expect((await revealArtifact('hostile-id', effects)).ok).toBe(false);
    expect((await saveArtifactCopy('hostile-id', effects)).ok).toBe(false);
    // PREVIEW IS THE FIFTH ACTION. Enumerative extension, not a relaxation:
    // every assertion above is unchanged and this one is added, because a
    // channel that reads a file's BYTES must be in the same list as the ones
    // that launch it. Refused as `unavailable`, which is what every "the ledger
    // does not vouch for this" answer looks like on this channel.
    expect(await previewArtifact('hostile-id', effects)).toEqual({ kind: 'none', reason: 'unavailable' });
    const listed = await listArtifactSummaries(effects);
    expect(listed.map((entry) => entry.artifactId)).not.toContain('hostile-id');
  });
});

describe('previewArtifact confines the source like the other four actions', () => {
  it('refuses when confinement refuses, and reads nothing', async () => {
    const record = await registerOne('artifacts/brief.html', '<p>hi</p>');
    const confine = vi.fn(async () => null);
    const effects: ArtifactHostEffects = {
      readLedger: () => readArtifactLedger(ledgerPath),
      confine,
      launch: async () => ({ ok: true }),
      reveal: async () => ({ ok: true }),
      chooseSaveDestination: async () => null,
    };

    expect(await previewArtifact(record.artifactId, effects)).toEqual({ kind: 'none', reason: 'unavailable' });
    expect(confine).toHaveBeenCalledWith(path.resolve(workspace, 'artifacts', 'brief.html'));
  });

  it('still previews when confinement allows - the check is a gate, not a wall', async () => {
    const record = await registerOne('artifacts/brief.html', '<p>hi</p>');
    const effects: ArtifactHostEffects = {
      readLedger: () => readArtifactLedger(ledgerPath),
      confine: async (target: string) => target,
      launch: async () => ({ ok: true }),
      reveal: async () => ({ ok: true }),
      chooseSaveDestination: async () => null,
    };

    expect(await previewArtifact(record.artifactId, effects)).toEqual({
      kind: 'text',
      text: '<p>hi</p>',
      truncated: false,
    });
  });
});

describe('saveArtifactCopy confines the source like the other three actions', () => {
  it('refuses when confinement refuses, and writes nothing', async () => {
    const record = await registerOne('artifacts/brief.html', '<p>hi</p>');
    const destination = path.join(root, 'copy.html');
    const confine = vi.fn(async () => null);
    const effects: ArtifactHostEffects = {
      readLedger: () => readArtifactLedger(ledgerPath),
      confine,
      launch: async () => ({ ok: true }),
      reveal: async () => ({ ok: true }),
      chooseSaveDestination: async () => destination,
    };

    const result = await saveArtifactCopy(record.artifactId, effects);

    expect(result).toEqual({ ok: false, error: 'path not allowed' });
    // Refused BEFORE the save dialog and before any write.
    expect(confine).toHaveBeenCalledWith(path.resolve(workspace, 'artifacts', 'brief.html'));
    await expect(fs.access(destination)).rejects.toThrow();
  });

  it('still saves when confinement allows - the check is a gate, not a wall', async () => {
    const record = await registerOne('artifacts/brief.html', '<p>hi</p>');
    const destination = path.join(root, 'copy.html');
    const effects: ArtifactHostEffects = {
      readLedger: () => readArtifactLedger(ledgerPath),
      confine: async (target: string) => target,
      launch: async () => ({ ok: true }),
      reveal: async () => ({ ok: true }),
      chooseSaveDestination: async () => destination,
    };

    const result = await saveArtifactCopy(record.artifactId, effects);

    expect(result.ok).toBe(true);
    expect(await fs.readFile(destination, 'utf8')).toBe('<p>hi</p>');
  });
});
