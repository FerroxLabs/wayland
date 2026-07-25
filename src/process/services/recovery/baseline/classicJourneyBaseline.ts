/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Repaired deterministic Classic v0.11.18 journey baseline.
 *
 * This module seals the single representative Classic state, outcome inventory,
 * current-route navigation set, and stable provider-response fixture that every
 * M0A target cell consumes. It is baseline construction only: it deliberately
 * makes no six-target package acceptance claim.
 *
 * Everything here is fail-closed. The compiled baseline and fixture are hashed
 * with a stable canonical digest and pinned; any byte drift, unknown/duplicate
 * item, missing authority disposition, noncanonical path, unstable ordering, or
 * silent authority widening throws at module load rather than degrading into a
 * plausible-but-wrong "green" baseline. A baseline mismatch can never be
 * normalized into success.
 */

import { createHash } from 'node:crypto';
import baselineJson from '../../../../../contracts/recovery/classic-journey-baseline.json';
import providerFixtureJson from '../../../../../contracts/recovery/classic-v0.11.18-provider-fixture.json';
import releaseJson from '../../../../../contracts/recovery/classic-v0.11.18-release.json';

export const CLASSIC_JOURNEY_BASELINE_CONTRACT = 'wayland-classic-journey-baseline/1.0' as const;
export const CLASSIC_PROVIDER_FIXTURE_CONTRACT = 'wayland-classic-provider-fixture/1.0' as const;

/** Compiled content digest of the sealed baseline. Drift fails closed at load. */
export const CLASSIC_JOURNEY_BASELINE_DIGEST =
  '5204526ac93579e68b5c898d52627216aae85d0af45de9b9896d423db56a3034' as const;
/** Compiled content digest of the stable v0.11.18 provider fixture. */
export const CLASSIC_PROVIDER_FIXTURE_DIGEST =
  '4951e5e0c241a519e893741002e1edeaf09d3a63455796f03e266a5c6e73fcb6' as const;

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const JOURNEY_IDS = ['artifact', 'automation', 'chat', 'developer-verification', 'project-resume'] as const;
const AUTHORITY_KINDS = ['desktop', 'core'] as const;
const AUTHORITY_DISPOSITIONS = ['preserve', 'fail-closed'] as const;
const ROUTE_KINDS = ['guid', 'settings'] as const;
const ALLOWED_TRANSFORMS = ['desktop-schema-53-to-52'] as const;

export type ClassicJourneyId = (typeof JOURNEY_IDS)[number];
export type ClassicAuthorityKind = (typeof AUTHORITY_KINDS)[number];
export type ClassicAuthorityDisposition = (typeof AUTHORITY_DISPOSITIONS)[number];
export type ClassicRouteKind = (typeof ROUTE_KINDS)[number];

export type ClassicStateItem = Readonly<{
  id: string;
  path: string;
  digest: string;
}>;

export type ClassicChatItem = ClassicStateItem & Readonly<{ messageCount: number }>;

export type ClassicAuthorityValue = Readonly<{
  id: string;
  authority: ClassicAuthorityKind;
  disposition: ClassicAuthorityDisposition;
}>;

export type ClassicCoreReference = Readonly<{
  id: string;
  path: string;
  disposition: 'fail-closed';
}>;

export type ClassicExternalReference = Readonly<{
  id: string;
  kind: string;
  identity: string;
}>;

export type ClassicRepresentativeState = Readonly<{
  chats: readonly ClassicChatItem[];
  projects: readonly ClassicStateItem[];
  teams: readonly ClassicStateItem[];
  schedules: readonly ClassicStateItem[];
  artifacts: readonly ClassicStateItem[];
  managedWorkspaces: readonly ClassicStateItem[];
  settings: readonly ClassicStateItem[];
  authorityValues: readonly ClassicAuthorityValue[];
  coreReferences: readonly ClassicCoreReference[];
  externalReferences: readonly ClassicExternalReference[];
}>;

export type ClassicCurrentRoute = Readonly<{
  id: string;
  kind: ClassicRouteKind;
  tab?: string;
}>;

export type ClassicJourney = Readonly<{
  id: ClassicJourneyId;
  title: string;
  expectedOutcome: 'green';
  usesProviderFixture: boolean;
}>;

export type ClassicOutcome = Readonly<{
  journey: ClassicJourneyId;
  status: 'green';
  evidence: string;
}>;

export type ClassicJourneyBaseline = Readonly<{
  contract: typeof CLASSIC_JOURNEY_BASELINE_CONTRACT;
  schemaVersion: 1;
  release: Readonly<{ repository: string; tag: string; tagCommit: string; version: string }>;
  providerFixture: Readonly<{
    contract: typeof CLASSIC_PROVIDER_FIXTURE_CONTRACT;
    route: string;
    model: string;
    capability: string;
    digest: string;
  }>;
  representativeState: ClassicRepresentativeState;
  currentRoutes: readonly ClassicCurrentRoute[];
  journeys: readonly ClassicJourney[];
  outcomes: readonly ClassicOutcome[];
  transforms: Readonly<{
    allowed: readonly string[];
    forbiddenLoss: readonly string[];
    forbiddenWidening: readonly string[];
  }>;
  preservedIdentities: readonly string[];
}>;

export type ClassicProviderFixture = Readonly<{
  contract: typeof CLASSIC_PROVIDER_FIXTURE_CONTRACT;
  schemaVersion: 1;
  boundRelease: Readonly<{ repository: string; tag: string; version: string }>;
  route: string;
  model: string;
  capability: string;
  request: Readonly<{
    temperature: number;
    topP: number;
    seed: number;
    messages: ReadonlyArray<Readonly<{ role: string; content: string }>>;
  }>;
  response: Readonly<{
    role: 'assistant';
    finishReason: string;
    content: string;
    usage: Readonly<{ promptTokens: number; completionTokens: number; totalTokens: number }>;
  }>;
}>;

/** Stable canonical serialization: sort object keys by codepoint, recurse. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .toSorted(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

/** Hash of the stable canonical serialization. */
export function classicBaselineDigest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  const record = asRecord(value, label);
  const actual = Object.keys(record).toSorted();
  const expected = keys.toSorted();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} contains missing or unknown fields.`);
  }
  return record;
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.normalize('NFC') !== value || value.includes('\0')) {
    throw new Error(`${label} is not canonical text.`);
  }
  return value;
}

function requireId(value: unknown, label: string): string {
  const text = requireText(value, label);
  if (!ID_PATTERN.test(text)) throw new Error(`${label} is not a canonical identifier.`);
  return text;
}

function requireDigest(value: unknown, label: string): string {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) throw new Error(`${label} is not a SHA-256 digest.`);
  return value;
}

/** Canonical relative path: posix, NFC, no absolute/backslash/traversal segment. */
function requireCanonicalPath(value: unknown, label: string): string {
  const text = requireText(value, label);
  if (
    text.startsWith('/') ||
    text.includes('\\') ||
    text.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error(`${label} is not a canonical relative path.`);
  }
  return text;
}

/** Reject unsorted or duplicate identities; ordering must be byte-stable. */
function requireSortedUniqueIds(ids: readonly string[], label: string): void {
  for (let index = 1; index < ids.length; index += 1) {
    const previous = ids[index - 1]!;
    const current = ids[index]!;
    if (current === previous) throw new Error(`${label} contains a duplicate identity: ${current}`);
    if (current < previous) throw new Error(`${label} is not in stable ascending order at: ${current}`);
  }
}

function parseStateItems<T extends ClassicStateItem>(
  value: unknown,
  label: string,
  extra?: (record: Record<string, unknown>, item: ClassicStateItem, itemLabel: string) => T
): readonly T[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty array.`);
  const items = value.map((entry, index) => {
    const itemLabel = `${label}[${index}]`;
    const keys = extra ? ['id', 'path', 'digest', 'messageCount'] : ['id', 'path', 'digest'];
    const record = exactRecord(entry, keys, itemLabel);
    const item: ClassicStateItem = {
      id: requireId(record.id, `${itemLabel}.id`),
      path: requireCanonicalPath(record.path, `${itemLabel}.path`),
      digest: requireDigest(record.digest, `${itemLabel}.digest`),
    };
    return (extra ? extra(record, item, itemLabel) : item) as T;
  });
  requireSortedUniqueIds(
    items.map((item) => item.id),
    label
  );
  return items;
}

function parseAuthorityValues(value: unknown, label: string): readonly ClassicAuthorityValue[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty array.`);
  const items = value.map((entry, index): ClassicAuthorityValue => {
    const itemLabel = `${label}[${index}]`;
    const record = exactRecord(entry, ['id', 'authority', 'disposition'], itemLabel);
    const authority = record.authority;
    const disposition = record.disposition;
    if (authority !== 'desktop' && authority !== 'core') {
      throw new Error(`${itemLabel}.authority is not a known authority root.`);
    }
    if (disposition !== 'preserve' && disposition !== 'fail-closed') {
      throw new Error(`${itemLabel}.disposition is missing or unknown.`);
    }
    // Core-bearing authority can never silently widen into preserve. Until the
    // producer-owned quiescence successor (Core issue #896) is accepted, Core
    // authority must fail closed.
    if (authority === 'core' && disposition !== 'fail-closed') {
      throw new Error(`${itemLabel} widens Core authority: Core state must remain fail-closed.`);
    }
    return { id: requireId(record.id, `${itemLabel}.id`), authority, disposition };
  });
  requireSortedUniqueIds(
    items.map((item) => item.id),
    label
  );
  return items;
}

function parseCoreReferences(value: unknown, label: string): readonly ClassicCoreReference[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty array.`);
  const items = value.map((entry, index): ClassicCoreReference => {
    const itemLabel = `${label}[${index}]`;
    const record = exactRecord(entry, ['id', 'path', 'disposition'], itemLabel);
    if (record.disposition !== 'fail-closed') {
      throw new Error(`${itemLabel} must declare a fail-closed Core disposition.`);
    }
    return {
      id: requireId(record.id, `${itemLabel}.id`),
      path: requireCanonicalPath(record.path, `${itemLabel}.path`),
      disposition: 'fail-closed',
    };
  });
  requireSortedUniqueIds(
    items.map((item) => item.id),
    label
  );
  return items;
}

function parseExternalReferences(value: unknown, label: string): readonly ClassicExternalReference[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty array.`);
  const items = value.map((entry, index): ClassicExternalReference => {
    const itemLabel = `${label}[${index}]`;
    const record = exactRecord(entry, ['id', 'kind', 'identity'], itemLabel);
    return {
      id: requireId(record.id, `${itemLabel}.id`),
      kind: requireText(record.kind, `${itemLabel}.kind`),
      identity: requireText(record.identity, `${itemLabel}.identity`),
    };
  });
  requireSortedUniqueIds(
    items.map((item) => item.id),
    label
  );
  return items;
}

function parseRepresentativeState(value: unknown): ClassicRepresentativeState {
  const record = exactRecord(
    value,
    [
      'chats',
      'projects',
      'teams',
      'schedules',
      'artifacts',
      'managedWorkspaces',
      'settings',
      'authorityValues',
      'coreReferences',
      'externalReferences',
    ],
    'representativeState'
  );
  return {
    chats: parseStateItems<ClassicChatItem>(record.chats, 'representativeState.chats', (raw, item, itemLabel) => {
      if (!Number.isSafeInteger(raw.messageCount) || (raw.messageCount as number) < 0) {
        throw new Error(`${itemLabel}.messageCount is invalid.`);
      }
      return { ...item, messageCount: raw.messageCount as number };
    }),
    projects: parseStateItems(record.projects, 'representativeState.projects'),
    teams: parseStateItems(record.teams, 'representativeState.teams'),
    schedules: parseStateItems(record.schedules, 'representativeState.schedules'),
    artifacts: parseStateItems(record.artifacts, 'representativeState.artifacts'),
    managedWorkspaces: parseStateItems(record.managedWorkspaces, 'representativeState.managedWorkspaces'),
    settings: parseStateItems(record.settings, 'representativeState.settings'),
    authorityValues: parseAuthorityValues(record.authorityValues, 'representativeState.authorityValues'),
    coreReferences: parseCoreReferences(record.coreReferences, 'representativeState.coreReferences'),
    externalReferences: parseExternalReferences(record.externalReferences, 'representativeState.externalReferences'),
  };
}

function parseCurrentRoutes(value: unknown): readonly ClassicCurrentRoute[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('currentRoutes must be a non-empty array.');
  let guidSeen = false;
  const routes = value.map((entry, index): ClassicCurrentRoute => {
    const itemLabel = `currentRoutes[${index}]`;
    const record = asRecord(entry, itemLabel);
    const kind = record.kind;
    if (kind !== 'guid' && kind !== 'settings') throw new Error(`${itemLabel}.kind is not a known route kind.`);
    if (kind === 'guid') {
      exactRecord(entry, ['id', 'kind'], itemLabel);
      guidSeen = true;
      return { id: requireId(record.id, `${itemLabel}.id`), kind };
    }
    exactRecord(entry, ['id', 'kind', 'tab'], itemLabel);
    return {
      id: requireId(record.id, `${itemLabel}.id`),
      kind,
      tab: requireId(record.tab, `${itemLabel}.tab`),
    };
  });
  requireSortedUniqueIds(
    routes.map((route) => route.id),
    'currentRoutes'
  );
  if (!guidSeen) throw new Error('currentRoutes must include the guid current route.');
  return routes;
}

function parseJourneys(value: unknown): readonly ClassicJourney[] {
  if (!Array.isArray(value)) throw new Error('journeys must be an array.');
  const journeys = value.map((entry, index): ClassicJourney => {
    const itemLabel = `journeys[${index}]`;
    const record = exactRecord(entry, ['id', 'title', 'expectedOutcome', 'usesProviderFixture'], itemLabel);
    const id = record.id;
    if (!JOURNEY_IDS.includes(id as ClassicJourneyId)) throw new Error(`${itemLabel}.id is not a declared journey.`);
    if (record.expectedOutcome !== 'green') throw new Error(`${itemLabel}.expectedOutcome must be green.`);
    if (typeof record.usesProviderFixture !== 'boolean') throw new Error(`${itemLabel}.usesProviderFixture is invalid.`);
    return {
      id: id as ClassicJourneyId,
      title: requireText(record.title, `${itemLabel}.title`),
      expectedOutcome: 'green',
      usesProviderFixture: record.usesProviderFixture,
    };
  });
  const ids = journeys.map((journey) => journey.id);
  requireSortedUniqueIds(ids, 'journeys');
  if (ids.length !== JOURNEY_IDS.length || JOURNEY_IDS.some((id) => !ids.includes(id))) {
    throw new Error('journeys must exhaustively cover every declared Classic journey.');
  }
  return journeys;
}

function parseOutcomes(value: unknown, journeys: readonly ClassicJourney[]): readonly ClassicOutcome[] {
  if (!Array.isArray(value)) throw new Error('outcomes must be an array.');
  const outcomes = value.map((entry, index): ClassicOutcome => {
    const itemLabel = `outcomes[${index}]`;
    const record = exactRecord(entry, ['journey', 'status', 'evidence'], itemLabel);
    const journey = record.journey;
    if (!JOURNEY_IDS.includes(journey as ClassicJourneyId)) throw new Error(`${itemLabel}.journey is unknown.`);
    if (record.status !== 'green') throw new Error(`${itemLabel}.status must be green.`);
    return {
      journey: journey as ClassicJourneyId,
      status: 'green',
      evidence: requireText(record.evidence, `${itemLabel}.evidence`),
    };
  });
  // Complete outcome accounting: exactly one green outcome per declared journey.
  // Missing coverage or an unaccounted extra outcome fails closed.
  const covered = outcomes.map((outcome) => outcome.journey);
  requireSortedUniqueIds(covered.toSorted(), 'outcomes');
  if (covered.length !== journeys.length) throw new Error('outcomes must account for every journey exactly once.');
  for (const journey of journeys) {
    if (!covered.includes(journey.id)) throw new Error(`outcomes omit the ${journey.id} journey.`);
  }
  return outcomes;
}

function parseTransforms(value: unknown): ClassicJourneyBaseline['transforms'] {
  const record = exactRecord(value, ['allowed', 'forbiddenLoss', 'forbiddenWidening'], 'transforms');
  const parseList = (list: unknown, label: string, allowedOnly?: readonly string[]): readonly string[] => {
    if (!Array.isArray(list) || list.length === 0) throw new Error(`${label} must be a non-empty array.`);
    const items = list.map((entry, index) => requireId(entry, `${label}[${index}]`));
    requireSortedUniqueIds(items.toSorted(), label);
    if (new Set(items).size !== items.length) throw new Error(`${label} contains a duplicate transform.`);
    if (allowedOnly) {
      for (const item of items) {
        if (!allowedOnly.includes(item)) throw new Error(`${label} contains an unknown transform: ${item}`);
      }
    }
    return items;
  };
  return {
    allowed: parseList(record.allowed, 'transforms.allowed', ALLOWED_TRANSFORMS),
    forbiddenLoss: parseList(record.forbiddenLoss, 'transforms.forbiddenLoss'),
    forbiddenWidening: parseList(record.forbiddenWidening, 'transforms.forbiddenWidening'),
  };
}

/** Validate the whole baseline before any field becomes a source of truth. */
export function parseClassicJourneyBaseline(value: unknown): ClassicJourneyBaseline {
  const record = exactRecord(
    value,
    [
      'contract',
      'schemaVersion',
      'release',
      'providerFixture',
      'representativeState',
      'currentRoutes',
      'journeys',
      'outcomes',
      'transforms',
      'preservedIdentities',
    ],
    'Classic journey baseline'
  );
  if (record.contract !== CLASSIC_JOURNEY_BASELINE_CONTRACT) {
    throw new Error('Classic journey baseline has an unsupported contract.');
  }
  if (record.schemaVersion !== 1) throw new Error('Classic journey baseline has an unsupported schema version.');

  const release = exactRecord(record.release, ['repository', 'tag', 'tagCommit', 'version'], 'baseline.release');
  // Bind exactly to the compiled v0.11.18 release identity. Live/provider drift
  // to any other release cannot be normalized into this baseline.
  if (
    release.repository !== releaseJson.repository ||
    release.tag !== releaseJson.tag ||
    release.tagCommit !== releaseJson.tagCommit ||
    release.version !== releaseJson.version ||
    release.version !== '0.11.18'
  ) {
    throw new Error('Classic journey baseline release identity does not match the compiled v0.11.18 pin.');
  }

  const providerFixture = exactRecord(
    record.providerFixture,
    ['contract', 'route', 'model', 'capability', 'digest'],
    'baseline.providerFixture'
  );
  if (providerFixture.contract !== CLASSIC_PROVIDER_FIXTURE_CONTRACT) {
    throw new Error('Classic journey baseline provider fixture has an unsupported contract.');
  }
  requireText(providerFixture.route, 'baseline.providerFixture.route');
  requireText(providerFixture.model, 'baseline.providerFixture.model');
  requireText(providerFixture.capability, 'baseline.providerFixture.capability');
  requireDigest(providerFixture.digest, 'baseline.providerFixture.digest');

  const journeys = parseJourneys(record.journeys);

  const baseline: ClassicJourneyBaseline = {
    contract: CLASSIC_JOURNEY_BASELINE_CONTRACT,
    schemaVersion: 1,
    release: {
      repository: release.repository as string,
      tag: release.tag as string,
      tagCommit: release.tagCommit as string,
      version: release.version as string,
    },
    providerFixture: {
      contract: CLASSIC_PROVIDER_FIXTURE_CONTRACT,
      route: providerFixture.route as string,
      model: providerFixture.model as string,
      capability: providerFixture.capability as string,
      digest: providerFixture.digest as string,
    },
    representativeState: parseRepresentativeState(record.representativeState),
    currentRoutes: parseCurrentRoutes(record.currentRoutes),
    journeys,
    outcomes: parseOutcomes(record.outcomes, journeys),
    transforms: parseTransforms(record.transforms),
    preservedIdentities: ((): readonly string[] => {
      if (!Array.isArray(record.preservedIdentities) || record.preservedIdentities.length === 0) {
        throw new Error('preservedIdentities must be a non-empty array.');
      }
      const items = record.preservedIdentities.map((entry, index) =>
        requireText(entry, `preservedIdentities[${index}]`)
      );
      requireSortedUniqueIds(items.toSorted(), 'preservedIdentities');
      if (new Set(items).size !== items.length) throw new Error('preservedIdentities contains a duplicate.');
      return items;
    })(),
  };

  // A journey may only claim provider-fixture use if it is the fixture's bound
  // route; the chat journey must use the fixture.
  for (const journey of baseline.journeys) {
    if (journey.usesProviderFixture && journey.id !== 'chat') {
      throw new Error(`journey ${journey.id} may not bind the provider fixture.`);
    }
  }
  if (!baseline.journeys.find((journey) => journey.id === 'chat')?.usesProviderFixture) {
    throw new Error('The chat journey must consume the deterministic provider fixture.');
  }
  return baseline;
}

/** Validate the stable provider fixture and bind it to the v0.11.18 identity. */
export function parseClassicProviderFixture(value: unknown, baseline: ClassicJourneyBaseline): ClassicProviderFixture {
  const record = exactRecord(
    value,
    ['contract', 'schemaVersion', 'boundRelease', 'route', 'model', 'capability', 'request', 'response'],
    'Classic provider fixture'
  );
  if (record.contract !== CLASSIC_PROVIDER_FIXTURE_CONTRACT) {
    throw new Error('Classic provider fixture has an unsupported contract.');
  }
  if (record.schemaVersion !== 1) throw new Error('Classic provider fixture has an unsupported schema version.');

  const boundRelease = exactRecord(record.boundRelease, ['repository', 'tag', 'version'], 'fixture.boundRelease');
  if (
    boundRelease.repository !== baseline.release.repository ||
    boundRelease.tag !== baseline.release.tag ||
    boundRelease.version !== baseline.release.version
  ) {
    throw new Error('Classic provider fixture is not bound to the v0.11.18 baseline release.');
  }
  if (
    record.route !== baseline.providerFixture.route ||
    record.model !== baseline.providerFixture.model ||
    record.capability !== baseline.providerFixture.capability
  ) {
    throw new Error('Classic provider fixture route/model/capability drifted from the baseline identity.');
  }

  const request = exactRecord(record.request, ['temperature', 'topP', 'seed', 'messages'], 'fixture.request');
  // Determinism: only a fixed, non-sampling request is a stable comparison root.
  if (request.temperature !== 0 || request.topP !== 1 || !Number.isSafeInteger(request.seed)) {
    throw new Error('Classic provider fixture request is not deterministic.');
  }
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new Error('Classic provider fixture request has no messages.');
  }
  for (const [index, message] of request.messages.entries()) {
    const messageRecord = exactRecord(message, ['role', 'content'], `fixture.request.messages[${index}]`);
    requireText(messageRecord.role, `fixture.request.messages[${index}].role`);
    requireText(messageRecord.content, `fixture.request.messages[${index}].content`);
  }

  const response = exactRecord(record.response, ['role', 'finishReason', 'content', 'usage'], 'fixture.response');
  if (response.role !== 'assistant') throw new Error('Classic provider fixture response is not an assistant turn.');
  requireText(response.finishReason, 'fixture.response.finishReason');
  requireText(response.content, 'fixture.response.content');
  const usage = exactRecord(response.usage, ['promptTokens', 'completionTokens', 'totalTokens'], 'fixture.response.usage');
  for (const field of ['promptTokens', 'completionTokens', 'totalTokens'] as const) {
    if (!Number.isSafeInteger(usage[field]) || (usage[field] as number) < 0) {
      throw new Error(`fixture.response.usage.${field} is invalid.`);
    }
  }
  if ((usage.promptTokens as number) + (usage.completionTokens as number) !== usage.totalTokens) {
    throw new Error('Classic provider fixture usage totals are inconsistent.');
  }
  return record as unknown as ClassicProviderFixture;
}

/**
 * A candidate outcome inventory can never be coerced into the baseline. It must
 * match the sealed outcome set exactly (same journeys, all green) or throw.
 */
export function assertOutcomesMatchBaseline(
  candidate: readonly { journey: string; status: string }[],
  baseline: ClassicJourneyBaseline = CLASSIC_JOURNEY_BASELINE
): void {
  const expected = baseline.outcomes;
  if (!Array.isArray(candidate) || candidate.length !== expected.length) {
    throw new Error('Candidate outcome inventory does not cover the baseline journeys exactly.');
  }
  const byJourney = new Map(expected.map((outcome) => [outcome.journey, outcome.status]));
  const seen = new Set<string>();
  for (const outcome of candidate) {
    const status = byJourney.get(outcome.journey as ClassicJourneyId);
    if (status === undefined) throw new Error(`Candidate outcome references an unknown journey: ${outcome.journey}`);
    if (seen.has(outcome.journey)) throw new Error(`Candidate outcome duplicates journey: ${outcome.journey}`);
    if (outcome.status !== status) {
      throw new Error(`Candidate outcome for ${outcome.journey} is ${outcome.status}, not the required ${status}.`);
    }
    seen.add(outcome.journey);
  }
  if (seen.size !== expected.length) throw new Error('Candidate outcome inventory is missing baseline journeys.');
}

// ── Fail-closed compiled seal ────────────────────────────────────────────────

const compiledFixtureDigest = classicBaselineDigest(providerFixtureJson);
if (compiledFixtureDigest !== CLASSIC_PROVIDER_FIXTURE_DIGEST) {
  throw new Error('Classic provider fixture does not match its compiled content digest.');
}
const compiledBaselineDigest = classicBaselineDigest(baselineJson);
if (compiledBaselineDigest !== CLASSIC_JOURNEY_BASELINE_DIGEST) {
  throw new Error('Classic journey baseline does not match its compiled content digest.');
}

/** The sealed, validated deterministic Classic v0.11.18 journey baseline. */
export const CLASSIC_JOURNEY_BASELINE: ClassicJourneyBaseline = parseClassicJourneyBaseline(baselineJson);

if (CLASSIC_JOURNEY_BASELINE.providerFixture.digest !== CLASSIC_PROVIDER_FIXTURE_DIGEST) {
  throw new Error('Classic journey baseline references a provider fixture other than the compiled one.');
}

/** The sealed, validated stable provider fixture. */
export const CLASSIC_PROVIDER_FIXTURE: ClassicProviderFixture = parseClassicProviderFixture(
  providerFixtureJson,
  CLASSIC_JOURNEY_BASELINE
);
