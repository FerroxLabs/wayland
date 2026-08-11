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
 * third-party egress the app's own CSP forbids for the document, and a hard
 * failure offline. `whisperWorker.ts` overrides that with the copy Vite emits
 * into the app's own asset directory.
 *
 * SCOPE: this proves CONFIGURATION ONLY. Nothing here executes WASM, so it
 * cannot prove the runtime loaded and ran - that is a live-app check.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

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
  it('points wasmPaths at the app asset that Vite emits, not a CDN', () => {
    expect(fakeEnv.backends.onnx.wasm.wasmPaths).toBe(ORT_WASM_PATHS);
    expect(typeof ORT_WASM_PATHS.wasm).toBe('string');
    expect(ORT_WASM_PATHS.wasm.length).toBeGreaterThan(0);
  });

  it('stays inside the app asset root it is resolved against', () => {
    // The emitted form differs by environment - worker-relative in a packaged
    // build (`new URL('ort-wasm-simd-threaded.asyncify-<hash>.wasm',
    // self.location.href)`), server-root-absolute under the Vite dev server -
    // so the invariant is the one both share: resolving it against the app's
    // own asset URL never leaves the app. Any absolute remote URL escapes.
    const packagedRoot = 'file:///Applications/Wayland.app/Contents/Resources/app.asar/out/renderer/';
    const packaged = new URL(ORT_WASM_PATHS.wasm, `${packagedRoot}assets/whisperWorker.js`);
    expect(packaged.protocol).toBe('file:');
    expect(packaged.host).toBe('');

    const devOrigin = 'http://localhost:5173';
    const dev = new URL(ORT_WASM_PATHS.wasm, `${devOrigin}/assets/whisperWorker.js`);
    expect(dev.origin).toBe(devOrigin);
  });

  it('is not an absolute remote URL', () => {
    expect(ORT_WASM_PATHS.wasm).not.toMatch(/^[a-z][a-z0-9+.-]*:/i);
    expect(ORT_WASM_PATHS.wasm).not.toMatch(/^\/\//);
    expect(ORT_WASM_PATHS.wasm).not.toMatch(/jsdelivr|unpkg|cdn\./i);
  });

  it('names the asyncify ORT build the Chromium renderer actually runs', () => {
    expect(ORT_WASM_PATHS.wasm).toMatch(/ort-wasm-simd-threaded\.asyncify[^/]*\.wasm$/);
  });

  it('leaves wasmPaths.mjs unset so ORT uses its bundled factory', () => {
    // Setting `mjs` makes ORT dynamic-import the factory over the network
    // instead of using the copy already bundled into the worker chunk, and it
    // re-arms the transformers.js Cache API pre-fetch. Both are regressions.
    expect(ORT_WASM_PATHS.mjs).toBeUndefined();
    expect(fakeEnv.useWasmCache).toBe(false);
  });
});
