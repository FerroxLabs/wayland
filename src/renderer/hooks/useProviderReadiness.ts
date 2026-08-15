/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import {
  modelRegistryCapabilitySnapshotGeneration,
  projectModelRegistryReadiness,
} from '@/common/chat/capability/modelRegistryCapabilityAdapter';

/**
 * Why the engine's agents are still asleep, when no working inference provider
 * is configured.
 *
 * - `no-provider`  - nothing is connected at all.
 * - `all-errored`  - one or more providers are connected, but every one is in
 *   an error state / carries a blocking connect error.
 * - `checking`     - connectivity is still being proved and no callable model
 *   inventory is available yet.
 * - `no-models`    - credentials are connected but the registry has no model.
 */
export type ProviderReadinessReason = 'no-provider' | 'all-errored' | 'checking' | 'no-models' | 'registry-error';

export type ProviderReadiness = {
  /** True once at least one configured provider has inventory the engine may attempt. */
  ready: boolean;
  /** True while the underlying provider list is still loading. */
  loading: boolean;
  /** Why agents are asleep - only set when `ready` is false and not loading. */
  reason?: ProviderReadinessReason;
};

/**
 * Reports whether a provider is configured for a dispatch attempt, so the
 * in-thread activation card does not block a valid setup before a live request
 * has had the opportunity to prove or disprove provider liveness.
 *
 * The renderer cannot read API keys, so readiness is derived only from the
 * renderer-safe registry state, callable inventory, and the main process's
 * explicit dispatch-eligibility result. A transient `testing` provider is not
 * promoted until the actual dispatcher accepts that inventory.
 */
/**
 * Which in-thread activation prompt (if any) the current readiness justifies.
 *
 * - `'connect'` - nothing is configured at all. This is the ONLY state that may
 *   claim "connect a model provider": it is the only one where that is true.
 * - `'repair'`  - providers ARE configured but none can currently take a task
 *   (every one blocked, no callable inventory, or the registry read failed).
 *   The remedies are the same three paths, but the copy must not tell a
 *   fully-provisioned user they have no provider.
 * - `null`      - ready, still loading, or a transient `checking` probe. A turn
 *   that fails for an unrelated reason (engine spawn, Constitution, network)
 *   leaves readiness untouched and must never surface an activation prompt -
 *   the failure's own remedy card owns that turn.
 */
export type ActivationPrompt = 'connect' | 'repair';

export function activationPromptFor(readiness: ProviderReadiness): ActivationPrompt | null {
  if (readiness.loading) return null;
  switch (readiness.reason) {
    case 'no-provider':
      return 'connect';
    case 'all-errored':
    case 'no-models':
    case 'registry-error':
      return 'repair';
    default:
      // `ready`, or `checking` - a provider is mid-probe, which is transient and
      // not something to interrupt the thread over.
      return null;
  }
}

export function useProviderReadiness(): ProviderReadiness {
  const { providers, loading, error } = useModelRegistry();

  return useMemo<ProviderReadiness>(() => {
    if (loading) {
      return { ready: false, loading: true };
    }
    if (error) {
      return { ready: false, loading: false, reason: 'registry-error' };
    }
    if (providers.length === 0) {
      return { ready: false, loading: false, reason: 'no-provider' };
    }
    const projection = projectModelRegistryReadiness(providers, {
      generation: modelRegistryCapabilitySnapshotGeneration(providers),
      now: Date.now(),
    });
    // A persisted connected row proves only configured dispatch eligibility,
    // never current provider liveness. It is sufficient to let the engine
    // attempt the turn when enabled inventory exists; runtime failure remains
    // authoritative and will move the row to error. A future live-probe
    // producer may independently yield projection.state === 'ready'.
    const configuredForDispatch = projection.providers.some(
      (provider) => provider.status === 'configured' && provider.callableModelCount > 0
    );
    const ready = projection.state === 'ready' || configuredForDispatch;
    if (ready) {
      return { ready: true, loading: false };
    }
    if (projection.state === 'invalid') {
      return { ready: false, loading: false, reason: 'registry-error' };
    }
    if (providers.some((provider) => provider.state === 'testing' && provider.error === undefined)) {
      return { ready: false, loading: false, reason: 'checking' };
    }
    if (providers.some((provider) => provider.state === 'connected' && (provider.callableModelCount ?? 0) === 0)) {
      return { ready: false, loading: false, reason: 'no-models' };
    }
    return { ready: false, loading: false, reason: 'all-errored' };
  }, [providers, loading, error]);
}
