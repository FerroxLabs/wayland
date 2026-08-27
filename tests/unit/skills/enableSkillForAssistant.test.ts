/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The `enabledSkills` mutator.
 *
 * Nothing in MAIN mutated `enabledSkills` before this, so there is no prior art
 * to lean on and every property below is asserted rather than assumed. The
 * dangerous shape is a read-modify-write of the WHOLE assistants array: get one
 * spread wrong and an install silently rewrites a user's curated config.
 */

import { describe, it, expect } from 'vitest';
import {
  enableSkillForAssistant,
  SMART_TRADER_ASSISTANT_ID,
  type EnableSkillIo,
} from '@process/services/skills/enableSkillForAssistant';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';

type Rec = { id?: string; name?: string; enabledSkills?: string[]; [k: string]: unknown };

function io(seed: Rec[]): EnableSkillIo & { written: Rec[][]; state: () => Rec[] } {
  let state = seed;
  const written: Rec[][] = [];
  return {
    getAssistants: async () => state as never,
    setAssistants: async (next) => {
      written.push(next as Rec[]);
      state = next as Rec[];
    },
    written,
    state: () => state,
  };
}

describe('enableSkillForAssistant', () => {
  it('appends the skill to the named assistant and leaves every other field alone', async () => {
    const h = io([
      { id: 'builtin-other', name: 'Other', enabledSkills: ['a'] },
      { id: 'builtin-smart-trader', name: 'Smart Trader', enabledSkills: ['tvcontrol-setup'], avatar: 'x', enabled: true },
    ]);

    expect(await enableSkillForAssistant('builtin-smart-trader', 'tide-morning-brief', h)).toBe(true);

    const target = h.state().find((a) => a.id === 'builtin-smart-trader')!;
    expect(target.enabledSkills).toEqual(['tvcontrol-setup', 'tide-morning-brief']);
    // Neighbouring fields survive the read-modify-write.
    expect(target.name).toBe('Smart Trader');
    expect(target.avatar).toBe('x');
    expect(target.enabled).toBe(true);
    // ...and the OTHER assistant is untouched, including its own skills.
    expect(h.state().find((a) => a.id === 'builtin-other')).toEqual({
      id: 'builtin-other',
      name: 'Other',
      enabledSkills: ['a'],
    });
  });

  it('never removes or reorders what the user already enabled', async () => {
    const h = io([{ id: 'a1', name: 'A', enabledSkills: ['keep-me', 'and-me', 'me-too'] }]);
    await enableSkillForAssistant('a1', 'new-one', h);
    expect(h.state()[0].enabledSkills).toEqual(['keep-me', 'and-me', 'me-too', 'new-one']);
  });

  it('is idempotent AND does not write at all when the skill is already on', async () => {
    // The no-write half matters: a re-install must not churn the config file,
    // and must not be able to duplicate an entry.
    const h = io([{ id: 'a1', name: 'A', enabledSkills: ['already'] }]);
    expect(await enableSkillForAssistant('a1', 'already', h)).toBe(true);
    expect(h.written).toHaveLength(0);
    expect(h.state()[0].enabledSkills).toEqual(['already']);
  });

  it('handles an assistant that has no enabledSkills array yet', async () => {
    const h = io([{ id: 'a1', name: 'A' }]);
    expect(await enableSkillForAssistant('a1', 'first', h)).toBe(true);
    expect(h.state()[0].enabledSkills).toEqual(['first']);
  });

  it('REFUSES an unknown assistant rather than creating one', async () => {
    // A typo'd id must not conjure a half-formed record into the config, where
    // it would show up in the Assistants list as a broken entry.
    const h = io([{ id: 'a1', name: 'A', enabledSkills: [] }]);
    expect(await enableSkillForAssistant('nope', 'x', h)).toBe(false);
    expect(h.written).toHaveLength(0);
    expect(h.state()).toEqual([{ id: 'a1', name: 'A', enabledSkills: [] }]);
  });

  it('the shipped constant matches a REAL preset, under the real builtin- prefix', async () => {
    // Guards the one thing the unit tests above cannot: that the id the apply
    // path uses corresponds to an assistant that actually ships. A wrong value
    // fails CLOSED and silently - the pack installs and is never switched on -
    // so it is tied to the preset list here rather than eyeballed.
    const preset = ASSISTANT_PRESETS.find((p) => `builtin-${p.id}` === SMART_TRADER_ASSISTANT_ID);
    expect(preset, `no shipped preset yields ${SMART_TRADER_ASSISTANT_ID}`).toBeTruthy();
    expect(preset!.id).toBe('smart-trader');

    const h = io([{ id: SMART_TRADER_ASSISTANT_ID, name: 'Smart Trader' }]);
    expect(await enableSkillForAssistant(SMART_TRADER_ASSISTANT_ID, 'tide-morning-brief', h)).toBe(true);
  });
});
