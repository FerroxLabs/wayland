/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * T4. "CHANGED SINCE IT WAS MADE" REPAIRS ITSELF - BY RE-VERIFYING, NEVER BY
 * SKIPPING A CHECK.
 *
 * `openVerified` refuses on a size mismatch AND on a digest mismatch, and that
 * refusal gates Open, Reveal and Save-a-copy alike. So the ordinary chat loop -
 * write the report on turn 3, revise it on turn 5, or open the .csv in Wayland
 * and type in a cell - BRICKS the card the user is looking at. That is the bug.
 *
 * THE OBVIOUS FIX IS THE WRONG ONE, and this file exists mostly to make taking
 * it impossible. Relaxing `openVerified` to tolerate a changed digest would
 * turn a live security check dead: the digest is what proves the bytes about to
 * be handed to an OS launcher are the bytes the host verified. So `verify()` is
 * untouched, and the repair is to RE-RUN REGISTRATION - the full path, with
 * containment, symlink refusal, non-regular-file refusal, the size cap and the
 * device/inode re-check all applied again to the new bytes.
 *
 * The two halves are asserted together in every test below: the refresh must
 * SUCCEED for a chat deliverable and the digest gate must still REFUSE the
 * things it always refused. A refresh that made everything openable would pass
 * the first half alone.
 *
 * AND IT IS CHAT-ONLY. A published series run is immutable - it is the record
 * of what a scheduled task produced on a given day - so "changed" there is not
 * an edit, it is tampering, and re-registering it would launder that into a
 * fresh valid record. The negative case is pinned as hard as the positive.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveOutputDir } from '@process/agent/wcore/envBuilder';
import {
  openArtifact,
  refreshChatArtifact,
  saveArtifactCopy,
  type ArtifactHostEffects,
} from '@process/services/artifacts/artifactActions';
import { readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { clearChatSweepMemo, sweepChatRun } from '@process/services/artifacts/chatRun';
import { beginTaskRun, commitTaskRun } from '@process/services/artifacts/taskRun';

const CONVERSATION = 'convrefresh001';

let root = '';
let workspace = '';
let ledgerPath = '';
let launched: string[] = [];

const effects: ArtifactHostEffects = {
  readLedger: () => readArtifactLedger(ledgerPath),
  confine: async (target) => target,
  launch: async (target) => {
    launched.push(target);
    return { ok: true };
  },
  reveal: async () => ({ ok: true }),
  chooseSaveDestination: async () => null,
};

/** Produce a real chat deliverable through the production resolver + sweep. */
async function chatDeliverable(relative: string, body: string) {
  const target = path.join(resolveOutputDir(workspace, undefined, CONVERSATION), ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
  const result = await sweepChatRun({ conversationId: CONVERSATION, workspace, ledgerPath, declaredBy: 'Chat' });
  return { record: result.registered[0], target };
}

/** Produce a real PUBLISHED series deliverable, the immutable kind. */
async function seriesDeliverable(body: string) {
  const handle = await beginTaskRun({ workspace, taskId: 'cron_brief', series: 'market' });
  await fs.writeFile(path.join(handle.stagingDir, 'brief.md'), body, 'utf8');
  const outcome = await commitTaskRun(handle, { ledgerPath, declaredBy: 'Morning Brief' });
  if (!outcome.published) throw new Error('control run did not publish');
  const record = outcome.registered[0];
  return { record, target: path.resolve(record.workspace, ...record.relativePath.split('/')) };
}

/** Edit the file on disk, behind the ledger's back, exactly as the user would. */
const editOnDisk = (target: string, body: string) => fs.writeFile(target, body, 'utf8');

beforeEach(async () => {
  clearChatSweepMemo();
  launched = [];
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-refresh-')));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
});

afterEach(async () => {
  clearChatSweepMemo();
  await fs.rm(root, { recursive: true, force: true });
});

describe('T4 - a changed chat deliverable repairs itself', () => {
  it('goes dead on an edit, then opens again after a refresh', async () => {
    const { record, target } = await chatDeliverable('report.csv', 'a,b\n1,2\n');
    // The control, first: before any edit it opens.
    expect(await openArtifact(record.artifactId, effects)).toEqual({ ok: true });

    await editOnDisk(target, 'a,b\n1,2\n3,4\n');
    const dead = await openArtifact(record.artifactId, effects);
    expect(dead).toEqual({ ok: false, error: 'artifact has changed since it was recorded' });

    const refreshed = await refreshChatArtifact(record.artifactId, effects, ledgerPath);
    expect(refreshed.ok).toBe(true);

    expect(await openArtifact(record.artifactId, effects)).toEqual({ ok: true });
    expect(launched).toHaveLength(2);
  });

  it('keeps the SAME artifact id, so the card already on screen survives', async () => {
    const { record, target } = await chatDeliverable('report.csv', 'a,b\n1,2\n');
    await editOnDisk(target, 'a,b\n9,9\n');

    const refreshed = await refreshChatArtifact(record.artifactId, effects, ledgerPath);

    expect(refreshed.ok && refreshed.artifact.artifactId).toBe(record.artifactId);
    // One row, not two: the ledger reader collapses by id.
    const ledger = await readArtifactLedger(ledgerPath);
    expect(ledger).toHaveLength(1);
    expect(ledger[0].sha256).not.toBe(record.sha256);
    expect(ledger[0].sizeBytes).toBe('a,b\n9,9\n'.length);
  });

  it('repairs Save-a-copy too, not only Open', async () => {
    const { record, target } = await chatDeliverable('report.csv', 'a,b\n1,2\n');
    await editOnDisk(target, 'a,b\n7,7\n');

    expect(await saveArtifactCopy(record.artifactId, effects)).toEqual({
      ok: false,
      error: 'artifact has changed since it was recorded',
    });

    await refreshChatArtifact(record.artifactId, effects, ledgerPath);

    // `chooseSaveDestination` returns null (cancelled), which is `{ok:true}` -
    // the point is that verification no longer refuses before the dialog.
    expect(await saveArtifactCopy(record.artifactId, effects)).toEqual({ ok: true });
  });

  /** THE NEGATIVE, pinned as hard as the positive. */
  it('REFUSES to refresh a published series run - that change is tampering', async () => {
    const { record, target } = await seriesDeliverable('# monday\n');
    await editOnDisk(target, '# monday, quietly rewritten\n');

    const refused = await refreshChatArtifact(record.artifactId, effects, ledgerPath);

    expect(refused).toEqual({ ok: false, error: 'only a chat deliverable can be refreshed' });
    // ...and it stays dead, which is the correct outcome for a published run.
    expect(await openArtifact(record.artifactId, effects)).toEqual({
      ok: false,
      error: 'artifact has changed since it was recorded',
    });
    // Nothing was appended on the refusal.
    const ledger = await readArtifactLedger(ledgerPath);
    expect(ledger.filter((r) => r.artifactId === record.artifactId)).toHaveLength(1);
    expect(ledger[0].sha256).toBe(record.sha256);
  });

  it('re-runs the FULL verification, so a file that became a symlink is refused', async () => {
    const { record, target } = await chatDeliverable('report.csv', 'a,b\n1,2\n');
    const elsewhere = path.join(root, 'outside.csv');
    await fs.writeFile(elsewhere, 'secrets\n', 'utf8');
    await fs.rm(target);
    await fs.symlink(elsewhere, target);

    const refused = await refreshChatArtifact(record.artifactId, effects, ledgerPath);

    expect(refused.ok).toBe(false);
    expect(refused.ok === false && refused.error).toContain('symlink');
    // The old record is untouched, and Open still refuses.
    expect((await openArtifact(record.artifactId, effects)).ok).toBe(false);
  });

  it('refuses an unknown id and a non-string id without touching the ledger', async () => {
    await chatDeliverable('report.csv', 'a,b\n1,2\n');
    const before = await readArtifactLedger(ledgerPath);

    expect((await refreshChatArtifact('deadbeef', effects, ledgerPath)).ok).toBe(false);
    expect((await refreshChatArtifact(42, effects, ledgerPath)).ok).toBe(false);
    expect((await refreshChatArtifact(undefined, effects, ledgerPath)).ok).toBe(false);

    expect(await readArtifactLedger(ledgerPath)).toEqual(before);
  });

  it('refuses when the file is simply gone, rather than inventing a record', async () => {
    const { record, target } = await chatDeliverable('report.csv', 'a,b\n1,2\n');
    await fs.rm(target);

    const refused = await refreshChatArtifact(record.artifactId, effects, ledgerPath);

    expect(refused.ok).toBe(false);
    expect(await readArtifactLedger(ledgerPath)).toHaveLength(1);
  });

  it('still refuses a confined path the host would not allow', async () => {
    const { record, target } = await chatDeliverable('report.csv', 'a,b\n1,2\n');
    await editOnDisk(target, 'a,b\n5,5\n');
    await refreshChatArtifact(record.artifactId, effects, ledgerPath);

    const refusing: ArtifactHostEffects = { ...effects, confine: async () => null };
    expect(await openArtifact(record.artifactId, refusing)).toEqual({ ok: false, error: 'path not allowed' });
  });
});
