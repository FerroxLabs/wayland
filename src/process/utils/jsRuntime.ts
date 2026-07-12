/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Resolve a JavaScript runtime for spawning our own JS entry points as child
 * processes (the IJFW MCP server, the builtin @wayland MCP servers, the IJFW
 * npm/npx update path).
 *
 * WHY THIS EXISTS (#706)
 * ----------------------
 * These sites historically spawned `process.execPath` (the app binary) with
 * `ELECTRON_RUN_AS_NODE=1`, relying on Electron's run-as-Node mode. That works
 * in DEV, but the packaged build hardens the binary in `scripts/afterPack.js`
 * with `FuseV1Options.RunAsNode: false` (SEC-ELEC-05), applied UNCONDITIONALLY
 * to every packaged build. Once that fuse is blown, `ELECTRON_RUN_AS_NODE=1` is
 * a silent no-op: the child boots as a full Electron APP (new window, no stdio
 * JSON-RPC) instead of Node, so the parent's handshake never completes and the
 * feature crash-loops — surfacing to users as "IJFW Memory: Degraded".
 *
 * The fix is to stop pretending the app binary is a Node runtime in packaged
 * builds and instead run a real one. The app already SHIPS a Bun runtime
 * (`resources/bundled-bun/<platform>-<arch>`, see electron-builder.yml) and
 * already resolves it via `getBundledBunDir()` for the npx-MCP path. Bun runs
 * plain `.js`, ESM `.mjs`, and even `npm-cli.js` as a drop-in Node replacement,
 * so it is the correct primary runtime for the fused, packaged build.
 *
 * `app.isPackaged` is a sound proxy for "the RunAsNode fuse is off" precisely
 * because `applyElectronFuses` runs unconditionally in afterPack — every
 * packaged build is fused, no packaged build honours ELECTRON_RUN_AS_NODE.
 *
 * DO NOT probe for the fuse by spawning `process.execPath -e ...`: with the fuse
 * blown, that launches a real Electron app/window rather than evaluating code.
 */

import path from 'path';
import { getPlatformServices } from '@/common/platform';
import { getBundledBunDir } from '@process/utils/shellEnv';

/**
 * How a resolved runtime launches a JS entry:
 *  - `electron-node`  → the app binary in ELECTRON_RUN_AS_NODE mode. Only valid
 *                       UNPACKAGED (dev/test), where the fuse is not applied.
 *  - `bundled-bun`    → the Bun runtime shipped inside the signed bundle. The
 *                       primary packaged runtime: always present, correct arch.
 *  - `system-node`    → a `node` on PATH. Best-effort last resort when the
 *                       bundled Bun binary is somehow missing (partial install);
 *                       may ENOENT, which callers already degrade on. Chosen in
 *                       preference to ever falling back to the app binary, which
 *                       is the exact crash-loop this module removes.
 */
export type JsRuntimeKind = 'electron-node' | 'bundled-bun' | 'system-node';

export interface ResolvedJsRuntime {
  /** Executable to spawn. Callers pass `[entry, ...args]` as argv unchanged. */
  command: string;
  /**
   * Extra env the runtime needs, to be merged into the child env. Only
   * `electron-node` needs anything (`ELECTRON_RUN_AS_NODE=1`); the real runtimes
   * need nothing, and must NOT carry ELECTRON_RUN_AS_NODE.
   */
  env: Record<string, string>;
  kind: JsRuntimeKind;
}

export interface JsRuntimeInputs {
  /** Is the app packaged? When packaged, the RunAsNode fuse is off. */
  isPackaged: boolean;
  /** Full path to the bundled Bun binary, or null if unavailable. */
  bundledBunPath: string | null;
  /** `process.execPath` — the app binary. */
  execPath: string;
  platform: NodeJS.Platform;
}

/**
 * Pure resolution core (no process/fs access) so the decision is unit testable.
 *
 * Order:
 *   1. NOT packaged → run the app binary as Node. Preserves dev/test behaviour
 *      EXACTLY: unpackaged Electron is unfused and honours the env var.
 *   2. packaged + bundled Bun present → Bun. The normal packaged path.
 *   3. packaged + no bundled Bun → system `node`. Never the app binary.
 */
export function resolveJsRuntimeWith(inputs: JsRuntimeInputs): ResolvedJsRuntime {
  if (!inputs.isPackaged) {
    return { command: inputs.execPath, env: { ELECTRON_RUN_AS_NODE: '1' }, kind: 'electron-node' };
  }
  if (inputs.bundledBunPath) {
    return { command: inputs.bundledBunPath, env: {}, kind: 'bundled-bun' };
  }
  return { command: inputs.platform === 'win32' ? 'node.exe' : 'node', env: {}, kind: 'system-node' };
}

/** Binary name of the bundled Bun for the current platform. */
function bunBinaryName(platform: NodeJS.Platform): string {
  return platform === 'win32' ? 'bun.exe' : 'bun';
}

/**
 * Resolve the JS runtime for the current process. Reads real process/platform
 * state and defers to {@link resolveJsRuntimeWith} for the decision.
 */
export function resolveJsRuntime(): ResolvedJsRuntime {
  const isPackaged = getPlatformServices().paths.isPackaged();
  // Only resolve the bundled Bun when it can actually be used (packaged). This
  // keeps the dev/test path off the filesystem and off getBundledBunDir.
  const bunDir = isPackaged ? getBundledBunDir() : null;
  const bundledBunPath = bunDir ? path.join(bunDir, bunBinaryName(process.platform)) : null;
  return resolveJsRuntimeWith({
    isPackaged,
    bundledBunPath,
    execPath: process.execPath,
    platform: process.platform,
  });
}
