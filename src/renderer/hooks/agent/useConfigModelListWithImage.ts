import { useMemo } from 'react';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import { curatedImageModelsForProvider, isImageModelName } from '@/common/config/imageModels';

/**
 * Provider list for the image-tool picker, with each provider's image-capable
 * model set resolved and merged into `model[]` (the picker filters image ids
 * back out via {@link isImageModelName}).
 *
 * Image models come from three sources, deduped, best-first:
 *   1. `provider.imageModels` - mirrored from the auto-refreshing model catalog
 *      (newest models.dev image models, no code change needed to stay current).
 *   2. The curated floor for the provider family - guarantees the latest known
 *      ids are present even when the catalog is cold or the registry mirror
 *      skips the provider (e.g. Google-auth Gemini).
 *   3. Any image ids already in the provider's own `model[]` - covers
 *      manually-added providers whose `/v1/models` list includes image ids.
 *
 * Finally, a redundant pre-registry duplicate is dropped: a non-bridge provider
 * whose image models are fully covered by a registry-managed (bridge) provider
 * on the same platform - e.g. a leftover manually-added "Gemini" sitting beside
 * the managed "Google Gemini" - so the same models don't appear under two
 * near-identical groups.
 */
const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';

const isBridged = (provider: { [k: string]: unknown }): boolean =>
  typeof provider[BRIDGE_TAG_KEY] === 'string';

const useConfigModelListWithImage = () => {
  const { data } = useSWR('configModelListWithImage', () => {
    return ipcBridge.mode.getModelConfig.invoke();
  });

  const modelListWithImage = useMemo(() => {
    const enriched = (data || []).map((platform) => {
      const fromCatalog = platform.imageModels ?? [];
      const fromCurated = curatedImageModelsForProvider(platform);
      const fromOwnModels = platform.model.filter(isImageModelName);

      const imageModels = Array.from(new Set([...fromCatalog, ...fromCurated, ...fromOwnModels]));
      // Merge image ids into `model` so the existing picker (which filters for
      // image names) surfaces them. Text ids stay first so non-image consumers
      // of this list are unaffected; image-only ids are appended.
      const provider = imageModels.length === 0 ? platform : Object.assign({}, platform, { model: [...new Set([...platform.model, ...imageModels])] });
      return { provider, imageModels, bridged: isBridged(platform as unknown as { [k: string]: unknown }) };
    });

    // Union of image ids offered by a bridge-managed provider, per platform.
    const bridgedByPlatform = new Map<string, Set<string>>();
    for (const e of enriched) {
      if (!e.bridged || e.imageModels.length === 0) continue;
      const key = (e.provider.platform || '').toLowerCase();
      const set = bridgedByPlatform.get(key) ?? new Set<string>();
      e.imageModels.forEach((m) => set.add(m));
      bridgedByPlatform.set(key, set);
    }

    return enriched
      .filter((e) => {
        if (e.bridged || e.imageModels.length === 0) return true;
        const covering = bridgedByPlatform.get((e.provider.platform || '').toLowerCase());
        // Drop only when EVERY image model is already offered by a bridged
        // sibling - a provider with any unique image model is always kept.
        return !covering || !e.imageModels.every((m) => covering.has(m));
      })
      .map((e) => e.provider);
  }, [data]);

  return {
    modelListWithImage,
  };
};

export default useConfigModelListWithImage;
