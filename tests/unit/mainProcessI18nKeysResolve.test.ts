/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * No raw i18n key path may reach the user. The main process is where that rule
 * is easiest to break: it translates with its own i18next instance, which loads
 * every locale module under ONE namespace (`translation`), and i18next answers a
 * lookup it cannot resolve with the key itself. The failure is completely silent
 * at build time - `cron:error.missedJob` type-checked, shipped, and wrote the
 * literal string `error.missedJob` into a user's conversation as a tips row.
 *
 * So this resolves every literal key the main process passes to `t()` against
 * the real catalogue. A key that answers with itself is a key the user can be
 * shown. `defaultValue` is a deliberate escape hatch and passes, because that
 * call cannot produce a key path.
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// The language read is what `i18nReady` waits on; nothing is stored in a test.
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => undefined) },
}));

import i18n, { i18nReady } from '@process/services/i18n';

const MAIN_PROCESS_ROOT = path.resolve(__dirname, '../../src/process');

/** Matches `t('some.key')` / `t('ns:some.key')`, not `format(` or `it(`. */
const T_CALL = /\bt\(\s*'([^']+)'/g;
/** A dotted or colon-prefixed identifier - what a key looks like, and nothing else. */
const KEY_LIKE = /^[a-zA-Z][a-zA-Z0-9_]*[.:]/;

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

describe('main-process i18n keys', () => {
  it('every literal key resolves to a translation, never to itself', async () => {
    await i18nReady;

    const files = collectSourceFiles(MAIN_PROCESS_ROOT);
    const unresolved: string[] = [];
    let checked = 0;

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      T_CALL.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = T_CALL.exec(source))) {
        const key = match[1];
        if (!KEY_LIKE.test(key)) continue;
        checked++;
        const translated = i18n.t(key);
        // i18next answers an unresolved lookup with the key, and drops an
        // unknown namespace prefix on the way out - both are key paths.
        if (translated === key || translated === key.replace(/^[^:]*:/, '')) {
          unresolved.push(`${path.relative(MAIN_PROCESS_ROOT, file)}: ${key} -> "${String(translated)}"`);
        }
      }
    }

    // Known-positive control: a regex that stopped matching would otherwise
    // report a clean zero forever.
    expect(checked).toBeGreaterThan(60);
    expect(unresolved).toEqual([]);
  });
});
