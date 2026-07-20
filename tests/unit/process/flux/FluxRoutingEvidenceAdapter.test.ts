import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { FluxRoutingCorrelation } from '@/common/routingEvidence';
import {
  FluxRoutingEvidenceAdapter,
  getDesktopFluxRoutingEvidenceAdapter,
  getWebCloudFluxRoutingEvidenceAdapter,
  initDesktopFluxRoutingEvidenceAdapter,
  initWebCloudFluxRoutingEvidenceAdapter,
} from '@process/flux/FluxRoutingEvidenceAdapter';

const contractRoot = path.join(process.cwd(), 'contracts/flux-routing-evidence/v1');
const fixturesRoot = path.join(contractRoot, 'fixtures');

// The pinned producer corpus: exactly two capability fixtures plus ten
// serialized request streams. Any missing or extra file is a corpus breach.
const CAPABILITY_FIXTURES = ['capability_available.json', 'capability_no_flux.json'] as const;
const EVENT_FIXTURES: Array<{ file: string; expected: 'flux' | 'no_flux' }> = [
  { file: 'auto_routing.json', expected: 'flux' },
  { file: 'circuit_open_degraded.json', expected: 'flux' },
  { file: 'disconnected.json', expected: 'no_flux' },
  { file: 'explicit_native.json', expected: 'flux' },
  { file: 'fallback.json', expected: 'flux' },
  { file: 'invalid_credential.json', expected: 'no_flux' },
  { file: 'retry.json', expected: 'flux' },
  { file: 'terminal_failure.json', expected: 'flux' },
  { file: 'unpriced_cost.json', expected: 'flux' },
  { file: 'user_override.json', expected: 'flux' },
];

const DISABLED = { routeExplanations: false, providerAttempts: false, costClaims: false } as const;
const NOW = new Date('2026-07-15T00:01:00Z');

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function readJson<T>(absolutePath: string): T {
  // JSON round-trip is deliberate: composition roots consume the producer's
  // serialized boundary, not imported TypeScript fixture objects.
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

type EventFixture = {
  expected_profile: 'flux' | 'no_flux';
  correlation: FluxRoutingCorrelation;
  events: Array<Record<string, unknown>>;
};

function loadEvents(file: string): EventFixture {
  return readJson<EventFixture>(path.join(fixturesRoot, file));
}

const capabilityAvailable = () => readJson<unknown>(path.join(fixturesRoot, 'capability_available.json'));

describe('FluxRoutingEvidenceAdapter corpus seal', () => {
  it('recomputes every manifest digest and rejects any missing or extra corpus file', () => {
    const manifest = readJson<{
      bundle_sha256: string;
      contract_version: string;
      generator_version: string;
      producer_baseline_commit: string;
      schema_sha256: string;
      files: Array<{ path: string; sha256: string }>;
    }>(path.join(contractRoot, 'manifest.json'));

    // Schema digest is authoritative and recomputed from bytes on disk.
    expect(sha256(fs.readFileSync(path.join(contractRoot, 'schema.json')))).toBe(manifest.schema_sha256);

    // The manifest inventory must equal the vendored inventory exactly: no file
    // in the manifest may be absent from disk, and no file on disk may be
    // omitted from the manifest.
    const onDisk = fs
      .readdirSync(fixturesRoot)
      .filter((file) => file.endsWith('.json'))
      .toSorted();
    expect(onDisk).toEqual([...CAPABILITY_FIXTURES, ...EVENT_FIXTURES.map((entry) => entry.file)].toSorted());

    const manifestPaths = manifest.files.map((entry) => entry.path).toSorted();
    const vendoredPaths = ['schema.json', ...onDisk.map((file) => `fixtures/${file}`)].toSorted();
    expect(manifestPaths).toEqual(vendoredPaths);

    // Every declared digest is recomputed from bytes; a tampered fixture fails here.
    for (const entry of manifest.files) {
      expect(sha256(fs.readFileSync(path.join(contractRoot, entry.path))), entry.path).toBe(entry.sha256);
    }

    // The bundle digest binds the whole inventory together.
    const bundleInput = manifest.files
      .toSorted((left, right) => left.path.localeCompare(right.path))
      .map((entry) => `${entry.path}:${entry.sha256}\n`)
      .join('');
    expect(sha256(bundleInput)).toBe(manifest.bundle_sha256);
  });

  it('starts both production roots with every customer-visible claim disabled', () => {
    const desktop = initDesktopFluxRoutingEvidenceAdapter();
    const webCloud = initWebCloudFluxRoutingEvidenceAdapter();

    expect(getDesktopFluxRoutingEvidenceAdapter()).toBe(desktop);
    expect(getWebCloudFluxRoutingEvidenceAdapter()).toBe(webCloud);
    expect(desktop.current()).toMatchObject({
      surface: 'desktop',
      decision: { profile: 'no_flux', reason: 'capability_absent', summary: null },
      claims: DISABLED,
    });
    expect(webCloud.current()).toMatchObject({
      surface: 'web-cloud',
      decision: { profile: 'no_flux', reason: 'capability_absent', summary: null },
      claims: DISABLED,
    });
  });

  it.each([
    ['desktop', () => new FluxRoutingEvidenceAdapter('desktop')],
    ['web-cloud', () => new FluxRoutingEvidenceAdapter('web-cloud')],
  ] as const)('replays every pinned request stream through the %s root', (_surface, createAdapter) => {
    const capability = capabilityAvailable();
    for (const { file, expected } of EVENT_FIXTURES) {
      const input = loadEvents(file);
      // Fixture self-declares its profile; the corpus and this test must agree.
      expect(input.expected_profile, file).toBe(expected);

      const result = createAdapter().replay({
        capability,
        events: input.events,
        expectedCorrelation: input.correlation,
        now: NOW,
      });
      expect(result.decision.profile, file).toBe(expected);

      if (expected === 'no_flux') {
        expect(result.claims, file).toEqual(DISABLED);
        expect(result.decision, file).toMatchObject({ summary: null });
        continue;
      }

      // Claim permissions are derived only from proven summary content, never minted.
      expect(result.decision.profile === 'flux' && result.decision.summary, file).toBeTruthy();
      if (result.decision.profile !== 'flux') throw new Error('unreachable');
      const summary = result.decision.summary;
      expect(result.claims, file).toEqual({
        routeExplanations: summary.route !== null,
        providerAttempts: summary.attempts.length > 0,
        costClaims: summary.cost !== null,
      });
    }
  });

  it('grants full claims for a priced auto-routed stream and nothing more', () => {
    const input = loadEvents('auto_routing.json');
    const result = new FluxRoutingEvidenceAdapter('desktop').replay({
      capability: capabilityAvailable(),
      events: input.events,
      expectedCorrelation: input.correlation,
      now: NOW,
    });
    expect(result.claims).toEqual({ routeExplanations: true, providerAttempts: true, costClaims: true });
    if (result.decision.profile !== 'flux') throw new Error('expected flux');
    expect(result.decision.summary.cost).toMatchObject({ price_status: 'priced', cost_microusd: 725, currency: 'USD' });
    expect(result.decision.summary.route).toMatchObject({ route_mode: 'flux_auto', flux_involved: true });
  });

  it('preserves explicit-native precedence: no reroute, no Flux involvement', () => {
    const input = loadEvents('explicit_native.json');
    const result = new FluxRoutingEvidenceAdapter('desktop').replay({
      capability: capabilityAvailable(),
      events: input.events,
      expectedCorrelation: input.correlation,
      now: NOW,
    });
    if (result.decision.profile !== 'flux') throw new Error('expected flux');
    expect(result.decision.summary.route).toMatchObject({
      route_mode: 'explicit_native',
      flux_involved: false,
      reroute_allowed: false,
      requested_model: 'native-model-a',
      selected_model: 'native-model-a',
    });
  });

  it('replays unpriced cost without minting a candidate charge', () => {
    const input = loadEvents('unpriced_cost.json');
    const result = new FluxRoutingEvidenceAdapter('desktop').replay({
      capability: capabilityAvailable(),
      events: input.events,
      expectedCorrelation: input.correlation,
      now: NOW,
    });
    if (result.decision.profile !== 'flux') throw new Error('expected flux');
    // A cost claim exists, but the observed charge is explicitly null: the
    // adapter never fabricates a number for an unpriced attempt.
    expect(result.claims.costClaims).toBe(true);
    expect(result.decision.summary.cost).toMatchObject({
      price_status: 'unpriced',
      cost_microusd: null,
      currency: null,
    });
  });

  it('preserves the producer reason for a no_flux capability and ignores otherwise-valid events', () => {
    const input = loadEvents('auto_routing.json');
    const result = new FluxRoutingEvidenceAdapter('desktop').replay({
      capability: readJson(path.join(fixturesRoot, 'capability_no_flux.json')),
      events: input.events,
      expectedCorrelation: input.correlation,
      now: NOW,
    });
    expect(result).toMatchObject({
      decision: { profile: 'no_flux', reason: 'disconnected', events: [], summary: null },
      claims: DISABLED,
    });
  });

  describe('hostile variants replay as no_flux and atomically revoke prior claims', () => {
    function baseGranted(): FluxRoutingEvidenceAdapter {
      const input = loadEvents('auto_routing.json');
      const adapter = new FluxRoutingEvidenceAdapter('desktop');
      const granted = adapter.replay({
        capability: capabilityAvailable(),
        events: input.events,
        expectedCorrelation: input.correlation,
        now: NOW,
      });
      expect(granted.claims).toEqual({ routeExplanations: true, providerAttempts: true, costClaims: true });
      return adapter;
    }

    const cases: Array<{ name: string; reason: string; mutate: (fx: EventFixture) => unknown[] }> = [
      {
        name: 'malformed event',
        reason: 'event_malformed',
        mutate: () => [{ malformed: true }],
      },
      {
        name: 'unknown-critical event type',
        reason: 'event_malformed',
        mutate: (fx) => {
          const events = structuredClone(fx.events);
          events[1].event_type = 'provider.attempt_teleported';
          return events;
        },
      },
      {
        name: 'unknown critical field',
        reason: 'event_malformed',
        mutate: (fx) => {
          const events = structuredClone(fx.events);
          (events[1].evidence as Record<string, unknown>).smuggled_authority = true;
          return events;
        },
      },
      {
        name: 'duplicate conflict',
        reason: 'duplicate_conflict',
        mutate: (fx) => {
          const events = structuredClone(fx.events);
          events.splice(2, 0, { ...events[1], evidence: { attempt_id: 'changed', provider: 'x', model: 'y' } });
          return events;
        },
      },
      {
        name: 'sequence gap',
        reason: 'sequence_invalid',
        mutate: (fx) => {
          const events = structuredClone(fx.events);
          events[2].sequence = 9;
          return events;
        },
      },
      {
        name: 'out of order',
        reason: 'sequence_invalid',
        mutate: (fx) => {
          const events = structuredClone(fx.events);
          [events[1], events[2]] = [events[2], events[1]];
          return events;
        },
      },
      {
        name: 'post-terminal event',
        reason: 'event_after_terminal',
        mutate: (fx) => {
          const events = structuredClone(fx.events);
          events.push({ ...events[0], event_id: 'after-terminal', sequence: events.length });
          return events;
        },
      },
    ];

    it.each(cases)('$name → no_flux ($reason) with claims revoked', ({ reason, mutate }) => {
      const input = loadEvents('auto_routing.json');
      const adapter = baseGranted();
      const rejected = adapter.replay({
        capability: capabilityAvailable(),
        events: mutate(input),
        expectedCorrelation: input.correlation,
        now: NOW,
      });
      expect(rejected).toMatchObject({
        decision: { profile: 'no_flux', reason, events: [], summary: null },
        claims: DISABLED,
      });
      // Revocation is atomic: the persisted snapshot equals the rejection.
      expect(adapter.current()).toEqual(rejected);
    });
  });
});
