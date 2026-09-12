/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  FUIGO_CUTOVER_MIGRATION_KEY,
  runFuigoCutoverConfigMigration,
  type FuigoCutoverConfigStore,
} from '@process/utils/migrations/fuigoCutoverConfigMigration';

/** In-memory store with the same get/set/remove surface as the JSON config file. */
function makeStore(initial: Record<string, unknown>) {
  const data: Record<string, unknown> = { ...initial };
  const writes: Array<[string, unknown]> = [];
  const removals: string[] = [];
  const store: FuigoCutoverConfigStore = {
    get: (async (key: string) => data[key]) as FuigoCutoverConfigStore['get'],
    set: (async (key: string, value: unknown) => {
      data[key] = value;
      writes.push([key, value]);
      return value;
    }) as FuigoCutoverConfigStore['set'],
    remove: async (key: string) => {
      delete data[key];
      removals.push(key);
      return data;
    },
  };
  return { store, data, writes, removals };
}

describe('runFuigoCutoverConfigMigration', () => {
  it('copies the retired Core default model to fuigo.defaultModel when Fuigo has none, then removes the Core key', async () => {
    const { store, data, removals } = makeStore({
      'wcore.defaultModel': { id: 'flux-router', useModel: 'flux-auto', accountId: 'acct-1' },
    });

    await runFuigoCutoverConfigMigration(store);

    expect(data['fuigo.defaultModel']).toEqual({ id: 'flux-router', useModel: 'flux-auto', accountId: 'acct-1' });
    expect(data['wcore.defaultModel']).toBeUndefined();
    expect(removals).toEqual(['wcore.defaultModel']);
    expect(data[FUIGO_CUTOVER_MIGRATION_KEY]).toBe(true);
  });

  it('never overwrites a Fuigo default the user already set', async () => {
    const { store, data } = makeStore({
      'wcore.defaultModel': { id: 'openai', useModel: 'gpt-5.5' },
      'fuigo.defaultModel': { id: 'anthropic', useModel: 'claude-sonnet-4.6' },
    });

    await runFuigoCutoverConfigMigration(store);

    expect(data['fuigo.defaultModel']).toEqual({ id: 'anthropic', useModel: 'claude-sonnet-4.6' });
    expect(data['wcore.defaultModel']).toBeUndefined();
  });

  it('ignores a malformed Core default rather than minting a broken Fuigo default', async () => {
    const { store, data } = makeStore({ 'wcore.defaultModel': 'gpt-5.5' });

    await runFuigoCutoverConfigMigration(store);

    expect(data['fuigo.defaultModel']).toBeUndefined();
    expect(data['wcore.defaultModel']).toBeUndefined();
  });

  it.each(['wcore', 'wnano', 'nanobot', 'wayland-core'])(
    'rewrites guid.lastSelectedAgent=%s to fuigo so a returning user does not land on a retired engine',
    async (retired) => {
      const { store, data } = makeStore({ 'guid.lastSelectedAgent': retired });

      await runFuigoCutoverConfigMigration(store);

      expect(data['guid.lastSelectedAgent']).toBe('fuigo');
    }
  );

  it('re-points persisted assistants whose default engine was retired, leaving the rest alone', async () => {
    const { store, data } = makeStore({
      assistants: [
        { id: 'builtin-concierge', name: 'Concierge', presetAgentType: 'wcore', enabled: true },
        { id: 'builtin-ignition', name: 'Ignition', presetAgentType: 'wnano', enabled: true },
        { id: 'builtin-cowork', name: 'Cowork', presetAgentType: 'claude', enabled: true },
      ],
    });

    await runFuigoCutoverConfigMigration(store);

    expect(data.assistants as Array<{ id: string; presetAgentType: string; enabled: boolean }>).toEqual([
      { id: 'builtin-concierge', name: 'Concierge', presetAgentType: 'fuigo', enabled: true },
      { id: 'builtin-ignition', name: 'Ignition', presetAgentType: 'fuigo', enabled: true },
      { id: 'builtin-cowork', name: 'Cowork', presetAgentType: 'claude', enabled: true },
    ]);
  });

  it('does not rewrite the assistants list when no row names a retired engine', async () => {
    const { store, writes } = makeStore({
      assistants: [{ id: 'builtin-cowork', name: 'Cowork', presetAgentType: 'claude', enabled: true }],
    });

    await runFuigoCutoverConfigMigration(store);

    expect(writes.map(([key]) => key)).toEqual([FUIGO_CUTOVER_MIGRATION_KEY]);
  });

  it('leaves a last-selected agent that still exists untouched', async () => {
    const { store, data, writes } = makeStore({ 'guid.lastSelectedAgent': 'claude' });

    await runFuigoCutoverConfigMigration(store);

    expect(data['guid.lastSelectedAgent']).toBe('claude');
    expect(writes.map(([key]) => key)).toEqual([FUIGO_CUTOVER_MIGRATION_KEY]);
  });

  it('runs once: a second boot with a retired agent re-persisted is not rewritten again', async () => {
    const { store, data, writes } = makeStore({
      [FUIGO_CUTOVER_MIGRATION_KEY]: true,
      'guid.lastSelectedAgent': 'wcore',
    });

    await runFuigoCutoverConfigMigration(store);

    expect(data['guid.lastSelectedAgent']).toBe('wcore');
    expect(writes).toEqual([]);
  });

  it('does nothing but mark itself done on a fresh profile', async () => {
    const { store, data, writes, removals } = makeStore({});

    await runFuigoCutoverConfigMigration(store);

    expect(writes).toEqual([[FUIGO_CUTOVER_MIGRATION_KEY, true]]);
    expect(removals).toEqual([]);
    expect(data['fuigo.defaultModel']).toBeUndefined();
  });
});
