/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #706 — the JS-runtime resolver.
 *
 * Packaged builds blow the RunAsNode fuse (scripts/afterPack.js), so spawning
 * `process.execPath` + ELECTRON_RUN_AS_NODE=1 boots the app instead of Node and
 * the IJFW/MCP children crash-loop ("IJFW Memory: Degraded"). The resolver's ONE
 * job is to never hand back the app binary in a packaged build, and to carry the
 * ELECTRON_RUN_AS_NODE env ONLY for the dev electron-node runtime.
 *
 * These tests exercise runtime behaviour (test files are not in the tsc program,
 * so type-level guarantees here would not actually run).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  isPackaged: vi.fn<() => boolean>(),
  getBundledBunDir: vi.fn<() => string | null>(),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ paths: { isPackaged: mocks.isPackaged } }),
}));

vi.mock('@process/utils/shellEnv', () => ({
  getBundledBunDir: mocks.getBundledBunDir,
}));

import { resolveJsRuntime, resolveJsRuntimeWith, type JsRuntimeInputs } from '@process/utils/jsRuntime';

const EXEC = '/Applications/Wayland.app/Contents/MacOS/Wayland';
const BUN = '/Applications/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun';

const inputs = (over: Partial<JsRuntimeInputs>): JsRuntimeInputs => ({
  isPackaged: true,
  bundledBunPath: BUN,
  execPath: EXEC,
  platform: 'darwin',
  ...over,
});

describe('resolveJsRuntimeWith (pure core)', () => {
  it('dev (unpackaged): runs the app binary as Node, carrying ELECTRON_RUN_AS_NODE', () => {
    // Unpackaged Electron is unfused and honours the env var — preserve exactly.
    const r = resolveJsRuntimeWith(inputs({ isPackaged: false }));
    expect(r).toEqual({ command: EXEC, env: { ELECTRON_RUN_AS_NODE: '1' }, kind: 'electron-node' });
  });

  it('dev wins even when a bundled Bun is present (isPackaged is checked first)', () => {
    // Guards against reordering the bun check above the packaged gate.
    const r = resolveJsRuntimeWith(inputs({ isPackaged: false, bundledBunPath: BUN }));
    expect(r.kind).toBe('electron-node');
    expect(r.command).toBe(EXEC);
  });

  it('packaged + bundled Bun present: uses Bun with NO ELECTRON_RUN_AS_NODE', () => {
    const r = resolveJsRuntimeWith(inputs({ isPackaged: true, bundledBunPath: BUN }));
    expect(r.command).toBe(BUN);
    expect(r.kind).toBe('bundled-bun');
    // A real runtime must not carry the Electron-as-Node env var.
    expect(r.env).toEqual({});
    expect(r.env).not.toHaveProperty('ELECTRON_RUN_AS_NODE');
  });

  it('packaged + no bundled Bun: falls back to system node, never the app binary', () => {
    const r = resolveJsRuntimeWith(inputs({ isPackaged: true, bundledBunPath: null }));
    expect(r.command).toBe('node');
    expect(r.kind).toBe('system-node');
    expect(r.env).toEqual({});
  });

  it('packaged system-node fallback is node.exe on Windows', () => {
    const r = resolveJsRuntimeWith(inputs({ isPackaged: true, bundledBunPath: null, platform: 'win32' }));
    expect(r.command).toBe('node.exe');
    expect(r.kind).toBe('system-node');
  });

  it('CONTROL: the app binary is NEVER returned in a packaged build (the #706 crash-loop)', () => {
    for (const bundledBunPath of [BUN, null]) {
      for (const platform of ['darwin', 'linux', 'win32'] as NodeJS.Platform[]) {
        const r = resolveJsRuntimeWith(inputs({ isPackaged: true, bundledBunPath, platform }));
        expect(r.command).not.toBe(EXEC);
        expect(r.env).not.toHaveProperty('ELECTRON_RUN_AS_NODE');
      }
    }
  });
});

describe('resolveJsRuntime (wiring)', () => {
  beforeEach(() => {
    mocks.isPackaged.mockReset();
    mocks.getBundledBunDir.mockReset();
  });

  it('packaged: joins the bundled Bun dir with the platform binary name', () => {
    mocks.isPackaged.mockReturnValue(true);
    mocks.getBundledBunDir.mockReturnValue('/res/bundled-bun/darwin-arm64');
    const r = resolveJsRuntime();
    expect(r.kind).toBe('bundled-bun');
    // Binary name is platform-derived by the resolver (bun.exe on Windows CI).
    const binName = process.platform === 'win32' ? 'bun.exe' : 'bun';
    expect(r.command).toBe(path.join('/res/bundled-bun/darwin-arm64', binName));
  });

  it('packaged with getBundledBunDir() null: system-node, not the app binary', () => {
    mocks.isPackaged.mockReturnValue(true);
    mocks.getBundledBunDir.mockReturnValue(null);
    const r = resolveJsRuntime();
    expect(r.kind).toBe('system-node');
    expect(r.command).not.toBe(process.execPath);
  });

  it('dev: electron-node with the real execPath', () => {
    mocks.isPackaged.mockReturnValue(false);
    mocks.getBundledBunDir.mockReturnValue(null);
    const r = resolveJsRuntime();
    expect(r).toEqual({ command: process.execPath, env: { ELECTRON_RUN_AS_NODE: '1' }, kind: 'electron-node' });
  });
});

describe('#706 regression: the RunAsNode fuse is still off in packaged builds', () => {
  it('afterPack.js disables RunAsNode — the premise app.isPackaged encodes', () => {
    // The resolver treats app.isPackaged as "the RunAsNode fuse is off". That is
    // only sound while afterPack keeps disabling it unconditionally. If this ever
    // flips to true, revisit jsRuntime.ts (Bun still works, but the rationale in
    // its header no longer holds).
    const afterPack = readFileSync(path.resolve(__dirname, '../../../scripts/afterPack.js'), 'utf-8');
    expect(afterPack).toMatch(/\[FuseV1Options\.RunAsNode\]:\s*false/);
  });
});
