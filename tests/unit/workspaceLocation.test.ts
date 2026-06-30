/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #455 - persistent project workspaces. These cover the pure path logic that
 * turns a project name into a filesystem-safe, collision-free workspace dir.
 * Kept free of electron/fs so the rules are exercised directly.
 */
import path from 'path';
import { describe, expect, it } from 'vitest';
import { resolveProjectWorkspacePath, sanitizeProjectFolderName } from '@process/utils/workspaceLocation';

describe('sanitizeProjectFolderName (#455)', () => {
  it('keeps an ordinary name intact', () => {
    expect(sanitizeProjectFolderName('My Notes')).toBe('My Notes');
  });

  it('strips path separators so a name can never escape the base dir', () => {
    expect(sanitizeProjectFolderName('a/b\\c')).toBe('a b c');
    expect(sanitizeProjectFolderName('../../etc/passwd')).toBe('etc passwd');
  });

  it('removes control and reserved filesystem characters', () => {
    expect(sanitizeProjectFolderName('re<po>:"|?*name')).toBe('reponame');
  });

  it('collapses whitespace and trims', () => {
    expect(sanitizeProjectFolderName('  spaced   out  ')).toBe('spaced out');
  });

  it('strips leading/trailing dots and spaces (Windows-unsafe)', () => {
    expect(sanitizeProjectFolderName('...hidden...')).toBe('hidden');
    expect(sanitizeProjectFolderName('.')).toBe('Project');
  });

  it('falls back to "Project" when nothing usable remains', () => {
    expect(sanitizeProjectFolderName('')).toBe('Project');
    expect(sanitizeProjectFolderName('///')).toBe('Project');
    expect(sanitizeProjectFolderName('   ')).toBe('Project');
  });

  it('caps very long names', () => {
    const out = sanitizeProjectFolderName('x'.repeat(500));
    expect(out.length).toBeLessThanOrEqual(80);
  });

  it('never ends in a dot when the length cap slices mid-dot (Windows-invalid)', () => {
    const out = sanitizeProjectFolderName('a'.repeat(79) + '.tail extra');
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.endsWith('.')).toBe(false);
  });
});

describe('resolveProjectWorkspacePath (#455)', () => {
  // resolveProjectWorkspacePath builds paths with path.join, so expectations use
  // path.join too (native separators) — otherwise these assertions fail on Windows.
  const base = path.join('/Users/me', 'Documents', 'Wayland');

  it('uses base/<name> when the path is free', () => {
    expect(resolveProjectWorkspacePath(base, 'Alpha', () => false)).toBe(path.join(base, 'Alpha'));
  });

  it('sanitizes the name into the path', () => {
    expect(resolveProjectWorkspacePath(base, 'a/b', () => false)).toBe(path.join(base, 'a b'));
  });

  it('appends a numeric suffix on collision', () => {
    const taken = new Set([path.join(base, 'Alpha'), path.join(base, 'Alpha (2)')]);
    expect(resolveProjectWorkspacePath(base, 'Alpha', (p) => taken.has(p))).toBe(path.join(base, 'Alpha (3)'));
  });

  it('two projects with the same name resolve to distinct dirs', () => {
    const taken = new Set<string>();
    const first = resolveProjectWorkspacePath(base, 'Notes', (p) => taken.has(p));
    taken.add(first);
    const second = resolveProjectWorkspacePath(base, 'Notes', (p) => taken.has(p));
    expect(first).toBe(path.join(base, 'Notes'));
    expect(second).toBe(path.join(base, 'Notes (2)'));
    expect(first).not.toBe(second);
  });
});
