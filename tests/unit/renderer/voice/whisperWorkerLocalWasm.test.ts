/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The local STT floor must not phone a CDN.
 *
 * transformers.js defaults ORT's WASM runtime to
 * `https://cdn.jsdelivr.net/npm/onnxruntime-web@<ver>/dist/` - ~22.5 MiB of
 * third-party egress and a hard failure offline or behind a captive portal.
 * `whisperWorker.ts` overrides that with the copy Vite emits into the app's own
 * asset directory. (The app's CSP is NOT what stops that fetch: a dedicated
 * worker on a `file:` document reaches jsdelivr anyway. Offline is the whole
 * argument, and it is enough.)
 *
 * SCOPE, stated honestly. This file can see two things and no more:
 *   1. that the worker installs its own object onto the transformers.js env,
 *      and 2. the SOURCE the bundler is handed.
 * It CANNOT see the value that ships. Under Vitest the `?url` import resolves
 * to a schemeless repo path (`/node_modules/onnxruntime-web/dist/...`) that no
 * build ever emits; the shipped value is always an absolute URL with a scheme
 * (`file:` packaged, `http:` under the dev server) produced by
 * `new URL('<emitted-name>', self.location.href)`. Assertions on the SHAPE of
 * that string therefore prove nothing about production, and two such
 * assertions previously passed here for exactly that wrong reason.
 *
 * The invariants that need the shipped artifact - the hash-suffixed binary Vite
 * emits and the reference to it inside the built worker chunk must agree, and
 * no complete remote `.wasm` URL may be baked into that chunk - are asserted
 * against real build output in
 * `tests/integration/whisperWorkerOrtWasmAsset-build.test.ts`.
 *
 * Nothing here executes WASM, so nothing here proves the runtime loaded and
 * ran; that is a live-app check.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, beforeAll } from 'vitest';

const WORKER_SOURCE_PATH = resolve(__dirname, '../../../../src/renderer/workers/whisperWorker.ts');

// Minimal stand-in for the transformers.js `env` singleton. `backends.onnx` is
// a shallow spread of ORT's own env in the real library, so `.wasm` is the
// same object reference ORT reads at session-create time.
const fakeEnv: {
  allowRemoteModels: boolean;
  allowLocalModels: boolean;
  useBrowserCache: boolean;
  useWasmCache: boolean;
  localModelPath: string;
  backends: { onnx: { wasm: { wasmPaths?: unknown } } };
} = {
  allowRemoteModels: true,
  allowLocalModels: false,
  useBrowserCache: true,
  useWasmCache: true,
  localModelPath: '',
  backends: {
    onnx: {
      wasm: {
        // The library's own default, verbatim - so the test starts from the
        // exact remote value the worker has to displace.
        wasmPaths: {
          mjs: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/ort-wasm-simd-threaded.asyncify.mjs',
          wasm: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/ort-wasm-simd-threaded.asyncify.wasm',
        },
      },
    },
  },
};

vi.mock('@huggingface/transformers', () => ({
  env: fakeEnv,
  pipeline: vi.fn(),
}));

let ORT_WASM_PATHS: { wasm: string; mjs?: string };

beforeAll(async () => {
  // The worker module installs a `self.onmessage` handler at import time.
  (globalThis as unknown as { self: unknown }).self ??= {
    onmessage: null,
    postMessage: () => {},
  };
  ({ ORT_WASM_PATHS } = await import('@renderer/workers/whisperWorker'));
});

describe('whisperWorker ORT WASM runtime location', () => {
  it('displaces the library default with its own wasmPaths object', () => {
    expect(fakeEnv.backends.onnx.wasm.wasmPaths).toBe(ORT_WASM_PATHS);
    expect(typeof ORT_WASM_PATHS.wasm).toBe('string');
    expect(ORT_WASM_PATHS.wasm.length).toBeGreaterThan(0);
  });

  it('takes the wasm URL from the bundler asset import, never a literal remote URL', () => {
    // This is the CDN gate that survives without a build. It reads the source
    // the bundler is handed rather than the value some resolver produced, so
    // it is true in every environment: the path must come from the `?url`
    // import Vite turns into an emitted app asset. Hardcoding any URL here -
    // jsdelivr or otherwise - fails this.
    const source = readFileSync(WORKER_SOURCE_PATH, 'utf8');
    expect(source).toMatch(/^import ortWasmUrl from 'onnxruntime-web\/ort-wasm-simd-threaded\.asyncify\.wasm\?url';$/m);
    expect(source).toMatch(/^export const ORT_WASM_PATHS = \{ wasm: ortWasmUrl \};$/m);
    expect(source).toMatch(/^env\.backends\.onnx\.wasm\.wasmPaths = ORT_WASM_PATHS;$/m);
  });

  it('names the asyncify ORT build the Chromium renderer actually runs', () => {
    // Basename only. This is stable across dev, packaged and Vitest, and it is
    // deliberately NOT a CDN check - the jsdelivr default ends in the same
    // basename. The CDN gates are the import assertion above and the build
    // -output test.
    expect(ORT_WASM_PATHS.wasm).toMatch(/ort-wasm-simd-threaded\.asyncify[^/]*\.wasm$/);
  });

  it('leaves wasmPaths.mjs unset so ORT uses its bundled factory', () => {
    // Setting `mjs` makes ORT dynamic-import the factory over the network
    // instead of using the copy already bundled into the worker chunk. With
    // only `wasmPaths.wasm` set, ORT wires `locateFile` straight to our URL.
    expect(ORT_WASM_PATHS.mjs).toBeUndefined();
  });

  it('pins useWasmCache off as defence in depth, inert while mjs stays unset', () => {
    // Honest about what this pins: it is currently a no-op. transformers.js
    // gates the Cache API pre-fetch on `wasmPaths.wasm && wasmPaths.mjs`
    // (@huggingface/transformers/src/backends/onnx.js, `ensureWasmLoaded`),
    // and `mjs` is deliberately unset above, so the pre-fetch is already
    // unreachable and live runs issue zero .mjs requests. The flag matters
    // only if a future change sets `mjs`; it is kept so that change does not
    // silently re-arm a Cache API fetch the file: scheme cannot serve.
    expect(fakeEnv.useWasmCache).toBe(false);
  });
});
