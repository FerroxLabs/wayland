/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Core 0.12.26 discards authority-expanding project config from an untrusted
 * workspace. Desktop writes exactly that kind of config — a launch-local
 * `[profiles.__wayland_desktop_session]` narrowing the MCP table — into a
 * per-chat directory, so it needs `--trust-workspace` or every Core turn dies
 * with "Profile '__wayland_desktop_session' not found in config".
 *
 * That flag is the whole reason these tests exist. Pointed at a directory the
 * USER chose, it grants that directory's `.wayland-core.toml` — hooks, MCP
 * servers, providers — precisely the authority the trust control withholds.
 * Open a cloned hostile repo as a workspace and the flag hands it the keys.
 *
 * So the negative cases below are the point of the file, not padding.
 */

import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import { isDesktopManagedWorkspace } from '@process/agent/wcore';

const WORK_ROOT = '/Users/someone/Library/Application Support/wayland/work';

describe('isDesktopManagedWorkspace', () => {
  it('accepts a workspace this app minted in its own managed work root', () => {
    expect(isDesktopManagedWorkspace(join(WORK_ROOT, 'wcore-temp-1786146174520'), WORK_ROOT)).toBe(true);
  });

  it('accepts the other managed agent prefixes, which share the grammar', () => {
    expect(isDesktopManagedWorkspace(join(WORK_ROOT, 'gemini-temp-1786146174520'), WORK_ROOT)).toBe(true);
  });

  it('REFUSES a directory the user opened', () => {
    // The attack this guard exists for: a cloned repo whose .wayland-core.toml
    // carries hooks or MCP servers. Trusting it would execute the repo's config.
    expect(isDesktopManagedWorkspace('/Users/someone/dev/some-cloned-repo', WORK_ROOT)).toBe(false);
  });

  it('REFUSES a lookalike name outside the managed root', () => {
    // Naming a folder `wcore-temp-1786146174520` must not be enough. Only
    // Desktop writes into the managed root, so location is the real authority.
    expect(isDesktopManagedWorkspace('/Users/someone/dev/wcore-temp-1786146174520', WORK_ROOT)).toBe(false);
  });

  it('REFUSES a nested path inside the managed root', () => {
    // Only direct children are minted by buildWorkspaceWidthFiles. A deeper path
    // means something else created it.
    expect(
      isDesktopManagedWorkspace(join(WORK_ROOT, 'wcore-temp-1786146174520', 'sub'), WORK_ROOT)
    ).toBe(false);
  });

  it('REFUSES a name that misses the closed grammar', () => {
    expect(isDesktopManagedWorkspace(join(WORK_ROOT, 'wcore-temp-123'), WORK_ROOT)).toBe(false); // too few digits
    expect(isDesktopManagedWorkspace(join(WORK_ROOT, 'scratch'), WORK_ROOT)).toBe(false);
    expect(isDesktopManagedWorkspace(join(WORK_ROOT, 'wcore-temp-abcdefghij'), WORK_ROOT)).toBe(false);
  });

  it('REFUSES traversal that resolves back out of the managed root', () => {
    expect(
      isDesktopManagedWorkspace(join(WORK_ROOT, '..', 'elsewhere', 'wcore-temp-1786146174520'), WORK_ROOT)
    ).toBe(false);
  });

  it('REFUSES empty inputs rather than defaulting to trusted', () => {
    expect(isDesktopManagedWorkspace('', WORK_ROOT)).toBe(false);
    expect(isDesktopManagedWorkspace(join(WORK_ROOT, 'wcore-temp-1786146174520'), '')).toBe(false);
  });
});
