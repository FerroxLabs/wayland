/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * models.dev registry client (main process).
 *
 * Fetches the model-enrichment registry from https://models.dev/api.json with
 * a three-rung fallback so enrichment is best-effort and NEVER load-bearing:
 *
 *   1. Live fetch  - validated, then atomically persisted as the last-good cache.
 *   2. Last-good cache - the previously persisted live response, in userData.
 *   3. Bundled snapshot - `resources/modelsdev-snapshot.json`, the offline floor.
 *
 * `getRegistry()` never throws. If every rung fails it returns an empty
 * registry `{}` - downstream consumers then simply show models unenriched.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { writeFileAtomic } from '@process/utils/atomicWrite';
import { validateRegistry, type ModelsDevRegistry } from './modelsDevSchema';

const MODELS_DEV_API_URL = 'https://models.dev/api.json';
const CACHE_FILE_NAME = 'modelsdev-cache.json';
const SNAPSHOT_FILE_NAME = 'modelsdev-snapshot.json';
const FETCH_TIMEOUT_MS = 10_000;
/** Reject a live response whose declared body exceeds this size - never buffer a huge payload. */
const MAX_RESPONSE_BYTES = 32 * 1024 * 1024;

export class ModelsDevClient {
  /**
   * Resolve the registry via the three-rung fallback. Never throws - the worst
   * case is an empty registry, which downstream code treats as "no enrichment".
   */
  async getRegistry(): Promise<ModelsDevRegistry> {
    const live = await this.fetchLive();
    if (live) {
      // Persist the validated live response as the last-good cache. A failed
      // write must not fail the call - we still have a good in-memory result.
      await this.persistCache(live).catch(() => {});
      return live;
    }

    const cached = await this.readCache();
    if (cached) return cached;

    const snapshot = await this.readSnapshot();
    if (snapshot) return snapshot;

    // Floor: degrade gracefully rather than throw.
    return {};
  }

  // ─── Rung 1: live fetch ─────────────────────────────────────────────────────

  /** Fetch + parse + validate the live registry. Returns `null` on any failure. */
  private async fetchLive(): Promise<ModelsDevRegistry | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(MODELS_DEV_API_URL, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      // Guard against buffering a huge body - bail before reading if the
      // declared content-length is implausible for the registry.
      const contentLength = res.headers?.get('content-length');
      if (contentLength != null) {
        const declaredLength = Number(contentLength);
        if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
          return null;
        }
      }
      // A chunked / content-length-less response bypasses the header guard
      // above, so read the body with a running cap and abort the moment it
      // exceeds the ceiling - never buffer an unbounded payload via `res.text()`.
      const body = await readBodyCapped(res, MAX_RESPONSE_BYTES);
      if (body == null) return null;
      return this.parseAndValidate(body);
    } catch {
      // Network error, timeout/abort, or non-JSON body - fall through.
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** JSON.parse a body and validate it. Truncated/garbage JSON yields `null`. */
  private parseAndValidate(body: string): ModelsDevRegistry | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return null;
    }
    return validateRegistry(parsed);
  }

  // ─── Rung 2: last-good cache ────────────────────────────────────────────────

  private cacheFilePath(): string {
    return path.join(app.getPath('userData'), CACHE_FILE_NAME);
  }

  /** Atomically persist a validated registry as the last-good cache. */
  private async persistCache(registry: ModelsDevRegistry): Promise<void> {
    await writeFileAtomic(this.cacheFilePath(), JSON.stringify(registry), { mode: 0o600 });
  }

  /** Read + validate the cached registry. Returns `null` if absent or invalid. */
  private async readCache(): Promise<ModelsDevRegistry | null> {
    try {
      const body = await fs.readFile(this.cacheFilePath(), 'utf8');
      return this.parseAndValidate(body);
    } catch {
      return null;
    }
  }

  // ─── Rung 3: bundled snapshot ───────────────────────────────────────────────

  /**
   * Resolve the bundled snapshot path for both run modes:
   *  - packaged: `<process.resourcesPath>/modelsdev-snapshot.json`
   *  - dev:      `<cwd>/resources/modelsdev-snapshot.json`
   * `electron-builder.yml` ships `resources/modelsdev-snapshot.json` into
   * `process.resourcesPath` via an `extraResources` entry.
   */
  private snapshotFilePath(): string {
    const isPackaged = app.isPackaged === true;
    const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
    if (isPackaged && resourcesPath) {
      return path.join(resourcesPath, SNAPSHOT_FILE_NAME);
    }
    return path.join(process.cwd(), 'resources', SNAPSHOT_FILE_NAME);
  }

  /** Read + validate the bundled snapshot. Returns `null` if absent or invalid. */
  private async readSnapshot(): Promise<ModelsDevRegistry | null> {
    try {
      const body = await fs.readFile(this.snapshotFilePath(), 'utf8');
      return this.parseAndValidate(body);
    } catch {
      return null;
    }
  }
}

// ─── Pure helpers ───────────────────────────────────────────────────────────────

/**
 * Read a response body as text with a hard byte ceiling, independent of any
 * declared `content-length`. Streams chunk-by-chunk and bails (returning
 * `null`) the instant the accumulated size would exceed `maxBytes`. Falls back
 * to `res.text()` only when the runtime exposes no readable stream.
 */
async function readBodyCapped(res: Response, maxBytes: number): Promise<string | null> {
  const stream = res.body;
  if (!stream || typeof stream.getReader !== 'function') {
    // No stream available - fall back to a buffered read, then enforce the cap.
    const text = await res.text();
    return Buffer.byteLength(text, 'utf8') > maxBytes ? null : text;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let out = '';
  try {
    for (;;) {
      // Sequential by nature - each chunk arrives only after the previous read.
      // oxlint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel().catch(() => {});
          return null;
        }
        out += decoder.decode(value, { stream: true });
      }
    }
    out += decoder.decode();
    return out;
  } finally {
    reader.releaseLock();
  }
}
