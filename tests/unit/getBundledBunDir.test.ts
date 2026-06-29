/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #438: getBundledBunDir must validate the actual `bun` binary, not just the
 * arch directory. prepareBundledBun's error path creates an EMPTY
 * `bundled-bun/<platform>-<arch>/` dir; returning it handed resolveNpxPath a
 * path to a `bun` that doesn't exist, so every npx-based local stdio MCP server
 * spawned ENOENT and surfaced only as -32000 "Connection closed".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  isPackaged: vi.fn(() => false),
  existsSync: vi.fn(),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ paths: { isPackaged: () => mocks.isPackaged() } }),
}));

// Override existsSync only; keep the rest of fs real so detectAvx2's
// readFileSync('/proc/cpuinfo') on x64 Linux runners still works.
vi.mock('fs', async (orig) => {
  const actual = await orig<typeof import('fs')>();
  return { ...actual, existsSync: mocks.existsSync };
});

const isBunBinary = (p: string): boolean => p.endsWith('bun') || p.endsWith('bun.exe');

describe('getBundledBunDir (#438 — validate the bun binary, not just the dir)', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.existsSync.mockReset();
    mocks.isPackaged.mockReturnValue(false);
  });

  it('returns null when the arch dir exists but the bun binary is missing (empty-dir failure path)', async () => {
    // The directory "exists", but the bun binary inside does not — exactly the
    // state prepareBundledBun leaves on a failed download.
    mocks.existsSync.mockImplementation((p: unknown) => !isBunBinary(String(p)));
    const { getBundledBunDir } = await import('@process/utils/shellEnv');
    expect(getBundledBunDir()).toBeNull();
  });

  it('returns the arch dir when the bun binary is present', async () => {
    mocks.existsSync.mockReturnValue(true);
    const { getBundledBunDir } = await import('@process/utils/shellEnv');
    const dir = getBundledBunDir();
    expect(dir).not.toBeNull();
    expect(dir).toContain('bundled-bun');
  });
});
