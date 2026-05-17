import type { ProviderModel, Capability, ProviderId } from '../types';
import { CAPABILITY_RULES } from './modelCapabilityRules';

/**
 * Detects capabilities for a model.
 * Strategy:
 *   1. If the model already has capabilities populated (e.g. from OpenRouter metadata), return them.
 *   2. Otherwise fall back to per-provider id-pattern rules.
 * All matching rules are additive; result is deduped and stable-sorted.
 */
export class ModelCapabilityDetector {
  detect(model: ProviderModel & { provider: ProviderId }): Capability[] {
    if (model.capabilities.length > 0) return model.capabilities;
    return detectFromRules(model.id, model.provider);
  }

  /**
   * Convenience: detect from id + provider without a full ProviderModel.
   */
  detectById(modelId: string, provider: ProviderId): Capability[] {
    return detectFromRules(modelId, provider);
  }
}

function detectFromRules(modelId: string, provider: ProviderId): Capability[] {
  const rules = CAPABILITY_RULES[provider];
  if (!rules || rules.length === 0) return ['chat'];

  const found = new Set<Capability>();
  for (const rule of rules) {
    if (rule.match.test(modelId)) {
      for (const cap of rule.capabilities) {
        found.add(cap);
      }
    }
  }

  return found.size > 0 ? Array.from(found) : ['chat'];
}
