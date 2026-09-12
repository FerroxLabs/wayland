/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * generateProviderCatalog.mjs
 *
 * Build-time generator for `src/process/providers/catalog/data/providerCatalog.generated.json`
 * — the bundled, curated provider catalog the desktop ships.
 *
 * Behaviour:
 *  - Reads the vendored provider catalog (`providers.vendored.toml`) committed
 *    next to the output; Desktop owns that file since the Fuigo cutover.
 *  - Parses with `smol-toml`, runs every row through the SAME T0.2 curation
 *    (`isCatalogEligible`) the runtime uses, keeps only eligible rows, and
 *    normalizes each via `normalizeCatalogEntry` (snake_case -> camelCase).
 *  - Writes a DETERMINISTIC JSON (entries sorted by id, stable key order) so a
 *    re-run produces a byte-identical file — the snapshot test depends on this.
 *  - Prints a breakdown of how many rows were excluded and why.
 *
 * Reuses the real runtime modules (Node strips the `import type`-only TS) so the
 * generator can never drift from the curation the app ships.
 *
 * Usage:
 *   node scripts/generateProviderCatalog.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';
import { normalizeCatalogEntry } from '../src/process/providers/catalog/catalogProvider.ts';
import { isCatalogEligible } from '../src/process/providers/catalog/catalogCuration.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APP_ROOT = path.resolve(__dirname, '..');

const DATA_DIR = path.join(APP_ROOT, 'src', 'process', 'providers', 'catalog', 'data');
/** The committed provider catalog Desktop owns. */
const VENDORED_TOML = path.join(DATA_DIR, 'providers.vendored.toml');
const OUTPUT_JSON = path.join(DATA_DIR, 'providerCatalog.generated.json');

function resolveSource() {
  if (existsSync(VENDORED_TOML)) return { tomlPath: VENDORED_TOML, source: 'vendored' };
  throw new Error(`No provider catalog found. Looked for: ${VENDORED_TOML}.`);
}

/** Re-serialize one normalized entry with a fixed key order (determinism). */
function stableEntry(entry) {
  /** @type {Record<string, string>} */
  const out = {
    id: entry.id,
    displayName: entry.displayName,
    baseUrl: entry.baseUrl,
    envVar: entry.envVar,
  };
  // Preserve the absent-vs-empty distinction: only emit apiPath when present.
  if (entry.apiPath !== undefined) out.apiPath = entry.apiPath;
  return out;
}

function main() {
  const { tomlPath, source } = resolveSource();
  const raw = parse(readFileSync(tomlPath, 'utf8'));
  const providers = Array.isArray(raw.provider) ? raw.provider : [];

  if (providers.length === 0) {
    throw new Error(`Parsed 0 [[provider]] entries from ${tomlPath} — refusing to write an empty catalog.`);
  }

  /** @type {Record<string, number>} */
  const excluded = {};
  const eligible = [];

  for (const entry of providers) {
    const verdict = isCatalogEligible(entry);
    if (verdict.eligible) {
      eligible.push(normalizeCatalogEntry(entry));
    } else {
      excluded[verdict.reason] = (excluded[verdict.reason] ?? 0) + 1;
    }
  }

  // Deterministic ordering: sort by id, then stabilize each entry's key order.
  eligible.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const output = eligible.map(stableEntry);

  // Trailing newline keeps the file POSIX-clean and matches other generated JSON.
  const json = `${JSON.stringify(output, null, 2)}\n`;
  writeIfChanged(OUTPUT_JSON, json);

  const excludedTotal = Object.values(excluded).reduce((sum, n) => sum + n, 0);
  console.log(`[generateProviderCatalog] source: ${source} (${tomlPath})`);
  console.log(`[generateProviderCatalog] parsed ${providers.length} entries`);
  console.log(`[generateProviderCatalog] eligible ${eligible.length}, excluded ${excludedTotal}`);
  for (const reason of Object.keys(excluded).sort()) {
    console.log(`[generateProviderCatalog]   - ${reason}: ${excluded[reason]}`);
  }
  console.log(`[generateProviderCatalog] wrote ${OUTPUT_JSON}`);
}

/** Write only when content differs so re-runs are byte-stable and idempotent. */
function writeIfChanged(filePath, content) {
  if (existsSync(filePath) && readFileSync(filePath, 'utf8') === content) return;
  writeFileSync(filePath, content);
}

main();
