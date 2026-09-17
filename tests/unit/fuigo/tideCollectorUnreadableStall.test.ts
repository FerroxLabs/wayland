/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The TC-TIDE collector must keep moving past symbols whose panel never renders.
 *
 * Measured on Windows against 0.13.0: panels went 10 → 18 → 18 → 18 across passes
 * and never advanced. The collector Wayland stages (stock pack + tideCompatibility.json)
 * skipped a symbol only when it had BOTH a quote and a panel, so every pass re-read
 * NASDAQ:PENN and NASDAQ:QUBT first and spent its budget on them.
 *
 * This runs the REAL staged collector, pass after pass, against a stand-in connector.
 * The collector is Masterclass IP and is not in this repository: point TIDE_PACK_DIR at
 * an unmodified `tide-morning-brief` pack (the folder holding report/collect.mjs) to run it.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import tideCompatibility from '@process/resources/skills/tvcontrol-setup/tideCompatibility.json';

const packDir = process.env.TIDE_PACK_DIR;
const stockCollector = packDir ? path.join(packDir, 'report', 'collect.mjs') : '';
const connector = path.resolve(__dirname, '../../fixtures/tide/fakeTvcontrolConnector.mjs');
const sha = (text: string) => createHash('sha256').update(text).digest('hex');

/** Apply the collect.mjs patch exactly as repairStagedTideSkill does. */
function stagedCollector(stock: string): string {
  const patch = tideCompatibility.files.find((file) => file.path === 'report/collect.mjs');
  if (!patch) throw new Error('tideCompatibility.json has no report/collect.mjs patch');
  expect(sha(stock), 'TIDE_PACK_DIR must hold the unmodified stock pack').toBe(patch.sourceSha256);
  const lines = stock.split('\n');
  for (const edit of patch.edits.toReversed()) lines.splice(edit.start, edit.deleteCount, ...edit.lines);
  const result = lines.join('\n');
  expect(sha(result)).toBe(patch.resultSha256);
  return result;
}

const roots: string[] = [];
afterAll(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

const BUDGET_SECONDS = 2;
const SLOW_MS = 2600; // one slow panel read always exhausts a pass budget
const UNREADABLE = ['NASDAQ:PENN', 'NASDAQ:QUBT'];

function stageRun(collectorSource: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tide-stall-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, 'pack', 'report'), { recursive: true });
  fs.mkdirSync(path.join(root, 'pack', 'watchlists'), { recursive: true });
  fs.writeFileSync(path.join(root, 'pack', 'report', 'collect.mjs'), collectorSource);

  // 30 names: #10 and #18 are readable but slow (they end passes 1 and 2), #19 and #20 never render.
  const tickers = Array.from({ length: 30 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`);
  tickers[18] = 'PENN';
  tickers[19] = 'QUBT';
  const watchlist = path.join(root, 'pack', 'watchlists', 'TC-MASTER-WATCHLIST.csv');
  fs.writeFileSync(watchlist, ['symbol,ticker', ...tickers.map((t) => `NASDAQ:${t},${t}`)].join('\n'));

  // Resume from a partial whose market instruments and calendar are already read, so passes spend
  // their budget on panels only. The instrument list is read from the collector itself.
  const marketBlock = collectorSource.slice(collectorSource.indexOf('const MARKETS = ['));
  const markets = [...marketBlock.slice(0, marketBlock.indexOf('];')).matchAll(/\['([^']+)'/g)].map((m) => m[1]);
  const market = markets.map((tv, i) => ({
    tv,
    resolved_symbol: tv,
    sym: tv,
    name: tv,
    desc: tv,
    kind: 'equity',
    bar: '2026-09-11',
    bars: Array.from({ length: 260 }, (_, j) => ({ time: 1780000000 + j * 86400, close: 100 + i * 10 + j })),
  }));
  const calendar = Array.from({ length: 300 }, (_, j) =>
    new Date((1780000000 + j * 86400) * 1000).toISOString().slice(0, 10)
  );
  fs.writeFileSync(path.join(root, 'raw.json.partial'), JSON.stringify({ market, quotes: {}, panels: {}, calendar }));
  return { root, watchlist, total: tickers.length, slow: ['NASDAQ:S10', 'NASDAQ:S18'] };
}

function runPasses(collectorSource: string, maxPasses: number) {
  const run = stageRun(collectorSource);
  const passes: Array<{ panels: number; finished: boolean; unread?: string[] }> = [];
  for (let pass = 0; pass < maxPasses; pass++) {
    const result = spawnSync(
      process.execPath,
      [
        path.join(run.root, 'pack', 'report', 'collect.mjs'),
        'raw.json',
        '--watchlist',
        run.watchlist,
        '--delay',
        '0',
        '--budget-seconds',
        String(BUDGET_SECONDS),
        '--server-entry',
        connector,
      ],
      {
        cwd: run.root,
        encoding: 'utf8',
        env: {
          ...process.env,
          FAKE_UNREADABLE: UNREADABLE.join(','),
          FAKE_SLOW: run.slow.join(','),
          FAKE_SLOW_MS: String(SLOW_MS),
        },
        timeout: 60_000,
      }
    );
    expect(result.status, result.stderr).toBe(0);
    const last = JSON.parse(result.stdout.trim().split('\n').pop() || '{}');
    passes.push({ panels: last.panels, finished: Boolean(last.wrote), unread: last.unread });
    if (last.wrote) break;
  }
  return { passes, total: run.total };
}

describe.skipIf(!packDir)('staged TC-TIDE collector with permanently unreadable panels', () => {
  it('reads past two unrenderable symbols, retries each once and names them unread', { timeout: 180_000 }, () => {
    const { passes, total } = runPasses(stagedCollector(fs.readFileSync(stockCollector, 'utf8')), 10);

    // The shape measured on Windows: 10, then 18, then the passes where only the unreadable names are tried.
    expect(passes.slice(0, 4).map((p) => p.panels)).toEqual([10, 18, 18, 18]);
    const final = passes.at(-1)!;
    expect(final.finished, `passes: ${JSON.stringify(passes)}`).toBe(true);
    expect(final.panels).toBe(total - UNREADABLE.length);
    expect(final.unread).toEqual(UNREADABLE);
  });
});
