/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import {
  CAPABILITY_PROJECTION_VERSION,
  MAX_CAPABILITY_EVIDENCE,
  compareCapabilityIdentity,
  projectCapabilities,
  type CapabilityEvidence,
} from '@/common/chat/capability/capabilityProjection';
import {
  MODEL_REGISTRY_CAPABILITY_CONTRACT,
  modelRegistryCapabilityMappingDigest,
  modelRegistryCapabilitySnapshotGeneration,
  projectModelRegistryReadiness,
} from '@/common/chat/capability/modelRegistryCapabilityAdapter';

const NOW = 10_000;
const TEST_CONTRACTS = {
  session_receipt: { name: 'test-session-receipt', version: '1', digest: 'sha256:session' },
  runtime_probe: { name: 'test-runtime-probe', version: '1', digest: 'sha256:runtime' },
  routing_contract: { name: 'test-routing-contract', version: '1', digest: 'sha256:routing' },
  engine_ready: { name: 'test-engine-ready', version: '1', digest: 'sha256:engine' },
  provider_registry: { name: 'test-provider-registry', version: '1', digest: 'sha256:registry' },
  stored_config: { name: 'test-stored-config', version: '1', digest: 'sha256:stored' },
  static_catalog: { name: 'test-static-catalog', version: '1', digest: 'sha256:catalog' },
} as const;
const TEST_INSTANCES = {
  session_receipt: ['session-stream-1', 'mcp-session-1', 'new-session-generation'],
  runtime_probe: [
    'runtime-1',
    'runtime-2',
    'anthropic-runtime',
    'ollama-runtime',
    ...Array.from({ length: 10 }, (_, index) => `runtime-${index}`),
  ],
  routing_contract: 'flux-contract',
  engine_ready: 'wcore-session-1',
  provider_registry: 'registry',
  stored_config: 'settings',
  static_catalog: 'bundle',
} as const;
const OPTIONS = {
  conversationId: 'chat-1',
  sessionId: 'session-1',
  now: NOW,
  maxAgeMs: 1_000,
  expectedSourceContracts: TEST_CONTRACTS,
  expectedSourceInstances: TEST_INSTANCES,
} as const;

const base = (overrides: Record<string, unknown> = {}) => {
  const source = (overrides.source ?? 'runtime_probe') as keyof typeof TEST_CONTRACTS;
  const sequence = (overrides.sequence ?? 0) as number;
  return {
    contractVersion: CAPABILITY_PROJECTION_VERSION,
    evidenceId: 'evidence-1',
    source,
    sourceInstance: 'runtime-1',
    sourceContract: TEST_CONTRACTS[source],
    observedAt: NOW,
    sequence,
    streamWindow: { startSequence: sequence, endSequence: sequence },
    ...overrides,
  };
};

const model = (id = 'model-1', inputModalities = ['text'], outputModalities = ['text']) => ({
  id,
  label: id,
  inputModalities,
  outputModalities,
});

const provider = (overrides: Record<string, unknown> = {}, envelope: Record<string, unknown> = {}) =>
  base({
    kind: 'provider',
    payload: { providerId: 'openai', mode: 'byok', status: 'available', models: [model()], ...overrides },
    ...envelope,
  });

const selection = (overrides: Record<string, unknown> = {}, envelope: Record<string, unknown> = {}) =>
  base({
    evidenceId: 'selection-1',
    source: 'session_receipt',
    sourceInstance: 'session-stream-1',
    conversationId: 'chat-1',
    sessionId: 'session-1',
    kind: 'selection',
    payload: { providerId: 'openai', modelId: 'model-1', mode: 'byok', status: 'available', ...overrides },
    ...envelope,
  });

describe('projectCapabilities', () => {
  it('wires the real renderer-safe model registry through the pinned production reducer', () => {
    const result = projectModelRegistryReadiness(
      [
        {
          providerId: 'openai',
          connectedVia: 'key',
          state: 'connected',
          modelCount: 3,
          callableModelCount: 3,
          dispatchEligible: true,
          observedAt: NOW,
        },
      ],
      { generation: 'registry-generation-7', now: NOW }
    );
    expect(result).toMatchObject({
      state: 'needs_setup',
      providers: [{ providerId: 'openai', status: 'configured', callableModelCount: 3, models: [] }],
    });
    expect(MODEL_REGISTRY_CAPABILITY_CONTRACT.digest).toBe(
      'sha256:bd47930c9b1dc28f6cd5c3739a065b7106b3029842bbae43cb189c78c4e7763b'
    );
    expect(MODEL_REGISTRY_CAPABILITY_CONTRACT.digest).toBe(modelRegistryCapabilityMappingDigest());
    expect(Object.hasOwn(result, 'selected')).toBe(false);
    expect(Object.hasOwn(result, 'mcp')).toBe(false);
    expect(Object.hasOwn(result, 'voice')).toBe(false);
    expect(Object.hasOwn(result, 'browser')).toBe(false);
  });

  it('fails closed when the real registry adapter has no generation identity', () => {
    const result = projectModelRegistryReadiness([], { generation: '   ', now: NOW });
    expect(result).toMatchObject({ state: 'invalid', issues: [{ code: 'malformed_evidence' }] });
    expect(Object.hasOwn(result, 'mcp')).toBe(false);
  });

  it('canonicalizes model-registry evidence independently of input order', () => {
    const providers = [
      {
        providerId: 'openai',
        connectedVia: 'key',
        state: 'connected' as const,
        modelCount: 4,
        callableModelCount: 2,
        dispatchEligible: true,
        observedAt: NOW,
      },
      {
        providerId: 'anthropic',
        connectedVia: 'key',
        state: 'testing' as const,
        modelCount: 3,
        callableModelCount: 1,
        dispatchEligible: true,
        observedAt: NOW - 1,
      },
    ];
    const forward = projectModelRegistryReadiness(providers, { generation: 'gen', now: NOW });
    const reverse = projectModelRegistryReadiness(providers.toReversed(), { generation: 'gen', now: NOW });
    expect(reverse).toEqual(forward);
    expect(forward.evidenceIds).toEqual(['model-registry:gen:anthropic', 'model-registry:gen:openai']);
  });

  it('binds registry snapshot identity to every dispatch-affecting field', () => {
    const rows = [
      {
        providerId: 'openai',
        connectedVia: 'key',
        state: 'connected' as const,
        modelCount: 4,
        callableModelCount: 2,
        dispatchEligible: true,
        observedAt: NOW,
      },
      {
        providerId: 'anthropic',
        connectedVia: 'key',
        state: 'testing' as const,
        modelCount: 3,
        callableModelCount: 1,
        dispatchEligible: true,
        observedAt: NOW - 1,
      },
    ];
    const generation = modelRegistryCapabilitySnapshotGeneration(rows);
    expect(modelRegistryCapabilitySnapshotGeneration(rows.toReversed())).toBe(generation);
    expect(modelRegistryCapabilitySnapshotGeneration([{ ...rows[0], dispatchEligible: false }, rows[1]])).not.toBe(
      generation
    );
    expect(modelRegistryCapabilitySnapshotGeneration([{ ...rows[0], observedAt: NOW + 1 }, rows[1]])).not.toBe(
      generation
    );
  });

  it('does not expire persisted configuration or promote it to live availability', () => {
    const result = projectModelRegistryReadiness(
      [
        {
          providerId: 'openai',
          connectedVia: 'key',
          state: 'connected',
          modelCount: 5,
          callableModelCount: 5,
          dispatchEligible: true,
          observedAt: 1,
        },
      ],
      { generation: 'gen', now: 1_000_000 }
    );
    expect(result).toMatchObject({
      state: 'needs_setup',
      providers: [{ providerId: 'openai', status: 'configured', callableModelCount: 5 }],
      issues: [],
    });
  });

  it('represents persisted error history as non-callable configuration, not fresh runtime unavailability', () => {
    const result = projectModelRegistryReadiness(
      [
        {
          providerId: 'openai',
          connectedVia: 'key',
          state: 'error',
          error: 'unauthorized',
          modelCount: 5,
          callableModelCount: 5,
          dispatchEligible: false,
          observedAt: 1,
        },
      ],
      { generation: 'gen', now: 1_000_000 }
    );
    expect(result).toMatchObject({
      state: 'needs_setup',
      providers: [{ status: 'configured', callableModelCount: 0 }],
      issues: [],
    });
  });

  it('does not treat raw catalog count or missing observation identity as live callable truth', () => {
    const rawOnly = projectModelRegistryReadiness(
      [{ providerId: 'openai', connectedVia: 'key', state: 'connected', modelCount: 5, observedAt: NOW }],
      { generation: 'gen', now: NOW }
    );
    expect(rawOnly).toMatchObject({ state: 'needs_setup', providers: [{ callableModelCount: 0 }] });

    const noObservation = projectModelRegistryReadiness(
      [
        {
          providerId: 'openai',
          connectedVia: 'key',
          state: 'connected',
          modelCount: 5,
          callableModelCount: 5,
          dispatchEligible: true,
        },
      ],
      { generation: 'gen', now: NOW }
    );
    expect(noObservation).toMatchObject({ state: 'invalid', issues: [{ code: 'malformed_evidence' }] });
  });

  it('returns a deterministic first-run state when no provider exists', () => {
    expect(projectCapabilities([], OPTIONS)).toMatchObject({
      state: 'needs_setup',
      selected: null,
      providers: [],
      mcp: { status: 'unavailable' },
      browser: { status: 'unavailable' },
    });
  });

  it('projects an available local model without requiring credentials', () => {
    const result = projectCapabilities(
      [provider({ providerId: 'ollama', mode: 'local', models: [model('llama-local')] })],
      OPTIONS
    );
    expect(result).toMatchObject({
      state: 'ready',
      providers: [{ providerId: 'ollama', mode: 'local', status: 'available' }],
    });
  });

  it('accepts live registry state but does not let a static catalog impersonate availability', () => {
    const registry = provider({}, { source: 'provider_registry', sourceInstance: 'registry' });
    expect(projectCapabilities([registry], OPTIONS)).toMatchObject({
      state: 'ready',
      providers: [{ status: 'available' }],
    });

    const catalog = provider(
      { status: 'configured' },
      { source: 'static_catalog', sourceInstance: 'bundle', observedAt: 1 }
    );
    const result = projectCapabilities([catalog], OPTIONS);
    expect(result.state).toBe('needs_setup');
    expect(result.providers[0].status).toBe('configured');
  });

  it('binds BYOK selected-model truth to an exact session receipt', () => {
    const result = projectCapabilities([provider(), selection()], OPTIONS);
    expect(result.selected).toMatchObject({ providerId: 'openai', modelId: 'model-1', mode: 'byok' });
    expect(result.state).toBe('ready');
  });

  it('surfaces a Flux fallback and its degraded reason without rewriting the requested model', () => {
    const flux = provider({ providerId: 'flux-router', mode: 'flux', models: [model('fallback-model')] });
    const first = selection(
      { providerId: 'anthropic', modelId: 'claude-primary', status: 'unavailable' },
      { evidenceId: 'selection-0', sequence: 4, streamWindow: { startSequence: 4, endSequence: 5 } }
    );
    const result = projectCapabilities(
      [
        flux,
        first,
        selection(
          {
            providerId: 'flux-router',
            modelId: 'fallback-model',
            mode: 'flux',
            status: 'fallback',
            requestedModelId: 'flux-auto',
            fallbackFrom: { providerId: 'anthropic', modelId: 'claude-primary' },
            reason: 'provider outage',
          },
          { sequence: 5, streamWindow: { startSequence: 4, endSequence: 5 } }
        ),
      ],
      OPTIONS
    );
    expect(result.state).toBe('degraded');
    expect(result.selected).toMatchObject({
      status: 'fallback',
      requestedModelId: 'flux-auto',
      fallbackFrom: { providerId: 'anthropic', modelId: 'claude-primary' },
      reason: 'provider outage',
    });
  });

  it('accepts a pinned routing contract only as Flux provider capability', () => {
    const flux = provider(
      { providerId: 'flux-router', mode: 'flux', models: [model('flux-auto')] },
      { source: 'routing_contract', sourceInstance: 'flux-contract' }
    );
    expect(projectCapabilities([flux], OPTIONS).providers[0]).toMatchObject({
      providerId: 'flux-router',
      mode: 'flux',
      status: 'available',
    });

    const forged = provider({}, { source: 'routing_contract', sourceInstance: 'flux-contract' });
    expect(projectCapabilities([forged], OPTIONS).issues[0].code).toBe('source_mismatch');
  });

  it('pins normalized evidence to its expected producer contract identity', () => {
    const identity = { name: 'flux-routing-evidence', version: '1.0.0', digest: 'sha256:abc' };
    const flux = provider(
      { providerId: 'flux-router', mode: 'flux', models: [model('flux-auto')] },
      {
        source: 'routing_contract',
        sourceInstance: 'flux-contract',
        sourceContract: identity,
      }
    );
    const options = { ...OPTIONS, expectedSourceContracts: { routing_contract: identity } };
    expect(projectCapabilities([flux], options).state).toBe('ready');
    expect(
      projectCapabilities([{ ...flux, sourceContract: { ...identity, digest: 'sha256:wrong' } }], options).issues[0]
        .code
    ).toBe('source_mismatch');
    const { sourceContract: _removed, ...unpinned } = flux;
    expect(projectCapabilities([unpinned], options).issues[0].code).toBe('malformed_evidence');
    expect(projectCapabilities([flux], { ...options, expectedSourceContracts: {} }).issues[0].code).toBe(
      'source_mismatch'
    );
  });

  it('keeps an authoritative provider outage unavailable', () => {
    const result = projectCapabilities(
      [provider({ status: 'unavailable', reason: 'invalid credential' }), selection({ status: 'unavailable' })],
      OPTIONS
    );
    expect(result.state).toBe('unavailable');
    expect(result.providers[0]).toMatchObject({ status: 'unavailable', reason: 'invalid credential' });
    expect(result.selected).toMatchObject({
      status: 'unavailable',
      reason: 'Selected provider is unavailable: invalid credential',
    });
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'unavailable_dependency' }));
  });

  it('fails closed when selected-session mode contradicts provider capability', () => {
    const result = projectCapabilities([provider(), selection({ mode: 'flux' })], OPTIONS);
    expect(result.state).toBe('invalid');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'conflicting_claims' }));
  });

  it('accepts a correctly chained mid-run model handoff', () => {
    const nextProvider = provider(
      { providerId: 'anthropic', models: [model('claude')] },
      { evidenceId: 'anthropic-provider', sourceInstance: 'anthropic-runtime' }
    );
    const first = selection({}, { sequence: 4, streamWindow: { startSequence: 4, endSequence: 5 } });
    const next = selection(
      { providerId: 'anthropic', modelId: 'claude', handoffFrom: { providerId: 'openai', modelId: 'model-1' } },
      { evidenceId: 'selection-2', sequence: 5, streamWindow: { startSequence: 4, endSequence: 5 } }
    );
    expect(projectCapabilities([provider(), nextProvider, next, first], OPTIONS).selected).toMatchObject({
      providerId: 'anthropic',
      modelId: 'claude',
      handoffFrom: { providerId: 'openai', modelId: 'model-1' },
    });
  });

  it('accepts a same-model status refresh without inventing a handoff', () => {
    const first = selection({}, { sequence: 4, streamWindow: { startSequence: 4, endSequence: 5 } });
    const unavailable = selection(
      { status: 'unavailable', reason: 'session revoked' },
      { evidenceId: 'selection-2', sequence: 5, streamWindow: { startSequence: 4, endSequence: 5 } }
    );
    expect(projectCapabilities([provider(), unavailable, first], OPTIONS)).toMatchObject({
      state: 'unavailable',
      selected: { status: 'unavailable', handoffFrom: null, reason: 'session revoked' },
    });
  });

  it('fails closed when a changed mid-run selection does not bind its predecessor', () => {
    const result = projectCapabilities(
      [
        provider(),
        provider(
          { providerId: 'anthropic', models: [model('claude')] },
          { evidenceId: 'anthropic-provider', sourceInstance: 'anthropic-runtime' }
        ),
        selection({}, { sequence: 4, streamWindow: { startSequence: 4, endSequence: 5 } }),
        selection(
          { providerId: 'anthropic', modelId: 'claude' },
          { evidenceId: 'selection-2', sequence: 5, streamWindow: { startSequence: 4, endSequence: 5 } }
        ),
      ],
      OPTIONS
    );
    expect(result.state).toBe('invalid');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'invalid_handoff' }));
  });

  it('fails selected capability closed when a required modality is unsupported', () => {
    const result = projectCapabilities([provider(), selection()], {
      ...OPTIONS,
      requiredInputModalities: ['image'],
    });
    expect(result.state).toBe('unavailable');
    expect(result.selected?.status).toBe('unavailable');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'unsupported_modality' }));
  });

  it('projects image capability only when the authoritative model declares it', () => {
    const result = projectCapabilities(
      [provider({ models: [model('vision', ['text', 'image'])] }), selection({ modelId: 'vision' })],
      { ...OPTIONS, requiredInputModalities: ['image'] }
    );
    expect(result.selected?.inputModalities).toEqual(['image', 'text']);
    expect(result.state).toBe('ready');
  });

  it('fails closed on stale and future dynamic evidence', () => {
    const stale = projectCapabilities([provider({})], { ...OPTIONS, now: NOW + 1_001 });
    expect(stale.state).toBe('invalid');
    expect(stale.issues[0].code).toBe('stale_evidence');

    const future = projectCapabilities([provider()], { ...OPTIONS, now: NOW - 30_001 });
    expect(future.state).toBe('invalid');
    expect(future.issues[0].code).toBe('future_evidence');
  });

  it('fails closed on malformed, wrong-version, and oversized evidence', () => {
    expect(projectCapabilities([null], OPTIONS).issues[0].code).toBe('malformed_evidence');
    expect(projectCapabilities(null as unknown as [], OPTIONS).issues[0].code).toBe('malformed_evidence');
    expect(projectCapabilities([{ ...provider(), contractVersion: '2.0' }], OPTIONS).issues[0].code).toBe(
      'version_mismatch'
    );
    expect(
      projectCapabilities(
        Array.from({ length: MAX_CAPABILITY_EVIDENCE + 1 }, () => provider()),
        OPTIONS
      ).issues[0].code
    ).toBe('oversized_input');
  });

  it('rejects inherited and custom-prototype protocol evidence', () => {
    const inherited = Object.create(provider()) as CapabilityEvidence;
    expect(projectCapabilities([inherited], OPTIONS).issues[0].code).toBe('malformed_evidence');

    const customEnvelope = structuredClone(provider());
    Object.setPrototypeOf(customEnvelope, { hiddenAuthority: true });
    expect(projectCapabilities([customEnvelope], OPTIONS).issues[0].code).toBe('malformed_evidence');

    const customPayload = structuredClone(provider());
    Object.setPrototypeOf(customPayload.payload, { hiddenAuthority: true });
    expect(projectCapabilities([customPayload], OPTIONS).issues[0].code).toBe('malformed_evidence');

    const customModel = structuredClone(provider());
    Object.setPrototypeOf(customModel.payload.models[0], { hiddenAuthority: true });
    expect(projectCapabilities([customModel], OPTIONS).issues[0].code).toBe('malformed_evidence');
  });

  it('rejects symbol, non-enumerable, and accessor protocol fields', () => {
    const symbolField = structuredClone(provider()) as Record<PropertyKey, unknown>;
    symbolField[Symbol('authority')] = true;

    const nonEnumerable = structuredClone(provider());
    Object.defineProperty(nonEnumerable, 'hiddenAuthority', { value: true, enumerable: false });

    const accessor = structuredClone(provider());
    Object.defineProperty(accessor.payload, 'hiddenAuthority', { get: () => true, enumerable: true });

    const throwingAccessor = structuredClone(provider());
    Object.defineProperty(throwingAccessor, 'evidenceId', {
      get: () => {
        throw new Error('must not execute protocol accessors');
      },
      enumerable: true,
    });

    for (const claim of [symbolField, nonEnumerable, accessor, throwingAccessor]) {
      expect(projectCapabilities([claim as CapabilityEvidence], OPTIONS).issues[0].code).toBe('malformed_evidence');
    }
  });

  it('bounds aggregate inventories and requested modalities', () => {
    const largeModelSet = Array.from({ length: 512 }, (_, index) => model(`model-${index}`));
    const claims = Array.from({ length: 9 }, (_, index) =>
      provider(
        { providerId: `provider-${index}`, models: largeModelSet },
        { evidenceId: `provider-${index}`, sourceInstance: `runtime-${index}` }
      )
    );
    expect(projectCapabilities(claims, OPTIONS).issues).toContainEqual(
      expect.objectContaining({ code: 'oversized_input' })
    );
    expect(projectCapabilities([provider({ models: [], callableModelCount: 513 })], OPTIONS)).toMatchObject({
      state: 'ready',
      providers: [{ callableModelCount: 513 }],
      issues: [],
    });
    expect(
      projectCapabilities([], {
        ...OPTIONS,
        requiredInputModalities: ['text', 'made-up'] as never,
      }).state
    ).toBe('invalid');
  });

  it('deduplicates identical evidence but rejects a reused ID with different claims', () => {
    const duplicate = provider();
    expect(projectCapabilities([duplicate, structuredClone(duplicate)], OPTIONS).evidenceIds).toEqual(['evidence-1']);

    const conflict = provider({ status: 'degraded' });
    expect(projectCapabilities([duplicate, conflict], OPTIONS)).toMatchObject({
      state: 'invalid',
      issues: [expect.objectContaining({ code: 'conflicting_claims' })],
    });
  });

  it('rejects equally authoritative conflicting provider claims', () => {
    const left = provider();
    const right = provider(
      { status: 'degraded', reason: 'rate limited' },
      { evidenceId: 'evidence-2', sourceInstance: 'runtime-2' }
    );
    expect(projectCapabilities([left, right], OPTIONS).issues).toContainEqual(
      expect.objectContaining({ code: 'conflicting_claims' })
    );
  });

  it('prefers a live probe over stored or catalog claims', () => {
    const stored = provider(
      { status: 'configured' },
      { evidenceId: 'stored', source: 'stored_config', sourceInstance: 'settings', observedAt: 1 }
    );
    const catalog = provider(
      { status: 'configured' },
      { evidenceId: 'catalog', source: 'static_catalog', sourceInstance: 'bundle', observedAt: 1 }
    );
    expect(projectCapabilities([stored, catalog, provider()], OPTIONS).providers[0]).toMatchObject({
      status: 'available',
      evidenceId: 'evidence-1',
    });
  });

  it('uses the latest sequence from one provider stream', () => {
    const old = provider(
      { status: 'degraded', reason: 'warming' },
      { streamWindow: { startSequence: 0, endSequence: 1 } }
    );
    const current = provider(
      {},
      { evidenceId: 'evidence-2', sequence: 1, streamWindow: { startSequence: 0, endSequence: 1 } }
    );
    expect(projectCapabilities([current, old], OPTIONS).providers[0]).toMatchObject({
      status: 'available',
      evidenceId: 'evidence-2',
    });
  });

  it('rejects provider and selection streams whose timestamps move backwards', () => {
    const providerBackwards = projectCapabilities(
      [
        provider({}, { evidenceId: 'p-old', sequence: 1, streamWindow: { startSequence: 1, endSequence: 2 } }),
        provider(
          {},
          {
            evidenceId: 'p-new',
            sequence: 2,
            observedAt: NOW - 1,
            streamWindow: { startSequence: 1, endSequence: 2 },
          }
        ),
      ],
      OPTIONS
    );
    expect(providerBackwards.issues).toContainEqual(
      expect.objectContaining({ code: 'conflicting_claims', reason: expect.stringContaining('time moves backwards') })
    );

    const selectionBackwards = projectCapabilities(
      [
        selection({}, { evidenceId: 's-old', sequence: 1, streamWindow: { startSequence: 1, endSequence: 2 } }),
        selection(
          {},
          {
            evidenceId: 's-new',
            sequence: 2,
            observedAt: NOW - 1,
            streamWindow: { startSequence: 1, endSequence: 2 },
          }
        ),
      ],
      OPTIONS
    );
    expect(selectionBackwards.issues).toContainEqual(
      expect.objectContaining({ code: 'conflicting_claims', reason: expect.stringContaining('time moves backwards') })
    );
  });

  it('does not promote standalone MCP reachability to active-session callability', () => {
    const mcp = base({
      kind: 'mcp',
      payload: { serverId: 'tavily', status: 'probe_reachable' },
    });
    const result = projectCapabilities([mcp], OPTIONS);
    expect(result.mcp).toMatchObject({ status: 'unverified', tools: [], resources: [], prompts: [] });
  });

  it('publishes sorted MCP tools, resources, and prompts only from a bound registered receipt', () => {
    const mcp = base({
      source: 'session_receipt',
      sourceInstance: 'mcp-session-1',
      conversationId: 'chat-1',
      sessionId: 'session-1',
      kind: 'mcp',
      payload: {
        serverId: 'firecrawl',
        status: 'registered',
        tools: ['scrape', 'extract', 'scrape'],
        resources: ['docs', 'docs'],
        prompts: ['research'],
      },
    });
    const result = projectCapabilities([mcp], OPTIONS);
    expect(result.mcp).toMatchObject({
      status: 'available',
      tools: ['extract', 'scrape'],
      resources: ['docs'],
      prompts: ['research'],
    });
  });

  it('marks partial MCP session publication degraded instead of hiding the unready server', () => {
    const registered = base({
      evidenceId: 'registered',
      source: 'session_receipt',
      sourceInstance: 'mcp-session-1',
      sequence: 0,
      streamWindow: { startSequence: 0, endSequence: 1 },
      conversationId: 'chat-1',
      sessionId: 'session-1',
      kind: 'mcp',
      payload: { serverId: 'tavily', status: 'registered', tools: ['search'] },
    });
    const waiting = base({
      evidenceId: 'waiting',
      source: 'session_receipt',
      sourceInstance: 'mcp-session-1',
      sequence: 1,
      streamWindow: { startSequence: 0, endSequence: 1 },
      conversationId: 'chat-1',
      sessionId: 'session-1',
      kind: 'mcp',
      payload: { serverId: 'firecrawl', status: 'published_unverified' },
    });
    expect(projectCapabilities([registered, waiting], OPTIONS).mcp).toMatchObject({
      status: 'degraded',
      tools: ['search'],
    });
  });

  it('rejects MCP inventory and registration minted by a standalone probe', () => {
    const mcp = base({
      kind: 'mcp',
      payload: { serverId: 'n8n', status: 'registered', tools: ['run_workflow'] },
    });
    expect(projectCapabilities([mcp], OPTIONS).issues[0].code).toBe('source_mismatch');
  });

  it('projects independently probed voice and engine-ready browser capability', () => {
    const voiceInput = base({
      evidenceId: 'voice-input',
      sequence: 0,
      streamWindow: { startSequence: 0, endSequence: 1 },
      kind: 'voice',
      payload: { direction: 'input', providerId: 'whisper-local', status: 'available' },
    });
    const voiceOutput = base({
      evidenceId: 'voice-output',
      sequence: 1,
      streamWindow: { startSequence: 0, endSequence: 1 },
      kind: 'voice',
      payload: { direction: 'output', providerId: 'openai', status: 'available', voices: ['nova'] },
    });
    const browser = base({
      evidenceId: 'browser',
      source: 'engine_ready',
      sourceInstance: 'wcore-session-1',
      kind: 'browser',
      payload: { status: 'available', controls: ['interact', 'navigate', 'observe'] },
    });
    const result = projectCapabilities([browser, voiceOutput, voiceInput], OPTIONS);
    expect(result.voice).toEqual({
      input: { status: 'available', providerId: 'whisper-local', voices: [], reason: null },
      output: { status: 'available', providerId: 'openai', voices: ['nova'], reason: null },
    });
    expect(result.browser).toEqual({
      status: 'available',
      controls: ['interact', 'navigate', 'observe'],
      reason: null,
    });
  });

  it('rejects stored configuration pretending to prove live voice or browser availability', () => {
    const voice = base({
      source: 'stored_config',
      kind: 'voice',
      payload: { direction: 'input', providerId: 'flux-voice', status: 'available' },
    });
    const browser = base({
      evidenceId: 'browser',
      source: 'stored_config',
      kind: 'browser',
      payload: { status: 'available', controls: ['navigate'] },
    });
    const result = projectCapabilities([voice, browser], OPTIONS);
    expect(result.state).toBe('invalid');
    expect(result.issues.every((entry) => entry.code === 'source_mismatch')).toBe(true);
  });

  it('lets stored voice/browser evidence describe configuration only, never failure or liveness', () => {
    const storedVoice = (status: 'configured' | 'degraded' | 'unavailable') =>
      base({
        source: 'stored_config',
        sourceInstance: 'settings',
        kind: 'voice',
        payload: { direction: 'input', providerId: 'flux-voice', status },
      });
    const storedBrowser = (status: 'configured' | 'degraded' | 'unavailable') =>
      base({
        source: 'stored_config',
        sourceInstance: 'settings',
        kind: 'browser',
        payload: { status, controls: [] },
      });

    expect(projectCapabilities([storedVoice('configured')], OPTIONS).voice.input.status).toBe('configured');
    expect(projectCapabilities([storedBrowser('configured')], OPTIONS).browser.status).toBe('configured');
    for (const claim of [
      storedVoice('degraded'),
      storedVoice('unavailable'),
      storedBrowser('degraded'),
      storedBrowser('unavailable'),
    ]) {
      expect(projectCapabilities([claim], OPTIONS).issues[0].code).toBe('source_mismatch');
    }
  });

  it('rejects routing/configuration evidence claiming selected-session authority', () => {
    const forged = { ...selection(), source: 'routing_contract' };
    expect(projectCapabilities([forged], OPTIONS).issues[0].code).toBe('source_mismatch');
  });

  it('rejects stale cross-session receipts', () => {
    const result = projectCapabilities([selection({}, { sessionId: 'session-old' })], OPTIONS);
    expect(result).toMatchObject({ state: 'invalid', issues: [expect.objectContaining({ code: 'session_mismatch' })] });
  });

  it('fails closed rather than throwing when hostile evidence properties cannot be read', () => {
    const hostile = Object.defineProperty({}, 'contractVersion', {
      get() {
        throw new Error('hostile getter');
      },
    });
    expect(() => projectCapabilities([hostile], OPTIONS)).not.toThrow();
    expect(projectCapabilities([hostile], OPTIONS)).toMatchObject({
      state: 'invalid',
      issues: [expect.objectContaining({ code: 'malformed_evidence' })],
    });
  });

  it('fails closed when a hostile top-level array iterator throws', () => {
    const hostile = [provider()];
    Object.defineProperty(hostile, Symbol.iterator, {
      value: () => {
        throw new Error('iterator-secret');
      },
    });
    expect(() => projectCapabilities(hostile, OPTIONS)).not.toThrow();
    const result = projectCapabilities(hostile, OPTIONS);
    expect(result).toMatchObject({ state: 'invalid', issues: [{ code: 'malformed_evidence' }] });
    expect(JSON.stringify(result)).not.toContain('iterator-secret');
  });

  it('rejects credential-shaped display identifiers and inventory without echoing them', () => {
    const credential = 'sk-abcdefghijklmnopqrstuvwxyz';
    const claims = [
      provider({ providerId: credential }),
      provider({ models: [model(credential)] }),
      base({ kind: 'mcp', payload: { serverId: credential, status: 'probe_reachable' } }),
    ];
    for (const claim of claims) {
      const result = projectCapabilities([claim], OPTIONS);
      expect(result.state).toBe('invalid');
      expect(JSON.stringify(result)).not.toContain(credential);
    }
  });

  it('keeps exact-generation session truth for long runs and rejects a prior runtime generation', () => {
    const oldButBound = selection({}, { observedAt: 1 });
    expect(
      projectCapabilities([provider(), oldButBound], {
        ...OPTIONS,
      }).selected
    ).toMatchObject({ modelId: 'model-1' });

    expect(
      projectCapabilities([oldButBound], {
        ...OPTIONS,
        expectedSourceInstances: { ...TEST_INSTANCES, session_receipt: 'new-session-generation' },
      }).issues
    ).toContainEqual(expect.objectContaining({ code: 'source_mismatch' }));
  });

  it('rejects a gap in the bounded global source stream even when entities differ', () => {
    const first = provider({}, { sequence: 0, streamWindow: { startSequence: 0, endSequence: 2 } });
    const third = base({
      evidenceId: 'voice-third',
      sequence: 2,
      streamWindow: { startSequence: 0, endSequence: 2 },
      kind: 'voice',
      payload: { direction: 'input', providerId: 'local', status: 'available' },
    });
    expect(projectCapabilities([first, third], OPTIONS).issues).toContainEqual(
      expect.objectContaining({ code: 'evidence_gap' })
    );
  });

  it('rejects reuse of a global stream sequence across different entities', () => {
    const voice = base({
      evidenceId: 'voice-same-sequence',
      kind: 'voice',
      payload: { direction: 'input', providerId: 'local', status: 'available' },
    });
    expect(projectCapabilities([provider(), voice], OPTIONS).issues).toContainEqual(
      expect.objectContaining({ code: 'conflicting_claims' })
    );
  });

  it('uses old evidence for continuity but applies freshness only to the latest reduced liveness state', () => {
    const old = provider(
      { status: 'degraded', reason: 'starting' },
      { observedAt: 1, sequence: 0, streamWindow: { startSequence: 0, endSequence: 1 } }
    );
    const fresh = provider(
      {},
      { evidenceId: 'fresh', sequence: 1, streamWindow: { startSequence: 0, endSequence: 1 } }
    );
    expect(projectCapabilities([old, fresh], OPTIONS)).toMatchObject({
      state: 'ready',
      providers: [{ evidenceId: 'fresh', status: 'available' }],
      issues: [],
    });
  });

  it('lets newer live provider and MCP failures supersede older session receipts', () => {
    const receiptProvider = provider(
      {},
      {
        evidenceId: 'receipt-provider',
        source: 'session_receipt',
        sourceInstance: 'session-stream-1',
        conversationId: 'chat-1',
        sessionId: 'session-1',
        observedAt: NOW - 100,
      }
    );
    const liveProvider = provider(
      { status: 'unavailable', reason: 'credential revoked' },
      { sequence: 0, streamWindow: { startSequence: 0, endSequence: 1 } }
    );
    const receiptMcp = base({
      evidenceId: 'receipt-mcp',
      source: 'session_receipt',
      sourceInstance: 'mcp-session-1',
      conversationId: 'chat-1',
      sessionId: 'session-1',
      observedAt: NOW - 100,
      kind: 'mcp',
      payload: { serverId: 'firecrawl', status: 'registered', tools: ['scrape'] },
    });
    const liveMcp = base({
      evidenceId: 'live-mcp',
      sequence: 1,
      streamWindow: { startSequence: 0, endSequence: 1 },
      kind: 'mcp',
      payload: { serverId: 'firecrawl', status: 'failed', reason: 'process exited' },
    });
    const result = projectCapabilities([receiptProvider, liveProvider, receiptMcp, liveMcp], OPTIONS);
    expect(result.providers[0]).toMatchObject({ status: 'unavailable', evidenceId: 'evidence-1' });
    expect(result.mcp).toMatchObject({ status: 'unavailable', tools: [], servers: [{ status: 'failed' }] });
  });

  it('does not let a newer reachability probe erase an authoritative MCP registration receipt', () => {
    const receipt = base({
      evidenceId: 'receipt-mcp',
      source: 'session_receipt',
      sourceInstance: 'mcp-session-1',
      conversationId: 'chat-1',
      sessionId: 'session-1',
      observedAt: NOW - 100,
      kind: 'mcp',
      payload: { serverId: 'firecrawl', status: 'registered', tools: ['scrape'] },
    });
    const reachability = base({
      evidenceId: 'reachable-mcp',
      observedAt: NOW,
      kind: 'mcp',
      payload: { serverId: 'firecrawl', status: 'probe_reachable' },
    });
    expect(projectCapabilities([receipt, reachability], OPTIONS).mcp).toMatchObject({
      status: 'available',
      tools: ['scrape'],
      servers: [expect.objectContaining({ evidenceId: 'receipt-mcp', status: 'registered' })],
    });
  });

  it('aggregates mixed configured and failed MCP servers as degraded', () => {
    const configured = base({
      evidenceId: 'configured',
      sequence: 0,
      streamWindow: { startSequence: 0, endSequence: 1 },
      kind: 'mcp',
      payload: { serverId: 'tavily', status: 'configured' },
    });
    const failed = base({
      evidenceId: 'failed',
      sequence: 1,
      streamWindow: { startSequence: 0, endSequence: 1 },
      kind: 'mcp',
      payload: { serverId: 'firecrawl', status: 'failed', reason: 'process exited' },
    });
    expect(projectCapabilities([configured, failed], OPTIONS).mcp.status).toBe('degraded');
  });

  it('binds runtime evidence to an explicitly pinned generation', () => {
    const result = projectCapabilities([provider()], {
      ...OPTIONS,
      expectedSourceInstances: { ...TEST_INSTANCES, runtime_probe: 'other-generation' },
    });
    expect(result).toMatchObject({ state: 'invalid', issues: [{ code: 'source_mismatch' }] });
  });

  it('separates source authority even when two producers reuse an instance label', () => {
    const sessionProvider = provider(
      {},
      {
        evidenceId: 'session-provider',
        source: 'session_receipt',
        sourceInstance: 'runtime-1',
        conversationId: 'chat-1',
        sessionId: 'session-1',
        observedAt: NOW - 1,
      }
    );
    const result = projectCapabilities([sessionProvider, provider({ status: 'degraded' })], {
      ...OPTIONS,
      expectedSourceInstances: { ...TEST_INSTANCES, session_receipt: 'runtime-1' },
    });
    expect(result.state).toBe('degraded');
    expect(result.providers[0].evidenceId).toBe('evidence-1');
  });

  it('rejects stored configuration claiming dynamic MCP state and empty registered inventory', () => {
    const stored = base({
      source: 'stored_config',
      sourceInstance: 'settings',
      kind: 'mcp',
      payload: { serverId: 'firecrawl', status: 'failed', reason: 'old failure' },
    });
    const emptyRegistered = base({
      source: 'session_receipt',
      sourceInstance: 'mcp-session-1',
      conversationId: 'chat-1',
      sessionId: 'session-1',
      kind: 'mcp',
      payload: { serverId: 'firecrawl', status: 'registered' },
    });
    expect(projectCapabilities([stored], OPTIONS).issues[0].code).toBe('source_mismatch');
    expect(projectCapabilities([emptyRegistered], OPTIONS).issues[0].code).toBe('source_mismatch');
  });

  it('keeps a usable degraded provider degraded and optional provider failures local', () => {
    expect(projectCapabilities([provider({ status: 'degraded', reason: 'rate limited' })], OPTIONS).state).toBe(
      'degraded'
    );
    const healthy = provider({}, { evidenceId: 'healthy' });
    const optionalFailure = provider(
      { providerId: 'anthropic', status: 'degraded', models: [model('claude')] },
      { evidenceId: 'optional', sourceInstance: 'anthropic-runtime' }
    );
    expect(projectCapabilities([optionalFailure, healthy], OPTIONS).state).toBe('ready');
  });

  it('classifies selected unavailability before first-run setup state', () => {
    expect(projectCapabilities([selection({ status: 'unavailable' })], OPTIONS)).toMatchObject({
      state: 'unavailable',
      selected: { status: 'unavailable' },
    });
  });

  it('requires a compatible live model when there is no selected-session receipt', () => {
    const textOnly = provider({ models: [model('text-only', ['text'])] });
    expect(projectCapabilities([textOnly], { ...OPTIONS, requiredInputModalities: ['image'] }).state).toBe(
      'unavailable'
    );
  });

  it('keeps stored-config-only BYOK in setup rather than claiming an outage', () => {
    const configured = provider(
      { status: 'configured' },
      { source: 'stored_config', sourceInstance: 'settings', observedAt: 1 }
    );
    expect(projectCapabilities([configured], OPTIONS).state).toBe('needs_setup');
    const forgedLive = provider(
      { status: 'available' },
      { source: 'stored_config', sourceInstance: 'settings', observedAt: NOW }
    );
    expect(projectCapabilities([forgedLive], OPTIONS).issues[0].code).toBe('source_mismatch');
  });

  it('rejects initial, self-referential, and non-immediate selection lineage', () => {
    const initialFallback = selection({
      status: 'fallback',
      fallbackFrom: { providerId: 'anthropic', modelId: 'claude' },
    });
    expect(projectCapabilities([initialFallback], OPTIONS).issues[0].code).toBe('invalid_handoff');

    const first = selection({}, { sequence: 4, streamWindow: { startSequence: 4, endSequence: 5 } });
    const selfFallback = selection(
      { status: 'fallback', fallbackFrom: { providerId: 'openai', modelId: 'model-1' } },
      { evidenceId: 'self', sequence: 5, streamWindow: { startSequence: 4, endSequence: 5 } }
    );
    expect(projectCapabilities([first, selfFallback], OPTIONS).issues[0].code).toBe('invalid_handoff');
  });

  it('rejects unknown nested fields instead of silently widening producer authority', () => {
    const unknownModel = provider({ models: [{ ...model(), hiddenAuthority: true }] });
    const unknownPair = selection({
      handoffFrom: { providerId: 'openai', modelId: 'old', hiddenAuthority: true },
    });
    expect(projectCapabilities([unknownModel], OPTIONS).issues[0].code).toBe('malformed_evidence');
    expect(projectCapabilities([unknownPair], OPTIONS).issues[0].code).toBe('malformed_evidence');
  });

  it('uses locale-independent code-unit ordering for protocol identity and output', () => {
    expect(['ä', 'z'].toSorted(compareCapabilityIdentity)).toEqual(['z', 'ä']);
    const localeCompare = vi.spyOn(String.prototype, 'localeCompare').mockImplementation(() => {
      throw new Error('locale-dependent comparison used');
    });
    try {
      expect(() =>
        projectCapabilities(
          [
            provider({ providerId: 'ä', models: [model('ä')] }, { evidenceId: 'ä', sourceInstance: 'runtime-2' }),
            provider({ providerId: 'z', models: [model('z')] }, { evidenceId: 'z' }),
          ],
          OPTIONS
        )
      ).not.toThrow();
    } finally {
      localeCompare.mockRestore();
    }
  });

  it('rejects credential-shaped unknown fields without retaining them', () => {
    const raw = provider() as CapabilityEvidence & { apiKey: string; payload: { token: string } };
    raw.apiKey = 'secret-at-envelope';
    (raw.payload as unknown as Record<string, unknown>).token = 'secret-in-payload';
    const result = projectCapabilities([raw], OPTIONS);
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(result).toMatchObject({ state: 'invalid', issues: [{ code: 'malformed_evidence' }] });
  });

  it('freezes the complete owned snapshot', () => {
    const result = projectCapabilities([provider()], OPTIONS);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.providers)).toBe(true);
    expect(Object.isFrozen(result.providers[0].models[0].inputModalities)).toBe(true);
    expect(() => (result.providers as unknown[]).push({})).toThrow();
  });

  it.each([
    ['AWS access key', 'credential AKIA1234567890ABCDEF rejected', ['AKIA1234567890ABCDEF']],
    ['AWS temporary access key', 'credential ASIA1234567890ABCDEF rejected', ['ASIA1234567890ABCDEF']],
    ['GitHub classic PAT', 'github ghp_abcdefghijklmnopqrstuvwxyz failed', ['ghp_abcdefghijklmnopqrstuvwxyz']],
    [
      'GitHub fine-grained PAT',
      'github github_pat_11_AAabcdefghijklmnopqrstuvwxyz failed',
      ['github_pat_11_AAabcdefghijklmnopqrstuvwxyz'],
    ],
    ['GitLab token', 'gitlab glpat-abcdefghijklmnopqrst failed', ['glpat-abcdefghijklmnopqrst']],
    ['GitLab deploy token', 'gitlab gldt-abcdefghijklmnopqrst failed', ['gldt-abcdefghijklmnopqrst']],
    ['Slack token', 'slack xoxb-1234567890-abcdefghijk failed', ['xoxb-1234567890-abcdefghijk']],
    ['Slack session token', 'slack xoxc-1234567890-abcdefghijk failed', ['xoxc-1234567890-abcdefghijk']],
    [
      'Slack webhook',
      'webhook https://hooks.slack.com/services/T12345678/B12345678/abcdefghijklmnop failed',
      ['https://hooks.slack.com/services/T12345678/B12345678/abcdefghijklmnop'],
    ],
    ['Google API key', `google AIza${'A'.repeat(35)} failed`, [`AIza${'A'.repeat(35)}`]],
    [
      'JWT',
      'jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signatureABC failed',
      ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signatureABC'],
    ],
    [
      'private key block',
      'tls -----BEGIN RSA PRIVATE KEY-----\nabcDEF123+/=\n-----END RSA PRIVATE KEY----- failed',
      ['abcDEF123+/=', 'BEGIN RSA PRIVATE KEY'],
    ],
    ['URL userinfo', 'dsn postgresql://alice:p%40ssword@db.example/wayland failed', ['alice:p%40ssword']],
    ['URL token userinfo', 'git https://opaqueCredential123@example.test/repo failed', ['opaqueCredential123']],
    ['Redis URL password', 'dsn redis://:redisPassword123@cache.example/0 failed', ['redisPassword123']],
    [
      'URL query credentials',
      'url https://api.example/run?Api_Key=querySecret123&ok=1&access_token=accessSecret456 failed',
      ['querySecret123', 'accessSecret456'],
    ],
    [
      'AWS signed URL query',
      'url https://s3.example/object?X-Amz-Credential=awsCredential123&X-Amz-Signature=awsSignature456',
      ['awsCredential123', 'awsSignature456'],
    ],
    [
      'connection string password',
      'Host=db.example;User Id=alice;PaSsWoRd=connectionSecret123;Database=wayland',
      ['connectionSecret123'],
    ],
    [
      'cloud connection string keys',
      'AccountName=wayland;AccountKey=azureSecret123;SharedAccessSignature="signatureSecret456"',
      ['azureSecret123', 'signatureSecret456'],
    ],
    [
      'mixed-case generic assignments',
      `Api_Key="quotedSecret123" CLIENT SECRET: clientSecret456 Authorization: Basic ${'Z'.repeat(32)}`,
      ['quotedSecret123', 'clientSecret456', 'Z'.repeat(32)],
    ],
  ])('redacts %s before any degraded reason enters the snapshot', (_label, reason, rawSecrets) => {
    const result = projectCapabilities([provider({ status: 'degraded', reason })], OPTIONS);
    const serialized = JSON.stringify(result);
    for (const secret of rawSecrets) expect(serialized).not.toContain(secret);
    expect(result.providers[0].reason).toContain('[redacted');
  });

  it('redacts multiple embedded credentials without over-redacting ordinary prose', () => {
    const secrets = [
      'AKIA1234567890ABCDEF',
      'gho_abcdefghijklmnopqrstuvwxyz',
      'glpat-abcdefghijklmnopqrst',
      'xoxp-1234567890-abcdefghijk',
      `AIza${'B'.repeat(35)}`,
    ];
    const mixed = `outage ${secrets.join(' then ')} Api-Key=MiXeDassignmentSecret`;
    const result = projectCapabilities([provider({ status: 'degraded', reason: mixed })], OPTIONS);
    const serialized = JSON.stringify(result);
    for (const secret of [...secrets, 'MiXeDassignmentSecret']) expect(serialized).not.toContain(secret);

    const prose = 'The token budget is low; keep the secret planning discussion in the project.';
    expect(projectCapabilities([provider({ status: 'degraded', reason: prose })], OPTIONS).providers[0].reason).toBe(
      prose
    );
  });

  it('keeps redaction work and retained output bounded for pathological reasons', () => {
    const bounded = 'api_key=abcdefghijklmnopqrstuvwxyz '.repeat(20).slice(0, 512);
    const result = projectCapabilities([provider({ status: 'degraded', reason: bounded })], OPTIONS);
    expect(result.providers[0].reason?.length).toBeLessThanOrEqual(512);
    expect(JSON.stringify(result)).not.toContain('abcdefghijklmnopqrstuvwxyz');

    const oversized = projectCapabilities(
      [provider({ status: 'degraded', reason: `password=${'x'.repeat(513)}` })],
      OPTIONS
    );
    expect(oversized.state).toBe('invalid');
    expect(JSON.stringify(oversized)).not.toContain('x'.repeat(64));
  });

  it('rejects oversized whitespace identities before normalization', () => {
    const result = projectCapabilities([], { ...OPTIONS, conversationId: ' '.repeat(129) });
    expect(result).toMatchObject({ state: 'invalid', issues: [{ code: 'malformed_evidence' }] });
  });

  it('orders invalid issues deterministically even when code and evidence id match', () => {
    const forward = projectCapabilities([null, {}], OPTIONS);
    const reverse = projectCapabilities([{}, null], OPTIONS);
    expect(reverse).toEqual(forward);
    expect(forward.issues).toHaveLength(2);
  });

  it('fails closed on a hostile nested reason getter without retaining or throwing its value', () => {
    const raw = provider({ status: 'degraded' });
    Object.defineProperty(raw.payload, 'reason', {
      get() {
        throw new Error('nested-secret-value');
      },
    });
    expect(() => projectCapabilities([raw], OPTIONS)).not.toThrow();
    const result = projectCapabilities([raw], OPTIONS);
    expect(result.state).toBe('invalid');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'malformed_evidence' }));
    expect(JSON.stringify(result)).not.toContain('nested-secret-value');
  });

  it('is deterministic across input order and does not freeze caller-owned evidence', () => {
    const openai = provider();
    const local = {
      ...provider({ providerId: 'ollama', mode: 'local', models: [model('llama')] }),
      evidenceId: 'local',
      sourceInstance: 'ollama-runtime',
    };
    const left = projectCapabilities([openai, local], OPTIONS);
    const right = projectCapabilities([local, openai], OPTIONS);
    expect(left).toEqual(right);
    expect(Object.isFrozen(openai)).toBe(false);
    expect(left.providers.map((item) => item.providerId)).toEqual(['ollama', 'openai']);
  });

  it('stays valid when providers were connected out of providerId order', () => {
    // Captured live from a clean first-run profile: onboarding auto-discovery
    // wired `groq` first, so its observedAt precedes `google-gemini`'s while
    // sorting later by identity. Sequencing on identity alone made the reducer
    // see time move backwards, invalidate the whole projection, and leave
    // `providers: []` - which `useProviderReadiness` reports as
    // `registry-error`, showing "connect a model provider" to a user with four
    // healthy providers and 170 enabled models.
    const connectedOutOfOrder = [
      {
        providerId: 'groq',
        connectedVia: 'auto-discovered',
        state: 'connected',
        modelCount: 15,
        callableModelCount: 4,
        dispatchEligible: true,
        observedAt: NOW,
      },
      {
        providerId: 'google-gemini',
        connectedVia: 'auto-discovered',
        state: 'connected',
        modelCount: 58,
        callableModelCount: 12,
        dispatchEligible: true,
        observedAt: NOW + 413,
      },
      {
        providerId: 'openrouter',
        connectedVia: 'auto-discovered',
        state: 'connected',
        modelCount: 364,
        callableModelCount: 135,
        dispatchEligible: true,
        observedAt: NOW + 706,
      },
      {
        providerId: 'openai',
        connectedVia: 'auto-discovered',
        state: 'connected',
        modelCount: 133,
        callableModelCount: 19,
        dispatchEligible: true,
        observedAt: NOW + 2726,
      },
    ] as unknown as Parameters<typeof projectModelRegistryReadiness>[0];

    const result = projectModelRegistryReadiness(connectedOutOfOrder, {
      generation: modelRegistryCapabilitySnapshotGeneration(connectedOutOfOrder),
      now: NOW + 5_000,
    });

    expect(result.state).not.toBe('invalid');
    expect(result.issues).toEqual([]);
    // The claim the activation card actually turns on: at least one provider
    // survives the projection as configured with callable inventory.
    expect(result.providers.some((p) => p.status === 'configured' && p.callableModelCount > 0)).toBe(true);
  });
});
