/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure spawn-config builder for the WhatsApp bridge child process (#890).
 *
 * WHY THIS EXISTS (#890 / #706)
 * -----------------------------
 * `WhatsAppPlugin.forkBridge` historically used `child_process.fork`, which
 * relies on Electron's run-as-Node mode. Packaged builds blow the RunAsNode
 * fuse in `scripts/afterPack.js` (SEC-ELEC-05), so a `fork` there boots a full
 * SECOND Electron app instance instead of Node running `bridge.js` — the
 * instance loses the single-instance lock and `app.quit()`s (code=0), the
 * reconnect ladder exhausts, and the channel parks `error`. baileys/QR never
 * run. This is the identical #706 breakage already fixed for the app's other
 * spawn sites via `resolveJsRuntime()` (see `safeSpawn.ts`); the bridge is the
 * one site that was never migrated.
 *
 * This module isolates the fork→spawn decision into a pure function so the
 * #706 regression (never hand back `process.execPath`, never carry
 * ELECTRON_RUN_AS_NODE in a packaged build) is unit-testable off-process,
 * mirroring `resolveJsRuntimeWith` in `jsRuntime.ts`.
 */

import type { StdioOptions } from 'child_process';
import type { ResolvedJsRuntime } from '@process/utils/jsRuntime';

/**
 * Env flag the bridge child reads to decide whether it runs under the Electron
 * parent (IPC-less). Replaces the old `typeof process.send === 'function'`
 * heuristic, which only worked because `child_process.fork` wired an IPC
 * channel. Under a plain `spawn` (no `'ipc'` stdio slot) `process.send` is
 * always undefined, so a presence heuristic would misfire; an explicit env flag
 * is runtime-agnostic (identical under dev electron-node and packaged Bun).
 */
export const BRIDGE_UNDER_PARENT_ENV = 'WAYLAND_BRIDGE_UNDER_PARENT';

export interface BridgeSpawnConfig {
  /** Executable to spawn (the resolved JS runtime, never the app binary when packaged). */
  command: string;
  /** argv: the bridge entry followed by its flags. */
  argv: string[];
  /** stdio layout: stdin+stdout piped (JSON-RPC framing), stderr inherited. No IPC slot. */
  stdio: StdioOptions;
  /** Child env: parent env + runtime env, with the under-parent flag set. */
  env: NodeJS.ProcessEnv;
}

export interface BridgeSpawnInputs {
  /** Resolved JS runtime from `resolveJsRuntime()`. */
  runtime: ResolvedJsRuntime;
  /** Absolute on-disk path to `bridge.js` (from `resolveBridgeEntryPath()`). */
  entry: string;
  /** Selected backend (`baileys` | `whatsapp-web` | `meta-business`). */
  backend: string;
  /** The parent process env to inherit (`process.env`). */
  parentEnv: NodeJS.ProcessEnv;
}

/**
 * Build the spawn arguments for the bridge child. Pure: no process/fs access,
 * so the decision is unit-testable. The `command`/env correctness for the #706
 * fuse case is owned by `resolveJsRuntimeWith`; this function composes that
 * runtime into a `spawn()` call with the exact transport the JSON-RPC bridge
 * needs.
 */
export function buildBridgeSpawnConfig(inputs: BridgeSpawnInputs): BridgeSpawnConfig {
  const { runtime, entry, backend, parentEnv } = inputs;
  return {
    command: runtime.command,
    argv: [entry, '--backend', backend],
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...parentEnv, ...runtime.env, [BRIDGE_UNDER_PARENT_ENV]: '1' },
  };
}
