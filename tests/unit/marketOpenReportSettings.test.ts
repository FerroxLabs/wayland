/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The morning report's memory between sessions.
 *
 * Two answers have to survive a restart - which watchlist to scan, and which
 * TradingView layout carries TC-TIDE - and the workspace is the only place that
 * can hold them: the skill dir is pruned and overwritten on every app start,
 * and everything outside the workspace is behind the sandbox.
 *
 * What is actually load-bearing here is not "does it read a file". It is that a
 * saved list, a default list and an operator override stay TELLABLE APART, and
 * that no failure mode ends in a complete, well-formed, entirely empty report.
 */

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The scripts ship as .mjs inside a resources dir, so they are loaded by path
// rather than through the app's alias graph.
const SETTINGS_MJS = new URL(
  '../../src/process/resources/skills/market-open-report/scripts/settings.mjs',
  import.meta.url
).pathname;

type SettingsModule = typeof import('../../src/process/resources/skills/market-open-report/scripts/settings.mjs');

let mod: SettingsModule;
let root: string;
let defaultList: string;
let defaultPositions: string;

beforeEach(async () => {
  mod = (await import(SETTINGS_MJS)) as SettingsModule;
  root = mkdtempSync(join(tmpdir(), 'mor-settings-'));
  // A workspace is the nearest ancestor holding `.wayland-core/`.
  mkdirSync(join(root, '.wayland-core'), { recursive: true });
  defaultList = join(root, 'shipped-list.csv');
  defaultPositions = join(root, 'shipped-positions.csv');
  writeFileSync(defaultList, 'symbol\n');
  writeFileSync(defaultPositions, 'symbol\n');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const write = (obj: unknown) => writeFileSync(join(root, 'smart-trader-settings.json'), JSON.stringify(obj));
const resolve = (env: NodeJS.ProcessEnv = {}) => mod.resolvePaths({ defaultList, defaultPositions, env, root });

describe('market-open-report settings (memory between sessions)', () => {
  it('falls back to the shipped list when nothing is configured', () => {
    const r = resolve();
    expect(r.listPath).toBe(defaultList);
    expect(r.provenance.source).toBe('default');
    // The sentence the assistant has to be able to say.
    expect(mod.provenanceLine(r.provenance)).toContain('ships with the report');
  });

  it('uses a saved list and can say WHICH list and WHEN it was exported', () => {
    const csv = join(root, 'watchlists', 'tc-master.csv');
    mkdirSync(join(root, 'watchlists'), { recursive: true });
    writeFileSync(csv, 'symbol\n');
    write({
      watchlist: { name: 'TC-MASTER-WATCHLIST', csv: 'watchlists/tc-master.csv', exportedAt: '2026-08-24T02:10:00Z' },
    });

    const r = resolve();
    expect(r.listPath).toBe(csv);
    expect(r.provenance.source).toBe('settings');
    const line = mod.provenanceLine(r.provenance);
    expect(line).toContain('TC-MASTER-WATCHLIST');
    expect(line).toContain('2026-08-24T02:10:00Z');
  });

  it('anchors a relative path to the workspace so the folder can be renamed', () => {
    const csv = join(root, 'list.csv');
    writeFileSync(csv, 'symbol\n');
    write({ watchlist: { csv: 'list.csv' } });
    expect(resolve().listPath).toBe(csv);
  });

  it('honours an absolute recorded path as given', () => {
    const outside = join(mkdtempSync(join(tmpdir(), 'mor-abs-')), 'elsewhere.csv');
    writeFileSync(outside, 'symbol\n');
    write({ watchlist: { csv: outside } });
    expect(resolve().listPath).toBe(outside);
  });

  it('discards a recorded path that no longer exists instead of scanning zero symbols', () => {
    // A missing CSV would produce a complete, well-formed, entirely EMPTY
    // report - the failure mode the skill already warns reads as success.
    const warn = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    write({ watchlist: { csv: 'watchlists/deleted.csv', name: 'Gone' } });

    const r = resolve();
    expect(r.listPath).toBe(defaultList);
    expect(r.provenance.source).toBe('default');
    expect(warn).toHaveBeenCalled();
  });

  it('lets an environment override win, and says so', () => {
    const csv = join(root, 'saved.csv');
    const forced = join(root, 'forced.csv');
    writeFileSync(csv, 'symbol\n');
    writeFileSync(forced, 'symbol\n');
    write({ watchlist: { csv: 'saved.csv', name: 'Saved' } });

    const r = resolve({ MARKET_OPEN_REPORT_LIST: forced });
    expect(r.listPath).toBe(forced);
    expect(r.provenance.source).toBe('env');
    expect(mod.provenanceLine(r.provenance)).toContain('MARKET_OPEN_REPORT_LIST');
  });

  it('survives a malformed settings file rather than failing the run', () => {
    const warn = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    writeFileSync(join(root, 'smart-trader-settings.json'), '{ "watchlist": { csv: oops }');

    const r = resolve();
    expect(r.listPath).toBe(defaultList);
    expect(r.provenance.source).toBe('default');
    expect(warn).toHaveBeenCalled();
  });

  it('ignores a settings file that is not an object', () => {
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    write(['not', 'an', 'object']);
    expect(resolve().provenance.source).toBe('default');
  });

  it('carries the chart layout through so TC-TIDE can be found again', () => {
    write({ chart: { layout: 'TC Tide 2', indicator: 'TC-TIDE' } });
    expect(resolve().provenance.chartLayout).toBe('TC Tide 2');
  });

  it('merges a partial write instead of erasing the other half', () => {
    // Setup saves the watchlist, then later saves only the layout. Losing the
    // watchlist at that point would silently revert the next run to the
    // shipped 74 names.
    mod.writeSettings({ watchlist: { name: 'TC-MASTER-WATCHLIST', csv: 'list.csv' } }, root);
    mod.writeSettings({ chart: { layout: 'TC Tide 2' } }, root);

    const saved = mod.readSettings(root) as {
      watchlist: { name: string; csv: string };
      chart: { layout: string };
      version: number;
    };
    expect(saved.watchlist.name).toBe('TC-MASTER-WATCHLIST');
    expect(saved.watchlist.csv).toBe('list.csv');
    expect(saved.chart.layout).toBe('TC Tide 2');
    expect(saved.version).toBe(1);
  });

  it('names the settings file visibly, not as a dot directory', () => {
    // Hidden paths are skipped by the Workbench file scanners, so a settings
    // file the user cannot see is one they cannot fix.
    expect(mod.SETTINGS_FILENAME.startsWith('.')).toBe(false);
    expect(mod.settingsPath(root)).toBe(join(root, 'smart-trader-settings.json'));
  });

  it('finds the workspace root from a nested skill directory', () => {
    const nested = join(root, '.wayland-core', 'skills', 'market-open-report', 'scripts');
    mkdirSync(nested, { recursive: true });
    expect(mod.workspaceRoot(nested)).toBe(root);
  });
});
