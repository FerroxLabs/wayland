/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Guards the curated skill sets attached to broken-doer specialists
// (2026-05-31). The 25 agent-profiles ran on persona prompt with ZERO skills
// before this; the 22 quiet-money/thin specialists were empty or under-equipped.
// A skill slug that isn't a real library entry silently no-ops at the workspace
// symlink step - this test fails loudly instead so a typo can't ship.

import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../../..');
const index = JSON.parse(
  readFileSync(path.join(ROOT, 'src/process/resources/skills-library/index.json'), 'utf-8')
) as Array<{ name: string; type?: string; security?: { verdict?: string } }>;
const validSkills = new Set(
  index.filter((e) => e.type === 'skill' && e.security?.verdict !== 'blocked').map((e) => e.name)
);

const agentProfileSkills = JSON.parse(
  readFileSync(path.join(ROOT, 'src/process/extensions/data/bundle-vendored/agentProfileSkills.json'), 'utf-8')
) as Record<string, string[]>;
const assistants = JSON.parse(
  readFileSync(path.join(ROOT, 'src/process/extensions/data/bundle-vendored/assistants.json'), 'utf-8')
) as Array<{ id?: string; appId?: string; name?: string; kind?: string; enabledSkills?: string[] }>;

describe('agent-profile curated skills', () => {
  it('covers all 25 agent-profiles', () => {
    const profiles = index.filter((e) => e.type === 'agent-profile').map((e) => e.name);
    for (const p of profiles) {
      expect(agentProfileSkills[p], `agent-profile '${p}' has no curated skill set`).toBeDefined();
    }
  });

  it('every curated skill resolves to a real, non-blocked library skill', () => {
    for (const [profile, skills] of Object.entries(agentProfileSkills)) {
      for (const slug of skills) {
        expect(validSkills.has(slug), `${profile}: '${slug}' is not a valid library skill`).toBe(true);
      }
    }
  });

  it('each set is a sensible size with no duplicates', () => {
    for (const [profile, skills] of Object.entries(agentProfileSkills)) {
      expect(skills.length, `${profile} has too few skills`).toBeGreaterThanOrEqual(6);
      expect(skills.length, `${profile} has too many skills`).toBeLessThanOrEqual(12);
      expect(new Set(skills).size, `${profile} has duplicate skills`).toBe(skills.length);
    }
  });
});

describe('quiet-money + thin specialists (assistants.json)', () => {
  // These specialists were 0-skill (quiet-money) or thin-at-3 before the fix.
  const QUIET_MONEY = [
    'quiet-money',
    'quiet-money-position-auditor',
    'quiet-money-career-strategist',
    'quiet-money-spending-auditor',
    'quiet-money-windfall-navigator',
    'quiet-money-generational-planner',
    'quiet-money-time-coach',
  ];

  it('every quiet-money specialist now has a non-empty curated skill set', () => {
    for (const id of QUIET_MONEY) {
      const a = assistants.find((x) => (x.id ?? x.appId ?? x.name) === id);
      expect(a, `specialist '${id}' not found in assistants.json`).toBeDefined();
      expect(a!.enabledSkills?.length ?? 0, `'${id}' is still skill-less`).toBeGreaterThanOrEqual(6);
    }
  });

  it('no specialist (kind:specialist) is left with an empty skill set', () => {
    const empties = assistants
      .filter((a) => a.kind === 'specialist' && (a.enabledSkills?.length ?? 0) === 0)
      .map((a) => a.id ?? a.appId ?? a.name);
    expect(empties, `specialists with zero skills: ${empties.join(', ')}`).toEqual([]);
  });
});
