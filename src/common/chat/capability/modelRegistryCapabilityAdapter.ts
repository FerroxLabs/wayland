/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelRegistryProviderView } from '@/common/adapter/ipcBridge';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import {
  CAPABILITY_PROJECTION_VERSION,
  compareCapabilityIdentity,
  projectCapabilities,
  type CapabilityEvidence,
  type CapabilityModelEvidence,
  type CapabilityProjection,
  type CapabilitySourceContractIdentity,
  type ProviderMode,
} from './capabilityProjection';

/**
 * Executable, reviewable adapter mapping. Runtime mapping reads these values
 * directly, so behavior cannot drift from the bytes used for contract identity.
 * Reducer semantics remain independently versioned by
 * `CAPABILITY_PROJECTION_VERSION`; this digest claims only adapter behavior.
 */
export const MODEL_REGISTRY_CAPABILITY_MAPPING = {
  schema: 3,
  source: 'stored_config',
  status: 'configured',
  providerModes: {
    'flux-router': 'flux',
    'ollama-local': 'local',
    default: 'byok',
  },
  blockingStates: ['error'],
  requireDispatchEligibility: true,
  callableInventory: 'enabled-curated-count',
  observationIdentity: 'provider-and-inventory-mutation-time',
  ordering: 'observedAt-then-providerId-code-unit',
  evidenceId: 'model-registry:{generation}:{providerId}',
  reducerContractVersion: CAPABILITY_PROJECTION_VERSION,
} as const;

type RegistryCapabilityPayload = CapabilityEvidence & { kind: 'provider' };

function mapProviderPayload(provider: IModelRegistryProviderView): RegistryCapabilityPayload['payload'] {
  const hasBlockingError =
    MODEL_REGISTRY_CAPABILITY_MAPPING.blockingStates.some((state) => provider.state === state) ||
    provider.error !== undefined ||
    (MODEL_REGISTRY_CAPABILITY_MAPPING.requireDispatchEligibility && provider.dispatchEligible !== true);
  const reason = hasBlockingError ? `Provider registry reports ${provider.error ?? 'connection failure'}` : undefined;
  return {
    providerId: provider.providerId,
    mode: providerMode(provider.providerId),
    status: MODEL_REGISTRY_CAPABILITY_MAPPING.status,
    ...(reason ? { reason } : {}),
    models: [] as CapabilityModelEvidence[],
    callableModelCount: hasBlockingError ? 0 : (provider.callableModelCount ?? 0),
  };
}

/**
 * Canonical executable truth table for every finite branch in the adapter.
 * The contract digest binds both the declarative rules and the outputs of the
 * exact mapper runtime uses, so a hard-coded branch change cannot retain the
 * old digest merely because a descriptive constant was left untouched.
 */
function executableMappingVectors(): readonly unknown[] {
  const providers = ['flux-router', 'ollama-local', 'openai'] as const;
  const states = ['connected', 'testing', 'error'] as const;
  const dispatchValues: readonly (boolean | undefined)[] = [true, false, undefined];
  const errors: readonly ('unauthorized' | undefined)[] = [undefined, 'unauthorized'];
  return providers.flatMap((providerId) =>
    states.flatMap((state) =>
      dispatchValues.flatMap((dispatchEligible) =>
        errors.map((error) => {
          const input: IModelRegistryProviderView = {
            providerId,
            connectedVia: 'key',
            state,
            modelCount: 7,
            callableModelCount: 3,
            ...(dispatchEligible === undefined ? {} : { dispatchEligible }),
            ...(error === undefined ? {} : { error }),
          };
          return {
            input: { providerId, state, dispatchEligible: dispatchEligible ?? null, error: error ?? null },
            output: mapProviderPayload(input),
          };
        })
      )
    )
  );
}

export function modelRegistryCapabilityMappingDigest(): `sha256:${string}` {
  const encoded = new TextEncoder().encode(
    JSON.stringify({ rules: MODEL_REGISTRY_CAPABILITY_MAPPING, executableVectors: executableMappingVectors() })
  );
  return `sha256:${bytesToHex(sha256(encoded))}`;
}

export const MODEL_REGISTRY_CAPABILITY_CONTRACT: CapabilitySourceContractIdentity = {
  name: 'wayland-desktop-model-registry-configuration',
  version: '1.5.0',
  digest: modelRegistryCapabilityMappingDigest(),
};

function providerMode(providerId: string): ProviderMode {
  const modes = MODEL_REGISTRY_CAPABILITY_MAPPING.providerModes;
  if (providerId === 'flux-router') return modes['flux-router'];
  if (providerId === 'ollama-local') return modes['ollama-local'];
  return modes.default;
}

/** Deterministic identity for the exact non-secret registry snapshot consumed. */
export function modelRegistryCapabilitySnapshotGeneration(
  providers: readonly IModelRegistryProviderView[]
): `model-registry-snapshot:${string}` {
  const rows = [...providers]
    .toSorted((left, right) => compareCapabilityIdentity(left.providerId, right.providerId))
    .map((provider) => ({
      providerId: provider.providerId,
      connectedVia: provider.connectedVia,
      state: provider.state,
      modelCount: provider.modelCount,
      callableModelCount: provider.callableModelCount ?? null,
      dispatchEligible: provider.dispatchEligible ?? null,
      observedAt: provider.observedAt ?? null,
      error: provider.error ?? null,
    }));
  const digest = bytesToHex(sha256(new TextEncoder().encode(JSON.stringify(rows))));
  return `model-registry-snapshot:${digest}`;
}

/**
 * The only production claim made by this adapter is configured dispatch
 * eligibility. Persisted rows never prove current network/provider liveness;
 * only a separate runtime probe producer may publish `available`. The
 * generic reducer also understands selected-session, MCP, voice, and browser
 * evidence, but those capabilities remain protocol primitives until their own
 * authoritative producers are connected; this adapter deliberately exposes
 * none of those dormant fields.
 *
 * Model identities are deliberately not invented: list() exposes only a
 * count, so the adapter publishes callableModelCount with an empty named
 * catalog. Exact selected-model validation must use a richer session receipt.
 */
export type ModelRegistryReadinessProjection = Readonly<
  Pick<CapabilityProjection, 'contractVersion' | 'state' | 'providers' | 'issues' | 'evidenceIds'>
>;

function narrowReadinessProjection(projection: CapabilityProjection): ModelRegistryReadinessProjection {
  return Object.freeze({
    contractVersion: projection.contractVersion,
    state: projection.state,
    providers: projection.providers,
    issues: projection.issues,
    evidenceIds: projection.evidenceIds,
  });
}

export function projectModelRegistryReadiness(
  providers: readonly IModelRegistryProviderView[],
  context: { generation: string; now: number }
): ModelRegistryReadinessProjection {
  const generation = context.generation.trim();
  if (!generation) {
    const invalid = projectCapabilities([null], {
      conversationId: 'desktop-provider-readiness',
      sessionId: 'model-registry',
      now: context.now,
      expectedSourceContracts: {},
      expectedSourceInstances: {},
    });
    return narrowReadinessProjection(invalid);
  }
  // Sequence must agree with `observedAt`: the reducer rejects a stream whose
  // time moves backwards as `conflicting_claims`, which invalidates the WHOLE
  // projection (`providers: []`), and `useProviderReadiness` then reports
  // `registry-error` - so a fully configured install is told its agents are
  // asleep and shown "connect a model provider".
  //
  // Ordering by providerId alone did exactly that whenever connect order
  // differed from identity order, which first-run auto-discovery makes routine:
  // wiring `groq` (observedAt T) before `google-gemini` (T+413ms) put the later
  // timestamp at sequence 0 and the earlier one at sequence 1. Reproduced live
  // on a clean profile with four healthy providers, every one `connected` and
  // `dispatchEligible`.
  //
  // These rows are concurrent facts, not a time series, so the identity sort
  // was only ever a determinism device. Keep it as the tiebreak - a provider
  // may carry no `observedAt` - and let time lead.
  const orderedProviders = [...providers].toSorted(
    (left, right) =>
      (left.observedAt ?? 0) - (right.observedAt ?? 0) || compareCapabilityIdentity(left.providerId, right.providerId)
  );
  const endSequence = Math.max(0, orderedProviders.length - 1);
  const evidence: CapabilityEvidence[] = orderedProviders.map((provider, sequence) => {
    return {
      contractVersion: CAPABILITY_PROJECTION_VERSION,
      evidenceId: `model-registry:${generation}:${provider.providerId}`,
      source: MODEL_REGISTRY_CAPABILITY_MAPPING.source,
      sourceInstance: generation,
      sourceContract: MODEL_REGISTRY_CAPABILITY_CONTRACT,
      observedAt: provider.observedAt,
      sequence,
      streamWindow: { startSequence: 0, endSequence },
      kind: 'provider',
      payload: mapProviderPayload(provider),
    };
  });
  const projection = projectCapabilities(evidence, {
    conversationId: 'desktop-provider-readiness',
    sessionId: 'model-registry',
    now: context.now,
    expectedSourceContracts: { stored_config: MODEL_REGISTRY_CAPABILITY_CONTRACT },
    expectedSourceInstances: { stored_config: generation },
  });
  return narrowReadinessProjection(projection);
}
