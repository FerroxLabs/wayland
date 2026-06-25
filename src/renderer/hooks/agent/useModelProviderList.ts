import { ipcBridge } from '@/common';
import { GOOGLE_AUTH_PROVIDER_ID } from '@/common/config/constants';
import type { IProvider } from '@/common/config/storage';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { useGeminiGoogleAuthModels } from './useGeminiGoogleAuthModels';
import type { GeminiModeOption } from './useModeModeList';
import { hasSpecificModelCapability } from '@/renderer/utils/model/modelCapabilities';
import { FLUX_MODEL_DISPLAY, isFluxModelId, type FluxModelId } from '@/common/config/flux';

export interface ModelProviderListResult {
  providers: IProvider[];
  /**
   * All ENABLED connected providers, BEFORE the "has available models" filter.
   * This is the source of truth for "is this provider still connected" - the
   * picker `providers` list hides a provider whose models are all transiently
   * filtered out (e.g. an OpenRouter refresh), which must NOT be read as a
   * disconnect (see useWCoreModelSelection's stale-model guard).
   */
  connectedProviders: IProvider[];
  /**
   * True only during the initial load of the legacy `model.config` view (SWR has
   * no data yet). Consumers that revalidate a selected model against the provider
   * lists must wait for this to be false: on a freshly-mounted conversation the
   * lists are momentarily empty, and clearing a selection during that window
   * blanks a model the user legitimately picked (the "model vanished after one
   * message" race).
   */
  isLoading: boolean;
  geminiModeLookup: Map<string, GeminiModeOption>;
  getAvailableModels: (provider: IProvider) => string[];
  formatModelLabel: (provider: { platform?: string } | undefined, modelName?: string) => string;
}

/**
 * Shared hook that builds the provider list (including Google Auth)
 * and exposes helpers consumed by both conversation and channel settings.
 */
export const useModelProviderList = (): ModelProviderListResult => {
  const { geminiModeOptions, isGoogleAuth } = useGeminiGoogleAuthModels();

  const geminiModeLookup = useMemo(() => {
    const lookup = new Map<string, GeminiModeOption>();
    geminiModeOptions.forEach((option) => lookup.set(option.value, option));
    return lookup;
  }, [geminiModeOptions]);

  const {
    data: modelConfig,
    mutate: mutateModelConfig,
    isLoading,
  } = useSWR('model.config.shared', () => ipcBridge.mode.getModelConfig.invoke());

  // Revalidate the legacy `model.config` view whenever the model registry's
  // catalog changes (connect / rekey / per-provider or global refresh emit
  // `modelRegistry.listChanged`). Without this, a fresh install that connects a
  // provider mirrors the new catalog into `model.config` but the picker's SWR
  // cache never re-reads it - the model list stays empty until a manual reload.
  useEffect(() => {
    return ipcBridge.modelRegistry.listChanged.on(() => {
      void mutateModelConfig();
    });
  }, [mutateModelConfig]);

  // Mutable cache for available-model filtering
  const availableModelsCacheRef = useRef(new Map<string, string[]>());

  // Clear cache when modelConfig changes
  useEffect(() => {
    availableModelsCacheRef.current.clear();
  }, [modelConfig]);

  const getAvailableModels = useCallback((provider: IProvider): string[] => {
    // Include modelEnabled state in the cache key
    const modelEnabledKey = provider.modelEnabled ? JSON.stringify(provider.modelEnabled) : 'all-enabled';
    const cacheKey = `${provider.id}-${(provider.model || []).join(',')}-${modelEnabledKey}`;
    const cache = availableModelsCacheRef.current;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }
    const result: string[] = [];
    for (const modelName of provider.model || []) {
      // Check whether the model is disabled (enabled by default)
      const isModelEnabled = provider.modelEnabled?.[modelName] !== false;
      if (!isModelEnabled) continue;

      const functionCalling = hasSpecificModelCapability(provider, modelName, 'function_calling');
      const excluded = hasSpecificModelCapability(provider, modelName, 'excludeFromPrimary');
      if ((functionCalling === true || functionCalling === undefined) && excluded !== true) {
        result.push(modelName);
      }
    }
    cache.set(cacheKey, result);
    return result;
  }, []);

  // Enabled, connected providers (NOT yet filtered by available-models). Source
  // of truth for "still connected" checks.
  const connectedProviders = useMemo(() => {
    let list: IProvider[] = Array.isArray(modelConfig) ? modelConfig : [];
    // Filter out disabled providers (enabled by default)
    list = list.filter((p) => p.enabled !== false);

    if (isGoogleAuth) {
      const googleProvider: IProvider = {
        id: GOOGLE_AUTH_PROVIDER_ID,
        name: 'Gemini Google Auth',
        platform: 'gemini-with-google-auth',
        baseUrl: '',
        apiKey: '',
        model: geminiModeOptions.map((v) => v.value),
        capabilities: [{ type: 'text' }, { type: 'vision' }, { type: 'function_calling' }],
        enabled: true, // Google Auth provider is always enabled
      } as unknown as IProvider;
      list = [googleProvider, ...list];
    }
    return list;
  }, [geminiModeOptions, isGoogleAuth, modelConfig]);

  // Picker list: also hide providers with no available models.
  const providers = useMemo(
    () => connectedProviders.filter((p) => getAvailableModels(p).length > 0),
    [connectedProviders, getAvailableModels]
  );

  const formatModelLabel = useCallback(
    (provider: { platform?: string } | undefined, modelName?: string) => {
      if (!modelName) return '';
      // Flux routing aliases (flux-auto, ...) carry a raw id but should read as
      // their brand name ("Flux Auto") everywhere they surface.
      if (isFluxModelId(modelName)) return FLUX_MODEL_DISPLAY[modelName as FluxModelId] ?? modelName;
      const isGoogleAuthProvider = provider?.platform?.toLowerCase().includes('gemini-with-google-auth');
      if (isGoogleAuthProvider) {
        return geminiModeLookup.get(modelName)?.label || modelName;
      }
      return modelName;
    },
    [geminiModeLookup]
  );

  return { providers, connectedProviders, isLoading, geminiModeLookup, getAvailableModels, formatModelLabel };
};
