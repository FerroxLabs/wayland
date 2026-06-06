/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resolves the default workflow launch target (backend + cliPath + model) when
 * the renderer does not supply an explicit selection.
 *
 * Extracted from `initBridge.ts` so it can be unit-tested in isolation without
 * triggering that module's side-effect-heavy bootstrap chain.
 *
 * Resolution order:
 *   1. Read `guid.lastSelectedAgent` from ProcessConfig (the key the renderer
 *      stores when the user picks an agent in /guid).
 *   2. Match a detected agent in AgentRegistry by backend to obtain cliPath.
 *   3. Build a `TProviderWithModel` by matching `model.config` + preferred
 *      model id from `acp.config`, falling back through first-of-any →
 *      synthetic placeholder so `start()` never crashes.
 */

import type { TProviderWithModel } from '@/common/config/storage';
import type { WorkflowLaunchTarget } from '@process/services/workflow/WorkflowSessionService';
import type { DetectedAgent } from '@/common/types/detectedAgent';

/**
 * Minimal slice of ProcessConfig used by the resolver. Injected as a
 * dependency so unit tests can supply a fake without importing the real
 * ConfigStorage singleton (which hits the filesystem).
 */
export type ProcessConfigLike = {
  get(key: string): Promise<unknown>;
};

/**
 * Minimal slice of AgentRegistry used by the resolver.
 */
export type AgentRegistryLike = {
  getDetectedAgents(): DetectedAgent[];
};

/**
 * Resolve the default workflow launch target given the user's persisted
 * last-selected-agent key and the live agent registry.
 *
 * @param config - ProcessConfig-compatible accessor
 * @param registry - AgentRegistry-compatible accessor
 */
export async function resolveDefaultLaunchTarget(
  config: ProcessConfigLike,
  registry: AgentRegistryLike
): Promise<WorkflowLaunchTarget & { customAgentId?: string }> {
  // 1. Determine backend from guid.lastSelectedAgent
  let backend = 'claude';
  let customAgentId: string | undefined;

  try {
    const lastKey = await config.get('guid.lastSelectedAgent');
    if (typeof lastKey === 'string' && lastKey.length > 0) {
      if (lastKey.startsWith('custom:')) {
        customAgentId = lastKey.slice(7);
        // Custom preset - backend is not directly encoded in the key. The
        // agent registry doesn't expose per-preset backends, so we leave
        // backend as 'claude' (the spawner default) and let the renderer's
        // explicit params override this in the normal path.
        backend = 'claude';
      } else if (lastKey.startsWith('remote:')) {
        backend = 'remote';
      } else {
        backend = lastKey;
      }
    }
  } catch {
    // No saved key or config read failure - backend stays 'claude'.
  }

  // 2. Resolve cliPath from the detected agent list
  const detected = registry.getDetectedAgents();
  const match = detected.find((a) => a.backend === backend);
  const cliPath: string | undefined = match ? (match as DetectedAgent & { cliPath?: string }).cliPath : undefined;

  // 3. Build TProviderWithModel
  let providerList: TProviderWithModel[] = [];
  try {
    const providers = await config.get('model.config');
    if (providers && Array.isArray(providers)) {
      providerList = providers as TProviderWithModel[];
    }
  } catch {
    // Uninitialized config - fall through to synthetic placeholder.
  }

  let preferredModelId: string | undefined;
  try {
    const acpConfig = await config.get('acp.config');
    if (acpConfig !== null && typeof acpConfig === 'object' && !Array.isArray(acpConfig)) {
      const perBackend = (acpConfig as Record<string, unknown>)[backend];
      if (perBackend !== null && typeof perBackend === 'object' && !Array.isArray(perBackend)) {
        const preferred = (perBackend as Record<string, unknown>).preferredModelId;
        if (typeof preferred === 'string') {
          preferredModelId = preferred;
        }
      }
    }
  } catch {
    // Config key absent - fall through.
  }

  // If acp.config didn't have a preferred model, fall through to
  // acp.cachedModels[backend].currentModelId - the live-discovered default
  // for the backend's current binary. Literal string 'auto' is NOT a valid
  // model identifier (upstream providers reject it with model_not_found
  // - caught in v0.6.1 live smoke).
  let cachedModelId: string | undefined;
  if (!preferredModelId) {
    try {
      const cachedModels = await config.get('acp.cachedModels');
      if (cachedModels !== null && typeof cachedModels === 'object' && !Array.isArray(cachedModels)) {
        const perBackend = (cachedModels as Record<string, unknown>)[backend];
        if (perBackend !== null && typeof perBackend === 'object' && !Array.isArray(perBackend)) {
          const current = (perBackend as Record<string, unknown>).currentModelId;
          if (typeof current === 'string' && current.length > 0) {
            cachedModelId = current;
          }
        }
      }
    } catch {
      // acp.cachedModels absent or unreadable - fall through to first model.
    }
  }

  const providerMatch = providerList.find((p) => p.platform === backend || p.id === backend);
  const desiredModelId = preferredModelId || cachedModelId;
  // `model.config` rows are IProvider at runtime (each carries the `model[]`
  // catalog), even though the local type omits it. Read it back safely.
  const catalogOf = (p: TProviderWithModel): string[] => {
    const m = (p as unknown as { model?: unknown }).model;
    return Array.isArray(m) ? (m as string[]) : [];
  };
  const modelOwner =
    desiredModelId && desiredModelId.length > 0
      ? providerList.find((p) => catalogOf(p).includes(desiredModelId))
      : undefined;

  let model: TProviderWithModel;
  if (providerMatch) {
    const useModel = desiredModelId || providerMatch.useModel || '';
    model = { ...providerMatch, useModel } as TProviderWithModel;
  } else if (modelOwner && desiredModelId) {
    // `wcore` (and any backend that is not itself a provider) proxies whichever
    // provider serves the chosen model. Bind the desired model to the provider
    // whose catalog contains it, NOT providerList[0] - pasting e.g. an OpenAI
    // `gpt-5.5` onto a Google provider POSTs it to the Google API → 404. (C1)
    model = { ...modelOwner, useModel: desiredModelId } as TProviderWithModel;
  } else if (providerList.length > 0) {
    // No provider matched the backend AND none serves the desired model - use
    // the first provider with ITS OWN model rather than a foreign alias that
    // would 404 against the wrong endpoint. (C1/C2)
    const first = providerList[0];
    const ownModel = catalogOf(first)[0];
    const useModel = ownModel || first.useModel || '';
    model = { ...first, useModel } as TProviderWithModel;
  } else {
    // No providers configured - synthetic placeholder. The conversation
    // will land but the agent send will fail loudly with a clear
    // "configure a provider" error rather than the cryptic upstream 404
    // that 'auto' produces.
    model = {
      id: `${backend}-fallback`,
      name: backend,
      useModel: preferredModelId || cachedModelId || '',
      platform: backend,
      baseUrl: '',
      apiKey: '',
    } as TProviderWithModel;
  }

  return { backend, cliPath, model, ...(customAgentId ? { customAgentId } : {}) };
}
