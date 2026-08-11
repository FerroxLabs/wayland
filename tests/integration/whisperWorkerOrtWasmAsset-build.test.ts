/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The local STT WASM runtime, asserted against real build output.
 *
 * transformers.js points ORT's WASM runtime at
 * `https://cdn.jsdelivr.net/npm/onnxruntime-web@<ver>/dist/` unless something
 * sets `wasmPaths` first - ~22.5 MiB of third-party egress and a hard failure
 * offline. `whisperWorker.ts` sets it to the copy Vite emits as an app asset.
 *
 * Two things then have to hold in the SHIPPED artifact, and no unit test can
 * see either of them. Under Vitest the `?url` import resolves to a schemeless
 * repo path that no build emits, while the shipped value is always an absolute
 * URL with a scheme built from `new URL('<emitted-name>', self.location.href)`
 * - `file:` packaged, `http:` under the dev server. So:
 *
 *   1. exactly ONE hash-suffixed `ort-wasm-simd-threaded.asyncify-<hash>.wasm`
 *      sits in `out/renderer/assets/`, and the built worker chunk references
 *      it by that EXACT emitted name, resolved against `self.location.href` so
 *      the request always lands on the sibling asset. If those diverge, ORT
 *      requests a name that is not there and local STT dies offline.
 *   2. no complete remote `.wasm` URL is baked into the chunk at all.
 *
 * Measured, not assumed: the hash-suffixed binary is emitted EITHER WAY.
 * onnxruntime-web references it through a bundler-visible pattern of its own,
 * so a build with `wasmPaths` pointed back at jsdelivr still emits and still
 * references the local asset - it just never asks for it. That is why (2)
 * exists as a separate assertion, and why (1) is only a self-consistency
 * claim about the emitted pair, not a CDN gate.
 *
 * Like the other `*-build.test.ts` suites here, this needs `electron-vite
 * build` output at least as new as the sources it asserts about, and skips
 * rather than lies when there is none. The always-run half of the CDN gate -
 * that the URL comes from the bundler import and not a literal remote URL -
 * lives in tests/unit/renderer/voice/whisperWorkerLocalWasm.test.ts.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '../..');
const assetsDir = resolve(repoRoot, 'out/renderer/assets');

// Sources whose change invalidates the emitted pair: the module that declares
// the import, and the manifest that decides which onnxruntime-web is installed.
const gatingSources = [resolve(repoRoot, 'src/renderer/workers/whisperWorker.ts'), resolve(repoRoot, 'package.json')];

// Only hash-suffixed names - Vite's emitted form. The bare
// `ort-wasm-simd-threaded.asyncify.wasm` also appears in the chunk as part of
// the dead jsdelivr default template inside transformers.js itself.
const EMITTED_WASM = /^ort-wasm-simd-threaded\.asyncify-[A-Za-z0-9_-]+\.wasm$/;
const EMITTED_WASM_REFERENCE = /ort-wasm-simd-threaded\.asyncify-[A-Za-z0-9_-]+\.wasm/g;
const SIBLING_REFERENCE =
  /new URL\("(ort-wasm-simd-threaded\.asyncify-[A-Za-z0-9_-]+\.wasm)",\s*self\.location\.href\)/;
const WORKER_CHUNK = /^whisperWorker-[A-Za-z0-9_-]+\.js$/;
// A whole remote URL ending in `.wasm`, in one string literal. The library's
// own default never takes this form: it concatenates a host template with the
// filename, so host and `.wasm` land in different literals. Measured: zero
// matches in a correct build, one the moment wasmPaths is given a CDN URL.
const REMOTE_WASM_URL = /https?:\/\/[^"'`)\\\s]*\.wasm/g;

function newestMtimeMs(files: string[]): number {
  return files.reduce((latest, file) => {
    if (!existsSync(file)) return latest;
    return Math.max(latest, statSync(file).mtimeMs);
  }, 0);
}

function assetNames(): string[] {
  return existsSync(assetsDir) ? readdirSync(assetsDir) : [];
}

describe('Built whisperWorker ORT WASM runtime', () => {
  const workerChunks = assetNames().filter((name) => WORKER_CHUNK.test(name));
  const builtChunkMtime = newestMtimeMs(workerChunks.map((name) => resolve(assetsDir, name)));
  const hasFreshBuild = workerChunks.length > 0 && builtChunkMtime >= newestMtimeMs(gatingSources);
  const runOrSkip = hasFreshBuild ? it : it.skip;

  runOrSkip('emits one ORT asyncify binary and references it by that exact name', () => {
    const emitted = assetNames().filter((name) => EMITTED_WASM.test(name));

    // More than one means two hashes are in flight and the chunk can only be
    // pointing at one of them; zero means no local copy ships at all.
    expect(emitted).toHaveLength(1);
    expect(workerChunks).toHaveLength(1);

    const emittedName = emitted[0]!;
    // A stub or a text placeholder would satisfy a name check; the real ORT
    // asyncify build is ~22.5 MiB.
    expect(statSync(resolve(assetsDir, emittedName)).size).toBeGreaterThan(1024 * 1024);

    const chunk = readFileSync(resolve(assetsDir, workerChunks[0]!), 'utf8');

    // Matched out rather than asserted with `toContain` so a failure prints
    // the two names instead of half a megabyte of bundle.
    expect(chunk.match(SIBLING_REFERENCE)?.[1] ?? null).toBe(emittedName);

    // And no OTHER emitted-style name is referenced - a stale hash left behind
    // by a partial rebuild would otherwise pass the check above.
    const referenced = new Set(chunk.match(EMITTED_WASM_REFERENCE) ?? []);
    expect([...referenced]).toEqual([emittedName]);
  });

  runOrSkip('bakes no remote wasm URL into the worker chunk', () => {
    const chunk = readFileSync(resolve(assetsDir, workerChunks[0]!), 'utf8');
    expect(chunk.match(REMOTE_WASM_URL) ?? []).toEqual([]);
  });
});
