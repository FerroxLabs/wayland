import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';

import {
  MARKET_DAILY_BARS_PREFETCH,
  routineCacheDir,
  runRoutinePrefetch,
} from '@process/services/cron/routinePrefetch';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SKILL_DIR = path.join(REPO_ROOT, 'src/process/resources/skills/market-open-report');
const ROUTINE_BODY = path.join(
  REPO_ROOT,
  'src/process/resources/bundled-workflows/bodies/wayland-morning-report/SKILL.md'
);

function tempWorkspace(): string {
  return mkdtempSync(path.join(tmpdir(), 'mr-ws-'));
}

describe('routine prefetch', () => {
  it('declares the morning report prefetch in routines.json, on the routine the milestone is about', async () => {
    const routines = JSON.parse(
      readFileSync(path.join(REPO_ROOT, 'src/process/resources/bundled-workflows/routines.json'), 'utf8')
    ) as Array<{ id: string; prefetch?: string; inputs?: Record<string, string> }>;
    const routine = routines.find((r) => r.id === 'weekday-morning-report');
    expect(routine).toBeDefined();
    expect(routine!.prefetch).toBe(MARKET_DAILY_BARS_PREFETCH);
    // `prefetch` is ROUTINE metadata, not an input. An input would change the
    // declared key set that `isSeederGeneratedPrompt` matches on, and every
    // already-seeded job's prompt would start reading as user-edited.
    expect(Object.keys(routine!.inputs ?? {})).not.toContain('prefetch');
  });

  it('THE SKILL BODY AND THE HOST NAME THE SAME CACHE DIRECTORY', () => {
    // The prefetch is worthless if the scanner looks somewhere else. The host
    // writes to `routineCacheDir(workspace)`; the run exports
    // MARKET_OPEN_REPORT_CACHE relative to the scanner's own directory, after
    // its mandated `cd`. They have to resolve to the same string - a drift here
    // is a full-outage report that looks exactly like a quiet market.
    //
    // RELATIVE is deliberate. An absolute `$PWD/...` form is banned outright by
    // two other guards, because computing the DELIVERABLES path that way is
    // what once filed the brief inside `.wayland-core/`, where the Workbench
    // never showed it.
    // Absolute ON THIS PLATFORM. A bare '/tmp/...' is rootless on Windows, so
    // `path.join` keeps it rootless while `path.resolve` below anchors it to
    // the cwd's drive - the two then differ by a drive letter alone and the
    // check fails for a reason that cannot happen in production, where the
    // workspace is always a real absolute directory.
    const ws = path.resolve('/tmp/example-workspace');
    const hostPath = routineCacheDir(ws);
    const body = readFileSync(ROUTINE_BODY, 'utf8');
    const match = body.match(/export MARKET_OPEN_REPORT_CACHE=(\S+)/);
    expect(match, 'the routine body must export MARKET_OPEN_REPORT_CACHE').not.toBeNull();
    expect(path.isAbsolute(match![1])).toBe(false);
    const cwdDuringRun = path.join(ws, '.wayland-core/skills/market-open-report');
    expect(path.resolve(cwdDuringRun, match![1])).toBe(hostPath);
  });

  it('is ALSO the directory the scanner probes on its own, so a run that skips the export still finds it', () => {
    // The scanner's second probe candidate is `<cwd>/.market-open-report-cache/
    // yahoo-cache`, and the routine body requires `cd` into the placed skill
    // directory before running. Belt AND braces: the export above, and this.
    const ws = '/tmp/example-workspace';
    const cwdDuringRun = path.join(ws, '.wayland-core/skills/market-open-report');
    expect(routineCacheDir(ws)).toBe(path.join(cwdDuringRun, '.market-open-report-cache', 'yahoo-cache'));
  });

  it("prefetches the scanner's OWN watchlist plus the overview symbols, and never throws", async () => {
    const ws = tempWorkspace();
    try {
      // Place the skill the way the cron path does, so the watchlist the
      // prefetch reads is the one the run will scan.
      const placed = path.join(ws, '.wayland-core/skills/market-open-report');
      mkdirSync(path.dirname(placed), { recursive: true });
      const { cpSync } = await import('fs');
      cpSync(SKILL_DIR, placed, { recursive: true });

      const requested: string[] = [];
      const res = await runRoutinePrefetch(MARKET_DAILY_BARS_PREFETCH, {
        workspace: ws,
        end: '20260822',
        fetchImpl: async (url: string) => {
          requested.push(url);
          return new Response('{}', { status: 500 });
        },
      });
      expect(res).not.toBeNull();
      // 74 watchlist names + 8 overview symbols, read from the shipped files.
      expect(requested.length).toBe(82);
      expect(requested.some((u) => u.includes('/chart/AAPL?'))).toBe(true);
      expect(requested.some((u) => u.includes(encodeURIComponent('^VIX')))).toBe(true);
      // Every fetch failed. That is an outage, not a crash.
      expect(res!.written).toBe(0);
      expect(existsSync(routineCacheDir(ws))).toBe(true);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it('returns null for a routine that declares no prefetch, and for an unknown name', async () => {
    const ws = tempWorkspace();
    try {
      expect(await runRoutinePrefetch(undefined, { workspace: ws, end: '20260822' })).toBeNull();
      expect(await runRoutinePrefetch('no-such-prefetcher', { workspace: ws, end: '20260822' })).toBeNull();
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it('returns null rather than throwing when the skill was never placed', async () => {
    const ws = tempWorkspace();
    try {
      const res = await runRoutinePrefetch(MARKET_DAILY_BARS_PREFETCH, { workspace: ws, end: '20260822' });
      expect(res).toBeNull();
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
});
