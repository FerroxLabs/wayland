/**
 * Every connector a bundled routine declares must be a REAL catalog entry name.
 *
 * THE BUG THIS EXISTS FOR: the morning routine was written declaring
 * `com.ferroxlabs-tvcontrol` — the catalog entry's FILENAME. The grant compares
 * the declaration against `libraryEntryId`, which `entryToServerData` sets to
 * `entry.name`, and that is `com.ferroxlabs/tvcontrol` WITH A SLASH.
 * `selectRoutineConnectorIds` does a plain `wanted.has(installed)` set lookup
 * with no normalisation, so the declaration matched nothing and the routine
 * resolved to `[]` — identical to declaring no connector at all.
 *
 * It fails SILENTLY and it fails CLOSED, which is the worst combination: the
 * scheduled run simply has no chart tools, reports that it could not read the
 * chart, and looks like a TradingView problem forever.
 */
import fs from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

const REPO = path.resolve(__dirname, '../../../..');
const ROUTINES = path.join(REPO, 'src/process/resources/bundled-workflows/routines.json');
const ENTRIES_DIR = path.join(REPO, 'src/renderer/mcp-catalog/entries');

function catalogEntryNames(): Set<string> {
  const names = new Set<string>();
  for (const file of fs.readdirSync(ENTRIES_DIR)) {
    if (!file.endsWith('.json')) continue;
    const entry = JSON.parse(fs.readFileSync(path.join(ENTRIES_DIR, file), 'utf-8')) as { name?: string };
    if (typeof entry.name === 'string') names.add(entry.name);
  }
  return names;
}

describe('a routine may only declare connectors that exist in the catalog', () => {
  const routines = JSON.parse(fs.readFileSync(ROUTINES, 'utf-8')) as Array<{ id: string; connectors?: string[] }>;
  const names = catalogEntryNames();

  it('CONTROL: the corpus is real on both sides', () => {
    expect(routines.length).toBeGreaterThan(5);
    expect(names.size).toBeGreaterThan(0);
    // A filename is NOT an entry name - this is the exact confusion that caused
    // the bug, so pin that they really are different strings.
    expect(names.has('com.ferroxlabs/tvcontrol')).toBe(true);
    expect(names.has('com.ferroxlabs-tvcontrol')).toBe(false);
  });

  it('every declared connector matches a catalog entry NAME, not its filename', () => {
    const bad: string[] = [];
    for (const r of routines) {
      for (const c of r.connectors ?? []) {
        if (!names.has(c)) bad.push(`${r.id} declares "${c}"`);
      }
    }
    expect(bad, 'a declaration that matches nothing silently grants nothing').toEqual([]);
  });
});
