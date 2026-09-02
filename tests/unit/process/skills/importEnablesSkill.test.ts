/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * An imported skill must be SWITCHED ON, not merely registered.
 *
 * Registering and enabling are different things and only the second one makes a
 * skill reachable from a chat: an assistant sees exactly what is in its own
 * `enabledSkills`. Import did the first and not the second, and the failure was
 * silent in the worst way - the pack installed, the UI said so, and the very
 * next message could not see it. Measured live on a fresh profile: the engine
 * logged `Discovered 0 optional skills` and the model went looking for a Skill
 * tool that had no TC-TIDE in it.
 *
 * The assistant is resolved the SAME way the composer resolves it
 * (`useGuidAgentSelection.restoreSavedSelection`). Enabling a skill for an
 * assistant the user is not in is invisible in exactly the same way as enabling
 * it for nobody, so any divergence from that function re-opens this bug.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, unknown>();

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: async (key: string) => store.get(key),
    set: async (key: string, value: unknown) => void store.set(key, value),
    update: async (key: string, mutator: (current: unknown) => unknown | Promise<unknown>) => {
      store.set(key, await mutator(store.get(key)));
    },
  },
}));

const { enableSkillForCurrentAssistant, resolveCurrentAssistantId, enableSkillForAssistant } =
  await import('@process/services/skills/enableSkillForAssistant');

const assistants = () => [
  { id: 'builtin-concierge', name: 'Concierge', enabledSkills: ['concierge'] },
  { id: 'builtin-smart-trader', name: 'Smart Trader', enabledSkills: ['tvcontrol-setup'] },
];

beforeEach(() => {
  store.clear();
  store.set('assistants', assistants());
});

describe('resolveCurrentAssistantId mirrors the composer', () => {
  it('uses the selected preset assistant', async () => {
    store.set('guid.lastSelectedAgent', 'custom:builtin-smart-trader');
    expect(await resolveCurrentAssistantId()).toBe('builtin-smart-trader');
  });

  it('falls back to Concierge on a fresh profile, exactly as the composer does', async () => {
    // Nothing saved. This is the state a buyer is in, and it is why an import
    // that enabled nothing left the skill unreachable from their first chat.
    expect(await resolveCurrentAssistantId()).toBe('builtin-concierge');
  });

  it('honours a user who turned the Concierge default off', async () => {
    store.set('concierge.defaultPersona', false);
    expect(await resolveCurrentAssistantId()).toBeNull();
  });

  it('returns null for a plain BACKEND key, which names an engine and not an assistant', async () => {
    // `wcore` / `gemini` are engines. Treating one as an assistant id would
    // write a skill onto a record that does not exist.
    store.set('guid.lastSelectedAgent', 'wcore');
    expect(await resolveCurrentAssistantId()).toBeNull();
  });
});

describe('enableSkillForCurrentAssistant', () => {
  it('switches the skill on for the selected assistant, keeping what was there', async () => {
    store.set('guid.lastSelectedAgent', 'custom:builtin-smart-trader');
    expect(await enableSkillForCurrentAssistant('tide-morning-brief')).toBe('builtin-smart-trader');
    const st = (store.get('assistants') as Array<{ id: string; enabledSkills: string[] }>).find(
      (a) => a.id === 'builtin-smart-trader'
    );
    // APPEND ONLY - a user's curation must survive an install.
    expect(st?.enabledSkills).toEqual(['tvcontrol-setup', 'tide-morning-brief']);
  });

  it('leaves every other assistant untouched', async () => {
    store.set('guid.lastSelectedAgent', 'custom:builtin-smart-trader');
    await enableSkillForCurrentAssistant('tide-morning-brief');
    const c = (store.get('assistants') as Array<{ id: string; enabledSkills: string[] }>).find(
      (a) => a.id === 'builtin-concierge'
    );
    expect(c?.enabledSkills).toEqual(['concierge']);
  });

  it('is idempotent - a re-import cannot duplicate the entry', async () => {
    store.set('guid.lastSelectedAgent', 'custom:builtin-smart-trader');
    await enableSkillForCurrentAssistant('tide-morning-brief');
    await enableSkillForCurrentAssistant('tide-morning-brief');
    const st = (store.get('assistants') as Array<{ id: string; enabledSkills: string[] }>).find(
      (a) => a.id === 'builtin-smart-trader'
    );
    expect(st?.enabledSkills).toEqual(['tvcontrol-setup', 'tide-morning-brief']);
  });

  it('returns null and writes nothing when there is no assistant to attach to', async () => {
    store.set('guid.lastSelectedAgent', 'wcore');
    const before = JSON.stringify(store.get('assistants'));
    expect(await enableSkillForCurrentAssistant('tide-morning-brief')).toBeNull();
    expect(JSON.stringify(store.get('assistants'))).toBe(before);
  });

  it('never invents an assistant for an id that does not exist', async () => {
    store.set('guid.lastSelectedAgent', 'custom:builtin-does-not-exist');
    expect(await enableSkillForCurrentAssistant('tide-morning-brief')).toBeNull();
    expect((store.get('assistants') as unknown[]).length).toBe(2);
  });

  it('never throws into the import path', async () => {
    // The skill is on disk and registered by this point; losing the convenience
    // must never cost the user the pack.
    store.set('assistants', 'not-an-array');
    await expect(enableSkillForCurrentAssistant('tide-morning-brief')).resolves.toBeNull();
  });
});

describe('the underlying single-assistant write is unchanged', () => {
  it('still reports false for an unknown assistant', async () => {
    expect(await enableSkillForAssistant('nope', 'tide-morning-brief')).toBe(false);
  });
});
