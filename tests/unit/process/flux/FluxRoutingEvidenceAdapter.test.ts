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

const contractRoot = path.join(process.cwd(), 'contracts/flux-routing-evidence/v1/fixtures');

function fixture<T>(name: string): T {
  // JSON round-trip is deliberate: composition roots consume the producer's
  // serialized boundary, not imported TypeScript fixture objects.
  return JSON.parse(fs.readFileSync(path.join(contractRoot, name), 'utf8')) as T;
}

type EventFixture = {
  expected_profile: 'flux' | 'no_flux';
  correlation: FluxRoutingCorrelation;
  events: unknown[];
};

const eventFixtures = [
  'auto_routing.json',
  'circuit_open_degraded.json',
  'disconnected.json',
  'explicit_native.json',
  'fallback.json',
  'invalid_credential.json',
  'retry.json',
  'terminal_failure.json',
  'unpriced_cost.json',
  'user_override.json',
];

describe('FluxRoutingEvidenceAdapter composition roots', () => {
  it('starts both production roots with every customer-visible claim disabled', () => {
    const desktop = initDesktopFluxRoutingEvidenceAdapter();
    const webCloud = initWebCloudFluxRoutingEvidenceAdapter();

    expect(getDesktopFluxRoutingEvidenceAdapter()).toBe(desktop);
    expect(getWebCloudFluxRoutingEvidenceAdapter()).toBe(webCloud);
    expect(desktop.current()).toMatchObject({
      surface: 'desktop',
      decision: { profile: 'no_flux', reason: 'capability_absent' },
      claims: { routeExplanations: false, providerAttempts: false, costClaims: false },
    });
    expect(webCloud.current()).toMatchObject({
      surface: 'web-cloud',
      decision: { profile: 'no_flux', reason: 'capability_absent' },
      claims: { routeExplanations: false, providerAttempts: false, costClaims: false },
    });
  });

  it.each([
    ['desktop', () => new FluxRoutingEvidenceAdapter('desktop')],
    ['web-cloud', () => new FluxRoutingEvidenceAdapter('web-cloud')],
  ] as const)('replays the full serialized request corpus through the %s root', (_surface, createAdapter) => {
    const capability = fixture<unknown>('capability_available.json');
    for (const name of eventFixtures) {
      const input = fixture<EventFixture>(name);
      const result = createAdapter().replay({
        capability,
        events: input.events,
        expectedCorrelation: input.correlation,
        now: new Date('2026-07-15T00:01:00Z'),
      });
      expect(result.decision.profile, name).toBe(input.expected_profile);
      if (input.expected_profile === 'no_flux') {
        expect(result.claims, name).toEqual({
          routeExplanations: false,
          providerAttempts: false,
          costClaims: false,
        });
      }
    }
  });

  it('preserves the producer reason for no_flux capability and ignores otherwise-valid events', () => {
    const input = fixture<EventFixture>('auto_routing.json');
    const adapter = new FluxRoutingEvidenceAdapter('desktop');
    const result = adapter.replay({
      capability: fixture('capability_no_flux.json'),
      events: input.events,
      expectedCorrelation: input.correlation,
      now: new Date('2026-07-15T00:01:00Z'),
    });

    expect(result).toMatchObject({
      decision: { profile: 'no_flux', reason: 'disconnected', events: [], summary: null },
      claims: { routeExplanations: false, providerAttempts: false, costClaims: false },
    });
  });

  it('atomically revokes earlier claims when a later capability or stream fails', () => {
    const input = fixture<EventFixture>('auto_routing.json');
    const adapter = new FluxRoutingEvidenceAdapter('desktop');
    const accepted = adapter.replay({
      capability: fixture('capability_available.json'),
      events: input.events,
      expectedCorrelation: input.correlation,
      now: new Date('2026-07-15T00:01:00Z'),
    });
    expect(accepted.claims).toEqual({ routeExplanations: true, providerAttempts: true, costClaims: true });

    const rejected = adapter.replay({
      capability: fixture('capability_available.json'),
      events: [{ malformed: true }],
      expectedCorrelation: input.correlation,
      now: new Date('2026-07-15T00:01:00Z'),
    });
    expect(rejected).toMatchObject({
      decision: { profile: 'no_flux', reason: 'event_malformed' },
      claims: { routeExplanations: false, providerAttempts: false, costClaims: false },
    });
    expect(adapter.current()).toEqual(rejected);
  });
});
