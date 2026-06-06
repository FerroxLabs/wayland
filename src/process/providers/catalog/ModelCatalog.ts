import type { ProviderId, ProviderModel } from '../types';
import { PROVIDER_ENDPOINTS } from '../detection/providerEndpoints';
import { ModelClassifier } from './ModelClassifier';
import { ModelCapabilityDetector } from './ModelCapabilityDetector';
import { ModelDisplayNames } from './ModelDisplayNames';

type FetchFn = typeof fetch;

type RawModel = { id: string; [key: string]: unknown };

/**
 * Fetches and caches the model list for a provider.
 * W2B will add SQLite persistence and the 24h refresh scheduler on top of this.
 */
export class ModelCatalog {
  private cache = new Map<ProviderId, ProviderModel[]>();
  private readonly classifier = new ModelClassifier();
  private readonly capDetector = new ModelCapabilityDetector();
  private readonly displayNames = new ModelDisplayNames();
  private readonly fetchFn: FetchFn;

  constructor(fetchFn: FetchFn = fetch) {
    this.fetchFn = fetchFn;
  }

  /**
   * Returns cached model list if available, otherwise fetches live.
   */
  async getModels(provider: ProviderId, apiKey: string): Promise<ProviderModel[]> {
    const cached = this.cache.get(provider);
    if (cached) return cached;
    return this.refresh(provider, apiKey);
  }

  /**
   * Force-fetches the model list from the provider API and updates the cache.
   */
  async refresh(provider: ProviderId, apiKey: string): Promise<ProviderModel[]> {
    const url = PROVIDER_ENDPOINTS[provider];
    if (!url) return [];

    try {
      const res = await this.fetchFn(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'User-Agent': 'Wayland/1.0',
        },
      });
      if (!res.ok) return [];
      const data: unknown = await res.json();
      const rawModels = extractModels(data);
      const models = rawModels.map((raw) => this.toProviderModel(raw, provider));
      this.cache.set(provider, models);
      return models;
    } catch {
      return [];
    }
  }

  invalidate(provider: ProviderId): void {
    this.cache.delete(provider);
  }

  private toProviderModel(raw: RawModel, provider: ProviderId): ProviderModel {
    const id = raw.id;
    const tier = this.classifier.classify(id, provider);
    const displayName = this.displayNames.humanise(id, provider);
    // Start with empty capabilities so the detector falls through to rules
    const stub: ProviderModel & { provider: ProviderId } = {
      id,
      displayName,
      tier,
      capabilities: [],
      enabled: true,
      provider,
    };
    const capabilities = this.capDetector.detect(stub);
    return { id, displayName, tier, capabilities, enabled: true };
  }
}

function extractModels(data: unknown): RawModel[] {
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  // Most providers: { data: [{ id, ... }] }
  if (Array.isArray(obj['data'])) {
    return (obj['data'] as unknown[]).filter(isRawModel);
  }
  // Some providers: { models: [{ id, ... }] } or { data: { models: [...] } }
  if (Array.isArray(obj['models'])) {
    return (obj['models'] as unknown[]).filter(isRawModel);
  }
  // Top-level array
  if (Array.isArray(data)) {
    return (data as unknown[]).filter(isRawModel);
  }
  return [];
}

function isRawModel(v: unknown): v is RawModel {
  return typeof v === 'object' && v !== null && typeof (v as Record<string, unknown>)['id'] === 'string';
}
