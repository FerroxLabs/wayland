/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The worked example must describe ONE trade.
 *
 * `report.mjs` picks the demo position deliberately - the most recent OPEN
 * position, so the entry, all four rungs and the current price share one
 * readable range - and it is the only thing that ships `bars`. `briefHtml.mjs`
 * used to re-derive its own pick (`held[0]`, the biggest unrealised winner) for
 * the heading, the entry price, the share count and the ladder, while still
 * drawing the chart from `d.demo`. The result was a card reading "entry 102.25,
 * now 974.33, +852.9%" above a picture of an entirely different stock.
 *
 * That is not a hypothetical: report.mjs's own comment records the same defect
 * shipping on 2026-08-07, and fixing it there did not fix it here, because the
 * renderer never asked. So this pins the RENDERER, not the engine.
 *
 * Nothing is stubbed. This runs the real `briefHtml.mjs` over a real temp file
 * and reads the real HTML back.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPTS = path.resolve(__dirname, '../../src/process/resources/skills/market-open-report/scripts');

/**
 * The decoy is the trap: a monster winner that sorts to `held[0]` and so is
 * exactly what the old code picked. The demo is a different, recent position.
 * If the renderer ever re-derives its own pick again, the decoy's identity and
 * numbers reappear in the worked example and this test fails.
 */
const DECOY = { tv: 'NASDAQ:DECOYWIN', entry: 102.25, close: 974.33, unreal: 852.89 };
const DEMO = { tv: 'NASDAQ:DEMOPICK', entry: 37.61, close: 36.5, unreal: -2.95 };

function bars() {
  // 40 bars ending on the demo's own last close, so the chart has something
  // real to draw and the entry lands inside the frame.
  return Array.from({ length: 40 }, (_, i) => {
    const c = 30 + i * 0.2;
    return { d: `2026-07-${String((i % 28) + 1).padStart(2, '0')}`, o: c, h: c + 1, l: c - 1, c };
  });
}

function payload() {
  const row = (o: Record<string, unknown>) => ({
    sym: String(o.tv).split(':')[1],
    open: true,
    entered_today: false,
    closed_today: false,
    trimmed_today: false,
    rungs: ['TP1', 'TP2', 'TP3', 'TP4'],
    entry_date: '2025-06-03',
    chg: 0.1,
    trend: 1,
    ...o,
  });
  return {
    tier: 1,
    slots: 20,
    // DECOY first AND biggest `unreal`, so it wins any local "pick the leader"
    // sort the renderer might reintroduce.
    rows: [row(DECOY), row({ ...DEMO, entry_date: '2026-08-12' })],
    market: [],
    market_summary: 'test',
    pressure: { score: 50, band: 'Mixed', components: [] },
    demo: {
      sym: 'DEMOPICK',
      ...DEMO,
      entry_date: '2026-08-12',
      live: false,
      rungs: ['TP1', 'TP2', 'TP3', 'TP4'],
      entry_in_frame: true,
      bars: bars(),
    },
    mine: null,
  };
}

/** The worked example is the block between its own heading and the next one. */
function workedExample(html: string): string {
  const start = html.indexOf('A trade, end to end');
  expect(start, 'worked-example heading must exist').toBeGreaterThan(-1);
  const after = html.indexOf('<h2 class="sec"', start + 1);
  return html.slice(start, after === -1 ? html.length : after);
}

describe('morning brief: the worked example describes one trade', () => {
  it('takes its identity and its numbers from d.demo, never from the biggest winner', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'brief-worked-'));
    try {
      const json = path.join(dir, 'mr.json');
      const out = path.join(dir, 'brief.html');
      writeFileSync(json, JSON.stringify(payload()), 'utf-8');
      execFileSync(process.execPath, [path.join(SCRIPTS, 'briefHtml.mjs'), json, out], {
        cwd: SCRIPTS,
      });
      const html = readFileSync(out, 'utf-8');
      const block = workedExample(html);

      // POSITIVE CONTROL, and the reason the absences below mean anything: the
      // decoy IS in this document, in the holdings table. A search that cannot
      // find it anywhere would report every absence as a pass.
      expect(html).toContain(DECOY.tv);
      expect(html).toContain('974.33');

      // The worked example is the demo's, whole.
      expect(block).toContain(DEMO.tv);
      expect(block).toContain('37.61');

      // ...and carries nothing belonging to the decoy.
      expect(block).not.toContain(DECOY.tv);
      expect(block).not.toContain('974.33');
      expect(block).not.toContain('852.9');
      expect(block).not.toContain('102.25');

      // The ladder is computed off the entry, so it is the sharpest tell that
      // the numbers and the chart came from the same position: these are the
      // demo's rungs, and 103.78 would be the decoy's first rung.
      expect(block).toContain('38.17');
      expect(block).not.toContain('103.78');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
