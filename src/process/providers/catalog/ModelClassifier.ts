import type { ProviderId, ModelTier } from '../types';
import { CLASSIFIER_RULES, type ClassifierRule } from './modelClassifierRules';

const DEFAULT_TIER: ModelTier = 'everyday';

export class ModelClassifier {
  private overrides: Partial<Record<ProviderId, ClassifierRule[]>> = {};

  classify(modelId: string, provider: ProviderId): ModelTier {
    const rules = this.overrides[provider] ?? CLASSIFIER_RULES[provider];
    if (!rules) return DEFAULT_TIER;
    for (const rule of rules) {
      if (rule.match.test(modelId)) return rule.tier;
    }
    return DEFAULT_TIER;
  }

  classifyMany(models: { id: string }[], provider: ProviderId): Map<string, ModelTier> {
    const result = new Map<string, ModelTier>();
    for (const m of models) {
      result.set(m.id, this.classify(m.id, provider));
    }
    return result;
  }

  /**
   * Fetch remote curation config and override bundled rules.
   * On shape mismatch or network failure, keeps bundled rules silently.
   */
  async loadRemoteConfig(url: string): Promise<void> {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data: unknown = await res.json();
      if (!isRemoteConfig(data)) return;
      for (const [provider, rules] of Object.entries(data.rules)) {
        this.overrides[provider as ProviderId] = rules.map((r) => ({
          match: new RegExp(r.match, 'i'),
          tier: r.tier,
        }));
      }
    } catch {
      // Network failure or malformed JSON - keep bundled rules
    }
  }
}

type RemoteConfig = {
  rules: Record<string, { match: string; tier: ModelTier }[]>;
};

function isRemoteConfig(v: unknown): v is RemoteConfig {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  if (typeof obj['rules'] !== 'object' || obj['rules'] === null) return false;
  for (const rules of Object.values(obj['rules'] as object)) {
    if (!Array.isArray(rules)) return false;
    for (const r of rules) {
      if (typeof r !== 'object' || r === null) return false;
      if (typeof (r as Record<string, unknown>)['match'] !== 'string') return false;
      if (typeof (r as Record<string, unknown>)['tier'] !== 'string') return false;
    }
  }
  return true;
}
