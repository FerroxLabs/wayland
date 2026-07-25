/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  CLASSIC_JOURNEY_BASELINE,
  CLASSIC_JOURNEY_BASELINE_DIGEST,
  CLASSIC_PROVIDER_FIXTURE,
  CLASSIC_PROVIDER_FIXTURE_DIGEST,
  assertOutcomesMatchBaseline,
  classicBaselineDigest,
  parseClassicJourneyBaseline,
  parseClassicProviderFixture,
} from '@process/services/recovery/baseline/classicJourneyBaseline';
import baselineJson from '../../../../../../contracts/recovery/classic-journey-baseline.json';
import providerFixtureJson from '../../../../../../contracts/recovery/classic-v0.11.18-provider-fixture.json';
import {
  EXPECTED_BASELINE_DIGEST,
  EXPECTED_PROVIDER_FIXTURE_DIGEST,
  canonicalDigest,
} from '../../../../../../scripts/recovery/verifyClassicV01118Baseline.mjs';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe('Classic v0.11.18 journey baseline seal', () => {
  it('binds to the compiled v0.11.18 release identity', () => {
    expect(CLASSIC_JOURNEY_BASELINE.release).toEqual({
      repository: 'FerroxLabs/wayland',
      tag: 'v0.11.18',
      tagCommit: '1b1c1e91119e3352bec3958188254ee91f150492',
      version: '0.11.18',
    });
  });

  it('is byte-stable against its compiled digest', () => {
    expect(classicBaselineDigest(baselineJson)).toBe(CLASSIC_JOURNEY_BASELINE_DIGEST);
    expect(classicBaselineDigest(providerFixtureJson)).toBe(CLASSIC_PROVIDER_FIXTURE_DIGEST);
  });

  it('agrees with the standalone verifier digests (single source of truth)', () => {
    expect(EXPECTED_BASELINE_DIGEST).toBe(CLASSIC_JOURNEY_BASELINE_DIGEST);
    expect(EXPECTED_PROVIDER_FIXTURE_DIGEST).toBe(CLASSIC_PROVIDER_FIXTURE_DIGEST);
    expect(canonicalDigest(baselineJson)).toBe(CLASSIC_JOURNEY_BASELINE_DIGEST);
    expect(canonicalDigest(providerFixtureJson)).toBe(CLASSIC_PROVIDER_FIXTURE_DIGEST);
  });

  it('is exhaustive across every declared representative-state category', () => {
    const state = CLASSIC_JOURNEY_BASELINE.representativeState;
    for (const category of [
      state.chats,
      state.projects,
      state.teams,
      state.schedules,
      state.artifacts,
      state.managedWorkspaces,
      state.settings,
      state.authorityValues,
      state.coreReferences,
      state.externalReferences,
    ]) {
      expect(category.length).toBeGreaterThan(0);
    }
  });

  it('declares exactly one green outcome per declared journey', () => {
    expect(CLASSIC_JOURNEY_BASELINE.journeys.map((journey) => journey.id)).toEqual([
      'artifact',
      'automation',
      'chat',
      'developer-verification',
      'project-resume',
    ]);
    expect(CLASSIC_JOURNEY_BASELINE.outcomes.every((outcome) => outcome.status === 'green')).toBe(true);
    expect(CLASSIC_JOURNEY_BASELINE.outcomes.map((outcome) => outcome.journey).sort()).toEqual(
      CLASSIC_JOURNEY_BASELINE.journeys.map((journey) => journey.id).sort()
    );
  });

  it('binds the deterministic provider fixture to the v0.11.18 identity', () => {
    expect(CLASSIC_PROVIDER_FIXTURE.boundRelease.version).toBe('0.11.18');
    expect(CLASSIC_PROVIDER_FIXTURE.request.temperature).toBe(0);
    expect(CLASSIC_JOURNEY_BASELINE.providerFixture.digest).toBe(CLASSIC_PROVIDER_FIXTURE_DIGEST);
  });
});

describe('Classic v0.11.18 baseline fails closed on hostile mismatch', () => {
  it('rejects a drifted release identity', () => {
    const mutated = clone(baselineJson);
    mutated.release.tagCommit = '0000000000000000000000000000000000000000';
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/release identity/);
  });

  it('rejects an unknown top-level field', () => {
    const mutated = clone(baselineJson) as Record<string, unknown>;
    mutated.injected = true;
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/missing or unknown fields/);
  });

  it('rejects a duplicate representative-state item', () => {
    const mutated = clone(baselineJson);
    const last = mutated.representativeState.chats[mutated.representativeState.chats.length - 1];
    mutated.representativeState.chats.push(clone(last));
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/duplicate identity/);
  });

  it('rejects unstable (non-ascending) ordering', () => {
    const mutated = clone(baselineJson);
    mutated.representativeState.settings.reverse();
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/stable ascending order/);
  });

  it('rejects a Core authority value widened to preserve', () => {
    const mutated = clone(baselineJson);
    const core = mutated.representativeState.authorityValues.find((value) => value.authority === 'core');
    core.disposition = 'preserve';
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/widens Core authority/);
  });

  it('rejects a missing authority disposition', () => {
    const mutated = clone(baselineJson);
    delete mutated.representativeState.authorityValues[0].disposition;
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/missing or unknown fields/);
  });

  it('rejects a noncanonical (absolute) path', () => {
    const mutated = clone(baselineJson);
    mutated.representativeState.projects[0].path = '/etc/passwd';
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/canonical relative path/);
  });

  it('rejects a path-traversal segment', () => {
    const mutated = clone(baselineJson);
    mutated.representativeState.artifacts[0].path = 'artifacts/../../escape.md';
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/canonical relative path/);
  });

  it('rejects a dropped journey (incomplete outcome inventory)', () => {
    const mutated = clone(baselineJson);
    mutated.journeys = mutated.journeys.filter((journey) => journey.id !== 'automation');
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/exhaustively cover/);
  });

  it('rejects an outcome that is not green', () => {
    const mutated = clone(baselineJson);
    mutated.outcomes[0].status = 'red';
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/status must be green/);
  });

  it('rejects an unknown allowed transform', () => {
    const mutated = clone(baselineJson);
    mutated.transforms.allowed = ['core-schema-widen'];
    expect(() => parseClassicJourneyBaseline(mutated)).toThrow(/unknown transform/);
  });

  it('rejects a provider fixture bound to a different release', () => {
    const mutatedFixture = clone(providerFixtureJson);
    mutatedFixture.boundRelease.version = '0.11.8';
    expect(() => parseClassicProviderFixture(mutatedFixture, CLASSIC_JOURNEY_BASELINE)).toThrow(
      /bound to the v0.11.18/
    );
  });

  it('rejects a non-deterministic provider fixture request', () => {
    const mutatedFixture = clone(providerFixtureJson);
    mutatedFixture.request.temperature = 0.7;
    expect(() => parseClassicProviderFixture(mutatedFixture, CLASSIC_JOURNEY_BASELINE)).toThrow(/not deterministic/);
  });
});

describe('a baseline mismatch cannot be normalized into success', () => {
  const greenInventory = CLASSIC_JOURNEY_BASELINE.outcomes.map((outcome) => ({
    journey: outcome.journey,
    status: outcome.status,
  }));

  it('accepts the exact sealed outcome inventory', () => {
    expect(() => assertOutcomesMatchBaseline(greenInventory)).not.toThrow();
  });

  it('rejects a downgraded outcome instead of coercing it', () => {
    const downgraded = greenInventory.map((outcome, index) => (index === 0 ? { ...outcome, status: 'red' } : outcome));
    expect(() => assertOutcomesMatchBaseline(downgraded)).toThrow(/not the required green/);
  });

  it('rejects a missing journey', () => {
    expect(() => assertOutcomesMatchBaseline(greenInventory.slice(1))).toThrow(/does not cover the baseline journeys/);
  });

  it('rejects an unknown extra journey', () => {
    expect(() =>
      assertOutcomesMatchBaseline([...greenInventory.slice(1), { journey: 'phantom', status: 'green' }])
    ).toThrow(/unknown journey/);
  });
});
