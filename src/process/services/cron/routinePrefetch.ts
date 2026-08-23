/**
 * Data a routine needs BEFORE its run starts, fetched where the run cannot.
 *
 * A scheduled run executes its shell tools under Core's seatbelt, and the
 * seatbelt refuses DNS. That is deliberate: an unattended auto-approve run
 * with outbound network is a security decision, and this milestone does not
 * take it. The consequence is that any routine whose work needs the internet
 * has to be handed its data by the host first.
 *
 * The registry is keyed by a NAME the routine declares in `routines.json`, and
 * the executor looks that name up LIVE, per run, from the bundled definition -
 * never from a field copied onto the stored job. That matters: a routine
 * already seeded onto a user's machine is never re-read from `routines.json`
 * by the seeder (`if (existingRoutineIds.has(routine.id)) continue`), so a new
 * key stored at seed time would never reach the one job this milestone is
 * about. Reading it at run time reaches every install, old and new.
 */
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import { logger } from '@office-ai/platform';

import {
  DEFAULT_PREFETCH_BUDGET_MS,
  prefetchDailyBars,
  type PrefetchResult,
} from '@process/services/marketData/prefetchDailyBars';

/** The one prefetcher that exists today. */
export const MARKET_DAILY_BARS_PREFETCH = 'market-daily-bars';

/**
 * Where the placed `market-open-report` skill lives inside a task workspace.
 * `setupWorkspaceSkills` puts a routine's declared skills here.
 */
function placedSkillDir(workspace: string): string {
  return path.join(workspace, '.wayland-core', 'skills', 'market-open-report');
}

/**
 * THE ONE CACHE DIRECTORY, named once.
 *
 * Chosen so it is reachable two independent ways and the model is not the
 * mechanism either time:
 *
 *  1. The routine body exports `MARKET_OPEN_REPORT_CACHE` to exactly this path,
 *     resolved from `$PWD` at the workspace root before its `cd`.
 *  2. Failing that, it IS the scanner's own second probe candidate,
 *     `<cwd>/.market-open-report-cache/yahoo-cache`, because the routine body
 *     requires a `cd` into the placed skill directory before running.
 *
 * A test asserts (1) and (2) name the same string. If they ever drift, the
 * scanner looks at an empty directory, has no network, and prints a confident
 * report with every symbol under NO DATA - a full outage that reads exactly
 * like a quiet market.
 */
export function routineCacheDir(workspace: string): string {
  return path.join(placedSkillDir(workspace), '.market-open-report-cache', 'yahoo-cache');
}

export type RoutinePrefetchContext = {
  workspace: string;
  /** The UTC cache-key date, computed ONCE by the caller and shared with the run. */
  end: string;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
  budgetMs?: number;
};

/** `symbol,ticker,…` - the scanner reads the `ticker` column. */
async function watchlistTickers(skillDir: string): Promise<string[]> {
  const csv = await readFile(path.join(skillDir, 'data', 'TC-MASTER-WATCHLIST.csv'), 'utf8');
  const lines = csv.replace(/\r\n?/g, '\n').split('\n').filter(Boolean);
  const header = lines.shift()?.split(',') ?? [];
  const col = header.indexOf('ticker');
  if (col < 0) return [];
  return lines.map((line) => line.split(',')[col]).filter((t): t is string => !!t);
}

/**
 * The eight fixed symbols `marketOverview.mjs` reads.
 *
 * Parsed from that module's own `MARKETS` table rather than restated here, so a
 * symbol added or renamed there is picked up instead of quietly going unfetched
 * - which would show up as a missing row in the overview and nowhere else.
 */
async function overviewSymbols(skillDir: string): Promise<string[]> {
  const src = await readFile(path.join(skillDir, 'scripts', 'marketOverview.mjs'), 'utf8');
  const table = src.match(/export const MARKETS = \[([\s\S]*?)\];/);
  if (!table) return [];
  return [...table[1].matchAll(/\[\s*'([^']+)'/g)].map((m) => m[1]);
}

/**
 * Run a routine's declared prefetch.
 *
 * NEVER THROWS and never blocks a run indefinitely. Returns null when there is
 * nothing to do or nothing can be done; the run then proceeds and produces the
 * honest empty report that names what it could not reach.
 */
export async function runRoutinePrefetch(
  name: string | undefined,
  ctx: RoutinePrefetchContext
): Promise<PrefetchResult | null> {
  if (name !== MARKET_DAILY_BARS_PREFETCH) return null;
  try {
    const skillDir = placedSkillDir(ctx.workspace);
    if (!existsSync(skillDir)) {
      logger.warn(`[RoutinePrefetch] market-open-report is not placed in ${ctx.workspace}; nothing to pre-warm`);
      return null;
    }
    const [scanSymbols, overview] = await Promise.all([watchlistTickers(skillDir), overviewSymbols(skillDir)]);
    if (scanSymbols.length === 0 && overview.length === 0) return null;
    return await prefetchDailyBars({
      // THE BOUNDARY IS THE WORKSPACE, not the cache directory.
      //
      // Every segment below the workspace is writable by the sandboxed run, so
      // any of them can be a symlink or a Windows junction the run left there
      // on a previous fire. The workspace itself is host-created, which is why
      // it - and only it - can anchor the decision.
      confineTo: ctx.workspace,
      cacheDir: routineCacheDir(ctx.workspace),
      scanSymbols,
      overviewSymbols: overview,
      end: ctx.end,
      fetchImpl: ctx.fetchImpl,
      budgetMs: ctx.budgetMs ?? DEFAULT_PREFETCH_BUDGET_MS,
    });
  } catch (error) {
    // A prefetch outage may never abort a run.
    logger.warn('[RoutinePrefetch] prefetch failed; the run will report what it could not reach', error);
    return null;
  }
}
