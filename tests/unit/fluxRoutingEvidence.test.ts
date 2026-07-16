import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  consumeFluxRoutingEvidence,
  evaluateFluxRoutingCapability,
  FLUX_ROUTING_EVIDENCE_BASELINE,
  FLUX_ROUTING_EVIDENCE_BUNDLE_SHA256,
  FLUX_ROUTING_EVIDENCE_GENERATOR_VERSION,
  FLUX_ROUTING_EVIDENCE_PRODUCER_COMMIT,
  FLUX_ROUTING_EVIDENCE_SCHEMA_SHA256,
  FLUX_ROUTING_EVIDENCE_VERSION,
  type FluxRoutingCorrelation,
} from '@/common/routingEvidence';

const contractRoot = path.join(process.cwd(), 'contracts/flux-routing-evidence/v1');

function fixtureFiles(): string[] {
  return fs
    .readdirSync(path.join(contractRoot, 'fixtures'))
    .filter((file) => file.endsWith('.json'))
    .toSorted();
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function readFixture<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(contractRoot, 'fixtures', file), 'utf8')) as T;
}

type RoutingFixture = {
  expected_profile: 'flux' | 'no_flux';
  correlation: FluxRoutingCorrelation;
  events: Array<Record<string, unknown>>;
};

describe('Flux routing evidence v1 consumer', () => {
  it('pins the producer manifest and replays every canonical fixture', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(contractRoot, 'manifest.json'), 'utf8')) as {
      bundle_sha256: string;
      contract_version: string;
      files: Array<{ path: string; sha256: string }>;
      generator_version: string;
      producer_baseline_commit: string;
      schema_sha256: string;
    };
    expect(FLUX_ROUTING_EVIDENCE_PRODUCER_COMMIT).toBe('6e7fa427ee6c062b531e67c0e7e1cedfd7aff208');
    expect(manifest.contract_version).toBe(FLUX_ROUTING_EVIDENCE_VERSION);
    expect(manifest.generator_version).toBe(FLUX_ROUTING_EVIDENCE_GENERATOR_VERSION);
    expect(manifest.producer_baseline_commit).toBe(FLUX_ROUTING_EVIDENCE_BASELINE);
    expect(manifest.bundle_sha256).toBe(FLUX_ROUTING_EVIDENCE_BUNDLE_SHA256);
    expect(manifest.schema_sha256).toBe(FLUX_ROUTING_EVIDENCE_SCHEMA_SHA256);
    expect(fixtureFiles()).toHaveLength(12);

    const manifestPaths = manifest.files.map(({ path: file }) => file).toSorted();
    const vendoredPaths = ['schema.json', ...fixtureFiles().map((file) => `fixtures/${file}`)].toSorted();
    expect(manifestPaths).toEqual(vendoredPaths);
    for (const file of manifest.files) {
      expect(sha256(fs.readFileSync(path.join(contractRoot, file.path))), file.path).toBe(file.sha256);
    }
    const bundleInput = manifest.files
      .toSorted((left, right) => left.path.localeCompare(right.path))
      .map(({ path: file, sha256: digest }) => `${file}:${digest}\n`)
      .join('');
    expect(sha256(bundleInput)).toBe(manifest.bundle_sha256);

    for (const file of fixtureFiles()) {
      const fixture = readFixture<{
        expected_profile: 'flux' | 'no_flux';
        correlation?: FluxRoutingCorrelation;
        events?: unknown[];
        type?: string;
      }>(file);
      if (fixture.type === 'routing.capabilities') {
        const expected = fixture.expected_profile ?? (file.includes('no_flux') ? 'no_flux' : 'flux');
        expect(evaluateFluxRoutingCapability(fixture, new Date('2026-07-15T00:01:00Z')), file).toBe(expected);
      } else {
        expect(consumeFluxRoutingEvidence(fixture.events ?? [], fixture.correlation!).profile, file).toBe(
          fixture.expected_profile
        );
      }
    }
  });

  it('fails closed on gaps, correlation drift, conflicting duplicates, and post-terminal events', () => {
    const fixture = readFixture<RoutingFixture>('fallback.json');
    const gap = structuredClone(fixture.events);
    gap[2].sequence = 9;
    expect(consumeFluxRoutingEvidence(gap, fixture.correlation)).toMatchObject({
      profile: 'no_flux',
      reason: 'sequence_invalid',
    });

    const drift = structuredClone(fixture.events);
    (drift[2].correlation as Record<string, unknown>).request_id = 'different-request';
    expect(consumeFluxRoutingEvidence(drift, fixture.correlation)).toMatchObject({
      profile: 'no_flux',
      reason: 'correlation_mismatch',
    });

    const conflict = structuredClone(fixture.events);
    conflict.splice(2, 0, { ...conflict[1], evidence: { attempt_id: 'changed', provider: 'x', model: 'y' } });
    expect(consumeFluxRoutingEvidence(conflict, fixture.correlation)).toMatchObject({
      profile: 'no_flux',
      reason: 'duplicate_conflict',
    });

    const afterTerminal = structuredClone(fixture.events);
    afterTerminal.push({ ...afterTerminal[0], event_id: 'after-terminal', sequence: afterTerminal.length });
    expect(consumeFluxRoutingEvidence(afterTerminal, fixture.correlation)).toMatchObject({
      profile: 'no_flux',
      reason: 'event_after_terminal',
    });
  });

  it('enforces explicit-native precedence through the full stream', () => {
    const fixture = readFixture<RoutingFixture>('explicit_native.json');
    const mutations: Array<[string, (events: Array<Record<string, unknown>>) => void]> = [
      [
        'changed model',
        (events) => ((events[0].evidence as Record<string, unknown>).selected_model = 'silently-rerouted-model'),
      ],
      ['Flux involvement', (events) => ((events[0].evidence as Record<string, unknown>).flux_involved = true)],
      ['reroute permission', (events) => ((events[0].evidence as Record<string, unknown>).reroute_allowed = true)],
      ['unpinned precedence', (events) => ((events[0].evidence as Record<string, unknown>).precedence = 'flux_auto')],
    ];
    for (const [label, mutate] of mutations) {
      const events = structuredClone(fixture.events);
      mutate(events);
      expect(consumeFluxRoutingEvidence(events, fixture.correlation), label).toMatchObject({
        profile: 'no_flux',
        reason: 'event_malformed',
      });
    }

    const fallback = structuredClone(fixture.events);
    fallback.splice(2, 0, {
      ...fallback[1],
      event_id: 'evt-native-fallback',
      event_type: 'provider.fallback_selected',
      sequence: 2,
      evidence: {
        from_attempt_id: 'attempt-native-1',
        provider: 'provider-b',
        model: 'model-b',
        reason_code: 'silent_native_reroute',
      },
    });
    fallback.slice(3).forEach((event, index) => {
      event.sequence = index + 3;
    });
    expect(consumeFluxRoutingEvidence(fallback, fixture.correlation)).toMatchObject({
      profile: 'no_flux',
      reason: 'fallback_forbidden',
    });
  });

  it('matches producer ordering and reference semantics', () => {
    const retry = readFixture<RoutingFixture>('retry.json');
    const retryWithoutFailure = structuredClone(retry.events).filter(
      (event) => event.event_type !== 'provider.attempt_failed'
    );
    retryWithoutFailure.forEach((event, sequence) => {
      event.sequence = sequence;
    });
    expect(consumeFluxRoutingEvidence(retryWithoutFailure, retry.correlation)).toMatchObject({
      profile: 'no_flux',
      reason: 'retry_source_invalid',
    });

    const success = readFixture<RoutingFixture>('auto_routing.json');
    const successWithoutCost = structuredClone(success.events).filter(
      (event) => event.event_type !== 'request.cost_observed'
    );
    successWithoutCost.forEach((event, sequence) => {
      event.sequence = sequence;
    });
    expect(consumeFluxRoutingEvidence(successWithoutCost, success.correlation)).toMatchObject({
      profile: 'no_flux',
      reason: 'terminal_success_invalid',
    });

    const override = readFixture<RoutingFixture>('user_override.json');
    const mismatchedOverride = structuredClone(override.events);
    (mismatchedOverride[0].evidence as Record<string, unknown>).route_mode = 'flux_auto';
    expect(consumeFluxRoutingEvidence(mismatchedOverride, override.correlation)).toMatchObject({
      profile: 'no_flux',
      reason: 'route_override_mismatch',
    });
  });

  it('accepts exact duplicate events idempotently and never turns unpriced cost into zero', () => {
    const fallback = readFixture<RoutingFixture>('fallback.json');
    const duplicate = structuredClone(fallback.events);
    duplicate.splice(2, 0, structuredClone(duplicate[1]));
    expect(consumeFluxRoutingEvidence(duplicate, fallback.correlation)).toMatchObject({
      profile: 'flux',
      summary: { fallbacks: 1 },
    });

    const unpriced = readFixture<RoutingFixture>('unpriced_cost.json');
    expect(consumeFluxRoutingEvidence(unpriced.events, unpriced.correlation)).toMatchObject({
      profile: 'flux',
      summary: { cost: { price_status: 'unpriced', cost_microusd: null, currency: null } },
    });
  });

  it('degrades stale capabilities before any route claims are enabled', () => {
    const capability = readFixture<Record<string, unknown>>('capability_available.json');
    expect(evaluateFluxRoutingCapability(capability, new Date('2026-07-15T00:10:00Z'))).toBe('no_flux');
    expect(evaluateFluxRoutingCapability({ ...capability, generator_version: '1.0.0' })).toBe('no_flux');
  });
});
