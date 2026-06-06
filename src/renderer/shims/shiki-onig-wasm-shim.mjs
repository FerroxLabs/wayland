/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shim for `@shikijs/engine-oniguruma/dist/wasm-inlined.mjs`.
 *
 * Shiki ships oniguruma WASM as a base64-inlined JS module by default. That
 * produces a ~620 KB lazy chunk dominated by `atob()` decode cost (parse +
 * decode runs on first code-block render).
 *
 * This shim mirrors the same export shape but loads the actual `onig.wasm`
 * binary as a separate Vite asset via `?url`, then instantiates it from a
 * fetch response. Vite emits `onig.wasm` next to the JS chunks, the browser
 * can stream-compile it with `instantiateStreaming`, and the JS chunk shrinks
 * to a few hundred bytes.
 *
 * Wired via `resolve.alias` in electron.vite.config.ts (renderer section).
 */
import onigWasmUrl from 'shiki/onig.wasm?url';

const getWasmInstance = async (info) => {
  if (typeof WebAssembly.instantiateStreaming === 'function') {
    try {
      const response = await fetch(onigWasmUrl);
      const result = await WebAssembly.instantiateStreaming(response, info);
      return result.instance.exports;
    } catch {
      // Fall through to ArrayBuffer path (e.g. wrong MIME under file://).
    }
  }
  const response = await fetch(onigWasmUrl);
  const bytes = await response.arrayBuffer();
  const result = await WebAssembly.instantiate(bytes, info);
  return result.instance.exports;
};

export { getWasmInstance as default, getWasmInstance };
