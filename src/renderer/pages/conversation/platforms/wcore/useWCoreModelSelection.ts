/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import { ipcBridge } from '@/common';
import { useModelProviderList } from '@/renderer/hooks/agent/useModelProviderList';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type WCoreModelSelection = {
  currentModel?: TProviderWithModel;
  providers: IProvider[];
  getAvailableModels: (provider: IProvider) => string[];
  handleSelectModel: (provider: IProvider, modelName: string) => Promise<void>;
  getDisplayModelName: (modelName?: string) => string;
  warmingModelId: string | null;
  runtimeRefreshNonce: number;
};

export type UseAionrsModelSelectionOptions = {
  initialModel: TProviderWithModel | undefined;
  onSelectModel: (provider: IProvider, modelName: string) => Promise<boolean>;
};

export function registryProviderIdFor(provider?: Pick<IProvider, 'id' | 'platform'>): string | undefined {
  if (!provider) return undefined;
  const tag = (provider as unknown as Record<string, unknown>).__waylandModelRegistryBridge;
  if (typeof tag === 'string' && tag.startsWith('v2:')) {
    const providerId = tag.slice('v2:'.length);
    if (providerId) return providerId;
  }
  return provider.id;
}

export const useWCoreModelSelection = ({
  initialModel,
  onSelectModel,
}: UseAionrsModelSelectionOptions): WCoreModelSelection => {
  const [currentModel, setCurrentModel] = useState<TProviderWithModel | undefined>(initialModel);
  const [warmingModelId, setWarmingModelId] = useState<string | null>(null);
  const [runtimeRefreshNonce, setRuntimeRefreshNonce] = useState(0);

  useEffect(() => {
    setCurrentModel(initialModel);
  }, [initialModel?.id, initialModel?.useModel]);

  const { providers: allProviders, getAvailableModels, formatModelLabel } = useModelProviderList();

  // WaylandCLI does not support Google Auth - filter it out
  const providers = useMemo(
    () => allProviders.filter((p) => !p.platform?.toLowerCase().includes('gemini-with-google-auth')),
    [allProviders]
  );

  const handleSelectModel = useCallback(
    async (provider: IProvider, modelName: string) => {
      const selected = {
        ...(provider as unknown as TProviderWithModel),
        useModel: modelName,
      } as TProviderWithModel;
      const ok = await onSelectModel(provider, modelName);
      if (ok) {
        setCurrentModel(selected);
        setRuntimeRefreshNonce((n) => n + 1);
        if (registryProviderIdFor(provider) === 'ollama-local') {
          setWarmingModelId(modelName);
          void ipcBridge.modelRegistry.warmOllamaModel
            .invoke({ modelId: modelName })
            .catch((error) => {
              console.warn('[WCoreModelSelection] Failed to warm Ollama model:', error);
            })
            .finally(() => {
              setWarmingModelId((current) => (current === modelName ? null : current));
              setRuntimeRefreshNonce((n) => n + 1);
            });
        }
      }
    },
    [onSelectModel]
  );

  const getDisplayModelName = useCallback(
    (modelName?: string) => {
      if (!modelName) return '';
      const label = formatModelLabel(currentModel, modelName);
      const maxLength = 20;
      return label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
    },
    [currentModel, formatModelLabel]
  );

  return {
    currentModel,
    providers,
    getAvailableModels,
    handleSelectModel,
    getDisplayModelName,
    warmingModelId,
    runtimeRefreshNonce,
  };
};
