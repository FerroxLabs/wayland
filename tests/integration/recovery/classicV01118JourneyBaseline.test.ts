/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration proof for the Classic v0.11.18 journey baseline verifier.
 *
 * Exercises the standalone `verifyClassicV01118Baseline.mjs` verifier against
 * the compiled Desktop baseline module: green journeys, digest recording, and
 * the quarantine gate. A failing baseline may continue ONLY through an explicit
 * owned, unexpired, narrow, claim-excluding quarantine; unowned/expired/broad/
 * silent quarantine fails closed.
 */

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  CLASSIC_JOURNEY_BASELINE,
  CLASSIC_JOURNEY_BASELINE_DIGEST,
  CLASSIC_PROVIDER_FIXTURE_DIGEST,
} from '@process/services/recovery/baseline/classicJourneyBaseline';
import {
  runJourneyBaselineVerification,
  validateQuarantineRecord,
  verifyBaselineIntegrity,
} from '../../../scripts/recovery/verifyClassicV01118Baseline.mjs';

const JOURNEYS = CLASSIC_JOURNEY_BASELINE.journeys.map((journey) => journey.id).sort();
const digestFor = (label: string): string => createHash('sha256').update(label).digest('hex');
const NOW = Date.parse('2026-07-20T00:00:00Z');
const FUTURE = '2026-08-01T00:00:00Z';

const allGreen = () => JOURNEYS.map((journey) => ({ journey, status: 'green', digest: digestFor(journey) }));

const ownedQuarantine = (journey: string) => ({
  failure: `expected-fail: ${journey} route regressed under the deterministic fixture`,
  command: `bunx vitest run tests/integration/recovery/classicV01118JourneyBaseline.test.ts -t ${journey}`,
  owner: 'recovery-team@ferroxlabs',
  expiry: FUTURE,
  affectedTarget: 'darwin/arm64',
  affectedJourney: journey,
  excludesClaim: true,
});

describe('Classic v0.11.18 baseline verifier integrity', () => {
  it('recomputes on-disk digests that match the compiled Desktop pins', () => {
    const integrity = verifyBaselineIntegrity();
    expect(integrity.baselineDigest).toBe(CLASSIC_JOURNEY_BASELINE_DIGEST);
    expect(integrity.fixtureDigest).toBe(CLASSIC_PROVIDER_FIXTURE_DIGEST);
    expect(integrity.journeys).toEqual(JOURNEYS);
  });
});

describe('Classic v0.11.18 baseline verification run', () => {
  it('passes when every declared journey is green and records every digest', () => {
    const result = runJourneyBaselineVerification({ candidates: allGreen(), nowMs: NOW });
    expect(result.ok).toBe(true);
    expect(result.baselineDigest).toBe(CLASSIC_JOURNEY_BASELINE_DIGEST);
    expect(result.fixtureDigest).toBe(CLASSIC_PROVIDER_FIXTURE_DIGEST);
    expect(result.records.map((record) => record.disposition)).toEqual(JOURNEYS.map(() => 'green'));
    for (const record of result.records) {
      expect(record.candidateDigest).toBe(digestFor(record.journey));
    }
    expect(result.excludedJourneys).toEqual([]);
  });

  it('fails closed when a journey fails with no quarantine', () => {
    const candidates = allGreen().map((candidate) =>
      candidate.journey === 'chat' ? { ...candidate, status: 'failing' } : candidate
    );
    const result = runJourneyBaselineVerification({ candidates, nowMs: NOW });
    expect(result.ok).toBe(false);
    expect(result.records.find((record) => record.journey === 'chat')?.disposition).toBe('failed');
  });

  it('continues a failing journey only through a valid owned quarantine that excludes the claim', () => {
    const candidates = allGreen().map((candidate) =>
      candidate.journey === 'chat' ? { ...candidate, status: 'failing' } : candidate
    );
    const result = runJourneyBaselineVerification({
      candidates,
      quarantines: [ownedQuarantine('chat')],
      nowMs: NOW,
    });
    expect(result.ok).toBe(true);
    const chat = result.records.find((record) => record.journey === 'chat');
    expect(chat?.disposition).toBe('quarantined');
    expect(chat?.excludesClaim).toBe(true);
    expect(result.excludedJourneys).toEqual(['chat']);
  });
});

describe('quarantine gate fails closed', () => {
  it('rejects an unowned quarantine', () => {
    expect(() =>
      validateQuarantineRecord({ ...ownedQuarantine('chat'), owner: '' }, { knownJourneys: JOURNEYS, nowMs: NOW })
    ).toThrow(/owner is missing/);
  });

  it('rejects an expired quarantine', () => {
    expect(() =>
      validateQuarantineRecord(
        { ...ownedQuarantine('chat'), expiry: '2026-07-01T00:00:00Z' },
        { knownJourneys: JOURNEYS, nowMs: NOW }
      )
    ).toThrow(/has expired/);
  });

  it('rejects a broad (wildcard) quarantine', () => {
    expect(() =>
      validateQuarantineRecord(
        { ...ownedQuarantine('chat'), affectedJourney: 'all' },
        { knownJourneys: JOURNEYS, nowMs: NOW }
      )
    ).toThrow(/too broad/);
  });

  it('rejects a quarantine for an undeclared journey', () => {
    expect(() =>
      validateQuarantineRecord(
        { ...ownedQuarantine('chat'), affectedJourney: 'phantom' },
        { knownJourneys: JOURNEYS, nowMs: NOW }
      )
    ).toThrow(/not a declared journey/);
  });

  it('rejects a silent quarantine that does not exclude the claim', () => {
    expect(() =>
      validateQuarantineRecord(
        { ...ownedQuarantine('chat'), excludesClaim: false },
        { knownJourneys: JOURNEYS, nowMs: NOW }
      )
    ).toThrow(/does not exclude/);
  });

  it('rejects a quarantine with unknown or missing fields', () => {
    const { owner: _owner, ...missingOwner } = ownedQuarantine('chat');
    void _owner;
    expect(() => validateQuarantineRecord(missingOwner, { knownJourneys: JOURNEYS, nowMs: NOW })).toThrow(
      /missing or unknown fields/
    );
  });

  it('rejects duplicate quarantines for the same journey', () => {
    const candidates = allGreen().map((candidate) =>
      candidate.journey === 'chat' ? { ...candidate, status: 'failing' } : candidate
    );
    expect(() =>
      runJourneyBaselineVerification({
        candidates,
        quarantines: [ownedQuarantine('chat'), ownedQuarantine('chat')],
        nowMs: NOW,
      })
    ).toThrow(/Duplicate quarantine/);
  });
});
