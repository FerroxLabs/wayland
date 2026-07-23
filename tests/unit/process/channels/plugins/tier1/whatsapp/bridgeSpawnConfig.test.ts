/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #890 / #706 — the bridge spawn-config builder is the automated floor that
 * would have caught #890: in a packaged build the bridge must spawn a REAL
 * runtime (bundled Bun), never the app binary (`process.execPath`) with
 * ELECTRON_RUN_AS_NODE — that path boots a second Electron instance under the
 * blown RunAsNode fuse and the bridge crash-loops. These tests compose the real
 * `resolveJsRuntimeWith` decision into `buildBridgeSpawnConfig` and lock the
 * invariants off-process (pure functions, no mocks).
 */

import { describe, expect, it } from 'vitest';

import { resolveJsRuntimeWith, type JsRuntimeInputs } from '@process/utils/jsRuntime';
import {
  buildBridgeSpawnConfig,
  BRIDGE_UNDER_PARENT_ENV,
} from '@process/channels/plugins/tier1/whatsapp/bridgeSpawnConfig';

const EXEC = '/Applications/Wayland.app/Contents/MacOS/Wayland';
const BUN = '/Applications/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun';
const ENTRY = '/Applications/Wayland.app/Contents/Resources/whatsapp-bridge/bridge.js';

const runtimeInputs = (over: Partial<JsRuntimeInputs>): JsRuntimeInputs => ({
  isPackaged: true,
  bundledBunPath: BUN,
  execPath: EXEC,
  platform: 'darwin',
  ...over,
});

describe('buildBridgeSpawnConfig (#890 / #706 regression lock)', () => {
  it('packaged: spawns the bundled Bun runtime, never the app binary', () => {
    const runtime = resolveJsRuntimeWith(runtimeInputs({ isPackaged: true }));
    const cfg = buildBridgeSpawnConfig({
      runtime,
      entry: ENTRY,
      backend: 'baileys',
      parentEnv: { PATH: '/usr/bin' },
    });
    expect(cfg.command).toBe(BUN);
    expect(cfg.command).not.toBe(EXEC);
  });

  it('packaged: carries no ELECTRON_RUN_AS_NODE (a no-op under the blown fuse, and a footgun)', () => {
    const runtime = resolveJsRuntimeWith(runtimeInputs({ isPackaged: true }));
    const cfg = buildBridgeSpawnConfig({
      runtime,
      entry: ENTRY,
      backend: 'baileys',
      parentEnv: { PATH: '/usr/bin' },
    });
    expect(cfg.env.ELECTRON_RUN_AS_NODE).toBeUndefined();
  });

  it('dev (unpackaged): runs the app binary as Node, preserving existing behaviour exactly', () => {
    const runtime = resolveJsRuntimeWith(runtimeInputs({ isPackaged: false }));
    const cfg = buildBridgeSpawnConfig({
      runtime,
      entry: ENTRY,
      backend: 'baileys',
      parentEnv: { PATH: '/usr/bin' },
    });
    expect(cfg.command).toBe(EXEC);
    expect(cfg.env.ELECTRON_RUN_AS_NODE).toBe('1');
  });

  it('packaged with no bundled Bun: falls back to system node, still never the app binary', () => {
    const runtime = resolveJsRuntimeWith(runtimeInputs({ isPackaged: true, bundledBunPath: null }));
    const cfg = buildBridgeSpawnConfig({
      runtime,
      entry: ENTRY,
      backend: 'baileys',
      parentEnv: {},
    });
    expect(cfg.command).toBe('node');
    expect(cfg.command).not.toBe(EXEC);
  });

  it('argv is [entry, --backend, backend]', () => {
    const runtime = resolveJsRuntimeWith(runtimeInputs({}));
    const cfg = buildBridgeSpawnConfig({
      runtime,
      entry: ENTRY,
      backend: 'whatsapp-web',
      parentEnv: {},
    });
    expect(cfg.argv).toEqual([ENTRY, '--backend', 'whatsapp-web']);
  });

  it('stdio has NO ipc slot (stdin+stdout piped for JSON-RPC, stderr inherited)', () => {
    const runtime = resolveJsRuntimeWith(runtimeInputs({}));
    const cfg = buildBridgeSpawnConfig({
      runtime,
      entry: ENTRY,
      backend: 'baileys',
      parentEnv: {},
    });
    expect(cfg.stdio).toEqual(['pipe', 'pipe', 'inherit']);
    expect(cfg.stdio).not.toContain('ipc');
  });

  it('sets WAYLAND_BRIDGE_UNDER_PARENT so the child can detect the parent without an ipc channel', () => {
    const runtime = resolveJsRuntimeWith(runtimeInputs({}));
    const cfg = buildBridgeSpawnConfig({
      runtime,
      entry: ENTRY,
      backend: 'baileys',
      parentEnv: { PATH: '/usr/bin' },
    });
    expect(cfg.env[BRIDGE_UNDER_PARENT_ENV]).toBe('1');
    // parent env is inherited...
    expect(cfg.env.PATH).toBe('/usr/bin');
  });
});
