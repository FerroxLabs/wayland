/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import { ConfigStorage } from '@/common/config/storage';
import { uuid } from '@/common/utils';
import { useGeminiGoogleAuthModels } from '@/renderer/hooks/agent/useGeminiGoogleAuthModels';
import { hasAvailableModels } from '../utils/modelUtils';
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
 * Matches by `${id}:${model}` OR `${platform}:${model}` — the home picker
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
 * matches this pattern — this only demotes a pin nobody chose.
 */
const EXPERIMENTAL_MODEL_PATTERN = /\b(preview|experimental|exp|nightly|alpha|beta|antigravity)\b/i;
const isLikelyExperimentalModel = (modelName: string): boolean => EXPERIMENTAL_MODEL_PATTERN.test(modelName);

type UsageModel = { modelId: string; useCount: number; lastUsedMs: number };
type ModelChoice = { provider: IProvider; useModel: string };

const providerForModelId = (modelList: IProvider[], modelId: string): IProvider | undefined =>
  modelList.find((p) => p.model?.includes(modelId));

/**
 * First usage entry (in the order given) whose model still exists in the
 * provider list. Telemetry `modelId` is the model name as it appears in a
 * provider's `model[]` array — the same string `guid.model_selected` records.
 */
const resolveUsageMatch = (modelList: IProvider[], usage: UsageModel[]): ModelChoice | null => {
  for (const u of usage) {
    const provider = providerForModelId(modelList, u.modelId);
    if (provider) return { provider, useModel: u.modelId };
  }
  return null;
};

/** First non-experimental model in the provider list, else `modelList[0]`. */
const resolveSafeDefault = (modelList: IProvider[]): ModelChoice | null => {
  for (const provider of modelList) {
    const safeModel = provider.model?.find((m) => !isLikelyExperimentalModel(m));
    if (safeModel) return { provider, useModel: safeModel };
  }
  const first = modelList[0];
  return first?.model?.[0] ? { provider: first, useModel: first.model[0] } : null;
};

/**
 * Resolve the persisted default-model pin to a concrete provider+model, or
 * null if it no longer exists. New format is `{ id: ProviderId, useModel }`;
 * the legacy format is a bare model-name string.
 *
 * Wave 3 Fix 11 — the home picker writes the `ProviderId` string (e.g.
 * `'openai'`) into `id`, NOT the legacy `IProvider.id` uuid. Match by uuid
 * first (legacy `gemini-with-google-auth` rows still use uuids), then by
 * `platform === id` with the model present in that provider's `model[]`.
 */
const resolveSavedPin = (savedModel: unknown, modelList: IProvider[]): ModelChoice | null => {
  if (savedModel && typeof savedModel === 'object' && 'id' in savedModel) {
    const { id, useModel } = savedModel as { id?: string; useModel?: string };
    if (!useModel) return null;
    const exactMatch = modelList.find((m) => m.id === id);
    const platformMatch = !exactMatch
      ? modelList.find((m) => m.platform === id && m.model?.includes(useModel))
      : undefined;
    const resolved = exactMatch ?? platformMatch;
    return resolved?.model?.includes(useModel) ? { provider: resolved, useModel } : null;
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
 * @param agentKey - current provider-based agent ('gemini' | 'wcore'), defaults to 'gemini'
 */
export const useGuidModelSelection = (agentKey: ProviderAgentKey = 'gemini'): GuidModelSelectionResult => {
  const { geminiModeOptions, isGoogleAuth } = useGeminiGoogleAuthModels();
  const { data: modelConfig } = useSWR('model.config.welcome', () => {
    return ipcBridge.mode.getModelConfig.invoke().then((data) => {
      return (data || []).filter((platform) => !!platform.model.length);
    });
  });

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

    return allProviders.filter(hasAvailableModels);
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
      await ConfigStorage.set(storageKey, { id: modelInfo.id, useModel: modelInfo.useModel }).catch((error) => {
        console.error('Failed to save default model:', error);
      });
      _setCurrentModel(modelInfo);
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
      if (!agentChanged && isModelKeyAvailable(currentKey, modelList)) {
        if (!selectedModelKeyRef.current && currentKey) {
          selectedModelKeyRef.current = currentKey;
        }
        return;
      }
      const savedModel = await ConfigStorage.get(storageKey);
      const savedPin = resolveSavedPin(savedModel, modelList);

      // Telemetry of models the user actually picked (recency-sorted). One IPC
      // per cold resolution; failures resolve to an empty list — telemetry must
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

      // Resolution order — "remember the last/best model used":
      //   recent → saved pin (if not an unchosen preview) → frequent → safe → saved pin.
      // The user's actual last pick (telemetry) wins. A saved pin nobody chose
      // (e.g. a preview model an earlier cold start auto-persisted) is demoted
      // below real usage and the safe default, and only used when there is no
      // usage history at all. This is what stops the boot default from sticking
      // on a preview model like Antigravity.
      const savedNonExperimental = savedPin && !isLikelyExperimentalModel(savedPin.useModel) ? savedPin : null;
      const chosen = recentMatch ?? savedNonExperimental ?? frequentMatch ?? resolveSafeDefault(modelList) ?? savedPin;
      if (!chosen) return;

      const defaultModel: IProvider | undefined = chosen.provider;
      const resolvedUseModel: string = chosen.useModel;

      if (!defaultModel || !resolvedUseModel) return;

      await setCurrentModel({
        ...defaultModel,
        useModel: resolvedUseModel,
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
