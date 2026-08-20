/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import { describe, expect, it } from 'vitest';
import { buildEngineSpawnEnv } from '../../../src/process/agent/wcore/envBuilder';

/**
 * P2-6. The CLASS fix behind this milestone.
 *
 * The morning-report defect was born of a contradiction a skill author had no
 * way to avoid: the bundled SKILL.md named an absolute, app-owned output path
 * (`~/wayland/outbox/market/`) AND told the agent everything outside the
 * workspace is refused. With nowhere legal to write, the agent wrote beside its
 * own script inside `.wayland-core/skills/...` - a dot directory every
 * workspace scanner skips - so a real deliverable was invisible.
 *
 * A skill author cannot repeat that if the host hands them the answer. The
 * engine child is spawned with `cwd: workspace` and, from this change,
 * `WAYLAND_OUTPUT_DIR=<workspace>/artifacts`. An author picks a RELATIVE
 * FILENAME and nothing else; the destination is not theirs to choose.
 *
 * Layering matters as much as presence: the value is applied AFTER the ambient
 * allowlist filter and AFTER both denylist sweeps, exactly like
 * WAYLAND_ALLOW_WIRE_FORCE, so neither a stale value in the user's shell nor a
 * revoked-authority denylist can leave a skill guessing.
 */

// `path.resolve`, not `path.join`: on Windows `path.join(path.sep, ...)` yields
// a drive-LESS absolute path (`\tmp\...`) while the code under test resolves
// its workspace with `path.resolve`, which qualifies it with the current drive
// (`D:\tmp\...`). The two never compare equal. POSIX is unaffected.
const WORKSPACE = path.resolve(path.sep, 'tmp', 'wl-workspace-fixture');
const EXPECTED = path.join(WORKSPACE, 'artifacts');

describe('WAYLAND_OUTPUT_DIR reaches every skill', () => {
  it('is <workspace>/artifacts on a plain spawn', () => {
    const env = buildEngineSpawnEnv({ providerEnv: {}, workspace: WORKSPACE });
    expect(env.WAYLAND_OUTPUT_DIR).toBe(EXPECTED);
  });

  it('is absolute, so it survives any cd the skill performs', () => {
    const env = buildEngineSpawnEnv({ providerEnv: {}, workspace: WORKSPACE });
    expect(path.isAbsolute(env.WAYLAND_OUTPUT_DIR)).toBe(true);
  });

  it('never points at a dot directory - the original defect', () => {
    const env = buildEngineSpawnEnv({ providerEnv: {}, workspace: WORKSPACE });
    const segments = env.WAYLAND_OUTPUT_DIR.split(path.sep).filter(Boolean);
    expect(segments.some((segment) => segment.startsWith('.'))).toBe(false);
    expect(segments[segments.length - 1]).toBe('artifacts');
  });

  it('ignores an inherited WAYLAND_OUTPUT_DIR from the user shell', () => {
    const previous = process.env.WAYLAND_OUTPUT_DIR;
    process.env.WAYLAND_OUTPUT_DIR = path.join(path.sep, 'somewhere', 'else');
    try {
      const env = buildEngineSpawnEnv({ providerEnv: {}, workspace: WORKSPACE });
      expect(env.WAYLAND_OUTPUT_DIR).toBe(EXPECTED);
    } finally {
      if (previous === undefined) delete process.env.WAYLAND_OUTPUT_DIR;
      else process.env.WAYLAND_OUTPUT_DIR = previous;
    }
  });

  it('cannot be stripped by a spawn denylist', () => {
    const env = buildEngineSpawnEnv({
      providerEnv: {},
      workspace: WORKSPACE,
      spawnEnvDenylist: ['WAYLAND_OUTPUT_DIR'],
    });
    expect(env.WAYLAND_OUTPUT_DIR).toBe(EXPECTED);
  });

  it('is absent, not empty, when no workspace was resolved', () => {
    const env = buildEngineSpawnEnv({ providerEnv: {} });
    expect('WAYLAND_OUTPUT_DIR' in env).toBe(false);
  });

  /**
   * `resolveOutputDir` re-checks containment itself, rather than trusting the
   * run path that produced the value, because THIS is where the value becomes a
   * host-blessed write destination handed to model-authored skill text. Nothing
   * asserted that, so the whole containment branch could be deleted and every
   * test in the suite stayed green.
   */
  describe('an open run overrides the default, but only inside the workspace', () => {
    const staging = path.join(WORKSPACE, 'artifacts', 'market', '.staging', 'r1');

    it('uses the run staging directory when it is inside the workspace', () => {
      const env = buildEngineSpawnEnv({ providerEnv: {}, workspace: WORKSPACE, outputDir: staging });
      expect(env.WAYLAND_OUTPUT_DIR).toBe(staging);
    });

    it.each([
      ['an absolute path elsewhere', path.join(path.sep, 'tmp', 'somewhere-else')],
      ['a sibling that shares the workspace prefix', `${WORKSPACE}-evil`],
      ['a traversal back out of the workspace', path.join(WORKSPACE, '..', 'elsewhere')],
      ['the workspace root itself', WORKSPACE],
    ])('falls back to the series root for %s', (_label, outputDir) => {
      const env = buildEngineSpawnEnv({ providerEnv: {}, workspace: WORKSPACE, outputDir });
      expect(env.WAYLAND_OUTPUT_DIR).toBe(EXPECTED);
    });
  });

  it('does not disturb the other authoritative spawn values', () => {
    const env = buildEngineSpawnEnv({
      providerEnv: { ANTHROPIC_API_KEY: 'k' },
      waylandHome: path.join(path.sep, 'tmp', 'wl-home'),
      workspace: WORKSPACE,
    });
    expect(env.ANTHROPIC_API_KEY).toBe('k');
    expect(env.WAYLAND_HOME).toBe(path.join(path.sep, 'tmp', 'wl-home'));
    expect(env.WAYLAND_ALLOW_WIRE_FORCE).toBe('1');
    expect(env.WAYLAND_OUTPUT_DIR).toBe(EXPECTED);
  });
});
