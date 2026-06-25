// @vitest-environment jsdom

/**
 * #64 - useWCoreModelSelection must drop a selection whose provider was
 * disconnected (so the composer stops showing a dead model), while never
 * treating flux-auto as stale (its provider is filtered out of the list but is
 * always a valid route).
 */

import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { IProvider, TProviderWithModel } from '@/common/config/storage';

const providerListState: {
  providers: IProvider[];
  connectedProviders: IProvider[];
  isLoading: boolean;
  getAvailableModels: (p: IProvider) => string[];
} = {
  providers: [],
  connectedProviders: [],
  isLoading: false,
  getAvailableModels: () => [],
};

vi.mock('@/renderer/hooks/agent/useModelProviderList', () => ({
  useModelProviderList: () => ({
    providers: providerListState.providers,
    connectedProviders: providerListState.connectedProviders,
    isLoading: providerListState.isLoading,
    geminiModeLookup: new Map(),
    getAvailableModels: providerListState.getAvailableModels,
    formatModelLabel: (_m: unknown, name: string) => name,
  }),
}));

import { useWCoreModelSelection } from '@renderer/pages/conversation/platforms/wcore/useWCoreModelSelection';

const openai = { id: 'openai', platform: 'openai', model: ['gpt-5.5'] } as unknown as IProvider;
const fluxModel = { id: 'flux', useModel: 'flux-auto' } as unknown as TProviderWithModel;
const onSelectModel = vi.fn().mockResolvedValue(true);

function setList(
  providers: IProvider[],
  avail: Record<string, string[]>,
  connected?: IProvider[],
  isLoading = false
) {
  providerListState.providers = providers;
  // The unfiltered connected list defaults to the picker list; pass it
  // explicitly to model the "connected but no available models" case.
  providerListState.connectedProviders = connected ?? providers;
  providerListState.isLoading = isLoading;
  providerListState.getAvailableModels = (p) => avail[p.id] ?? [];
}

describe('useWCoreModelSelection revalidation (#64)', () => {
  it('keeps a selection whose provider is still connected', async () => {
    setList([openai], { openai: ['gpt-5.5'] });
    const initial = { id: 'openai', useModel: 'gpt-5.5' } as unknown as TProviderWithModel;
    const { result } = renderHook(() => useWCoreModelSelection({ initialModel: initial, onSelectModel }));
    await waitFor(() => expect(result.current.currentModel?.useModel).toBe('gpt-5.5'));
  });

  it('drops the model when its provider is disconnected (no longer in the list)', async () => {
    setList([], {}); // openai disconnected -> not in providers
    const initial = { id: 'openai', useModel: 'gpt-5.5' } as unknown as TProviderWithModel;
    const { result } = renderHook(() => useWCoreModelSelection({ initialModel: initial, onSelectModel }));
    await waitFor(() => expect(result.current.currentModel).toBeUndefined());
  });

  it('keeps an OpenRouter selection when the provider is still connected but its models are transiently filtered out', async () => {
    // Regression for the "model vanished after one message" report: after the
    // first turn a catalog refresh dropped z-ai/glm-5.2 from the *available*
    // (picker) list, so `providers` is empty - but OpenRouter is still
    // connected. The selection must survive (the still-connected guard must
    // read the UNFILTERED connected list, not the picker list).
    const openrouter = {
      id: 'openrouter',
      platform: 'openai-compatible',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: ['z-ai/glm-5.2'],
    } as unknown as IProvider;
    // picker `providers` = [] (model filtered out -> 0 available), but the
    // provider is still present in the unfiltered connected list.
    setList([], { openrouter: [] }, [openrouter]);
    const initial = {
      id: 'openrouter',
      platform: 'openai-compatible',
      baseUrl: 'https://openrouter.ai/api/v1',
      useModel: 'z-ai/glm-5.2',
    } as unknown as TProviderWithModel;
    const { result } = renderHook(() => useWCoreModelSelection({ initialModel: initial, onSelectModel }));
    // give the revalidation effect a chance to (wrongly) clear it
    await new Promise((r) => setTimeout(r, 30));
    expect(result.current.currentModel?.useModel).toBe('z-ai/glm-5.2');
  });

  it('keeps a freshly-picked model while the provider list is still loading (vanish-after-one-message race)', async () => {
    // Repro for the live-found bug: a model picked on the new-chat screen lands
    // in a freshly-mounted conversation whose `model.config` (SWR) hasn't
    // resolved yet, so both provider lists are momentarily empty AND isLoading is
    // true. The revalidation must NOT clear the selection during that window -
    // otherwise the model runs one turn then the composer blanks to "No model
    // selected". Once loaded, the existing guards take over.
    setList([], { openai: [] }, [], /* isLoading */ true);
    const initial = { id: 'openai', platform: 'openai', useModel: 'gpt-5.5' } as unknown as TProviderWithModel;
    const { result } = renderHook(() => useWCoreModelSelection({ initialModel: initial, onSelectModel }));
    // give the revalidation effect a chance to (wrongly) clear it
    await new Promise((r) => setTimeout(r, 30));
    expect(result.current.currentModel?.useModel).toBe('gpt-5.5');
  });

  it('never treats flux-auto as stale, even though its provider is filtered out', async () => {
    setList([], {}); // flux provider absent from the list (by design)
    const { result } = renderHook(() => useWCoreModelSelection({ initialModel: fluxModel, onSelectModel }));
    // give the revalidation effect a chance to (wrongly) clear it
    await new Promise((r) => setTimeout(r, 30));
    expect(result.current.currentModel?.useModel).toBe('flux-auto');
  });

  it('rebinds a model spawned with a registry ProviderId to the owning legacy provider (#124)', async () => {
    // A fresh WCore chat carries the registry ProviderId ('openai'); the legacy
    // storage provider has an opaque id ('prov_a1b2'). The old id-only check
    // cleared it (blank picker, cannot send). It must instead keep the model and
    // re-bind to the legacy provider so send resolves real credentials.
    const legacy = { id: 'prov_a1b2', platform: 'openai', model: ['gpt-5.5'] } as unknown as IProvider;
    setList([legacy], { prov_a1b2: ['gpt-5.5'] });
    const initial = { id: 'openai', useModel: 'gpt-5.5' } as unknown as TProviderWithModel;
    const { result } = renderHook(() => useWCoreModelSelection({ initialModel: initial, onSelectModel }));
    await waitFor(() => expect(result.current.currentModel?.id).toBe('prov_a1b2'));
    expect(result.current.currentModel?.useModel).toBe('gpt-5.5');
  });
});
