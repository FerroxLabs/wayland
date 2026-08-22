import path from 'path';
import { describe, expect, it } from 'vitest';

import { resolveRoutinePrefetch } from '@process/services/cron/BuiltinRoutinesSeeder';
import { MARKET_DAILY_BARS_PREFETCH } from '@process/services/cron/routinePrefetch';

const BUNDLED_DIR = path.resolve(__dirname, '../../../src/process/resources/bundled-workflows');
const EXECUTOR = path.resolve(__dirname, '../../../src/process/services/cron/WorkerTaskManagerJobExecutor.ts');

describe('the prefetch declaration reaches an ALREADY-SEEDED job', () => {
  it('is resolved live from routines.json by routine id, not read off the stored job', async () => {
    // `BuiltinRoutinesSeeder` skips any routine it has already seeded
    // (`if (existingRoutineIds.has(routine.id)) continue`) and the definition
    // migration copies no new configOptions onto an existing job. A prefetch
    // key stored at seed time would therefore never reach Sean's existing
    // "Weekday morning report" - the single job this whole milestone is about.
    // Reading it at RUN time, keyed only by the routine id the job already
    // carries, reaches every install.
    expect(await resolveRoutinePrefetch('weekday-morning-report', BUNDLED_DIR)).toBe(MARKET_DAILY_BARS_PREFETCH);
    expect(await resolveRoutinePrefetch('weekly-copy-review', BUNDLED_DIR)).toBeUndefined();
    expect(await resolveRoutinePrefetch('no-such-routine', BUNDLED_DIR)).toBeUndefined();
    expect(await resolveRoutinePrefetch(undefined, BUNDLED_DIR)).toBeUndefined();
  });

  it('the executor runs the prefetch BEFORE it sends the turn, and awaits it', async () => {
    // Structural, deliberately: the ordering is the whole point. Bars that
    // arrive after the scanner has already looked are bars that were never
    // there. Read the file rather than trusting the diff.
    const { readFileSync } = await import('fs');
    const src = readFileSync(EXECUTOR, 'utf8');
    const prefetchAt = src.indexOf('await runRoutinePrefetch(');
    const sendAt = src.indexOf('await task.sendMessage(');
    expect(prefetchAt).toBeGreaterThan(-1);
    expect(sendAt).toBeGreaterThan(-1);
    expect(prefetchAt).toBeLessThan(sendAt);
  });

  it('the end date is computed ONCE by the host and shared with the run', async () => {
    const { readFileSync } = await import('fs');
    const src = readFileSync(EXECUTOR, 'utf8');
    // Exactly one place derives "today" for this purpose. Two derivations is
    // the UTC-midnight cache miss that produces a totally empty report.
    expect(src.match(/utcCacheEndDate\(/g)?.length).toBe(1);
  });
});
