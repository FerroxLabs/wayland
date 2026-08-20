/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Promotion journal (protocol rules 1 and 2).
 *
 * Promotion allocates a folder in the user's Documents and then copies real
 * data into it. Two things make that dangerous without a journal:
 *
 *  - **Double promotion.** Two accepts of the same offer allocate `Task` and
 *    `Task (2)`, copy both, and leave one fully-populated folder in Finder that
 *    nothing references and nobody can explain. The idempotency key -
 *    conversation id plus job id - makes the second call return the first
 *    call's result.
 *  - **A crash mid-copy.** Without a record of "which folder did I already
 *    allocate for this", the next attempt allocates a NEW one and the first is
 *    orphaned. So the operation and its target are persisted BEFORE any bytes
 *    are copied.
 *
 * The journal is app-private state, not user content: a single small JSON file
 * under the config dir, written atomically, with writes serialized through one
 * tail promise so two concurrent operations cannot lose each other's record.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { writeFileAtomic } from '@process/utils/atomicWrite';
import { getConfigPath } from '@process/utils';
import type { SkippedEntry } from './promotionCopy';

export const PROMOTION_JOURNAL_FILE = 'workspace-promotions.json';

/**
 * `intent`    - H5. The schedule state this operation must END in, written
 *               BEFORE the job is paused. Nothing is allocated yet, so this is
 *               explicitly NOT resumable as a copy - it exists only so a crash
 *               between the pause and the copy cannot lose the fact that the
 *               user's task was supposed to be ON.
 * `staged`    - target allocated and recorded; the copy may be partial.
 * `copied`    - the staging tree is complete and verified; publish may be partial.
 * `committed` - the conversation points at the new workspace. Terminal, replayable.
 * `aborted`   - cleaned up. A later attempt with the same key starts fresh.
 */
export type PromotionState = 'intent' | 'staged' | 'copied' | 'committed' | 'aborted';

export type PromotionRecord = Readonly<{
  schemaVersion: 1;
  key: string;
  operationId: string;
  conversationId: string;
  jobId: string;
  sourceWorkspace: string;
  targetWorkspace: string;
  stagingDir: string;
  workspaceId: string | null;
  state: PromotionState;
  startedAtMs: number;
  finishedAtMs?: number;
  skipped?: readonly SkippedEntry[];
  error?: string;
  /**
   * H5 - whether the recurring task was ARMED when promotion started, and must
   * therefore be armed again when it ends. Read from the journal rather than
   * from the live job, because by the time a retry runs the live job has
   * already been paused by the attempt that crashed.
   */
  resumeEnabled?: boolean;
  /**
   * True once the schedule has actually been put back. Makes the repair a
   * one-shot: a user who pauses the task themselves after a completed promotion
   * must not have that undone by a later duplicate accept.
   */
  scheduleRestored?: boolean;
}>;

/** Rule 1: the idempotency key. */
export const promotionKey = (conversationId: string, jobId: string): string => `${conversationId}::${jobId}`;

type JournalFile = { schemaVersion: 1; records: Record<string, PromotionRecord> };

const EMPTY: JournalFile = { schemaVersion: 1, records: {} };

export class PromotionJournal {
  private tail: Promise<unknown> = Promise.resolve();

  constructor(private readonly file: string) {}

  private async load(): Promise<JournalFile> {
    try {
      const parsed = JSON.parse(await fs.readFile(this.file, 'utf8')) as unknown;
      if (!parsed || typeof parsed !== 'object') return { ...EMPTY, records: {} };
      const records = (parsed as JournalFile).records;
      if (!records || typeof records !== 'object') return { ...EMPTY, records: {} };
      return { schemaVersion: 1, records };
    } catch {
      // A missing or corrupt journal must not block promotion; the worst case
      // is an orphan folder, which is exactly what a corrupt journal cannot
      // prevent anyway.
      return { ...EMPTY, records: {} };
    }
  }

  /** Serialize every mutation so a concurrent write cannot drop a record. */
  private mutate<T>(operation: (file: JournalFile) => Promise<T> | T): Promise<T> {
    const run = this.tail.then(async () => {
      const file = await this.load();
      const result = await operation(file);
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      await writeFileAtomic(this.file, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
      return result;
    });
    this.tail = run.catch((): undefined => undefined);
    return run;
  }

  async read(key: string): Promise<PromotionRecord | null> {
    return (await this.load()).records[key] ?? null;
  }

  async list(): Promise<PromotionRecord[]> {
    return Object.values((await this.load()).records);
  }

  async write(record: PromotionRecord): Promise<void> {
    await this.mutate((file) => {
      file.records[record.key] = record;
    });
  }

  async remove(key: string): Promise<void> {
    await this.mutate((file) => {
      delete file.records[key];
    });
  }
}

let shared: PromotionJournal | null = null;

/** The process-wide journal. Lazy so the module stays loadable without Electron. */
export function defaultPromotionJournal(): PromotionJournal {
  if (!shared) shared = new PromotionJournal(path.join(getConfigPath(), PROMOTION_JOURNAL_FILE));
  return shared;
}
