/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * T3. THE TURN ENDS AND THE FILE IS ALREADY A DELIVERABLE.
 *
 * THE IDENTITY DECISION, ASSERTED RATHER THAN DESCRIBED. `runId` is the
 * CONVERSATION id, stable for the life of the chat - not the turn id. A
 * per-turn run id reads as more correct and is wrong: `artifactIdFor` is
 * deterministic on (workspace, runId, relativePath), so a fresh run id every
 * turn mints a fresh artifact id for the SAME file, and the rail fills with
 * duplicate rows of one report, all but the newest permanently dead on Open.
 *
 * The load-bearing assertion in this file is therefore the count: after two
 * turns that rewrite the same file, the ledger holds EXACTLY ONE record for it,
 * carrying the SECOND turn's digest. If that is ever two, the identity decision
 * has been reimplemented per-turn and the feature is broken in the exact way
 * the user notices.
 *
 * NOTHING HERE SEEDS A LEDGER AND NOTHING HERE INVENTS A PATH. The file is
 * written to whatever `resolveOutputDir` - the production spawn resolver -
 * returns for that conversation, the registration is done by the production
 * sweep, and the assertions read the production ledger reader. A test that
 * created the directory it then asserted was found is the exact defect this
 * whole milestone exists because of.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveOutputDir } from '@process/agent/wcore/envBuilder';
import { MAX_DECLARATIONS_PER_RUN, readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { clearChatSweepMemo, onChatTurnCompleted, sweepChatRun } from '@process/services/artifacts/chatRun';
import { beginTaskRun, commitTaskRun } from '@process/services/artifacts/taskRun';

const CONVERSATION = 'convsweep0001';

let root = '';
let workspace = '';
let ledgerPath = '';

/** Where the ENGINE was told to write, asked of the production resolver. */
function outputDir(conversationId = CONVERSATION): string {
  return resolveOutputDir(workspace, undefined, conversationId);
}

/** Act as the agent would: write a file into the directory it was given. */
async function agentWrites(relative: string, body: string, conversationId = CONVERSATION): Promise<void> {
  const target = path.join(outputDir(conversationId), ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
}

const sweep = (conversationId = CONVERSATION) =>
  sweepChatRun({ conversationId, workspace, ledgerPath, declaredBy: 'Chat' });

beforeEach(async () => {
  clearChatSweepMemo();
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-chatsweep-')));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
});

afterEach(async () => {
  clearChatSweepMemo();
  await fs.rm(root, { recursive: true, force: true });
});

describe('T3 - the turn-end sweep registers what the chat produced', () => {
  it('registers a file the agent wrote where the resolver told it to', async () => {
    await agentWrites('summary.md', '# what wayland is\n');

    const result = await sweep();

    expect(result.registered.map((r) => path.basename(r.relativePath))).toEqual(['summary.md']);
    const ledger = await readArtifactLedger(ledgerPath);
    expect(ledger).toHaveLength(1);
    expect(ledger[0].relativePath).toBe(`artifacts/chat/${CONVERSATION}/summary.md`);
  });

  it('finds nothing, and writes nothing, when the chat produced nothing', async () => {
    const result = await sweep();

    expect(result.registered).toEqual([]);
    expect(await readArtifactLedger(ledgerPath)).toEqual([]);
  });

  /** THE ONE THAT MATTERS. */
  it('leaves EXACTLY ONE record after two turns rewriting the same file', async () => {
    await agentWrites('summary.md', '# the long version\n');
    const first = await sweep();

    await agentWrites('summary.md', '# short\n');
    const second = await sweep();

    const ledger = await readArtifactLedger(ledgerPath);
    const forSummary = ledger.filter((r) => r.relativePath.endsWith('summary.md'));

    expect(forSummary).toHaveLength(1);
    // Same identity across turns - that is WHY there is one row.
    expect(second.registered[0].artifactId).toBe(first.registered[0].artifactId);
    // ...and it carries the SECOND turn's bytes, not a stale digest.
    expect(forSummary[0].sha256).toBe(second.registered[0].sha256);
    expect(forSummary[0].sha256).not.toBe(first.registered[0].sha256);
    expect(forSummary[0].sizeBytes).toBe('# short\n'.length);
  });

  /**
   * The dangerous half of the re-hash skip. Skipping on SIZE alone would let a
   * same-length rewrite - "make that summary shorter" landing on the same byte
   * count, a corrected figure, a swapped word - keep the OLD digest in the
   * ledger. `openVerified` would then refuse the file on every button, because
   * the recorded digest no longer matches the bytes, and the user's card would
   * be dead with no explanation. So the skip requires mtime too, and this is
   * what says so.
   */
  it('re-registers a rewrite that kept exactly the same size', async () => {
    await agentWrites('summary.md', 'AAAAAAAA\n');
    const first = await sweep();

    await agentWrites('summary.md', 'BBBBBBBB\n');
    const second = await sweep();

    expect(second.registered[0].sizeBytes).toBe(first.registered[0].sizeBytes);
    expect(second.registered[0].sha256).not.toBe(first.registered[0].sha256);
    const ledger = await readArtifactLedger(ledgerPath);
    expect(ledger).toHaveLength(1);
    expect(ledger[0].sha256).toBe(second.registered[0].sha256);
  });

  it('re-hashes when the file did not settle before we hashed it (coarse-clock rewrite)', async () => {
    // THE WINDOWS CASE, MADE DETERMINISTIC. The memo skips re-hashing when size
    // AND mtime both match. File mtime is COARSE - NTFS buckets around 15ms,
    // FAT a full 2s - so a same-size rewrite can land in the SAME bucket as the
    // write we hashed and leave the stat identical. The skip would then return
    // the previous digest for bytes that moved. CI caught exactly that; macOS
    // never reproduces it because its mtime is fine grained.
    //
    // Rather than race the clock, pin the mtime to a moment only just before the
    // sweep - inside the granularity window - and pin it again after the
    // rewrite. Same size, same mtime, different bytes: indistinguishable from
    // "unchanged", so the memo must be refused.
    //
    // Note this is deliberately a RECENT time, not a future one. A future mtime
    // would also be refused by a naive "mtime < hashedAt" rule, so it would not
    // catch the real defect - the file being quiet for LESS than the timestamp
    // granularity when we hashed it.
    const target = path.join(outputDir(), 'summary.md');
    const pinned = new Date(Date.now() - 100);

    await agentWrites('summary.md', 'AAAAAAAA\n');
    await fs.utimes(target, pinned, pinned);
    const first = await sweep();

    await agentWrites('summary.md', 'BBBBBBBB\n');
    await fs.utimes(target, pinned, pinned); // the bucket "did not move"
    const second = await sweep();

    const stat = await fs.stat(target);
    // Within a millisecond, not exactly: utimes round-trips through nanosecond
    // precision, so a whole-ms input reads back as e.g. ...540.999.
    expect(Math.abs(stat.mtimeMs - pinned.getTime())).toBeLessThan(2); // simulation held
    expect(second.registered[0].sizeBytes).toBe(first.registered[0].sizeBytes);
    expect(second.registered[0].sha256).not.toBe(first.registered[0].sha256);
    const ledger = await readArtifactLedger(ledgerPath);
    expect(ledger).toHaveLength(1);
    expect(ledger[0].sha256).toBe(second.registered[0].sha256);
  });

  it('still reports an unchanged file as a live deliverable on a later turn', async () => {
    await agentWrites('summary.md', '# unchanged\n');
    const first = await sweep();
    // Nothing happens on turn two. The card must still name the file.
    const second = await sweep();

    expect(second.registered.map((r) => r.artifactId)).toEqual([first.registered[0].artifactId]);
    expect(await readArtifactLedger(ledgerPath)).toHaveLength(1);
  });

  it('keeps two conversations in two namespaces with two identities', async () => {
    const other = 'convsweep0002';
    await agentWrites('summary.md', '# mine\n');
    await agentWrites('summary.md', '# theirs\n', other);

    const mine = await sweep();
    const theirs = await sweep(other);

    expect(mine.registered[0].artifactId).not.toBe(theirs.registered[0].artifactId);
    expect(mine.registered[0].relativePath).toContain(`/${CONVERSATION}/`);
    expect(theirs.registered[0].relativePath).toContain(`/${other}/`);
    expect(await readArtifactLedger(ledgerPath)).toHaveLength(2);
  });

  it('walks nested output and never leaves the namespace', async () => {
    await agentWrites('nested/deep/report.md', '# nested\n');
    await agentWrites('top.md', '# top\n');
    // A file OUTSIDE the namespace, in the workspace root, is scratch: the
    // control that proves the sweep is a namespace walk and not a workspace one.
    await fs.writeFile(path.join(workspace, 'scratch.py'), 'print(1)\n', 'utf8');

    const result = await sweep();

    expect(result.registered.map((r) => path.basename(r.relativePath)).toSorted()).toEqual(['report.md', 'top.md']);
    for (const record of result.registered) {
      expect(record.relativePath.startsWith(`artifacts/chat/${CONVERSATION}/`)).toBe(true);
    }
  });

  it('reports a rejection instead of silently dropping it', async () => {
    await agentWrites('good.md', '# good\n');
    // A symlink is refused OUTRIGHT by the ledger - it must be REPORTED, since
    // a deliverable that is silently absent has no reason anywhere.
    await fs.symlink(path.join(workspace, 'scratch.py'), path.join(outputDir(), 'link.md'));
    await fs.writeFile(path.join(workspace, 'scratch.py'), 'print(1)\n', 'utf8');

    const result = await sweep();

    expect(result.registered.map((r) => path.basename(r.relativePath))).toEqual(['good.md']);
    expect(result.rejected.map((r) => r.reason)).toContain('symlink');
  });

  /**
   * The cap has to be REPORTED, not applied twice.
   *
   * `commitTaskRun` used to `slice(0, MAX_DECLARATIONS_PER_RUN)` the staged
   * paths BEFORE handing them to `registerArtifacts`. The validator's own
   * `too-many` rejection could therefore never fire from that path: files 65+
   * were dropped by the caller and the run reported zero rejections, so a user
   * whose task produced 70 files saw 64 and had no reason anywhere for the
   * other six. The truncation and the rejection are the same rule; only one of
   * them can tell the user what happened.
   */
  it('reports every deliverable past the cap instead of silently truncating', async () => {
    const handle = await beginTaskRun({ workspace, taskId: 'cron_overflow', series: 'market' });
    const overflow = MAX_DECLARATIONS_PER_RUN + 6;
    for (let i = 0; i < overflow; i += 1) {
      const name = `f${String(i).padStart(3, '0')}.md`;
      // eslint-disable-next-line no-await-in-loop -- ordering keeps the fixture deterministic
      await fs.writeFile(path.join(handle.stagingDir, name), `# ${i}\n`, 'utf8');
    }

    const outcome = await commitTaskRun(handle, { ledgerPath, declaredBy: 'Overflow Task' });
    if (!outcome.published) throw new Error('overflow run did not publish');

    expect(outcome.registered).toHaveLength(MAX_DECLARATIONS_PER_RUN);
    // The six that did not fit have a REASON, which is the whole point.
    expect(outcome.rejected).toHaveLength(6);
    expect(outcome.rejected.every((r) => r.reason === 'too-many')).toBe(true);
  });

  describe('the turn-end handler', () => {
    const turn = (over: Record<string, unknown> = {}) => ({
      sessionId: CONVERSATION,
      state: 'ai_waiting_input',
      workspace,
      ...over,
    });

    it('sweeps on a terminal turn and reports what it registered', async () => {
      await agentWrites('summary.md', '# done\n');
      const swept: string[] = [];

      const result = await onChatTurnCompleted(turn(), {
        ledgerPath,
        onSwept: (r) => {
          swept.push(...r.registered.map((x) => path.basename(x.relativePath)));
        },
      });

      expect(result?.registered).toHaveLength(1);
      expect(swept).toEqual(['summary.md']);
      expect(await readArtifactLedger(ledgerPath)).toHaveLength(1);
    });

    it('does nothing at all while the agent is still generating', async () => {
      await agentWrites('summary.md', '# half written\n');

      const result = await onChatTurnCompleted(turn({ state: 'ai_generating' }), { ledgerPath });

      expect(result).toBeNull();
      // The load-bearing half: a mid-turn sweep would register a half-written
      // file and hand the user a card for a partial report.
      expect(await readArtifactLedger(ledgerPath)).toEqual([]);
    });

    it('sweeps a turn that ERRORED - the file may already be on disk', async () => {
      await agentWrites('summary.md', '# written before it failed\n');

      const result = await onChatTurnCompleted(turn({ state: 'error' }), { ledgerPath });

      expect(result?.registered).toHaveLength(1);
    });

    it('never fires the card path for a turn that produced nothing', async () => {
      let fired = false;
      const result = await onChatTurnCompleted(turn(), { ledgerPath, onSwept: () => void (fired = true) });

      expect(result?.registered).toEqual([]);
      expect(fired).toBe(false);
    });

    it('ignores an event with no conversation or no workspace', async () => {
      await agentWrites('summary.md', '# x\n');

      expect(await onChatTurnCompleted(turn({ sessionId: '' }), { ledgerPath })).toBeNull();
      expect(await onChatTurnCompleted(turn({ workspace: '' }), { ledgerPath })).toBeNull();
      expect(await readArtifactLedger(ledgerPath)).toEqual([]);
    });

    it('reports a sweep failure instead of rejecting the turn', async () => {
      await agentWrites('summary.md', '# x\n');
      const errors: unknown[] = [];

      // A ledger path whose PARENT is a regular file: mkdir fails, so the
      // append fails. The turn must still settle.
      await fs.writeFile(path.join(root, 'not-a-dir'), 'x', 'utf8');
      const result = await onChatTurnCompleted(turn(), {
        ledgerPath: path.join(root, 'not-a-dir', 'ledger.jsonl'),
        onError: (e) => errors.push(e),
      });

      expect(result).toBeNull();
      expect(errors).toHaveLength(1);
    });
  });
});
