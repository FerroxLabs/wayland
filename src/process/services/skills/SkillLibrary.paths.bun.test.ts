/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Run with: bun test src/process/services/skills/SkillLibrary.paths.bun.test.ts
import { describe, it, expect } from 'bun:test';
import path from 'path';
import { buildResourceDirCandidates } from './SkillLibrary';

// These tests pin the packaged-path resolution that broke skill search in the
// spawned `wayland_search_skills` stdio subprocess (issue #22): there
// `process.resourcesPath` is undefined, so the resolver must reach the
// extraResources dir purely from the bundle's __dirname.

describe('buildResourceDirCandidates', () => {
  // Packaged layout used by the assertions below. The bundle lives at
  // Resources/app.asar.unpacked/out/main; the resource dir is at
  // Resources/skills-library (three levels up from out/main).
  //
  // Both the fixtures and the expectations are built with `path` - the same
  // host-native API production resolves with - so they carry the host's
  // separator and root spelling. A POSIX string literal cannot be used here:
  // production returns `path.resolve(...)` output, and on win32 that both
  // normalizes to backslashes and prefixes the cwd drive
  // (`path.resolve('/Applications')` is `C:\Applications`).
  const packagedResourcesDir = path.resolve(path.join('/Applications', 'Wayland.app', 'Contents', 'Resources'));
  const packagedBundleDir = path.join(packagedResourcesDir, 'app.asar.unpacked', 'out', 'main');
  const realResourceDir = path.join(packagedResourcesDir, 'skills-library');

  it('never produces a doubled app.asar.unpacked.unpacked path', () => {
    const candidates = buildResourceDirCandidates(packagedBundleDir, undefined, 'skills-library');
    for (const c of candidates) {
      expect(c).not.toContain('app.asar.unpacked.unpacked');
    }
  });

  it('includes the correct three-levels-up extraResources dir when resourcesPath is undefined (subprocess)', () => {
    const candidates = buildResourceDirCandidates(packagedBundleDir, undefined, 'skills-library');
    expect(candidates).toContain(realResourceDir);
  });

  it('prefers resourcesPath when present (main process)', () => {
    const candidates = buildResourceDirCandidates(packagedBundleDir, packagedResourcesDir, 'skills-library');
    expect(candidates[0]).toBe(path.join(packagedResourcesDir, 'skills-library'));
  });

  it('collapses the electron-vite chunks subdir before resolving', () => {
    const chunksBundleDir = path.join(packagedBundleDir, 'chunks');
    const candidates = buildResourceDirCandidates(chunksBundleDir, undefined, 'skills-library');
    expect(candidates).toContain(realResourceDir);
    for (const c of candidates) {
      expect(c).not.toContain('app.asar.unpacked.unpacked');
    }
  });

  it('resolves the dev source-tree dir from out/main', () => {
    const devRoot = path.resolve(path.join('/repo', 'app'));
    const devBundleDir = path.join(devRoot, 'out', 'main');
    const candidates = buildResourceDirCandidates(devBundleDir, undefined, 'skills-library');
    expect(candidates).toContain(path.join(devRoot, 'src', 'process', 'resources', 'skills-library'));
  });

  it('works the same for the bundled-workflows resource', () => {
    const candidates = buildResourceDirCandidates(packagedBundleDir, undefined, 'bundled-workflows');
    expect(candidates).toContain(path.join(packagedResourcesDir, 'bundled-workflows'));
    for (const c of candidates) {
      expect(c).not.toContain('app.asar.unpacked.unpacked');
    }
  });
});
