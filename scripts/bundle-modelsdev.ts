/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * bundle-modelsdev.ts
 *
 * Build-time generator for `resources/modelsdev-snapshot.json` - the bundled
 * offline floor for the models.dev enrichment client (rung 3 of its fallback).
 *
 * Behaviour:
 *  - Downloads https://models.dev/api.json, validates it with `validateRegistry`.
 *  - On success: writes `resources/modelsdev-snapshot.json`.
 *  - On any failure (offline, timeout, non-ok, garbage, schema break): does NOT
 *    overwrite an existing snapshot and exits 0 so an offline build still works.
 *    It only exits non-zero if there is no usable snapshot AND it could not
 *    fetch one - that is the single case where the build floor would be missing.
 *
 * Usage:
 *   bunx tsx scripts/bundle-modelsdev.ts
 *
 * Wired into `package.json` as `prebuild`, so it runs before the build scripts.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { writeFileSyncAtomic } from '../src/process/utils/atomicWrite';
import { validateRegistry } from '../src/process/providers/enrichment/modelsDevSchema';

const MODELS_DEV_API_URL = 'https://models.dev/api.json';
const FETCH_TIMEOUT_MS = 30_000;
const SNAPSHOT_PATH = path.resolve(__dirname, '..', 'resources', 'modelsdev-snapshot.json');

/** Fetch + validate the live registry. Returns the JSON string, or `null`. */
async function fetchSnapshot(): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(MODELS_DEV_API_URL, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`[bundle-modelsdev] models.dev returned HTTP ${res.status}`);
      return null;
    }
    const body = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      console.warn('[bundle-modelsdev] models.dev returned non-JSON body');
      return null;
    }
    const registry = validateRegistry(parsed);
    if (!registry) {
      console.warn('[bundle-modelsdev] models.dev payload failed schema validation');
      return null;
    }
    // Re-serialise the validated object so the snapshot is normalised.
    return JSON.stringify(registry);
  } catch (err) {
    console.warn(`[bundle-modelsdev] download failed: ${(err as Error).message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** True only if the existing snapshot file is present and itself valid. */
function hasValidExistingSnapshot(): boolean {
  if (!existsSync(SNAPSHOT_PATH)) return false;
  try {
    return validateRegistry(JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'))) !== null;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const fresh = await fetchSnapshot();

  if (fresh) {
    writeFileSyncAtomic(SNAPSHOT_PATH, fresh);
    const providerCount = Object.keys(JSON.parse(fresh)).length;
    console.log(`[bundle-modelsdev] wrote snapshot with ${providerCount} providers → ${SNAPSHOT_PATH}`);
    return;
  }

  // Download failed - keep the last good snapshot rather than clobbering it.
  if (hasValidExistingSnapshot()) {
    console.warn('[bundle-modelsdev] download failed - keeping existing snapshot');
    return;
  }

  // No usable snapshot and no fresh one. The runtime client still degrades to
  // an empty registry, so this is non-fatal, but flag it loudly.
  console.error('[bundle-modelsdev] download failed and no existing snapshot - offline floor is MISSING');
  process.exitCode = 1;
}

main().catch((err) => {
  // Never let an unexpected error abort the whole build.
  console.error(`[bundle-modelsdev] unexpected error: ${(err as Error).message}`);
});
