/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// #502: packaged builds pack vendored bodies into skill-bodies.bin +
// skill-bodies.offsets.json and ship no loose bodies/ tree (see SkillPack.ts).
// `mergeVendoredAgentProfiles` used to resolve bodies via a loose
// `readFileSync(bodies/<path>)` only, so every packaged vendored agent-profile
// landed with an empty `context`/`prompts.system`. This confirms the packed
// blob is now used as a fallback when the loose file is absent.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  mergeVendoredAgentProfiles,
  __resetAgentProfileMergeCacheForTests,
} from '@process/extensions/data/bundle-vendored/agentProfileMerge';
import { buildSkillPack } from '@process/services/skills/SkillPack';

function setResourcesPath(value: string | undefined): void {
  Object.defineProperty(process, 'resourcesPath', { value, configurable: true });
}

describe('mergeVendoredAgentProfiles', () => {
  let resourcesRoot: string | null = null;
  const originalResourcesPath = process.resourcesPath;

  beforeEach(() => {
    __resetAgentProfileMergeCacheForTests();
  });

  afterEach(() => {
    setResourcesPath(originalResourcesPath);
    if (resourcesRoot) {
      rmSync(resourcesRoot, { recursive: true, force: true });
      resourcesRoot = null;
    }
    __resetAgentProfileMergeCacheForTests();
  });

  it('resolves a vendored agent-profile body from the packed blob when no loose bodies/ file exists', async () => {
    resourcesRoot = mkdtempSync(path.join(tmpdir(), 'agent-profile-merge-'));
    const libDir = path.join(resourcesRoot, 'skills-library');
    mkdirSync(libDir, { recursive: true });

    const relPath = 'agent-profiles/test-profile/SKILL.md';
    writeFileSync(
      path.join(libDir, 'index.json'),
      JSON.stringify([
        {
          name: 'test-profile',
          type: 'agent-profile',
          description: 'A test agent-profile',
          path: relPath,
          metadata: { category: 'engineering' },
        },
      ]),
      'utf-8'
    );
    // Stage the loose body only long enough for buildSkillPack to read it -
    // packaged builds never ship this directory, which is exactly the bug.
    mkdirSync(path.join(libDir, 'bodies', 'agent-profiles', 'test-profile'), { recursive: true });
    writeFileSync(path.join(libDir, 'bodies', relPath), '# Test Profile\nSome rules.', 'utf-8');

    await buildSkillPack(libDir, libDir);
    rmSync(path.join(libDir, 'bodies'), { recursive: true, force: true });

    // Point the resolver at our fixture the same way the packaged main
    // process would (buildResourceDirCandidates prefers `resourcesPath`).
    setResourcesPath(resourcesRoot);

    const merged = mergeVendoredAgentProfiles([]);
    const profile = merged.find((a) => a.id === 'test-profile');

    expect(profile).toBeDefined();
    expect(profile?.context).toBe('# Test Profile\nSome rules.');
    expect((profile?.prompts as { system?: string } | undefined)?.system).toBe('# Test Profile\nSome rules.');
  });

  it('falls back to an empty body without throwing when neither loose file nor pack has the entry', async () => {
    resourcesRoot = mkdtempSync(path.join(tmpdir(), 'agent-profile-merge-empty-'));
    const libDir = path.join(resourcesRoot, 'skills-library');
    mkdirSync(libDir, { recursive: true });
    writeFileSync(
      path.join(libDir, 'index.json'),
      JSON.stringify([
        {
          name: 'no-body-profile',
          type: 'agent-profile',
          description: 'No body anywhere',
          path: 'agent-profiles/no-body/SKILL.md',
          metadata: { category: 'engineering' },
        },
      ]),
      'utf-8'
    );

    setResourcesPath(resourcesRoot);

    const merged = mergeVendoredAgentProfiles([]);
    const profile = merged.find((a) => a.id === 'no-body-profile');

    expect(profile).toBeDefined();
    expect(profile?.context).toBe('');
  });
});
