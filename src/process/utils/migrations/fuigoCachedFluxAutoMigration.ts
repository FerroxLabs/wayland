/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-shot: forget the `flux-auto` Fuigo reported as its own default.
 *
 * `acp.cachedModels.fuigo.currentModelId` is written once, from the first Fuigo
 * session's snapshot, and then preserved (`AcpAgent.doCacheSessionCapabilities`).
 * A new chat that named no model got the engine's default, so the cache reads
 * `flux-auto` on every profile that ever opened one - and the new-chat picker,
 * teams and workflows read that cache as the default for every future chat.
 *
 * The cache is never a record of a choice: an explicit pick lives in
 * `acp.config.fuigo.preferredModelId` / `fuigo.defaultModel`, which this leaves
 * alone. Only the current-model fields are cleared; the catalog is kept.
 *
 * Idempotent: gated on `migration.fuigoCachedFluxAutoCleared`.
 */

import type { IConfigStorageRefer } from '@/common/config/storage';
import { FLUX_AUTO_MODEL } from '@/common/config/flux';

export const FUIGO_CACHED_FLUX_AUTO_MIGRATION_KEY = 'migration.fuigoCachedFluxAutoCleared';

export type FuigoCachedFluxAutoConfigStore = {
  get<K extends keyof IConfigStorageRefer>(key: K): Promise<IConfigStorageRefer[K] | undefined>;
  set<K extends keyof IConfigStorageRefer>(key: K, value: IConfigStorageRefer[K]): Promise<unknown>;
};

export async function runFuigoCachedFluxAutoMigration(store: FuigoCachedFluxAutoConfigStore): Promise<void> {
  const done = await store.get(FUIGO_CACHED_FLUX_AUTO_MIGRATION_KEY).catch(() => false);
  if (done) return;

  const cached = await store.get('acp.cachedModels').catch((): undefined => undefined);
  const fuigo = cached?.fuigo;
  if (cached && fuigo?.currentModelId === FLUX_AUTO_MODEL) {
    await store.set('acp.cachedModels', {
      ...cached,
      fuigo: { ...fuigo, currentModelId: null, currentModelLabel: null },
    });
  }

  await store.set(FUIGO_CACHED_FLUX_AUTO_MIGRATION_KEY, true);
}
