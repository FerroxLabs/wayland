/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { ipcBridge } from '@/common';
import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import { ConfigStorage } from '@/common/config/storage';
import { DEFAULT_ACCOUNT_ID, resolveAccountId } from '@/common/config/account';
import { uuid } from '@/common/utils';
import { MARQUEE_DEFAULT_RULES } from '@renderer/utils/model/marquee';
import { useGeminiGoogleAuthModels } from '@/renderer/hooks/agent/useGeminiGoogleAuthModels';
import { hasAvailableModels } from '../utils/modelUtils';
import { isFluxModelId } from '@/common/config/flux';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';

/**
 * Build a unique key for a provider/model pair.
 */
const buildModelKey = (providerId?: string, modelName?: string) => {
  if (!providerId || !modelName) return null;
  return `${providerId}:${modelName}`;
};

/**
 * Check if a model key still exists in the provider list.
 *
 * Matches by `${id}:${model}` OR `${platform}:${model}` - the home picker
 * writes a `ProviderId` (e.g. `'openai'`) into the saved `id`, while the
 * legacy `model.config` row exposes the matching `platform` field. Without
 * the platform match a registry-keyed pick looks "unavailable" on every
 * reload and the hook resets to `modelList[0]` (Wave 3 Fix 11).
 */
const isModelKeyAvailable = (key: string | null, providers?: IProvider[]) => {
  if (!key || !providers || providers.length === 0) return false;
  return providers.some((provider) => {
    if (!provider.model?.length) return false;
    return provider.model.some((modelName) => {
      if (provider.id && buildModelKey(provider.id, modelName) === key) return true;
      if (provider.platform && buildModelKey(provider.platform, modelName) === key) return true;
      return false;
    });
  });
};

/**
 * Models the user almost certainly did not mean to make their standing
 * default on a cold start (preview / experimental / dated betas). `antigravity`
 * is listed explicitly: it's a preview product whose model id does not always
 * carry the word "preview", and the user flagged it as not a sensible default.
 * A model the user actively picked is always honored via telemetry, even if it
 * matches this pattern - this only demotes a pin nobody chose.
 */
const EXPERIMENTAL_MODEL_PATTERN = /\b(preview|experimental|exp|nightly|alpha|beta|antigravity)\b/i;
const isLikelyExperimentalModel = (modelName: string): boolean => EXPERIMENTAL_MODEL_PATTERN.test(modelName);

/**
 * A whole provider the user almost certainly did not mean as their standing
 * default - e.g. the legacy `antigravity` preview provider whose own model
 * names don't always carry "preview", so a per-model check alone misses it.
 * Guards the provider's `platform` and display `name`.
 */
export const isExperimentalProvider = (provider: { platform?: string; name?: string }): boolean =>
  EXPERIMENTAL_MODEL_PATTERN.test(provider.platform ?? '') || EXPERIMENTAL_MODEL_PATTERN.test(provider.name ?? '');

type UsageModel = { modelId: string; useCount: number; lastUsedMs: number };
type ModelChoice = { provider: IProvider; useModel: string; accountId?: string };

/**
 * Registry-bridge tag prefix stamped on every mirrored `model.config` row
 * (`v2:${registryProviderId}`). Hardcoded rather than imported because this
 * renderer hook must not reach into @process.
 */
const V2_BRIDGE_PREFIX = 'v2:';
const bridgeTagOf = (provider: IProvider): string | undefined => {
  const tag = (provider as unknown as Record<string, unknown>).__waylandModelRegistryBridge;
  return typeof tag === 'string' ? tag : undefined;
};

/** The ChatGPT-subscription provider row (`v2:chatgpt-subscription`). */
const CHATGPT_SUBSCRIPTION_BRIDGE_TAG = `${V2_BRIDGE_PREFIX}chatgpt-subscription`;
const isChatGptSubscriptionProvider = (provider: IProvider): boolean =>
  bridgeTagOf(provider) === CHATGPT_SUBSCRIPTION_BRIDGE_TAG;

/**
 * The auto-registered local Ollama daemon (`v2:ollama-local`). It is the one
 * provider the app connects on the user's behalf without being asked, it lands
 * first in `model.config`, and its models are small local builds that cannot
 * drive an agent turn - so it must never win an AUTOMATIC default over a
 * connected Flux Router. A model the user actually picked is unaffected: that
 * arrives through usage telemetry, which ranks above this rule.
 */
const LOCAL_DAEMON_BRIDGE_TAG = `${V2_BRIDGE_PREFIX}ollama-local`;
export const isLocalDaemonProvider = (provider: IProvider): boolean =>
  bridgeTagOf(provider) === LOCAL_DAEMON_BRIDGE_TAG;

/**
 * The provider that owns `modelId`. Prefer the ChatGPT-subscription provider
 * (OAuth, no per-token cost) when it also lists the id, so a recently-used /
 * frequent bare id (e.g. `gpt-5.5`) is not hijacked by a metered look-alike
 * (direct OpenAI / OpenRouter) that merely lists the same id first in
 * `model.config` and bills there - the same #555 anti-hijack the team resolver
 * (TeamSessionService.resolveOwningProviderModelById) already applies. Telemetry
 * stores a BARE model id with no provider identity, so without this preference
 * the default resolver could bind the subscription's model to the disabled /
 * metered OpenAI provider.
 */
const providerForModelId = (modelList: IProvider[], modelId: string): IProvider | undefined => {
  const owns = (p: IProvider): boolean => p.model?.includes(modelId) === true && p.modelEnabled?.[modelId] !== false;
  return modelList.find((p) => owns(p) && isChatGptSubscriptionProvider(p)) ?? modelList.find(owns);
};

/**
 * First usage entry (in the order given) whose model still exists in the
 * provider list. Telemetry `modelId` is the model name as it appears in a
 * provider's `model[]` array - the same string `guid.model_selected` records.
 */
const resolveUsageMatch = (modelList: IProvider[], usage: UsageModel[]): ModelChoice | null => {
  for (const u of usage) {
    const provider = providerForModelId(modelList, u.modelId);
    if (provider) return { provider, useModel: u.modelId };
  }
  return null;
};

/**
 * First non-experimental model from a non-experimental provider. Skips whole
 * experimental providers (e.g. legacy `antigravity`) so a dead preview provider
 * can never win the cold-start default. Falls back to any non-experimental
 * provider's first model, then finally `modelList[0]` so we always return
 * something when only experimental providers exist.
 */
export const resolveSafeDefault = (modelList: IProvider[]): ModelChoice | null => {
  const realProviders = modelList.filter((p) => !isExperimentalProvider(p));
  // Prefer a marquee model (Claude / Gemini / GPT / DeepSeek / Kimi) so a small
  // open model like `allam-2-7b` can never become the cold-start default just
  // because its provider happens to sort first in the list.
  for (const rule of MARQUEE_DEFAULT_RULES) {
    for (const provider of realProviders) {
      if (!rule.platform.test(provider.platform ?? '') && !rule.platform.test(provider.name ?? '')) continue;
      const model = provider.model?.find((m) => rule.model.test(m) && !isLikelyExperimentalModel(m));
      if (model) return { provider, useModel: model };
    }
  }
  for (const provider of realProviders) {
    const safeModel = provider.model?.find((m) => !isLikelyExperimentalModel(m));
    if (safeModel) return { provider, useModel: safeModel };
  }
  const firstReal = realProviders.find((p) => p.model?.[0]);
  if (firstReal?.model?.[0]) return { provider: firstReal, useModel: firstReal.model[0] };
  const first = modelList[0];
  return first?.model?.[0] ? { provider: first, useModel: first.model[0] } : null;
};

/**
 * Flux Router's Autopilot model. When connected, it is the recommended
 * cold-start default - but only below real usage signals, so a user who has
 * actually picked something keeps their choice.
 */
const FLUX_AUTO_MODEL = 'flux-auto';
export const resolveFluxAuto = (modelList: IProvider[]): ModelChoice | null => {
  const provider = modelList.find((p) => p.model?.includes(FLUX_AUTO_MODEL));
  return provider ? { provider, useModel: FLUX_AUTO_MODEL } : null;
};

/**
 * Resolve the persisted default-model pin to a concrete provider+model, or
 * null if it no longer exists. New format is `{ id: ProviderId, useModel }`;
 * the legacy format is a bare model-name string.
 *
 * Wave 3 Fix 11 - the home picker writes the `ProviderId` string (e.g.
 * `'openai'`) into `id`, NOT the legacy `IProvider.id` uuid. Match by uuid
 * first (legacy `gemini-with-google-auth` rows still use uuids), then by
 * `platform === id` with the model present in that provider's `model[]`.
 *
 * The platform match alone is not enough for a registry-native provider whose
 * mirror row carries a generic `platform`. Flux Router is the case that bit:
 * the pin stores `id: 'flux-router'` while the row is `{ id: 'b1c5cb99',
 * platform: 'openai-compatible', __waylandModelRegistryBridge: 'v2:flux-router' }`,
 * so both matches missed and the user's deliberate Flux pin was discarded on
 * every boot. Resolve by bridge tag as well, mirroring the priority
 * `resolveSelectedProvider` and `useWCoreModelSelection` already use.
 */
const resolveSavedPin = (savedModel: unknown, modelList: IProvider[]): ModelChoice | null => {
  if (savedModel && typeof savedModel === 'object' && 'id' in savedModel) {
    const { id, useModel, accountId } = savedModel as { id?: string; useModel?: string; accountId?: string };
    if (!useModel) return null;
    const exactMatch = modelList.find((m) => m.id === id);
    const platformMatch = !exactMatch
      ? modelList.find((m) => m.platform === id && m.model?.includes(useModel))
      : undefined;
    const bridgeMatch =
      !exactMatch && !platformMatch
        ? modelList.find((m) => bridgeTagOf(m) === `${V2_BRIDGE_PREFIX}${id}` && m.model?.includes(useModel))
        : undefined;
    const resolved = exactMatch ?? platformMatch ?? bridgeMatch;
    return resolved?.model?.includes(useModel) ? { provider: resolved, useModel, accountId } : null;
  }
  if (typeof savedModel === 'string') {
    const provider = modelList.find((m) => m.model?.includes(savedModel));
    return provider ? { provider, useModel: savedModel } : null;
  }
  return null;
};

/** Provider-based agent keys that share the model list UI */
type ProviderAgentKey = 'gemini' | 'wcore';

/** Map agent key → storage key for persisting default model */
const MODEL_STORAGE_KEY: Record<ProviderAgentKey, 'gemini.defaultModel' | 'wcore.defaultModel'> = {
  gemini: 'gemini.defaultModel',
  wcore: 'wcore.defaultModel',
};

export type GuidModelSelectionResult = {
  modelList: IProvider[];
  isGoogleAuth: boolean;
  geminiModeOptions: ReturnType<typeof useGeminiGoogleAuthModels>['geminiModeOptions'];
  geminiModeLookup: Map<string, ReturnType<typeof useGeminiGoogleAuthModels>['geminiModeOptions'][number]>;
  formatGeminiModelLabel: (provider: { platform?: string } | undefined, modelName?: string) => string;
  currentModel: TProviderWithModel | undefined;
  setCurrentModel: (modelInfo: TProviderWithModel) => Promise<void>;
};

/**
 * Hook that manages Gemini model list and selection state for the Guid page.
 * @param agentKey - current provider-based agent ('gemini' | 'wcore'), defaults to 'wcore'
 */
export const useGuidModelSelection = (agentKey: ProviderAgentKey = 'wcore'): GuidModelSelectionResult => {
  const { geminiModeOptions, isGoogleAuth } = useGeminiGoogleAuthModels();
  const { data: modelConfig, mutate: mutateModelConfig } = useSWR('model.config.welcome', () => {
    return ipcBridge.mode.getModelConfig.invoke().then((data) => {
      return (data || []).filter((platform) => !!platform.model.length);
    });
  });

  // Revalidate the home picker's `model.config` view whenever the model
  // registry's catalog changes (connect / rekey / refresh all emit
  // `modelRegistry.listChanged`). The first-run onboarding overlay connects
  // Flux Router as a Modal mounted ON TOP of this already-mounted home page, so
  // dismissing it never remounts the page — without this subscription the SWR
  // cache stays on its empty cold-start snapshot, `currentModel` never
  // resolves, and the brand-new user's first send is silently dropped by the
  // wcore "no model configured" guard (issue #108). Mirrors the same
  // revalidation `useModelProviderList` already does for `model.config.shared`.
  useEffect(() => {
    return ipcBridge.modelRegistry.listChanged.on(() => {
      void mutateModelConfig();
    });
  }, [mutateModelConfig]);

  const geminiModelValues = useMemo(() => geminiModeOptions.map((option) => option.value), [geminiModeOptions]);

  const modelList = useMemo(() => {
    let allProviders: IProvider[] = [];

    // Only expose the Gemini Google Auth provider when the current agent is
    // 'gemini'. Other provider-based agents (e.g. wcore) do not support
    // Google login, so surfacing this provider would make the default-model
    // fallback pick a Gemini auto model by mistake.
    if (isGoogleAuth && agentKey === 'gemini') {
      const geminiProvider: IProvider = {
        id: uuid(),
        name: 'Gemini Google Auth',
        platform: 'gemini-with-google-auth',
        baseUrl: '',
        apiKey: '',
        model: geminiModelValues,
        capabilities: [{ type: 'text' }, { type: 'vision' }, { type: 'function_calling' }],
      };
      allProviders = [geminiProvider, ...(modelConfig || [])];
    } else {
      allProviders = modelConfig || [];
    }

    // #538: honor the provider-level disable flag, mirroring useModelProviderList
    // (:102) - otherwise a disabled provider row still feeds the new-chat default
    // resolver and can win (e.g. a disabled OpenAI row surfacing gpt-5.5).
    return allProviders.filter((p) => p.enabled !== false).filter(hasAvailableModels);
  }, [agentKey, geminiModelValues, isGoogleAuth, modelConfig]);

  const geminiModeLookup = useMemo(() => {
    const lookup = new Map<string, (typeof geminiModeOptions)[number]>();
    geminiModeOptions.forEach((option) => lookup.set(option.value, option));
    return lookup;
  }, [geminiModeOptions]);

  const formatGeminiModelLabel = useCallback(
    (provider: { platform?: string } | undefined, modelName?: string) => {
      if (!modelName) return '';
      const isGoogleProvider = provider?.platform?.toLowerCase().includes('gemini-with-google-auth');
      if (isGoogleProvider) {
        return geminiModeLookup.get(modelName)?.label || modelName;
      }
      return modelName;
    },
    [geminiModeLookup]
  );

  const [currentModel, _setCurrentModel] = useState<TProviderWithModel>();
  const selectedModelKeyRef = useRef<string | null>(null);
  const prevStorageKeyRef = useRef<string | null>(null);

  const storageKey = MODEL_STORAGE_KEY[agentKey];

  const setCurrentModel = useCallback(
    async (modelInfo: TProviderWithModel) => {
      selectedModelKeyRef.current = buildModelKey(modelInfo.id, modelInfo.useModel);
      // Apply to React state FIRST, and never gate it on the write.
      //
      // The renderer IPC bridge is resolve-only: it has no reject path and no
      // timeout (see bridgeAllowlist.ts), so a provider that never answers
      // leaves this promise pending forever - the inline .catch() below cannot
      // fire, because nothing ever rejects. While that awaited write sat ahead
      // of the state update, one stalled config write left `currentModel`
      // undefined for the rest of the session: the home page showed
      // "No model configured yet" with a dead Send button while the picker
      // listed hundreds of models, and every manual pick was swallowed by the
      // same await. Reported live on v0.12.0 against eleven connected
      // providers and a perfectly valid saved pin.
      //
      // Ordering it this way makes the UI depend only on state that is already
      // in hand. Persistence is still attempted, still logs on failure, and a
      // lost write costs at most the pin - not the running session.
      _setCurrentModel(modelInfo);
      // Detached on purpose, for the same reason: awaiting it here would hand
      // the caller a promise that can never settle. handlePickCurated awaits
      // this setter, so a stalled write would strand the pick mid-flight and
      // skip everything after it. Persist the account binding alongside the
      // model (multi-account, audit C2/C5); defaults to the implicit
      // single-account row, so existing pins keep working untouched.
      void ConfigStorage.set(storageKey, {
        id: modelInfo.id,
        useModel: modelInfo.useModel,
        accountId: resolveAccountId(modelInfo),
      }).catch((error) => {
        console.error('Failed to save default model:', error);
      });
    },
    [storageKey]
  );

  // Set default model when modelList or agent changes
  useEffect(() => {
    const setDefaultModel = async () => {
      if (!modelList || modelList.length === 0) {
        return;
      }
      // When agent switches, reset selection so we reload from the new storage key
      const agentChanged = prevStorageKeyRef.current !== null && prevStorageKeyRef.current !== storageKey;
      prevStorageKeyRef.current = storageKey;
      if (agentChanged) {
        selectedModelKeyRef.current = null;
      }

      const currentKey = selectedModelKeyRef.current || buildModelKey(currentModel?.id, currentModel?.useModel);
      // #129 - a just-enabled "Route through Flux" + an available flux-auto must
      // supersede a stale non-Flux selection. The onboarding Flux connect pins
      // flux-auto AFTER the home already locked onto whatever model loaded first
      // (a local Ollama smollm2:135m loads instantly; cloud catalogs + the Flux
      // virtual models land a beat later). Without this, the lock below keeps the
      // stale local pick in-session until an app restart re-reads the pin. When a
      // Flux override is pending we fall through to the full resolution, which
      // still puts the user's own saved pin first - so this only ever promotes an
      // unchosen default to flux-auto, never overrides a deliberate pick.
      const fluxAutoAvailable = modelList.some((p) => p.model?.includes(FLUX_AUTO_MODEL));
      const currentIsFlux = currentModel?.useModel ? isFluxModelId(currentModel.useModel) : false;
      let fluxOverridePending = false;
      if (fluxAutoAvailable && !currentIsFlux) {
        try {
          fluxOverridePending = (await ipcBridge.systemSettings.getRouteThroughFlux.invoke()) ?? false;
        } catch {
          /* no override on failure - fall through to the normal lock */
        }
      }
      if (!agentChanged && !fluxOverridePending && isModelKeyAvailable(currentKey, modelList)) {
        if (!selectedModelKeyRef.current && currentKey) {
          selectedModelKeyRef.current = currentKey;
        }
        return;
      }
      const savedModel = await ConfigStorage.get(storageKey);
      const savedPin = resolveSavedPin(savedModel, modelList);

      // Telemetry of models the user actually picked (recency-sorted). One IPC
      // per cold resolution; failures resolve to an empty list - telemetry must
      // never break model selection.
      let recentlyUsed: UsageModel[] = [];
      try {
        const result = await ipcBridge.usage.queryRecentlyUsedModels.invoke({ limit: 25 });
        if (Array.isArray(result)) recentlyUsed = result;
      } catch {
        /* telemetry must never break model selection */
      }

      const recentMatch = resolveUsageMatch(modelList, recentlyUsed);
      const byFrequency = [...recentlyUsed].toSorted((a, b) =>
        b.useCount !== a.useCount ? b.useCount - a.useCount : b.lastUsedMs - a.lastUsedMs
      );
      const frequentMatch = resolveUsageMatch(modelList, byFrequency);

      // Resolution order - "remember the last/best model used":
      //   recent → saved pin (if not an unchosen preview) → frequent → safe → saved pin.
      // The user's actual last pick (telemetry) wins. A saved pin nobody chose
      // (e.g. a preview model an earlier cold start auto-persisted) is demoted
      // below real usage and the safe default, and only used when there is no
      // usage history at all. This is what stops the boot default from sticking
      // on a preview model like Antigravity.
      const savedNonExperimental =
        savedPin && !isLikelyExperimentalModel(savedPin.useModel) && !isExperimentalProvider(savedPin.provider)
          ? savedPin
          : null;
      // Flux Router's Autopilot is the recommended default only while "Route
      // through Flux" is enabled. It sits below real usage signals and a chosen
      // pin - only above the generic safe default - so a brand-new user (whose
      // onboarding turns the toggle on when they connect Flux) lands on
      // flux-auto, while anyone who picked a model keeps it. Crucially, a user
      // who turns the toggle OFF must escape the flux-auto default here too, not
      // just in the per-conversation path, or the home picker keeps re-selecting
      // flux (#160). Mirrors the gating in createConversationParams.
      let routeThroughFlux = false;
      try {
        routeThroughFlux = (await ipcBridge.systemSettings.getRouteThroughFlux.invoke()) ?? false;
      } catch {
        /* on failure leave flux-auto out of the default chain */
      }
      const fluxAuto = routeThroughFlux ? resolveFluxAuto(modelList) : null;

      // Flux Router is connected when its Autopilot model is in the catalog -
      // independent of the routing toggle, which only decides whether flux-auto
      // is the RECOMMENDED default.
      //
      // While Flux is connected, the auto-registered local daemon must not win
      // an automatic default. Two things make it win today:
      //   - it is mirrored into `model.config` first, so it leads the generic
      //     safe-default fallback; and
      //   - this hook PERSISTS whatever it auto-resolves under `storageKey`,
      //     the same key a deliberate pick writes. A cold start that resolved
      //     before the cloud catalogs landed therefore stamps a local model
      //     into the pin, and from then on it is indistinguishable on disk from
      //     a choice the user made. That is how a 3.3 GB `gemma3:4b` became the
      //     standing default in front of a connected Flux Router - and then
      //     400'd, because a local model of that size rejects the tools payload
      //     every agent turn carries.
      //
      // The trade: a pin naming the local daemon is treated as unverified while
      // Flux is connected. A pick the user really made still wins - it is in the
      // `guid.model_selected` telemetry that feeds `recentMatch` / `frequentMatch`
      // above, which the picker writes ONLY on a real pick. A deliberate local
      // pick older than the telemetry window is the case this moves to Flux.
      const fluxConnected = resolveFluxAuto(modelList) !== null;
      const savedTrusted =
        fluxConnected && savedNonExperimental && isLocalDaemonProvider(savedNonExperimental.provider)
          ? null
          : savedNonExperimental;
      const safeDefaultCandidates = fluxConnected ? modelList.filter((p) => !isLocalDaemonProvider(p)) : modelList;
      const chosen =
        recentMatch ??
        savedTrusted ??
        frequentMatch ??
        fluxAuto ??
        resolveSafeDefault(safeDefaultCandidates) ??
        savedPin;
      if (!chosen) return;

      const defaultModel: IProvider | undefined = chosen.provider;
      const resolvedUseModel: string = chosen.useModel;

      if (!defaultModel || !resolvedUseModel) return;

      await setCurrentModel({
        ...defaultModel,
        useModel: resolvedUseModel,
        accountId: chosen.accountId ?? DEFAULT_ACCOUNT_ID,
      });
    };

    setDefaultModel().catch((error) => {
      console.error('Failed to set default model:', error);
    });
  }, [modelList, storageKey]);
  return {
    modelList,
    isGoogleAuth,
    geminiModeOptions,
    geminiModeLookup,
    formatGeminiModelLabel,
    currentModel,
    setCurrentModel,
  };
};
