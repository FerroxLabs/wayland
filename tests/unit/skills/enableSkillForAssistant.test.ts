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
  assistantDisplayName,
  enableSkillForAssistant,
  SMART_TRADER_ASSISTANT_ID,
  type EnableSkillIo,
} from '@process/services/skills/enableSkillForAssistant';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';

type Rec = { id?: string; name?: string; enabledSkills?: string[]; [k: string]: unknown };

/**
 * Models `ProcessConfig.update`: the mutator runs against the CURRENT state
 * inside the critical section, and a returned array identical to the input
 * counts as "no write". Deliberately not a get/set pair - that shape is what
 * allowed a stale snapshot to overwrite a concurrent edit.
 */
function io(seed: Rec[]): EnableSkillIo & { written: Rec[][]; state: () => Rec[] } {
  let state = seed;
  const written: Rec[][] = [];
  return {
    update: async (mutator) => {
      const next = mutator(state as never) as unknown as Rec[];
      if (next !== state) {
        written.push(next);
        state = next;
      }
    },
    written,
    state: () => state,
  };
}

describe('enableSkillForAssistant', () => {
  it('appends the skill to the named assistant and leaves every other field alone', async () => {
    const h = io([
      { id: 'builtin-other', name: 'Other', enabledSkills: ['a'] },
      {
        id: 'builtin-smart-trader',
        name: 'Smart Trader',
        enabledSkills: ['tvcontrol-setup'],
        avatar: 'x',
        enabled: true,
      },
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

  it('a concurrent edit made between read and write is NOT clobbered', async () => {
    // The defect this replaced: a get/set PAIR read `[A,B]`, the user changed
    // Settings to `[A,C]` during the IPC round trip, and the installer then
    // wrote its stale `[A+skill,B]` back - deleting C and resurrecting B.
    // Because the mutator now runs against CURRENT state inside the critical
    // section, the interleaving cannot lose the edit.
    let state: Rec[] = [
      { id: 'builtin-smart-trader', name: 'Smart Trader', enabledSkills: [] },
      { id: 'b', name: 'B' },
    ];
    const h: EnableSkillIo = {
      update: async (mutator) => {
        // The concurrent edit lands BEFORE our mutator runs, exactly as it
        // would when the queue serialises the two writers.
        state = [state[0], { id: 'c', name: 'C' }];
        state = mutator(state as never) as unknown as Rec[];
      },
    };

    expect(await enableSkillForAssistant('builtin-smart-trader', 'tide-morning-brief', h)).toBe(true);
    expect(state.map((a) => a.id)).toEqual(['builtin-smart-trader', 'c']);
    expect(state.find((a) => a.id === 'builtin-smart-trader')!.enabledSkills).toEqual(['tide-morning-brief']);
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

describe('assistantDisplayName', () => {
  /**
   * `enabledFor` carries an ID. `builtin-smart-trader` is not something to show
   * a buyer, and the import modal now tells them where their skill went - so
   * the label has to resolve, and has to fail soft when it cannot.
   */
  it('resolves the assistant name', async () => {
    const store = io([{ id: 'builtin-smart-trader', name: 'Smart Trader', enabledSkills: [] }]);
    await expect(assistantDisplayName('builtin-smart-trader', store)).resolves.toBe('Smart Trader');
  });

  it('reads without writing', async () => {
    const store = io([{ id: 'builtin-smart-trader', name: 'Smart Trader', enabledSkills: [] }]);
    await assistantDisplayName('builtin-smart-trader', store);
    expect(store.written).toEqual([]);
  });

  it('returns null for an assistant that does not exist', async () => {
    const store = io([{ id: 'builtin-concierge', name: 'Concierge', enabledSkills: [] }]);
    await expect(assistantDisplayName('nope', store)).resolves.toBeNull();
  });

  it('returns null rather than throwing when the store is unusable', async () => {
    // Losing the label must never cost the user the import.
    const broken: EnableSkillIo = {
      update: async () => {
        throw new Error('storage down');
      },
    };
    await expect(assistantDisplayName('builtin-smart-trader', broken)).resolves.toBeNull();
  });
});
