/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-shot config migration for the Fuigo cutover.
 *
 * Wayland Core and Wayland Nano left Desktop; Fuigo is the only bundled
 * engine. Two persisted preferences would otherwise keep a returning user on
 * an engine that no longer exists:
 *
 *  - `wcore.defaultModel` - the model pick made for Core (onboarding / the
 *    Concierge `set_default_model` proposal). Copied to `fuigo.defaultModel`
 *    when the latter is unset, so the pick survives the engine swap. Then the
 *    Core key is removed; nothing reads it any more.
 *  - `guid.lastSelectedAgent` - the renderer re-applies it on the new-chat
 *    page, so a value naming a retired engine would land every returning Core
 *    user back on a picker entry that cannot spawn until they click New Chat.
 *    Rewritten to `fuigo`.
 *  - `assistants[].presetAgentType` - the per-assistant default engine, which
 *    the built-in presets used to seed as `wcore` and which is persisted as a
 *    user-controlled field. Rewritten to `fuigo` where it names a retired
 *    engine.
 *
 * Idempotent: gated on `migration.fuigoCutover`. Pure over the injected store
 * so it is unit-testable without files.
 */

import type { IConfigStorageRefer } from '@/common/config/storage';

export const FUIGO_CUTOVER_MIGRATION_KEY = 'migration.fuigoCutover';

/** Every persisted id that used to name the retired engines. */
export const RETIRED_ENGINE_IDS: ReadonlySet<string> = new Set(['wcore', 'wayland-core', 'wnano', 'nanobot']);

/** Legacy Core keys the migration reads before removing. Deliberately untyped: the keys are gone from the store's type. */
const LEGACY_DEFAULT_MODEL_KEY = 'wcore.defaultModel';

export type FuigoCutoverConfigStore = {
  get<K extends keyof IConfigStorageRefer>(key: K): Promise<IConfigStorageRefer[K] | undefined>;
  set<K extends keyof IConfigStorageRefer>(key: K, value: IConfigStorageRefer[K]): Promise<unknown>;
  remove?(key: string): Promise<unknown>;
};

type DefaultModel = NonNullable<IConfigStorageRefer['fuigo.defaultModel']>;

function isDefaultModel(value: unknown): value is DefaultModel {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as DefaultModel).id === 'string' &&
    typeof (value as DefaultModel).useModel === 'string'
  );
}

export async function runFuigoCutoverConfigMigration(store: FuigoCutoverConfigStore): Promise<void> {
  const done = await store.get(FUIGO_CUTOVER_MIGRATION_KEY).catch(() => false);
  if (done) return;

  const legacyGet = store.get as unknown as (key: string) => Promise<unknown>;
  const legacyDefault = await legacyGet.call(store, LEGACY_DEFAULT_MODEL_KEY).catch((): undefined => undefined);
  const fuigoDefault = await store.get('fuigo.defaultModel').catch((): undefined => undefined);
  if (!fuigoDefault && isDefaultModel(legacyDefault)) {
    await store.set('fuigo.defaultModel', {
      id: legacyDefault.id,
      useModel: legacyDefault.useModel,
      ...(legacyDefault.accountId ? { accountId: legacyDefault.accountId } : {}),
    });
  }
  if (legacyDefault !== undefined && store.remove) {
    await store.remove(LEGACY_DEFAULT_MODEL_KEY);
  }

  const lastAgent = await store.get('guid.lastSelectedAgent').catch((): undefined => undefined);
  if (typeof lastAgent === 'string' && RETIRED_ENGINE_IDS.has(lastAgent)) {
    await store.set('guid.lastSelectedAgent', 'fuigo');
  }

  const assistants = await store.get('assistants').catch((): undefined => undefined);
  if (Array.isArray(assistants) && assistants.some((a) => RETIRED_ENGINE_IDS.has(String(a?.presetAgentType)))) {
    await store.set(
      'assistants',
      assistants.map((a) =>
        RETIRED_ENGINE_IDS.has(String(a?.presetAgentType)) ? { ...a, presetAgentType: 'fuigo' } : a
      )
    );
  }

  await store.set(FUIGO_CUTOVER_MIGRATION_KEY, true);
}
