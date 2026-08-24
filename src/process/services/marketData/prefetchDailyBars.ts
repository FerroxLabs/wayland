/**
 * Pre-warm the morning report's Yahoo bar cache from OUTSIDE the engine sandbox.
 *
 * WHY THIS FILE EXISTS AT ALL
 * ---------------------------
 * The signal engine needs deep history - `report.mjs` discards any symbol with
 * fewer than 300 daily bars - and a scheduled run cannot fetch it. A run's Bash
 * tool executes under Core's seatbelt, where DNS is refused outright: a `curl`
 * from inside a run exits 6, and every symbol then comes back `no data` while
 * the run still produces a well-formed, entirely empty brief. Widening the
 * sandbox would fix it in one line and is the wrong line - an unattended
 * auto-approve run with outbound network is a security decision with a real
 * blast radius, and it is deliberately not taken here.
 *
 * So the bars are fetched by the main process, which is not in the seatbelt,
 * and left on disk in the exact shape the scanner already reads without a
 * network call. `yahooDaily` checks its cache file FIRST and returns it; the
 * payload it writes is exactly the parsed bar array. Nothing in the scanner
 * changes.
 *
 * THE BARS ARE YAHOO'S, NOT TRADINGVIEW'S. Anyone reading a green result on the
 * morning-report milestone has to be told that sentence in those words. This
 * module is the whole of the report's history layer and it talks to
 * query1.finance.yahoo.com.
 *
 * TWO THINGS THIS CODE IS CAREFUL ABOUT, BOTH BECAUSE IT RUNS UNSANDBOXED
 * ----------------------------------------------------------------------
 *  1. A symbol reaches `path.join` on the way to a filename. In the sandboxed
 *     scanner that write is jailed; here it is not, so a symbol carrying `..`
 *     or a separator would be an arbitrary file write running as the user. The
 *     grammar below REFUSES rather than sanitises, because a sanitiser that
 *     silently rewrites `BRK/B` into something else produces a cache file the
 *     scanner never asks for, which is the exact silent-empty-report failure
 *     this module exists to remove.
 *  2. A symbol reaches a URL. It is percent-encoded into the path segment, and
 *     redirects are refused, so a crafted watchlist entry cannot rewrite the
 *     query, the fragment, or the host that is eventually contacted.
 */
import { randomBytes } from 'crypto';
import {
  closeSync,
  constants as fsConstants,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeSync,
} from 'fs';
import path from 'path';

/** `report.mjs:334` - `yahooDaily(tkr, '19990101', end, …)`. */
export const YAHOO_SCAN_START = '19990101';

/** `marketOverview.mjs:179` - `yahooDaily(sym, '20220101', end, …)`. */
export const YAHOO_OVERVIEW_START = '20220101';

/** Yahoo rejects an unfamiliar agent outright; same string the scanner sends. */
const UA = 'Mozilla/5.0';

/** Whole-fetch deadline for ONE symbol. */
const PER_SYMBOL_TIMEOUT_MS = 20_000;

/** Whole-prefetch deadline. A routine fires at 07:00 and must not hang a run. */
export const DEFAULT_PREFETCH_BUDGET_MS = 240_000;

/**
 * ONE Yahoo ticker, and nothing that can leave a directory.
 *
 * Deliberately a whitelist of the characters the shipped universe actually
 * uses: plain tickers (`AAPL`), class shares (`BRK.B`), continuous futures
 * (`ES=F`), indices (`^VIX`) and Yahoo's dotted index names (`DX-Y.NYB`).
 * `/`, `\`, `..`, NUL and every URL separator are outside the set, so a
 * traversal is a REFUSAL and not a rewrite.
 */
export function isPrefetchableSymbol(symbol: unknown): boolean {
  if (typeof symbol !== 'string') return false;
  if (symbol.length === 0 || symbol.length > 16) return false;
  if (symbol.includes('..')) return false;
  return /^[A-Za-z0-9^][A-Za-z0-9.=^-]*$/.test(symbol);
}

/**
 * The end half of the cache key, in UTC.
 *
 * MUST agree with `utcToday()` in `morning-report.mjs`, which is what the
 * scanner passes when `--end` is absent. A test pins both to the same frozen
 * instant across a UTC midnight; see the note on that function for what a
 * disagreement costs.
 */
export function utcCacheEndDate(now: Date = new Date()): string {
  return (
    String(now.getUTCFullYear()) +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0')
  );
}

/**
 * CONTAINMENT IS DECIDED ON THE REAL PATH, NEVER ON THE STRING.
 * ------------------------------------------------------------
 * Everything below exists because of one asymmetry: this module runs OUTSIDE
 * the seatbelt, and every path it writes to is derived from the task
 * workspace, which the sandboxed run can write to. `mkdir`, `open`, `write`
 * and `unlink` all FOLLOW symbolic links. A run that has been prompt-injected
 * cannot leave its jail itself, but it can drop a link inside the workspace
 * and let the host walk into it on the next fire. A lexical prefix comparison
 * agrees that `<workspace>/…/yahoo-cache` is inside the workspace no matter
 * where that name actually points.
 *
 * On Windows the same escape costs nothing: a directory JUNCTION needs no
 * privilege, and `O_NOFOLLOW` is not implemented there at all. So `O_NOFOLLOW`
 * is used where it exists - it is the only thing that closes the window
 * between the check and the open - but it is NEVER the only defence. The
 * `lstat` refusal is, and Node reports a junction as a symbolic link.
 *
 * A path that cannot be resolved is REFUSED, not assumed safe.
 *
 * AND PATH CONTAINMENT IS NOT ENOUGH ON ITS OWN. A HARDLINK is not a link the
 * kernel resolves - it is a SECOND DIRECTORY ENTRY for the same inode, sitting
 * legitimately inside the workspace. Against one, every path answer above is
 * correct and useless: the relative check passes, `realpathSync` resolves
 * inside the root, and `isSymbolicLink()` is FALSE. The damage happens through
 * the inode - `O_TRUNC` on that entry empties a file outside the workspace.
 *
 * So there is a second axis, and it is about the INODE, not the path:
 *  - a file this module wrote has exactly ONE link, so `nlink !== 1` is a
 *    refusal ({@link leafKind}); and
 *  - this module never writes THROUGH an existing entry at all. Every write
 *    creates a fresh private name with `O_EXCL` and RENAMES it into place,
 *    which replaces the directory entry and never touches the inode any other
 *    entry still points at ({@link writeConfinedFile}).
 */
const O_NOFOLLOW = typeof fsConstants.O_NOFOLLOW === 'number' ? fsConstants.O_NOFOLLOW : 0;

function isInside(realRoot: string, candidate: string): boolean {
  if (candidate === realRoot) return true;
  return candidate.startsWith(realRoot.endsWith(path.sep) ? realRoot : realRoot + path.sep);
}

/**
 * Resolve the confinement root ONCE, from the kernel.
 *
 * The root is host-created (the task workspace), so its own real path is the
 * trusted anchor every later decision is made against. An unresolvable root is
 * a total prefetch outage, which is a correct outcome; assuming it is fine is
 * not.
 */
function resolveRoot(root: string): string | null {
  try {
    const real = realpathSync(path.resolve(root));
    return lstatSync(real).isDirectory() ? real : null;
  } catch {
    return null;
  }
}

/**
 * Create `dir` beneath `realRoot`, ONE SEGMENT AT A TIME, refusing to traverse
 * or create through anything that is not a real directory.
 *
 * Walking from the resolved root rather than resolving the whole candidate is
 * what makes this work on macOS, where `/var` is itself a link to
 * `/private/var`: the segments are taken from the LEXICAL relationship between
 * the two caller-supplied strings and then re-walked against the REAL root, so
 * a legitimate caller is never refused for the platform's own symlinks while
 * an attacker-planted one still is.
 *
 * Returns the resolved real directory, or null when the path may not be used.
 */
function realiseConfinedDir(realRoot: string, lexicalRoot: string, dir: string): string | null {
  const rel = path.relative(path.resolve(lexicalRoot), path.resolve(dir));
  if (path.isAbsolute(rel)) return null;
  const segments = rel === '' ? [] : rel.split(path.sep);
  let cursor = realRoot;
  for (const segment of segments) {
    if (!isPlainFileName(segment)) return null;
    const next = path.join(cursor, segment);
    let st;
    try {
      st = lstatSync(next);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') return null;
      try {
        mkdirSync(next);
      } catch {
        return null;
      }
      // Re-stat what is ACTUALLY there. `mkdirSync` succeeding is not proof
      // that what we now hold is the directory we asked for.
      try {
        st = lstatSync(next);
      } catch {
        return null;
      }
    }
    if (st.isSymbolicLink() || !st.isDirectory()) return null;
    cursor = next;
  }
  // The kernel's answer, not our own bookkeeping.
  try {
    const real = realpathSync(cursor);
    return isInside(realRoot, real) ? real : null;
  } catch {
    return null;
  }
}

/** Refuse a name that is anything other than a single path component. */
function isPlainFileName(name: string): boolean {
  if (name === '' || name === '.' || name === '..') return false;
  if (name.includes('\0')) return false;
  return path.basename(name) === name && !path.isAbsolute(name);
}

/**
 * Write a file INTO an already-resolved directory, refusing to follow a link
 * planted at the leaf.
 *
 * `existsSync` was the original hole twice over: it says false for a DANGLING
 * link, so the write went ahead and landed on the link target, and it says
 * true for a link onto an existing victim file, so that file was reported as
 * a valid cache hit and read back into the engine as bars.
 */
function writeConfinedFile(realDir: string, name: string, data: string): boolean {
  if (!isPlainFileName(name)) return false;
  const target = path.join(realDir, name);
  if (leafKind(target) === 'other') return false;

  // A PRIVATE NAME NOTHING ELSE CAN BE HOLDING. `O_EXCL` fails if the name
  // exists at all - link, hardlink, directory, anything - so the bytes can only
  // ever land in an inode this call created. Then `rename` swaps the DIRECTORY
  // ENTRY, which is why a victim reachable through some other entry keeps its
  // contents even if the check above were somehow raced.
  const staging = path.join(realDir, `.prefetch-tmp-${randomBytes(8).toString('hex')}`);
  let fd: number | undefined;
  try {
    fd = openSync(staging, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | O_NOFOLLOW);
    writeSync(fd, data);
    closeSync(fd);
    fd = undefined;
    renameSync(staging, target);
    return true;
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        /* already closed or never opened cleanly */
      }
    }
    // A staging file still present means the rename did not happen. Leaving it
    // would grow the cache this module exists to keep bounded.
    try {
      if (leafKind(staging) === 'file') unlinkSync(staging);
    } catch {
      /* best effort */
    }
  }
}

/**
 * `absent` | `file` | `other`.
 *
 * `file` means "a real regular file that this module could have written": a
 * regular file, not a link, and with exactly ONE directory entry. A second
 * entry (`nlink > 1`) means somebody else's inode is reachable through this
 * name, and this module has never produced such a file - so it is `other`, and
 * `other` is always a refusal. That is what stops a hardlinked victim being
 * truncated by a write, unlinked by the prune, or - the quiet one - counted as
 * a cache HIT and read back into the engine as bars.
 *
 * Anything undecidable is refused rather than assumed absent; only ENOENT is
 * `absent`.
 */
function leafKind(target: string): 'absent' | 'file' | 'other' {
  let st;
  try {
    st = lstatSync(target);
  } catch (error) {
    return (error as NodeJS.ErrnoException)?.code === 'ENOENT' ? 'absent' : 'other';
  }
  if (st.isSymbolicLink() || !st.isFile()) return 'other';
  return st.nlink === 1 ? 'file' : 'other';
}

/**
 * Delete every cache file keyed to a DIFFERENT end date.
 *
 * The key ends with the run date, so an unpruned cache gains one file per
 * symbol per day - measured at 51 MB for a single 82-symbol run. This cache
 * lives inside the task workspace, under `~/Documents`, so on a machine with
 * Desktop & Documents sync turned on that is a 51 MB/day upload of files nobody
 * will ever read again. Keeping only the current date is what makes it bounded.
 *
 * Matches ONLY the filenames this module writes (`<SYM>_<START>_<END>.json` for
 * one of the two known start dates). A file that does not fit that shape was
 * put there by something else and is left alone - a prune that deletes by
 * directory rather than by pattern is a data-loss bug waiting for the day
 * somebody points this at the wrong path.
 */
function pruneStaleCache(realCacheDir: string, end: string): void {
  const keep = new RegExp(`_(?:${YAHOO_SCAN_START}|${YAHOO_OVERVIEW_START})_(\\d{8})\\.json$`);
  let entries: string[];
  try {
    entries = readdirSync(realCacheDir);
  } catch {
    return;
  }
  for (const name of entries) {
    const m = keep.exec(name);
    if (!m || m[1] === end) continue;
    if (!isPlainFileName(name)) continue;
    const victim = path.join(realCacheDir, name);
    // Only ever a real regular file. `realCacheDir` is already resolved, so
    // this cannot be a listing of somebody else's directory - but a link
    // planted at the leaf is still a name we did not write, and the rule this
    // prune has always had is that it deletes only what this module writes.
    if (leafKind(victim) !== 'file') continue;
    try {
      unlinkSync(victim);
    } catch {
      /* a file we cannot remove is not worth failing a run over */
    }
  }
}

export type PrefetchResult = {
  /** Files newly written this run. */
  written: number;
  /** Keys already on disk, so never fetched. */
  cached: number;
  /** Symbols refused by the grammar. Never fetched, never written. */
  rejected: string[];
  /** Symbols that were fetched and produced nothing usable. */
  failed: string[];
  /** True when the whole-prefetch budget ran out before the list did. */
  timedOut: boolean;
};

export type PrefetchOptions = {
  /**
   * The boundary. Every mkdir, write and unlink this function performs is
   * REFUSED unless its resolved real path lands inside this directory's
   * resolved real path.
   *
   * Required, and deliberately not defaulted: the caller is the only party
   * that knows which directory the sandboxed run is confined to, and a default
   * here would be a guess that silently reads as "safe".
   */
  confineTo: string;
  cacheDir: string;
  /** Watchlist tickers - the deep-history shape. */
  scanSymbols: readonly string[];
  /** `marketOverview.MARKETS` symbols - the shallower shape. */
  overviewSymbols: readonly string[];
  end: string;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
  budgetMs?: number;
};

function epochSeconds(yyyymmdd: string): number {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  return Math.floor(Date.UTC(y, m - 1, d) / 1000);
}

/**
 * Yahoo's chart payload -> the scanner's bar array.
 *
 * Intentionally the same filtering `yahooDaily` applies, because the file this
 * writes IS what `yahooDaily` returns: it is read back with `JSON.parse` and
 * handed straight to the engine with no further validation. Anything this
 * function lets through is financial signal input.
 */
function parseBars(raw: unknown): Array<Record<string, number | string>> {
  const chart = (raw as { chart?: { result?: unknown[] } })?.chart;
  const res = chart?.result?.[0] as
    | { timestamp?: unknown; indicators?: { quote?: Array<Record<string, unknown[]>> } }
    | undefined;
  if (!res || !Array.isArray(res.timestamp)) return [];
  const q = res.indicators?.quote?.[0];
  if (!q) return [];
  const out: Array<Record<string, number | string>> = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    const o = q['open']?.[i];
    const h = q['high']?.[i];
    const l = q['low']?.[i];
    const c = q['close']?.[i];
    if (o === null || o === undefined || h === null || h === undefined) continue;
    if (l === null || l === undefined || c === null || c === undefined) continue;
    if (!(Number(h) > 0 && Number(l) > 0 && Number(c) > 0)) continue;
    out.push({
      date: new Date(Number(res.timestamp[i]) * 1000).toISOString().slice(0, 10),
      open: Number(o),
      high: Number(h),
      low: Number(l),
      close: Number(c),
      volume: Number(q['volume']?.[i] ?? 0) || 0,
    });
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/**
 * Fetch and cache the daily bars the morning report will ask for.
 *
 * NEVER THROWS. A prefetch outage must not abort the run: the scanner then
 * finds an empty cache, has no network, and produces the honest empty report
 * that names exactly what it could not reach. That is a correct outcome and a
 * far better one than a run that dies with a stack trace, or - worse - a brief
 * assembled from whatever happened to be lying around.
 */
export async function prefetchDailyBars(options: PrefetchOptions): Promise<PrefetchResult> {
  const result: PrefetchResult = { written: 0, cached: 0, rejected: [], failed: [], timedOut: false };
  const doFetch = options.fetchImpl ?? ((url: string, init?: RequestInit) => fetch(url, init));
  const deadline = Date.now() + (options.budgetMs ?? DEFAULT_PREFETCH_BUDGET_MS);

  const jobs: Array<{ symbol: string; start: string }> = [
    ...options.scanSymbols.map((symbol) => ({ symbol, start: YAHOO_SCAN_START })),
    ...options.overviewSymbols.map((symbol) => ({ symbol, start: YAHOO_OVERVIEW_START })),
  ];

  // THE ONE CONTAINMENT DECISION, MADE ON RESOLVED PATHS, BEFORE ANY MUTATION.
  //
  // An unresolvable root, a cache directory that is not reachable from it
  // without traversing a link, or a directory we cannot create without going
  // through one, are all the same answer: a total prefetch outage. The run
  // then finds an empty cache and produces the honest empty report. That is a
  // correct outcome; writing outside the jail is not.
  const realRoot = resolveRoot(options.confineTo);
  const realCacheDir = realRoot === null ? null : realiseConfinedDir(realRoot, options.confineTo, options.cacheDir);
  if (realCacheDir === null) {
    result.failed = jobs.map((j) => j.symbol);
    return result;
  }

  // BEFORE fetching, not after: a run that then fails still leaves the cache
  // bounded, and the disk the new files need is freed first.
  pruneStaleCache(realCacheDir, options.end);

  for (const { symbol, start } of jobs) {
    if (!isPrefetchableSymbol(symbol)) {
      result.rejected.push(symbol);
      continue;
    }
    const fileName = `${symbol}_${start}_${options.end}.json`;
    // Belt and braces on top of the grammar: the file must land in the cache
    // directory ITSELF, not in a child of it and not beside it.
    if (!isPlainFileName(fileName)) {
      result.rejected.push(symbol);
      continue;
    }
    const target = path.join(realCacheDir, fileName);
    const kind = leafKind(target);
    if (kind === 'other') {
      // A link, or something that is not a regular file, sitting on a name this
      // module owns. It was not put there by this module. Refuse the symbol
      // outright rather than write through it or read it back as bars.
      result.rejected.push(symbol);
      continue;
    }
    if (kind === 'file') {
      result.cached += 1;
      continue;
    }
    if (Date.now() >= deadline) {
      result.timedOut = true;
      break;
    }

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?period1=${epochSeconds(start)}&period2=${epochSeconds(options.end)}&interval=1d&events=split`;
    let bars: Array<Record<string, number | string>> = [];
    try {
      const response = await doFetch(url, {
        headers: { 'User-Agent': UA },
        // A crafted symbol cannot rewrite the host through the template, but a
        // 30x could send the follow-up request anywhere. Refuse it.
        redirect: 'error',
        signal: AbortSignal.timeout(PER_SYMBOL_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      bars = parseBars(JSON.parse(await response.text()));
    } catch {
      result.failed.push(symbol);
      continue;
    }
    if (bars.length === 0) {
      result.failed.push(symbol);
      continue;
    }
    if (writeConfinedFile(realCacheDir, fileName, JSON.stringify(bars))) {
      result.written += 1;
    } else {
      result.failed.push(symbol);
    }
  }

  // Provenance, so the brief can say where its bars came from and how old they
  // are. Best effort: a manifest that cannot be written must not fail the run.
  // Guarded exactly like a cache file: provenance is not load-bearing, but a
  // best-effort write is still a write, and this one was unguarded.
  writeConfinedFile(
    realCacheDir,
    '.prefetch-manifest.json',
    JSON.stringify(
      {
        source: 'yahoo-daily',
        host: 'query1.finance.yahoo.com',
        end: options.end,
        fetchedAt: new Date().toISOString(),
        written: result.written,
        cached: result.cached,
        failed: result.failed.length,
        rejected: result.rejected.length,
        timedOut: result.timedOut,
      },
      null,
      2
    )
  );

  return result;
}
