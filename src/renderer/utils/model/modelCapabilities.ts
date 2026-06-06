/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProvider, ModelType } from '@/common/config/storage';
import { CAPABILITY_PATTERNS, CAPABILITY_EXCLUSIONS, getBaseModelName } from '@/common/utils/modelCapabilities';

export { hasSpecificModelCapability } from '@/common/utils/modelCapabilities';

// Capability resolution cache
const modelCapabilitiesCache = new Map<string, boolean | undefined>();

/**
 * Capability rules for specific providers
 */
const PROVIDER_CAPABILITY_RULES: Record<string, Record<ModelType, boolean | null>> = {
  anthropic: {
    text: true,
    vision: true,
    function_calling: true,
    image_generation: false,
    web_search: false,
    reasoning: false,
    embedding: false,
    rerank: false,
    excludeFromPrimary: false,
  },
  deepseek: {
    text: true,
    vision: null,
    function_calling: true,
    image_generation: false,
    web_search: false,
    reasoning: null,
    embedding: false,
    rerank: false,
    excludeFromPrimary: false,
  },
};

/**
 * Check whether the user has manually configured a given capability type
 * @param model - Model object
 * @param type - Capability type
 * @returns true/false if the user has an explicit configuration, undefined otherwise
 */
const getUserSelectedCapability = (model: IProvider, type: ModelType): boolean | undefined => {
  const capability = model.capabilities?.find((cap) => cap.type === type);
  return capability?.isUserSelected;
};

/**
 * Get the capability rule for a given provider
 * @param provider - Provider name
 * @param type - Capability type
 * @returns true/false/null (null means use default logic)
 */
const getProviderCapabilityRule = (provider: string, type: ModelType): boolean | null => {
  const rules = PROVIDER_CAPABILITY_RULES[provider?.toLowerCase()];
  return rules?.[type] ?? null;
};

/**
 * Determine whether a model has a given capability - three-layer resolution inspired by Cherry Studio
 * @param model - Model object
 * @param type - Capability type
 * @returns true=supported, false=unsupported, undefined=unknown
 */
export const hasModelCapability = (model: IProvider, type: ModelType): boolean | undefined => {
  // Build cache key (includes capabilities hash to invalidate stale entries)
  const capabilitiesHash = model.capabilities ? JSON.stringify(model.capabilities) : '';
  const cacheKey = `${model.id}-${model.platform}-${type}-${capabilitiesHash}`;

  // Check cache
  if (modelCapabilitiesCache.has(cacheKey)) {
    return modelCapabilitiesCache.get(cacheKey);
  }

  let result: boolean | undefined;

  // 1. Priority 1: user-configured capability
  const userSelected = getUserSelectedCapability(model, type);
  if (userSelected !== undefined) {
    result = userSelected;
  } else {
    // 2. Priority 2: provider-specific rule
    const providerRule = getProviderCapabilityRule(model.platform, type);
    if (providerRule !== null) {
      result = providerRule;
    } else {
      // 3. Priority 3: regex pattern matching
      // Check whether any model under this platform supports the capability
      const modelNames = model.model || [];

      // Unified handling for all capability types
      // Check whether at least one model supports the capability
      const exclusions = CAPABILITY_EXCLUSIONS[type];
      const pattern = CAPABILITY_PATTERNS[type];

      const hasSupport = modelNames.some((modelName) => {
        const baseModelName = getBaseModelName(modelName);

        // Check blacklist
        const isExcluded = exclusions.some((excludePattern) => excludePattern.test(baseModelName));
        if (isExcluded) return false;

        // Check whitelist
        return pattern.test(baseModelName);
      });

      result = hasSupport ? true : undefined;
    }
  }

  // Cache result
  modelCapabilitiesCache.set(cacheKey, result);
  return result;
};

/**
 * Clear the capability resolution cache
 */
export const clearModelCapabilitiesCache = (): void => {
  modelCapabilitiesCache.clear();
};
