/**
 * The prefetch runs OUTSIDE the seatbelt. The run it feeds runs INSIDE it.
 *
 * That asymmetry is the whole point of `prefetchDailyBars` - and it is also the
 * hole these tests close. Every path the prefetch writes to is derived from the
 * task workspace, and the task workspace is writable by the sandboxed run. A
 * run that has been prompt-injected cannot itself reach outside its jail, but
 * it CAN leave a symbolic link inside the workspace and wait ~24 hours for the
 * host to walk into it. `mkdir`, `write` and `rm` all follow symlinks; a
 * containment check made on the lexical string does not.
 *
 * On Windows the same escape needs no symlink privilege at all: a directory
 * JUNCTION is creatable by an unprivileged user and `O_NOFOLLOW` does not
 * exist there, so the resolved-path check - not the open flag - has to be the
 * thing that refuses.
 *
 * AND A RESOLVED-PATH CHECK IS NOT ENOUGH BY ITSELF. A hardlink gives the run a
 * second directory entry for an inode outside the jail, and every path-based
 * answer about that entry is correct: it really is inside the workspace. PROBES
 * 6-8 are that axis, and they were red against a containment fix that had only
 * the path half - probe 6 truncated the victim and wrote the manifest over it.
 *
 * These tests drive the real `runRoutinePrefetch`, with the real placed skill
 * directory copied in, so the containment decision under test is the one that
 * ships and not a restatement of it.
 */
import {
  cpSync,
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { routineCacheDir, runRoutinePrefetch } from '@process/services/cron/routinePrefetch';
import { YAHOO_SCAN_START, type PrefetchResult } from '@process/services/marketData/prefetchDailyBars';

const END = '20260822';

/** The shipped skill, copied whole - the watchlist and MARKETS table are read from it. */
const SHIPPED_SKILL = path.resolve(__dirname, '../../src/process/resources/skills/market-open-report');

const BARS = Array.from({ length: 400 }, (_, i) => ({
  open: 10 + i,
  high: 11 + i,
  low: 9 + i,
  close: 10.5 + i,
  volume: 1000 + i,
}));

function yahooChartBody(): string {
  return JSON.stringify({
    chart: {
      result: [
        {
          timestamp: BARS.map((_, i) => 1_700_000_000 + i * 86_400),
          indicators: {
            quote: [
              {
                open: BARS.map((b) => b.open),
                high: BARS.map((b) => b.high),
                low: BARS.map((b) => b.low),
                close: BARS.map((b) => b.close),
                volume: BARS.map((b) => b.volume),
              },
            ],
          },
        },
      ],
    },
  });
}

let root: string;
let workspace: string;
/** Stands in for everything on the machine that is NOT the confined workspace. */
let victim: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'mr-confine-'));
  workspace = path.join(root, 'workspace');
  victim = path.join(root, 'victim');
  mkdirSync(workspace, { recursive: true });
  mkdirSync(victim, { recursive: true });
  const placed = path.join(workspace, '.wayland-core', 'skills', 'market-open-report');
  mkdirSync(path.dirname(placed), { recursive: true });
  cpSync(SHIPPED_SKILL, placed, { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

async function runReported(): Promise<PrefetchResult | null> {
  return await runRoutinePrefetch('market-daily-bars', {
    workspace,
    end: END,
    fetchImpl: async () => new Response(yahooChartBody(), { status: 200 }),
  });
}

async function run(): Promise<void> {
  await runReported();
}

/** Every file that appeared under `victim`, at any depth. */
function victimContents(): string[] {
  const out: string[] = [];
  const walk = (dir: string, prefix: string): void => {
    for (const name of readdirSync(dir)) {
      const abs = path.join(dir, name);
      out.push(path.join(prefix, name));
      if (!lstatSync(abs).isSymbolicLink() && lstatSync(abs).isDirectory()) walk(abs, path.join(prefix, name));
    }
  };
  walk(victim, '');
  return out.toSorted();
}

describe('prefetch confinement: a link left inside the workspace must not move a host write out of it', () => {
  it('PROBE 1 - the cache directory itself is a symlink out of the workspace: nothing is written through it', async () => {
    // The run creates this the day before. It is inside its jail, so the
    // seatbelt permits it; the LINK TARGET is not, but nothing dereferences it
    // until the host does.
    const cacheParent = path.dirname(routineCacheDir(workspace));
    mkdirSync(path.dirname(cacheParent), { recursive: true });
    symlinkSync(victim, cacheParent, 'dir');

    await run();

    expect(victimContents()).toEqual([]);
  });

  it('PROBE 2 - the LAST cache segment is a symlink out of the workspace: nothing is written through it', async () => {
    const cacheDir = routineCacheDir(workspace);
    mkdirSync(path.dirname(cacheDir), { recursive: true });
    symlinkSync(victim, cacheDir, 'dir');

    await run();

    expect(victimContents()).toEqual([]);
  });

  it('PROBE 3 - the prune deletes a victim file outside the workspace', async () => {
    // The prune matches ONLY the filenames this module writes, so the run picks
    // a victim name that fits the pattern. Through a symlinked cache directory
    // that is an arbitrary unlink outside the jail.
    const bait = path.join(victim, `AAPL_${YAHOO_SCAN_START}_20260801.json`);
    writeFileSync(bait, 'a file that belongs to somebody else');
    const cacheDir = routineCacheDir(workspace);
    mkdirSync(path.dirname(cacheDir), { recursive: true });
    symlinkSync(victim, cacheDir, 'dir');

    await run();

    expect(existsSync(bait)).toBe(true);
  });

  it('PROBE 4 - a DANGLING symlink at a cache FILE name redirects that one write out of the workspace', async () => {
    // The cache directory is genuinely inside the workspace here. Only the leaf
    // is poisoned, and `existsSync` on a dangling link is false, so the write
    // goes ahead and lands on the link target.
    const cacheDir = routineCacheDir(workspace);
    mkdirSync(cacheDir, { recursive: true });
    const escaped = path.join(victim, 'pwned.json');
    symlinkSync(escaped, path.join(cacheDir, `AAPL_${YAHOO_SCAN_START}_${END}.json`), 'file');

    await run();

    expect(existsSync(escaped)).toBe(false);
  });

  it('PROBE 5 - the manifest write obeys the same boundary', async () => {
    const cacheDir = routineCacheDir(workspace);
    mkdirSync(cacheDir, { recursive: true });
    const escaped = path.join(victim, 'manifest.json');
    symlinkSync(escaped, path.join(cacheDir, '.prefetch-manifest.json'), 'file');

    await run();

    expect(existsSync(escaped)).toBe(false);
  });

  /**
   * A HARDLINK DEFEATS EVERY PATH-BASED CHECK, INCLUDING THE ONE ABOVE.
   *
   * It is not a link the kernel resolves - it is a SECOND DIRECTORY ENTRY for
   * the same inode, sitting legitimately inside the workspace. So
   * `path.relative` containment passes, `dirname === realCacheDir` passes,
   * `realpathSync` resolves INSIDE the root, and `lstat().isSymbolicLink()` is
   * FALSE. Every path answer is correct and the damage happens through the
   * inode: `O_TRUNC` on that entry empties the victim.
   *
   * Path containment is necessary and NOT sufficient. The second axis is that a
   * file this module wrote has exactly one link, and that this module never
   * writes THROUGH an existing entry at all.
   */
  it('PROBE 6 - a HARDLINKED victim at the manifest name is not truncated', async () => {
    const cacheDir = routineCacheDir(workspace);
    mkdirSync(cacheDir, { recursive: true });
    const victimFile = path.join(victim, 'payroll.json');
    const contents = 'BYTES THAT MUST SURVIVE';
    writeFileSync(victimFile, contents);
    // Same filesystem, so the run can do this from inside its own jail.
    linkSync(victimFile, path.join(cacheDir, '.prefetch-manifest.json'));

    await run();

    expect(readFileSync(victimFile, 'utf8')).toBe(contents);
  });

  it('PROBE 7 - a HARDLINKED victim at a CACHE FILE name is neither truncated nor served as bars', async () => {
    const cacheDir = routineCacheDir(workspace);
    mkdirSync(cacheDir, { recursive: true });
    const victimFile = path.join(victim, 'private-notes.json');
    const contents = 'BYTES THAT MUST SURVIVE';
    writeFileSync(victimFile, contents);
    const entry = path.join(cacheDir, `AAPL_${YAHOO_SCAN_START}_${END}.json`);
    linkSync(victimFile, entry);

    const outcome = await runReported();

    expect(readFileSync(victimFile, 'utf8')).toBe(contents);
    // And it must not be counted as a cache HIT, which is how the victim's
    // bytes would reach the scanner - and from there the brief.
    expect(outcome?.rejected).toContain('AAPL');
    expect(outcome?.cached).toBe(0);
  });

  it('PROBE 8 - the prune does not unlink a HARDLINKED entry it did not write', async () => {
    const cacheDir = routineCacheDir(workspace);
    mkdirSync(cacheDir, { recursive: true });
    const victimFile = path.join(victim, 'stale-looking.json');
    writeFileSync(victimFile, 'BYTES THAT MUST SURVIVE');
    // A stale-dated name, which is exactly what the prune deletes.
    const entry = path.join(cacheDir, `AAPL_${YAHOO_SCAN_START}_20260801.json`);
    linkSync(victimFile, entry);

    await run();

    expect(existsSync(entry)).toBe(true);
    expect(readFileSync(victimFile, 'utf8')).toBe('BYTES THAT MUST SURVIVE');
  });

  it('still pre-warms a clean workspace - the guard must refuse escapes, not the feature', async () => {
    await run();
    const cacheDir = routineCacheDir(workspace);
    const written = readdirSync(cacheDir).filter((f) => f.endsWith('.json') && !f.startsWith('.'));
    expect(written.length).toBeGreaterThan(0);
    expect(existsSync(path.join(cacheDir, '.prefetch-manifest.json'))).toBe(true);
    expect(victimContents()).toEqual([]);
  });
});
