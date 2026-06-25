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
  // POSIX-style packaged layout used by the assertions below. The bundle lives
  // at Resources/app.asar.unpacked/out/main; the resource dir is at
  // Resources/skills-library (three levels up from out/main).
  const packagedBundleDir = '/Applications/Wayland.app/Contents/Resources/app.asar.unpacked/out/main';
  const realResourceDir = '/Applications/Wayland.app/Contents/Resources/skills-library';

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
    const resourcesPath = '/Applications/Wayland.app/Contents/Resources';
    const candidates = buildResourceDirCandidates(packagedBundleDir, resourcesPath, 'skills-library');
    expect(candidates[0]).toBe(path.join(resourcesPath, 'skills-library'));
  });

  it('collapses the electron-vite chunks subdir before resolving', () => {
    const chunksBundleDir = '/Applications/Wayland.app/Contents/Resources/app.asar.unpacked/out/main/chunks';
    const candidates = buildResourceDirCandidates(chunksBundleDir, undefined, 'skills-library');
    expect(candidates).toContain(realResourceDir);
    for (const c of candidates) {
      expect(c).not.toContain('app.asar.unpacked.unpacked');
    }
  });

  it('resolves the dev source-tree dir from out/main', () => {
    const devBundleDir = '/repo/app/out/main';
    const candidates = buildResourceDirCandidates(devBundleDir, undefined, 'skills-library');
    expect(candidates).toContain('/repo/app/src/process/resources/skills-library');
  });

  it('works the same for the bundled-workflows resource', () => {
    const candidates = buildResourceDirCandidates(packagedBundleDir, undefined, 'bundled-workflows');
    expect(candidates).toContain('/Applications/Wayland.app/Contents/Resources/bundled-workflows');
    for (const c of candidates) {
      expect(c).not.toContain('app.asar.unpacked.unpacked');
    }
  });
});
