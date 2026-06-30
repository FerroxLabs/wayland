/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #455 scope 4 - persistent project workspaces still need native skill symlinks
 * (the engine/CLIs scan `.wayland-core/skills`, `.claude/skills`, ... at the
 * workspace root). To keep the user's folder clean those managed dot-dirs are
 * gitignored. buildManagedGitignore must be idempotent and must never clobber a
 * user's existing .gitignore.
 */
import { describe, expect, it } from 'vitest';
import { MANAGED_GITIGNORE_START, buildManagedGitignore } from '@process/utils/workspaceGitignore';

describe('buildManagedGitignore (#455)', () => {
  it('creates a managed block for an empty/absent .gitignore', () => {
    const out = buildManagedGitignore('');
    expect(out).not.toBeNull();
    expect(out).toContain(MANAGED_GITIGNORE_START);
    expect(out).toContain('.wayland-core/');
    expect(out).toContain('.wayland/');
    expect(out).toContain('.claude/');
    expect(out!.endsWith('\n')).toBe(true);
  });

  it('appends the managed block to an existing user .gitignore without losing content', () => {
    const existing = 'node_modules/\ndist/\n';
    const out = buildManagedGitignore(existing);
    expect(out).not.toBeNull();
    expect(out!.startsWith('node_modules/\ndist/')).toBe(true);
    expect(out).toContain(MANAGED_GITIGNORE_START);
    expect(out).toContain('.wayland-core/');
  });

  it('is idempotent - returns null when the managed block is already present', () => {
    const first = buildManagedGitignore('node_modules/\n');
    expect(first).not.toBeNull();
    expect(buildManagedGitignore(first!)).toBeNull();
  });
});
