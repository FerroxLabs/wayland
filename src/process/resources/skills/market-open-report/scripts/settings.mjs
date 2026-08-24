/**
 * settings.mjs — the morning report's memory between sessions.
 *
 * ===========================================================================
 * WHY A FILE IN THE WORKSPACE, AND NOWHERE ELSE
 * ===========================================================================
 * Two answers have to survive a restart: WHICH watchlist to scan, and WHICH
 * TradingView chart layout carries TC-TIDE. Every other place we could keep
 * them is either wiped or unreachable:
 *
 *   - `config/builtin-skills/market-open-report/data/*.csv` is PRUNED AND
 *     OVERWRITTEN on every app start, so a list edited in place silently
 *     reverts to the shipped 74 names on the next launch.
 *   - `config/skills/` survives, and so does anything under the app's config
 *     dir, but the report runs inside the agent sandbox whose root is the
 *     workspace. Reading outside it needs an explicit folder grant from the
 *     user; writing outside it is not grantable at all.
 *   - The engine's semantic memory is retrieval, not configuration. A miss
 *     returns nothing and the run falls back to the shipped list — and a count
 *     alone cannot tell those two apart, which is the exact confusion the
 *     skill already warns about.
 *
 * The workspace IS reachable and, for a chat or a recurring task bound to a
 * real folder (`~/Documents/Wayland/Tasks/<name>`), it is durable by design —
 * "recurrence implies durability", the same reasoning that gives a routine one
 * task root instead of a fresh `wcore-temp-<ts>` per fire. So the settings live
 * beside the reports they describe, in the folder the user owns.
 *
 * In an ephemeral `wcore-temp-<ts>` chat there is simply no file, which reads
 * as "not configured" and falls through to the shipped defaults. That is the
 * honest outcome, not a failure.
 *
 * ===========================================================================
 * PRECEDENCE
 * ===========================================================================
 *   1. `MARKET_OPEN_REPORT_LIST` / `MARKET_OPEN_REPORT_POSITIONS` env vars
 *      — an explicit operator override; unchanged from before this file.
 *   2. `smart-trader-settings.json` at the workspace root.
 *   3. The CSVs shipped inside the skill.
 *
 * The file is NAMED, not hidden: a dot directory is skipped by the Workbench
 * file scanners, and a settings file the user cannot see is one they cannot
 * fix.
 *
 * Nothing here throws. A malformed settings file degrades to the shipped
 * defaults with a warning on stderr, because a morning report that dies over a
 * misplaced comma is worse than one that runs on the default list and says so.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** The settings file's name at the workspace root. Visible on purpose. */
export const SETTINGS_FILENAME = 'smart-trader-settings.json';

/**
 * The workspace root: the nearest ancestor holding `.wayland-core/`, which is
 * the directory the engine stages skills into and therefore the sandbox root.
 *
 * Resolved from THIS FILE's location, not from `process.cwd()`, because the
 * skill's documented run sequence pins the output directory and then
 * `cd`s into the skill folder — so cwd is the skill, not the workspace.
 * `process.cwd()` remains the last resort for a copy of these scripts run from
 * somewhere else entirely.
 */
export function workspaceRoot(startDir = HERE) {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, '.wayland-core'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

/** Absolute path of the settings file for a workspace. */
export function settingsPath(root = workspaceRoot()) {
  return join(root, SETTINGS_FILENAME);
}

/**
 * Read the settings file. Returns `null` when there is none (the ordinary
 * unconfigured case) and `null` when it cannot be parsed, after warning.
 */
export function readSettings(root = workspaceRoot()) {
  const p = settingsPath(root);
  if (!existsSync(p)) return null;
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      process.stderr.write(`[settings] ${SETTINGS_FILENAME} is not an object; ignoring it\n`);
      return null;
    }
    return parsed;
  } catch (err) {
    process.stderr.write(`[settings] could not read ${SETTINGS_FILENAME} (${err.message}); using defaults\n`);
    return null;
  }
}

/**
 * Resolve a path recorded in settings. Relative paths are anchored to the
 * workspace root so the folder can be renamed or moved without editing the
 * file; an absolute path is honoured as given. A recorded path that does not
 * exist is discarded rather than passed on: a missing CSV would otherwise scan
 * zero symbols and produce a complete, well-formed, entirely empty report.
 */
export function resolveRecordedPath(value, root = workspaceRoot()) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const abs = isAbsolute(value) ? value : join(root, value);
  if (!existsSync(abs)) {
    process.stderr.write(`[settings] recorded path does not exist, ignoring it: ${abs}\n`);
    return null;
  }
  return abs;
}

/**
 * Resolve the watchlist and positions CSVs, plus the provenance the caller has
 * to be able to say out loud.
 *
 * `source` is one of:
 *   'env'      — an explicit environment override
 *   'settings' — the saved choice
 *   'default'  — the list shipped inside the skill
 *
 * The distinction matters: "your TradingView watchlist has 74 names" and "the
 * scan list that ships with the report has 74 names" are different sentences,
 * and the count alone cannot tell them apart.
 */
export function resolvePaths({ defaultList, defaultPositions, env = process.env, root = workspaceRoot() } = {}) {
  const settings = readSettings(root);
  const watchlist = settings?.watchlist ?? {};
  const positions = settings?.positions ?? {};

  const envList = env.MARKET_OPEN_REPORT_LIST?.trim() || null;
  const envPositions = env.MARKET_OPEN_REPORT_POSITIONS?.trim() || null;
  const savedList = envList ? null : resolveRecordedPath(watchlist.csv, root);
  const savedPositions = envPositions ? null : resolveRecordedPath(positions.csv, root);

  return {
    listPath: envList || savedList || defaultList,
    positionsPath: envPositions || savedPositions || defaultPositions,
    provenance: {
      source: envList ? 'env' : savedList ? 'settings' : 'default',
      name: savedList ? watchlist.name || null : null,
      exportedAt: savedList ? watchlist.exportedAt || null : null,
      settingsFile: settings ? settingsPath(root) : null,
      chartLayout: settings?.chart?.layout || null,
    },
  };
}

/**
 * One line the caller prints so the model can quote the source honestly
 * instead of inferring it from a symbol count.
 */
export function provenanceLine(provenance) {
  if (provenance.source === 'env') {
    return 'watchlist: environment override (MARKET_OPEN_REPORT_LIST)';
  }
  if (provenance.source === 'settings') {
    const name = provenance.name ? ` "${provenance.name}"` : '';
    const when = provenance.exportedAt ? `, exported ${provenance.exportedAt}` : ', export date not recorded';
    return `watchlist: your saved list${name}${when}`;
  }
  return 'watchlist: the scan list that ships with the report, not your TradingView watchlist';
}

/**
 * Write the settings file, merging into whatever is already there so a partial
 * update (just the chart layout, say) cannot erase the other half.
 *
 * Returns the path written. Throws only if the workspace itself is unwritable,
 * which is a real failure the caller must not paper over: a setup step that
 * silently saves nothing leaves the user believing it is configured.
 */
export function writeSettings(patch, root = workspaceRoot()) {
  const current = readSettings(root) ?? {};
  const merged = {
    ...current,
    ...patch,
    version: 1,
    watchlist: { ...(current.watchlist ?? {}), ...(patch.watchlist ?? {}) },
    positions: { ...(current.positions ?? {}), ...(patch.positions ?? {}) },
    chart: { ...(current.chart ?? {}), ...(patch.chart ?? {}) },
  };
  const p = settingsPath(root);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return p;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
//
// The setup walkthrough drives this rather than hand-writing JSON and CSV.
// Two file formats written by a language model are two places for a typo to
// land, and both fail in the worst way available: a malformed settings file
// reverts to the shipped 74 names, and a malformed CSV scans zero symbols and
// still exits 0.
//
//   --import-watchlist <export.json>   the file `watchlist_export` writes
//     [--name NAME]                    what to call it back to the user
//     [--chart-layout NAME]            record the TC-TIDE layout at the same time
//   --set-chart-layout NAME            record just the layout
//   --show                             print the saved settings, or say there are none

/** TradingView symbols are `EXCHANGE:TICKER`; the scanner wants both halves. */
function toCsv(symbols) {
  const rows = ['symbol,ticker'];
  for (const s of symbols) {
    const symbol = typeof s === 'string' ? s : s?.symbol;
    if (typeof symbol !== 'string' || !symbol.includes(':')) continue;
    rows.push(`${symbol},${symbol.slice(symbol.indexOf(':') + 1)}`);
  }
  return `${rows.join('\n')}\n`;
}

function slug(name) {
  return (
    String(name || 'watchlist')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'watchlist'
  );
}

function cliArg(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

function cli(argv) {
  const root = workspaceRoot();

  if (argv.includes('--show')) {
    const s = readSettings(root);
    if (!s) {
      process.stdout.write(`no ${SETTINGS_FILENAME} in ${root} — nothing saved yet\n`);
      return 0;
    }
    process.stdout.write(`${settingsPath(root)}\n${JSON.stringify(s, null, 2)}\n`);
    return 0;
  }

  const layoutOnly = cliArg(argv, '--set-chart-layout');
  if (layoutOnly && !argv.includes('--import-watchlist')) {
    process.stdout.write(`saved ${writeSettings({ chart: { layout: layoutOnly } }, root)}\n`);
    return 0;
  }

  const exportFile = cliArg(argv, '--import-watchlist');
  if (!exportFile) {
    process.stderr.write(
      'usage: settings.mjs --import-watchlist <export.json> [--name NAME] [--chart-layout NAME]\n' +
        '       settings.mjs --set-chart-layout NAME\n' +
        '       settings.mjs --show\n'
    );
    return 2;
  }

  let payload;
  try {
    payload = JSON.parse(readFileSync(exportFile, 'utf8'));
  } catch (err) {
    process.stderr.write(`cannot read ${exportFile}: ${err.message}\n`);
    return 1;
  }

  const symbols = Array.isArray(payload) ? payload : (payload?.symbols ?? []);
  const csv = toCsv(symbols);
  const count = csv.split('\n').length - 2; // minus header and trailing newline
  if (count < 1) {
    // Refuse rather than save a list that scans nothing. An empty watchlist
    // produces a complete, well-formed, entirely empty report.
    process.stderr.write(`${exportFile} yielded no EXCHANGE:TICKER symbols; nothing saved\n`);
    return 1;
  }

  const name = cliArg(argv, '--name') || payload?.name || 'watchlist';
  const rel = join('watchlists', `${slug(name)}.csv`);
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, csv, 'utf8');

  const layout = cliArg(argv, '--chart-layout');
  const saved = writeSettings(
    {
      watchlist: { source: 'tradingview', name, csv: rel, exportedAt: new Date().toISOString(), symbolCount: count },
      ...(layout ? { chart: { layout } } : {}),
    },
    root
  );
  process.stdout.write(`wrote ${abs} (${count} symbols)\nsaved ${saved}\n`);
  return 0;
}

if (process.argv[1] && process.argv[1].endsWith('settings.mjs')) {
  process.exit(cli(process.argv.slice(2)));
}
