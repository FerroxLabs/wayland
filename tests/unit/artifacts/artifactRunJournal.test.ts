/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE RECORD OF A RUN THAT LEFT NOTHING BEHIND.
 *
 * A failed or empty run is ABANDONED - its staging tree is removed and no dated
 * directory is ever created - so this file is the only evidence it happened.
 * That makes three properties load-bearing, and each is checked against a real
 * file on a real filesystem:
 *
 *  - it never throws, because it is called from the settle path of a run that
 *    has ALREADY failed;
 *  - it is bounded, because a task that fails every five minutes would
 *    otherwise append to a file in the user's Documents folder forever;
 *  - it is parsed DEFENSIVELY, because it sits inside the agent's own workspace
 *    and anything with shell access can rewrite it.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  MAX_JOURNAL_BYTES,
  MAX_JOURNAL_ENTRIES,
  MAX_JOURNAL_MESSAGE_LENGTH,
  readRunJournal,
  recordRunOutcome,
  RUN_JOURNAL_NAME,
  sanitizeJournalMessage,
} from '@process/services/artifacts/artifactRunJournal';

let root = '';
let seriesDir = '';

const journalFile = (): string => path.join(seriesDir, RUN_JOURNAL_NAME);

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-run-journal-'));
  seriesDir = path.join(root, 'workspace', 'artifacts', 'market');
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('the run journal', () => {
  it('records a failure and reads it back, newest first', async () => {
    await recordRunOutcome(seriesDir, {
      runId: 'rone',
      taskId: 'cron_brief',
      status: 'failed',
      message: 'engine died on start',
      now: new Date('2026-08-19T07:00:00Z'),
    });
    await recordRunOutcome(seriesDir, {
      runId: 'rtwo',
      taskId: 'cron_brief',
      status: 'no-output',
      now: new Date('2026-08-20T07:00:00Z'),
    });

    const entries = await readRunJournal(seriesDir);
    expect(entries.map((entry) => entry.runId)).toEqual(['rtwo', 'rone']);
    expect(entries[1]).toMatchObject({ status: 'failed', message: 'engine died on start', taskId: 'cron_brief' });
    expect(entries[0].message).toBeUndefined();
  });

  it('is dot-prefixed, so the workspace scanners and the alias namespace skip it', async () => {
    await recordRunOutcome(seriesDir, { runId: 'rone', taskId: 't', status: 'failed' });
    expect(RUN_JOURNAL_NAME.startsWith('.')).toBe(true);
    expect(await fs.readdir(seriesDir)).toEqual([RUN_JOURNAL_NAME]);
  });

  it('APPENDS rather than rewriting, so two settles cannot lose each other', async () => {
    await recordRunOutcome(seriesDir, { runId: 'rone', taskId: 't', status: 'failed' });
    const afterFirst = await fs.readFile(journalFile(), 'utf-8');
    await recordRunOutcome(seriesDir, { runId: 'rtwo', taskId: 't', status: 'failed' });
    const afterSecond = await fs.readFile(journalFile(), 'utf-8');

    expect(afterSecond.startsWith(afterFirst)).toBe(true);
    expect(afterSecond.trimEnd().split('\n')).toHaveLength(2);
  });

  it('never throws when the journal cannot be written', async () => {
    // A run that already failed must not fail a second time over its epitaph.
    // A path whose parent is a FILE cannot be made a directory, which is the
    // cheapest real un-writable series directory to construct.
    const blocked = path.join(root, 'not-a-dir');
    await fs.writeFile(blocked, 'in the way', 'utf8');

    await expect(
      recordRunOutcome(path.join(blocked, 'series'), { runId: 'rone', taskId: 't', status: 'failed' })
    ).resolves.toBeUndefined();
  });

  it('reads a missing, torn or corrupt journal as empty rather than throwing', async () => {
    expect(await readRunJournal(seriesDir)).toEqual([]);

    await recordRunOutcome(seriesDir, { runId: 'rgood', taskId: 't', status: 'failed' });
    // A crash can only truncate the FINAL line. It must cost that line and
    // nothing else.
    await fs.appendFile(journalFile(), '{"version":1,"runId":"rtor', 'utf8');
    expect((await readRunJournal(seriesDir)).map((entry) => entry.runId)).toEqual(['rgood']);

    await fs.writeFile(journalFile(), 'not json at all\n{]\n', 'utf8');
    expect(await readRunJournal(seriesDir)).toEqual([]);
  });

  it('DROPS a forged entry whose run id could not name a directory', async () => {
    // The journal is inside the workspace, so its contents are untrusted. A run
    // id is used as a key against the real published run ids, and one carrying
    // separators or traversal has no business being matched against anything.
    await fs.mkdir(seriesDir, { recursive: true });
    await fs.writeFile(
      journalFile(),
      [
        JSON.stringify({
          version: 1,
          runId: '../../etc',
          taskId: 't',
          status: 'failed',
          at: '2026-08-20T00:00:00.000Z',
        }),
        JSON.stringify({ version: 1, runId: 'r/../x', taskId: 't', status: 'failed', at: '2026-08-20T00:00:00.000Z' }),
        JSON.stringify({ version: 2, runId: 'rfuture', taskId: 't', status: 'failed', at: '2026-08-20T00:00:00.000Z' }),
        JSON.stringify({ version: 1, runId: 'rbad', taskId: 't', status: 'exploded', at: '2026-08-20T00:00:00.000Z' }),
        JSON.stringify({ version: 1, runId: 'rnodate', taskId: 't', status: 'failed', at: 'whenever' }),
        JSON.stringify({ version: 1, runId: 'rreal', taskId: 't', status: 'failed', at: '2026-08-20T00:00:00.000Z' }),
      ].join('\n') + '\n',
      'utf8'
    );

    expect((await readRunJournal(seriesDir)).map((entry) => entry.runId)).toEqual(['rreal']);
  });

  it('strips control characters and bounds a message, on the way in AND on the way out', async () => {
    // A terminal escape reaches a card label and an app log. Neither should be
    // able to clear a screen or move a cursor because a skill's error did.
    const esc = String.fromCharCode(27);
    expect(sanitizeJournalMessage('clean')).toBe('clean');
    expect(sanitizeJournalMessage('two\nlines')).toBe('two lines');
    expect(sanitizeJournalMessage('   ')).toBeUndefined();
    expect(sanitizeJournalMessage(42)).toBeUndefined();
    expect(sanitizeJournalMessage(`${esc}[2Jcleared`)).toBe('[2Jcleared');
    expect(sanitizeJournalMessage('x'.repeat(5000))!.length).toBe(MAX_JOURNAL_MESSAGE_LENGTH);

    // On the way out too: the file can be rewritten after we wrote it.
    await fs.mkdir(seriesDir, { recursive: true });
    await fs.writeFile(
      journalFile(),
      `${JSON.stringify({
        version: 1,
        runId: 'rreal',
        taskId: 't',
        status: 'failed',
        at: '2026-08-20T00:00:00.000Z',
        message: `${esc}[2Jcleared the terminal${'!'.repeat(5000)}`,
      })}\n`,
      'utf8'
    );
    const [entry] = await readRunJournal(seriesDir);
    expect(entry.message).not.toContain(esc);
    expect(entry.message!.length).toBe(MAX_JOURNAL_MESSAGE_LENGTH);
  });

  it('collapses a run id recorded twice, keeping the LAST word on it', async () => {
    await recordRunOutcome(seriesDir, {
      runId: 'rone',
      taskId: 't',
      status: 'no-output',
      now: new Date('2026-08-20T07:00:00Z'),
    });
    await recordRunOutcome(seriesDir, {
      runId: 'rone',
      taskId: 't',
      status: 'failed',
      message: 'and then it broke',
      now: new Date('2026-08-20T07:00:01Z'),
    });

    const entries = await readRunJournal(seriesDir);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ status: 'failed', message: 'and then it broke' });
  });

  it('COMPACTS itself instead of growing without bound', async () => {
    // A task failing on a five-minute schedule appends forever. The file lives
    // in the user's Documents folder, so "forever" is not an acceptable size.
    const total = 500;
    for (let index = 0; index < total; index += 1) {
      // eslint-disable-next-line no-await-in-loop -- appends are sequential by construction
      await recordRunOutcome(seriesDir, {
        runId: `r${String(index).padStart(5, '0')}`,
        taskId: 'cron_brief',
        status: 'failed',
        // Long enough that the byte cap is passed well inside this loop.
        message: 'x'.repeat(MAX_JOURNAL_MESSAGE_LENGTH),
        now: new Date(Date.UTC(2026, 7, 1, 0, index)),
      });
    }

    // The control: unchecked, these entries are far past the cap, so a file that
    // is still under it was actively compacted rather than merely small.
    const oneLine = JSON.stringify({
      version: 1,
      runId: 'r00000',
      taskId: 'cron_brief',
      status: 'failed',
      at: '2026-08-01T00:00:00.000Z',
      message: 'x'.repeat(MAX_JOURNAL_MESSAGE_LENGTH),
    }).length;
    expect(oneLine * total).toBeGreaterThan(MAX_JOURNAL_BYTES);

    const size = (await fs.stat(journalFile())).size;
    expect(size).toBeLessThanOrEqual(MAX_JOURNAL_BYTES + oneLine + 1);

    const entries = await readRunJournal(seriesDir);
    expect(entries.length).toBeLessThanOrEqual(MAX_JOURNAL_ENTRIES);
    // What survives is the NEWEST, which is what anybody diagnosing a broken
    // task is looking at.
    expect(entries[0].runId).toBe(`r${String(total - 1).padStart(5, '0')}`);
    expect(entries.map((entry) => entry.runId)).not.toContain('r00000');
  });

  it('refuses to record a run id that could not name a directory', async () => {
    await recordRunOutcome(seriesDir, { runId: '../escape', taskId: 't', status: 'failed' });
    await recordRunOutcome(seriesDir, { runId: '', taskId: 't', status: 'failed' });
    expect(await readRunJournal(seriesDir)).toEqual([]);
  });
});
