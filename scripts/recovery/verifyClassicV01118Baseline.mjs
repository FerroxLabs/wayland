/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Deterministic Classic v0.11.18 baseline verifier.
 *
 * Records every test/candidate/fixture digest and decides whether the baseline
 * may be consumed. A failing baseline journey may continue ONLY through an
 * explicit quarantine record naming the exact failure, a reproducible command,
 * an owner, an expiry, the affected target/journey, and its exclusion from the
 * M0A/cohort claim. Unowned, expired, broad, or silent quarantine fails closed.
 *
 * The canonical digest here is byte-identical to
 * `src/process/services/recovery/baseline/classicJourneyBaseline.ts`; the unit
 * suite asserts the pinned digests in both files agree with the compiled bytes.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTRACTS = path.resolve(HERE, '..', '..', 'contracts', 'recovery');
const BASELINE_PATH = path.join(CONTRACTS, 'classic-journey-baseline.json');
const FIXTURE_PATH = path.join(CONTRACTS, 'classic-v0.11.18-provider-fixture.json');

/** Compiled content digests, pinned identically to the compiled Desktop module. */
export const EXPECTED_BASELINE_DIGEST = '5204526ac93579e68b5c898d52627216aae85d0af45de9b9896d423db56a3034';
export const EXPECTED_PROVIDER_FIXTURE_DIGEST = '4951e5e0c241a519e893741002e1edeaf09d3a63455796f03e266a5c6e73fcb6';

const QUARANTINE_FIELDS = [
  'failure',
  'command',
  'owner',
  'expiry',
  'affectedTarget',
  'affectedJourney',
  'excludesClaim',
];
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

/** Stable canonical serialization: sort object keys by codepoint, recurse. */
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

/** Hash of the stable canonical serialization. */
export function canonicalDigest(value) {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

/** Recompute the on-disk digests and reject drift from the compiled pins. */
export function verifyBaselineIntegrity() {
  const baseline = readJson(BASELINE_PATH);
  const fixture = readJson(FIXTURE_PATH);
  const baselineDigest = canonicalDigest(baseline);
  const fixtureDigest = canonicalDigest(fixture);
  if (baselineDigest !== EXPECTED_BASELINE_DIGEST) {
    throw new Error(`Classic journey baseline digest drifted: ${baselineDigest} != ${EXPECTED_BASELINE_DIGEST}`);
  }
  if (fixtureDigest !== EXPECTED_PROVIDER_FIXTURE_DIGEST) {
    throw new Error(`Classic provider fixture digest drifted: ${fixtureDigest} != ${EXPECTED_PROVIDER_FIXTURE_DIGEST}`);
  }
  if (baseline.providerFixture.digest !== fixtureDigest) {
    throw new Error('Classic journey baseline references a provider fixture other than the compiled one.');
  }
  return {
    baselineDigest,
    fixtureDigest,
    journeys: baseline.journeys.map((journey) => journey.id).sort(),
  };
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`Quarantine ${label} is missing.`);
  return value;
}

/**
 * Validate one quarantine record. Fails closed on any unowned, expired, broad,
 * or silent record. `knownJourneys` binds the record to a real declared journey.
 */
export function validateQuarantineRecord(record, { knownJourneys, nowMs }) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('Quarantine record must be an object.');
  }
  const actual = Object.keys(record).sort();
  const expected = [...QUARANTINE_FIELDS].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error('Quarantine record has missing or unknown fields.');
  }
  nonEmptyString(record.failure, 'failure');
  nonEmptyString(record.command, 'command');
  nonEmptyString(record.owner, 'owner');
  const affectedTarget = nonEmptyString(record.affectedTarget, 'affectedTarget');
  const affectedJourney = nonEmptyString(record.affectedJourney, 'affectedJourney');
  // Broad quarantine (wildcards or unknown journeys) can never buy blanket
  // exclusion; it must name one real declared journey and target.
  if (['*', 'all', 'any', 'cohort', 'm0a'].includes(affectedJourney.toLowerCase())) {
    throw new Error('Quarantine affectedJourney is too broad.');
  }
  if (['*', 'all', 'any'].includes(affectedTarget.toLowerCase())) {
    throw new Error('Quarantine affectedTarget is too broad.');
  }
  if (!knownJourneys.includes(affectedJourney)) {
    throw new Error(`Quarantine affectedJourney is not a declared journey: ${affectedJourney}`);
  }
  if (typeof record.expiry !== 'string' || !ISO_PATTERN.test(record.expiry)) {
    throw new Error('Quarantine expiry is not a UTC timestamp.');
  }
  const expiryMs = Date.parse(record.expiry);
  if (!Number.isFinite(expiryMs) || expiryMs <= nowMs) {
    throw new Error('Quarantine record has expired.');
  }
  // Silent quarantine that does not mechanically exclude the claim fails closed.
  if (record.excludesClaim !== true) {
    throw new Error('Quarantine record does not exclude the affected M0A/cohort claim.');
  }
  return {
    affectedJourney,
    affectedTarget,
    owner: record.owner,
    expiry: record.expiry,
    failure: record.failure,
    command: record.command,
  };
}

/**
 * Verify a run: every declared journey must be green, or covered by exactly one
 * valid quarantine. Records every candidate and fixture digest. Malformed
 * quarantine throws; a legitimately failing-but-unowned journey returns ok:false.
 */
export function runJourneyBaselineVerification({ candidates, quarantines = [], nowMs = Date.now() } = {}) {
  const integrity = verifyBaselineIntegrity();
  if (!Array.isArray(candidates)) throw new Error('Verification candidates must be an array.');
  const knownJourneys = integrity.journeys;

  const validatedQuarantines = quarantines.map((record) => validateQuarantineRecord(record, { knownJourneys, nowMs }));
  const quarantinedJourneys = new Set();
  for (const record of validatedQuarantines) {
    if (quarantinedJourneys.has(record.affectedJourney)) {
      throw new Error(`Duplicate quarantine for journey: ${record.affectedJourney}`);
    }
    quarantinedJourneys.add(record.affectedJourney);
  }

  const candidateByJourney = new Map();
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') throw new Error('Candidate must be an object.');
    const journey = nonEmptyString(candidate.journey, 'candidate.journey');
    if (!knownJourneys.includes(journey)) throw new Error(`Candidate references an unknown journey: ${journey}`);
    if (candidate.status !== 'green' && candidate.status !== 'failing') {
      throw new Error(`Candidate ${journey} has an unknown status.`);
    }
    if (typeof candidate.digest !== 'string' || !/^[a-f0-9]{64}$/.test(candidate.digest)) {
      throw new Error(`Candidate ${journey} has no recorded digest.`);
    }
    if (candidateByJourney.has(journey)) throw new Error(`Duplicate candidate for journey: ${journey}`);
    candidateByJourney.set(journey, candidate);
  }

  const records = [];
  let ok = true;
  for (const journey of knownJourneys) {
    const candidate = candidateByJourney.get(journey);
    const quarantined = quarantinedJourneys.has(journey);
    let disposition;
    if (candidate && candidate.status === 'green') {
      disposition = 'green';
    } else if (quarantined) {
      disposition = 'quarantined';
    } else {
      disposition = 'failed';
      ok = false;
    }
    records.push({
      journey,
      disposition,
      candidateDigest: candidate ? candidate.digest : null,
      excludesClaim: disposition === 'quarantined',
    });
  }

  return {
    ok,
    integrity,
    fixtureDigest: integrity.fixtureDigest,
    baselineDigest: integrity.baselineDigest,
    records,
    quarantines: validatedQuarantines,
    excludedJourneys: [...quarantinedJourneys].sort(),
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const integrity = verifyBaselineIntegrity();
    const report = {
      contract: 'wayland-classic-journey-baseline-verification/1.0',
      baselineDigest: integrity.baselineDigest,
      fixtureDigest: integrity.fixtureDigest,
      journeys: integrity.journeys,
      targetMatrixClaim: false,
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Classic v0.11.18 baseline verification failed: ${error.message}\n`);
    process.exit(1);
  }
}
