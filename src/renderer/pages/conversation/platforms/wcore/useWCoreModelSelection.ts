/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import { useModelProviderList } from '@/renderer/hooks/agent/useModelProviderList';
import { useModelDisplayName } from '@/renderer/hooks/agent/useModelDisplayName';
import { isFluxModelId } from '@/common/config/flux';
import { BRIDGE_TAG_KEY, V2_TAG_PREFIX } from '@/renderer/components/model/modelSelector/resolveSelectedProvider';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type WCoreModelSelection = {
  currentModel?: TProviderWithModel;
  providers: IProvider[];
  getAvailableModels: (provider: IProvider) => string[];
  handleSelectModel: (provider: IProvider, modelName: string) => Promise<void>;
  getDisplayModelName: (modelName?: string) => string;
};

export type UseAionrsModelSelectionOptions = {
  initialModel: TProviderWithModel | undefined;
  onSelectModel: (provider: IProvider, modelName: string) => Promise<boolean>;
};

export const useWCoreModelSelection = ({
  initialModel,
  onSelectModel,
}: UseAionrsModelSelectionOptions): WCoreModelSelection => {
  const [currentModel, setCurrentModel] = useState<TProviderWithModel | undefined>(initialModel);

  useEffect(() => {
    setCurrentModel(initialModel);
  }, [initialModel?.id, initialModel?.useModel]);

  const {
    providers: allProviders,
    connectedProviders: allConnectedProviders,
    isLoading: providerListLoading,
    getAvailableModels,
  } = useModelProviderList();

  // Resolve a picked model id to its catalog display name ("Claude Haiku 4.5"),
  // the same source the picker reads. The legacy `formatModelLabel` only knew
  // Flux aliases, so a real model surfaced its raw id in the header + send box.
  const resolveModelDisplayName = useModelDisplayName('wcore');

  // WaylandCLI does not support Google Auth - filter it out
  const providers = useMemo(
    () => allProviders.filter((p) => !p.platform?.toLowerCase().includes('gemini-with-google-auth')),
    [allProviders]
  );

  // Unfiltered connected list (before the "has available models" cut) for the
  // still-connected guard below. A provider whose models are transiently all
  // filtered out (e.g. an OpenRouter catalog refresh) stays here, so we don't
  // mistake the empty picker list for a disconnect and clear a live selection.
  const connectedProviders = useMemo(
    () => (allConnectedProviders ?? []).filter((p) => !p.platform?.toLowerCase().includes('gemini-with-google-auth')),
    [allConnectedProviders]
  );

  // #64: drop a stale selection whose provider was disconnected/removed (the
  // composer otherwise keeps showing a dead model like "gpt-5.5" that fails on
  // send). flux-auto is exempt: the Flux Router provider is intentionally
  // filtered out of `providers` (no function_calling models) yet is always a
  // valid route, so never treat a flux id as stale.
  //
  // #124: validate by MODEL MEMBERSHIP across all connected providers, not by
  // `provider.id`. A freshly-spawned chat carries the model registry's
  // ProviderId (e.g. 'openai'), which never equals the opaque legacy storage
  // `provider.id`, so an id-only match wrongly cleared a perfectly valid model -
  // blanking the picker and blocking sends until a manual reselect. When the
  // model is still offered but under a different (registry) id, re-bind to the
  // owning legacy provider so send resolves real credentials.
  useEffect(() => {
    if (!currentModel) return;
    if (currentModel.useModel && isFluxModelId(currentModel.useModel)) return;
    // Don't revalidate until the provider list has actually loaded. On a freshly
    // mounted conversation `model.config` (SWR) is briefly undefined, so both
    // `providers` and `connectedProviders` are empty for a tick. Running the
    // stale-model clear in that window wrongly drops a model the user just picked
    // on the new-chat screen - it runs one turn, then the composer blanks to "No
    // model selected" until a manual reselect (the "vanished after one message"
    // race). Once loaded, a genuinely-disconnected provider still clears (#64).
    if (providerListLoading) return;
    const useModel = currentModel.useModel ?? '';
    // #555 - the selection's registry-bridge tag (`v2:<registryProviderId>`), if
    // it carries one. A persisted wcore chat/team model can store `id` as the
    // registry ProviderId (e.g. 'chatgpt-subscription') rather than the opaque
    // mirrored legacy id, so the id-only match below misses. Without a
    // tag-aware step the bare-model-id fallback then binds the picker to
    // whatever provider lists the same bare id FIRST - e.g. a metered
    // direct-API/OpenRouter provider that shares 'gpt-5.4' - mislabeling the
    // selection as a provider the user never chose. (Real spend is routed
    // engine-side from the persisted conversation.model tag, not this local
    // state, so this is a picker/header/health display fix, not a billing fix.)
    // Resolve the owner by tag before the bare-id fallback, mirroring
    // resolveSelectedProvider's priority.
    const currentTag = (currentModel as unknown as Record<string, unknown>)[BRIDGE_TAG_KEY];
    const tagOf = (p: IProvider): unknown => (p as unknown as Record<string, unknown>)[BRIDGE_TAG_KEY];
    const owner =
      // 1. exact legacy id (cheap, correct when registry and storage ids align)
      providers.find((p) => p.id === currentModel.id && getAvailableModels(p).includes(useModel)) ??
      // 2. the selection's OWN bridge tag - deterministic registry owner. Match
      //    by tag ALONE (no getAvailableModels gate), exactly like
      //    resolveSelectedProvider.bridgeTagMatch: a ChatGPT-subscription row can
      //    be curated out of the function-calling set (#168/#158) yet still be
      //    the true owner - gating on availability would fall through to the
      //    bare-id metered look-alike again.
      (typeof currentTag === 'string' ? providers.find((p) => tagOf(p) === currentTag) : undefined) ??
      // 3. persisted id IS the registry ProviderId (untagged model): match the
      //    provider tagged `v2:<id>` (tag alone, same rationale as step 2)
      providers.find((p) => tagOf(p) === `${V2_TAG_PREFIX}${currentModel.id}`) ??
      // 4. bare-model-id membership fallback (untagged providers only in practice)
      providers.find((p) => getAvailableModels(p).includes(useModel));
    if (!owner) {
      // The model isn't in any provider's *curated* available list. Before
      // dropping it, check whether its OWN provider is still connected.
      // Dynamic-catalog providers (e.g. OpenRouter) expose brand-new models
      // like `z-ai/glm-5.2` that models.dev hasn't enriched yet, so the Curator
      // filters them out of `getAvailableModels` even though the provider is
      // connected and the model works. Clearing there blanks the picker
      // mid-conversation ("No model selected"), blocking a model the user just
      // used successfully. Only drop the selection when the provider itself is
      // gone (#64); when it's still connected, keep the used model bound to it.
      // Check against the UNFILTERED connected list, not the picker `providers`
      // (which hides a provider whose models are transiently all filtered out -
      // exactly the OpenRouter "model vanished after one message" case).
      const providerStillConnected = connectedProviders.some(
        (p) =>
          p.id === currentModel.id ||
          (!!currentModel.platform &&
            p.platform === currentModel.platform &&
            (p.baseUrl ?? '') === (currentModel.baseUrl ?? ''))
      );
      if (!providerStillConnected) {
        setCurrentModel(undefined);
      }
    } else if (owner.id !== currentModel.id) {
      setCurrentModel({ ...(owner as unknown as TProviderWithModel), useModel });
    }
  }, [providers, connectedProviders, currentModel, getAvailableModels, providerListLoading]);

  const handleSelectModel = useCallback(
    async (provider: IProvider, modelName: string) => {
      const selected = {
        ...(provider as unknown as TProviderWithModel),
        useModel: modelName,
      } as TProviderWithModel;
      const ok = await onSelectModel(provider, modelName);
      if (ok) {
        setCurrentModel(selected);
      }
    },
    [onSelectModel]
  );

  const getDisplayModelName = useCallback(
    (modelName?: string) => {
      if (!modelName) return '';
      const label = resolveModelDisplayName(modelName);
      const maxLength = 20;
      return label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
    },
    [resolveModelDisplayName]
  );

  return {
    currentModel,
    providers,
    getAvailableModels,
    handleSelectModel,
    getDisplayModelName,
  };
};
