/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * B14 - TWO DATES FOR ONE INSTANT, ON A ROUTINE WHOSE WHOLE JOB IS BEING CLEAR
 * ABOUT DATES.
 *
 * The thread said "generated on 2026-08-22" while the app, the Artifacts view
 * and the series directory all said 2026-08-23. BOTH ARE CORRECT AND NEITHER
 * SAYS WHICH CLOCK IT IS ON. Measured, same second, pinned v0.13.4 engine:
 *
 *     $ wayland-core sandbox exec --workspace ... 'date'
 *     Sat Aug 22 21:24:21 UTC 2026        <- the engine's sandboxed child
 *     $ date                              <- the host
 *     Sun Aug 23 04:24:21 +07 2026
 *
 * `briefHtml.mjs` renders inside that sandbox, so `nowStamp` - which used
 * getFullYear/getMonth/getDate/getHours/getMinutes, i.e. the LOCAL time of
 * whatever process runs it - produced a UTC wall clock with no zone on it.
 * `artifactSeries.seriesDateFor` runs in the MAIN process at +07 and
 * deliberately uses the local calendar date (a 20:00 run in Los Angeles must
 * not file under the following day). Two different clocks, two different
 * calendar days, one instant, and nothing in the document to reconcile them.
 *
 * AND IT CANNOT BE FIXED BY EXPORTING TZ: the engine's env allowlist - the same
 * one that ate WAYLAND_OUTPUT_DIR - does not forward it. Measured:
 * `TZ="Asia/Bangkok" ... sandbox exec ... 'date'` still printed UTC.
 *
 * SO THE FIX LABELS THE INSTANT RATHER THAN MOVING IT. `seriesDateFor` is NOT
 * changed; local is the right answer to "which morning's brief is this". What
 * changes is that the other number stops being ambiguous.
 *
 * The fixture is the production path: the REAL briefHtml.mjs, run twice on the
 * same mr.json, with only the child's TZ differing.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPTS = path.resolve(__dirname, '../../src/process/resources/skills/market-open-report/scripts');

/** A minimal but REAL payload shape - what report.mjs writes, keys and all. */
function payload() {
  return {
    tier: 1,
    slots: 20,
    rows: [],
    market: [],
    market_summary: 'test',
    pressure: null,
    demo: null,
    mine: {},
    bar: '2026-08-21',
  };
}

/** The `generated <stamp>` the masthead prints, verbatim. */
function generatedStamp(html: string): string {
  const m = html.match(/generated ([^<]+)</);
  if (!m) throw new Error(`the masthead no longer prints a generation stamp:\n${html.slice(0, 400)}`);
  return m[1].trim();
}

function render(dir: string, tz: string): string {
  const json = path.join(dir, 'mr.json');
  const out = path.join(dir, `brief-${tz.replace(/\W/g, '_')}.html`);
  writeFileSync(json, JSON.stringify(payload()), 'utf8');
  execFileSync(process.execPath, [path.join(SCRIPTS, 'briefHtml.mjs'), json, out], {
    cwd: SCRIPTS,
    env: { ...process.env, TZ: tz },
  });
  return readFileSync(out, 'utf8');
}

/** The zone token at the end of the stamp: `UTC`, `+07:00`, `-04:00`. */
function zoneToken(stamp: string): string | null {
  const m = stamp.match(/(UTC|[+-]\d{2}:\d{2})$/);
  return m ? m[1] : null;
}

/** Read the stamp back as an instant, using its own declared zone. */
function toInstant(stamp: string): number {
  const zone = zoneToken(stamp);
  if (!zone) throw new Error(`no zone on "${stamp}"`);
  const wall = stamp.slice(0, stamp.length - zone.length).trim();
  const iso = wall.replace(' ', 'T') + ':00' + (zone === 'UTC' ? 'Z' : zone);
  const t = Date.parse(iso);
  if (Number.isNaN(t)) throw new Error(`unparseable stamp "${stamp}" -> "${iso}"`);
  return t;
}

describe('the brief says which clock its generation stamp is on', () => {
  it('carries a zone, a DIFFERENT zone per runtime, and the SAME instant either way', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'brief-tz-'));
    try {
      // The two clocks that actually collided: the engine's sandboxed child
      // runs UTC, the host that names the series directory is +07.
      const utc = generatedStamp(render(dir, 'UTC'));
      const bkk = generatedStamp(render(dir, 'Asia/Bangkok'));

      // 1. Both name their zone. A stamp with no zone, generated in one and read
      //    in another, is the whole bug.
      expect(zoneToken(utc), `no zone token in "${utc}"`).not.toBeNull();
      expect(zoneToken(bkk), `no zone token in "${bkk}"`).not.toBeNull();

      // 2. And they name DIFFERENT ones, so the token is read off the runtime
      //    rather than hard-coded.
      expect(zoneToken(utc)).not.toBe(zoneToken(bkk));

      // 3. THE ASSERTION WITH TEETH: two renders seconds apart, on two clocks,
      //    describe the same moment. Without this, appending a literal "UTC" to
      //    a Bangkok wall clock passes 1 and 2 and is a seven-hour lie.
      expect(Math.abs(toInstant(utc) - toInstant(bkk))).toBeLessThan(90_000);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60000);

  it('the routine body tells the run to quote that stamp verbatim, zone and all', () => {
    const body = readFileSync(
      path.resolve(
        __dirname,
        '../../src/process/resources/bundled-workflows/bodies/wayland-morning-report/SKILL.md'
      ),
      'utf8'
    );
    // Emphasis markers and line wrapping are formatting, not meaning: flatten
    // both before matching, or a `**bold**` in the middle of a phrase breaks
    // the assertion without changing what the run is told.
    const prose = body.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ');
    expect(prose).toContain('generated'); // known positive: the word is in scope
    expect(prose).toContain('including its zone');
    expect(prose).toContain('not running on the same clock as the app');
  });
});
