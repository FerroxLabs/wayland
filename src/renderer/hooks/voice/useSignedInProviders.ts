/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * "Which providers is the user signed in to" signal for local-first cloud-voice
 * gating.
 *
 * The voice layer has NO auth of its own. It reuses the app's EXISTING single
 * sign-in / credential store: the model registry. This hook reads the live,
 * already-reactive provider snapshot from {@link useModelRegistry} (which is a
 * thin wrapper over `ipcBridge.modelRegistry.list()` and re-fetches on every
 * `modelRegistry.listChanged` event), and derives the set of provider ids the
 * user currently has working credentials for.
 *
 * EXISTING SOURCE READ (no new IPC, no parallel auth):
 *   `src/renderer/hooks/useModelRegistry.ts` → `providers: IModelRegistryProviderView[]`
 *   backed by `ipcBridge.modelRegistry.list` (`src/common/adapter/ipcBridge.ts:1960`).
 *   Each view carries `{ providerId, state, error }` where
 *   `state: 'connected' | 'testing' | 'error'`. The renderer can never read API
 *   keys directly (they never cross the process boundary), so "signed in" is
 *   derived purely from connection STATE — exactly as
 *   `useProviderReadiness.ts` already does.
 *
 * The resulting set feeds `availableVoiceModels(catalog, { platform,
 * signedInProviders })` in `src/common/voice/voiceModelCatalog.ts`, whose
 * `requiresProvider` strings are native provider ids: 'openai', 'deepgram',
 * 'elevenlabs', 'azure', 'groq'. Those ids match the model registry's
 * `providerId` 1:1, with one alias: a ChatGPT subscription sign-in is stored
 * under the `chatgpt-subscription` provider id, so it is mapped to 'openai'
 * here — voice options gated on 'openai' light up whether the user pasted an
 * OpenAI API key OR signed in with ChatGPT.
 */

import { useMemo } from 'react';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import type { IModelRegistryProviderView } from '@/common/adapter/ipcBridge';

/**
 * Provider ids that count as a given voice provider beyond their own id. The
 * key is the registry provider id; the value is the voice provider id it should
 * also satisfy. Currently only the ChatGPT-subscription → 'openai' alias.
 */
const PROVIDER_ALIASES: Readonly<Record<string, string>> = {
  'chatgpt-subscription': 'openai',
};

/**
 * A registry provider is "signed in" when it is connected (or mid-test) and
 * carries no blocking connect error. Mirrors `isWorkingProvider` in
 * `useProviderReadiness.ts`: `state: 'testing'` is transient — credentials
 * already exist — and only `state: 'error'` or a classified `error` excludes it.
 */
const isSignedIn = (p: IModelRegistryProviderView): boolean => p.state !== 'error' && p.error === undefined;

/**
 * Pure mapper: derive the set of signed-in voice-provider ids from a model
 * registry snapshot. Exported for unit testing — the hook is a thin reactive
 * wrapper over this.
 *
 * Each working provider contributes its own id plus any aliased id (e.g.
 * `chatgpt-subscription` also contributes `openai`).
 */
export const providersFromRegistry = (providers: readonly IModelRegistryProviderView[]): Set<string> => {
  const out = new Set<string>();
  for (const p of providers) {
    if (!isSignedIn(p)) continue;
    out.add(p.providerId);
    const alias = PROVIDER_ALIASES[p.providerId];
    if (alias) out.add(alias);
  }
  return out;
};

/**
 * Reactive set of provider ids the user is currently signed in to / has working
 * credentials for, derived from the existing model registry. Re-derives whenever
 * the registry snapshot changes (connect / disconnect / refresh), so the voice
 * picker can gate cloud options live.
 */
export const useSignedInProviders = (): ReadonlySet<string> => {
  const { providers } = useModelRegistry();
  return useMemo(() => providersFromRegistry(providers), [providers]);
};

export default useSignedInProviders;
