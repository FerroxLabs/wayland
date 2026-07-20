/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, generateKeyPairSync, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdtemp as mkdtempP, rm as rmP } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { aggregateM0BBaseline } from '@process/services/cohort/CohortBaselineAggregator';
import {
  CohortBaselineService,
  type M0BCohortEventRepository,
  type M0BObservationIncidentIngestor,
} from '@process/services/cohort/CohortBaselineService';
import { LocalM0BCohortEventRepository } from '@process/services/cohort/LocalCohortEventRepository';
import { createM0BClassicBaselineConfig } from '@process/services/cohort/policy';
import { CohortIncidentAuthority } from '@process/services/cohort/instrumentation/CohortIncidentAuthority';
import { CohortJourneyObserver } from '@process/services/cohort/instrumentation/CohortJourneyObserver';
import {
  CohortObservationIncidentIngestor,
  describeObservationPublicKey,
  issueObservationIncident,
  type ObservationIncident,
  type ObservationIncidentPayload,
  type ObservationIncidentPolicy,
  type ObservationTrustedPublicKey,
} from '@process/services/cohort/instrumentation/CohortObservationIncidentIngestor';
import { CohortWorkJourneyAuthority } from '@process/services/cohort/instrumentation/CohortWorkJourneyAuthority';
import { M0B_DAY_MS, M0B_PRIMARY_JOURNEYS, type M0BCohort } from '@process/services/cohort/types';

// ---------------------------------------------------------------------------
// A single locally constructed 14-day Classic observation window. Every event
// is produced by the real process-owned graph:
//   authority (work/incident/ingestor) -> CohortJourneyObserver -> service ->
//   durable LocalM0BCohortEventRepository -> aggregateM0BBaseline.
// No live observation is started: timestamps are fixed inside the window.
// ---------------------------------------------------------------------------

const WINDOW_START = 1_800_000_000_000;
const WINDOW_END = WINDOW_START + 14 * M0B_DAY_MS;
const APP_VERSION = '0.11.18-wave6';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rmP(root, { recursive: true, force: true })));
});

function baselineConfig() {
  return createM0BClassicBaselineConfig({
    appVersion: APP_VERSION,
    windowStartMs: WINDOW_START,
    privacyMode: 'structured-cohort-uat',
  });
}

async function makeRepository(): Promise<{ root: string; repository: LocalM0BCohortEventRepository }> {
  const root = await mkdtempP(path.join(os.tmpdir(), 'wayland-m0b-classic-'));
  roots.push(root);
  const repository = new LocalM0BCohortEventRepository({
    rootDirectory: path.join(root, 'events'),
    windowStartMs: WINDOW_START,
    windowEndMs: WINDOW_END,
  });
  return { root, repository };
}

function makeService(
  repository: M0BCohortEventRepository,
  incidentIngestor?: M0BObservationIncidentIngestor
): CohortBaselineService {
  return new CohortBaselineService(
    repository,
    baselineConfig(),
    { enabled: true, acceptedAtMs: WINDOW_START },
    incidentIngestor
  );
}

/**
 * A deterministic, strictly-increasing in-window clock plus opaque id generator
 * for one participant. Every emitted event id and journey-run id is unique and
 * matches the closed opaque-id shape the privacy parser enforces.
 */
function makeClock(baseMs: number) {
  let tick = 0;
  let idSeq = 0;
  return {
    now: () => baseMs + tick++ * 1_000,
    nextId: () => `id-${baseMs}-${String(idSeq++).padStart(6, '0')}`,
  };
}

/**
 * One real Classic participant session: a process-owned CohortJourneyObserver
 * wired as the recorder behind the production work-journey and incident
 * authorities. Evidence is submitted exactly as the production seams submit it
 * (process origin, the frozen session tag, a monotonic clock).
 */
class ClassicParticipant {
  readonly observer: CohortJourneyObserver;
  readonly work: CohortWorkJourneyAuthority;
  readonly incident: CohortIncidentAuthority;
  private readonly sessionId: string;
  private readonly baseMs: number;
  private evTick = 0;

  constructor(service: CohortBaselineService, installIdentity: string, cohort: M0BCohort, baseMs: number) {
    const clock = makeClock(baseMs);
    this.baseMs = baseMs;
    this.observer = new CohortJourneyObserver({
      service,
      installIdentity,
      cohort,
      shell: 'classic',
      now: clock.now,
      createId: clock.nextId,
    });
    this.sessionId = `obs-${cohort}-${baseMs}`;
    this.work = new CohortWorkJourneyAuthority({ recorder: this.observer, sessionId: this.sessionId });
    this.incident = new CohortIncidentAuthority({ recorder: this.observer, sessionId: this.sessionId });
  }

  private base() {
    return { sessionId: this.sessionId, occurredAtMs: this.baseMs + this.evTick++, origin: 'process' as const };
  }

  async open(): Promise<void> {
    const started = await this.observer.startSession();
    expect(started.status).toBe('recorded');
  }

  async chatFirstResponse(conversationId: string, workspace: string) {
    return this.work.observeConversationCompletion({ ...this.base(), conversationId, turnAccepted: true, workspace });
  }

  async projectResume(projectId: string, workspace: string) {
    return this.work.observeProjectResume({ ...this.base(), projectId, persisted: true, conversationCount: 3, workspace });
  }

  async coworkArtifact(workspace: string) {
    return this.work.observeWorkspaceChange({ ...this.base(), workspace, createdCount: 1, modifiedCount: 0, deletedCount: 0 });
  }

  async developerVerify(workspace: string) {
    return this.work.observeVerificationResult({ ...this.base(), workspace, kind: 'execute', isToolResult: true, success: true });
  }

  async automation(runId: string, phase: 'started' | 'completed' | 'failed') {
    return this.incident.observeAutomationRun({ ...this.base(), runId, phase });
  }

  async endSession(kind: 'normal' | 'crash') {
    return this.incident.observeSessionTerminal({ ...this.base(), kind });
  }

  async zeroToleranceStop(reason: string) {
    return this.incident.observeIncidentStop({ ...this.base(), source: 'security-stop', reason });
  }

  async benignUserStop(reason: string) {
    return this.incident.observeIncidentStop({ ...this.base(), source: 'user-stop', reason });
  }

  /** Correlate a workspace and emit both the cowork artifact and developer verify terminals. */
  async coworkAndDeveloper(conversationId: string, workspace: string) {
    expect((await this.chatFirstResponse(conversationId, workspace)).status).toBe('recorded');
    expect((await this.coworkArtifact(workspace)).status).toBe('recorded');
    expect((await this.developerVerify(workspace)).status).toBe('recorded');
  }
}

// --- Signed observation-incident helpers (support / accessibility) ---------

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const protocolPath = path.resolve(scriptDir, '../../../contracts/cohort/m0b-usability-protocol.json');
const PROTOCOL_DIGEST = `sha256:${createHash('sha256').update(readFileSync(protocolPath)).digest('hex')}` as const;
const CANDIDATE_COMMIT = `sha256:${'c'.repeat(64)}` as const;
const CANDIDATE_TREE = `sha256:${'d'.repeat(64)}` as const;
const INSTALL_PARTICIPANT = 'b'.repeat(64);
const OBS_PARTICIPANT = 'a'.repeat(64);
const OBS_SESSION = 'obs-usability-session-1';

function makeKeypair(): { keyId: string; privateKey: KeyObject; descriptor: ObservationTrustedPublicKey } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const keyId = 'm0b-observer-key-classic';
  return { keyId, privateKey, descriptor: describeObservationPublicKey(keyId, publicKey) };
}

function usabilityPayload(
  keyId: string,
  incident: ObservationIncident,
  nonce: string
): ObservationIncidentPayload {
  return {
    schemaVersion: 1,
    protocolDigest: PROTOCOL_DIGEST,
    candidateCommit: CANDIDATE_COMMIT,
    candidateTree: CANDIDATE_TREE,
    appVersion: APP_VERSION,
    installParticipantHash: INSTALL_PARTICIPANT,
    participantIdHash: OBS_PARTICIPANT,
    sessionId: OBS_SESSION,
    windowStartMs: WINDOW_START,
    windowEndMs: WINDOW_END,
    occurredAtMs: WINDOW_START + M0B_DAY_MS,
    cohort: 'developer',
    shell: 'classic',
    terminalBinding: 'terminal-binding-classic-1',
    incident,
    signerKeyId: keyId,
    nonce,
  };
}

function usabilityPolicy(descriptor: ObservationTrustedPublicKey): ObservationIncidentPolicy {
  return {
    expected: {
      protocolDigest: PROTOCOL_DIGEST,
      candidateCommit: CANDIDATE_COMMIT,
      candidateTree: CANDIDATE_TREE,
      appVersion: APP_VERSION,
      installParticipantHash: INSTALL_PARTICIPANT,
      window: { startMs: WINDOW_START, endMs: WINDOW_END },
      cohort: 'developer',
      shell: 'classic',
    },
    trustedPublicKeys: [descriptor],
  };
}

/** Seed the observation session the signed usability incidents correlate to. */
async function seedUsabilitySession(service: CohortBaselineService): Promise<void> {
  const seeded = await service.record({
    schemaVersion: 1,
    eventId: 'obs-usability-start-0001',
    participantIdHash: OBS_PARTICIPANT,
    sessionId: OBS_SESSION,
    occurredAtMs: WINDOW_START + 100,
    cohort: 'developer',
    shell: 'classic',
    kind: 'session_started',
  });
  expect(seeded.status).toBe('recorded');
}

describe('Classic production instrumentation — five work/automation journeys', () => {
  it('emits exactly one closed start/complete pair for every primary journey through the real graph', async () => {
    const { repository } = await makeRepository();
    const service = makeService(repository);
    const participant = new ClassicParticipant(service, 'install-five-journeys', 'developer', WINDOW_START + 3_600_000);
    await participant.open();

    const workspace = '/classic/workspace/five';
    await participant.coworkAndDeveloper('conv-five', workspace);
    expect((await participant.projectResume('proj-five', workspace)).status).toBe('recorded');
    expect((await participant.automation('auto-five:1', 'started')).status).toBe('armed');
    expect((await participant.automation('auto-five:1', 'completed')).status).toBe('recorded');
    expect((await participant.endSession('normal')).status).toBe('recorded');

    const report = await service.aggregate(WINDOW_END - 1);

    for (const journey of M0B_PRIMARY_JOURNEYS) {
      expect(report.byPrimaryJourney[journey]).toMatchObject({
        journeyStartedCount: 1,
        journeyCompletedCount: 1,
        journeyFailedCount: 0,
        journeyUnresolvedCount: 0,
      });
    }
    expect(report.totals.journeyStartedCount).toBe(5);
    expect(report.totals.journeyCompletedCount).toBe(5);
    expect(report.totals.journeyUnresolvedCount).toBe(0);
    expect(report.totals.sessionStartedCount).toBe(1);
    expect(report.totals.sessionEndedCount).toBe(1);
    expect(report.totals.participantCount).toBe(1);
    expect(report.quality.contractRejectedEventCount).toBe(0);
    expect(report.quality.privacyRejectedEventCount).toBe(0);
  });
});

describe('Classic production instrumentation — session terminals and failures', () => {
  it('records normal, crash, and failed terminals as distinct denominators', async () => {
    const { repository } = await makeRepository();
    const service = makeService(repository);

    const normal = new ClassicParticipant(service, 'install-normal', 'novice', WINDOW_START + 3_600_000);
    await normal.open();
    expect((await normal.chatFirstResponse('conv-normal', '/ws/normal')).status).toBe('recorded');
    expect((await normal.endSession('normal')).status).toBe('recorded');

    const crashed = new ClassicParticipant(service, 'install-crash', 'operator', WINDOW_START + 7_200_000);
    await crashed.open();
    expect((await crashed.automation('auto-crash:1', 'started')).status).toBe('armed');
    expect((await crashed.automation('auto-crash:1', 'failed')).status).toBe('recorded');
    expect((await crashed.endSession('crash')).status).toBe('recorded');

    const report = await service.aggregate(WINDOW_END - 1);

    expect(report.totals.sessionStartedCount).toBe(2);
    expect(report.totals.sessionEndedCount).toBe(1);
    expect(report.totals.sessionCrashedCount).toBe(1);
    expect(report.totals.sessionIncompleteCount).toBe(0);
    expect(report.totals.crashFreeSessionRate).toBe(0.5);
    expect(report.totals.journeyFailedCount).toBe(1);
    expect(report.byPrimaryJourney['operator.run-automation']).toMatchObject({
      journeyStartedCount: 1,
      journeyCompletedCount: 0,
      journeyFailedCount: 1,
      journeyUnresolvedCount: 0,
    });
    expect(report.quality.contractRejectedEventCount).toBe(0);
  });

  it('counts unresolved work without ever minting a terminal', async () => {
    const { repository } = await makeRepository();
    const service = makeService(repository);
    const participant = new ClassicParticipant(service, 'install-unresolved', 'knowledge-work', WINDOW_START + 3_600_000);
    await participant.open();

    // A run that starts but never terminalizes is unresolved, never a success.
    expect((await participant.automation('auto-open:1', 'started')).status).toBe('armed');

    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.journeyStartedCount).toBe(1);
    expect(report.totals.journeyCompletedCount).toBe(0);
    expect(report.totals.journeyFailedCount).toBe(0);
    expect(report.totals.journeyUnresolvedCount).toBe(1);
    expect(report.totals.sessionIncompleteCount).toBe(1);
  });
});

describe('Classic production instrumentation — authenticated usability incidents', () => {
  it('admits one signed support_contact and one accessibility_violation into the aggregate', async () => {
    const { repository } = await makeRepository();
    const keypair = makeKeypair();
    let ingestor!: CohortObservationIncidentIngestor;
    const inbox: Uint8Array[] = [
      issueObservationIncident(usabilityPayload(keypair.keyId, { kind: 'support_contact', category: 'blocked' }, 'nonce-support-0000001'), {
        keyId: keypair.keyId,
        privateKey: keypair.privateKey,
      }),
      issueObservationIncident(
        usabilityPayload(keypair.keyId, { kind: 'accessibility_violation', severity: 'critical' }, 'nonce-a11y-000000000001'),
        { keyId: keypair.keyId, privateKey: keypair.privateKey }
      ),
    ];
    const service = makeService(repository, { ingestPending: () => ingestor.ingestPending() });
    ingestor = new CohortObservationIncidentIngestor({
      service,
      policy: usabilityPolicy(keypair.descriptor),
      source: { list: async () => inbox },
    });
    await seedUsabilitySession(service);

    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.supportContactCount).toBe(1);
    expect(report.totals.accessibilityViolationCount).toBe(1);

    // Re-draining the identical inbox never mints a second incident.
    const again = await service.aggregate(WINDOW_END - 1);
    expect(again.totals.supportContactCount).toBe(1);
    expect(again.totals.accessibilityViolationCount).toBe(1);
    expect(again.quality.contractRejectedEventCount).toBe(0);
  });

  it('never fabricates a usability incident from an empty inbox', async () => {
    const { repository } = await makeRepository();
    const keypair = makeKeypair();
    let ingestor!: CohortObservationIncidentIngestor;
    const service = makeService(repository, { ingestPending: () => ingestor.ingestPending() });
    ingestor = new CohortObservationIncidentIngestor({
      service,
      policy: usabilityPolicy(keypair.descriptor),
      source: { list: async () => [] },
    });
    await seedUsabilitySession(service);

    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.supportContactCount).toBe(0);
    expect(report.totals.accessibilityViolationCount).toBe(0);
  });
});

describe('Classic production instrumentation — zero-tolerance stop', () => {
  it('trips the automatic stop gate for a mapped zero-tolerance reason and blocks the decision', async () => {
    const { repository } = await makeRepository();
    const service = makeService(repository);
    const participant = new ClassicParticipant(service, 'install-stop', 'operator', WINDOW_START + 3_600_000);
    await participant.open();

    expect((await participant.zeroToleranceStop('approval-bypass')).status).toBe('recorded');
    // A benign user stop is not a zero-tolerance reason and mints nothing.
    expect(await participant.benignUserStop('user-requested-stop')).toEqual({ status: 'ignored', reason: 'not-zero-tolerance' });

    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.zeroToleranceStopCount).toBe(1);
    expect(report.totals.zeroToleranceStopsByReason['approval-bypass']).toBe(1);
    expect(report.gates.automaticStopTriggered).toBe(true);
    expect(report.decision.readyForDecision).toBe(false);
  });
});

describe('Classic production instrumentation — duplicate conflicts', () => {
  it('ignores a duplicate automation terminal so the completion is counted exactly once', async () => {
    const { repository } = await makeRepository();
    const service = makeService(repository);
    const participant = new ClassicParticipant(service, 'install-dup', 'developer', WINDOW_START + 3_600_000);
    await participant.open();

    expect((await participant.automation('auto-dup:1', 'started')).status).toBe('armed');
    expect((await participant.automation('auto-dup:1', 'completed')).status).toBe('recorded');
    // A replayed terminal (e.g. the schedule page re-projecting) never re-emits.
    expect(await participant.automation('auto-dup:1', 'completed')).toEqual({ status: 'ignored', reason: 'duplicate-terminal' });

    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.byPrimaryJourney['operator.run-automation']).toMatchObject({
      journeyStartedCount: 1,
      journeyCompletedCount: 1,
      journeyUnresolvedCount: 0,
    });
    expect(report.quality.contractRejectedEventCount).toBe(0);
  });

  it('collapses an exact duplicate event and rejects a conflicting event id at aggregation', () => {
    const base = {
      schemaVersion: 1 as const,
      eventId: 'conflict-000001',
      participantIdHash: 'a'.repeat(16),
      sessionId: 'dup-session-1',
      occurredAtMs: WINDOW_START + 5_000,
      cohort: 'developer' as const,
      shell: 'classic' as const,
      kind: 'session_started' as const,
    };
    const conflicting = { ...base, occurredAtMs: WINDOW_START + 6_000 };

    const report = aggregateM0BBaseline([base, { ...base }, conflicting], baselineConfig(), WINDOW_END - 1);
    expect(report.quality.duplicateEventCount).toBe(1);
    expect(report.quality.contractErrors).toEqual([{ eventId: 'conflict-000001', code: 'conflicting_event_id' }]);
    expect(report.quality.contractRejectedEventCount).toBe(1);
    expect(report.gates.dataQualityPass).toBe(false);
  });
});

describe('Classic production instrumentation — content injection', () => {
  it('rejects a content-bearing field at the process boundary and never stores it', async () => {
    const { repository } = await makeRepository();
    const service = makeService(repository);

    const injected = {
      schemaVersion: 1 as const,
      eventId: 'inject-000001',
      participantIdHash: 'a'.repeat(16),
      sessionId: 'inject-session-1',
      occurredAtMs: WINDOW_START + 5_000,
      cohort: 'developer' as const,
      shell: 'classic' as const,
      kind: 'session_started' as const,
      prompt: 'exfiltrate this secret',
    };

    expect(await service.record(injected)).toEqual({ status: 'rejected', code: 'forbidden_field', field: 'prompt' });

    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.sessionStartedCount).toBe(0);
    expect(report.quality.acceptedEventCount).toBe(0);

    // The same injected input fed to the aggregator is a privacy rejection, never accepted evidence.
    const rejectedReport = aggregateM0BBaseline([injected], baselineConfig(), WINDOW_END - 1);
    expect(rejectedReport.quality.privacyRejections).toEqual([{ index: 0, code: 'forbidden_field', field: 'prompt' }]);
    expect(rejectedReport.quality.acceptedEventCount).toBe(0);
    expect(rejectedReport.gates.dataQualityPass).toBe(false);
  });
});

describe('Classic production instrumentation — durable restart aggregation', () => {
  it('re-aggregates an identical report from the durable stream after a process restart', async () => {
    const { root, repository } = await makeRepository();
    const service = makeService(repository);
    const participant = new ClassicParticipant(service, 'install-restart', 'developer', WINDOW_START + 3_600_000);
    await participant.open();
    await participant.coworkAndDeveloper('conv-restart', '/ws/restart');
    expect((await participant.automation('auto-restart:1', 'started')).status).toBe('armed');
    expect((await participant.automation('auto-restart:1', 'completed')).status).toBe('recorded');
    expect((await participant.endSession('normal')).status).toBe('recorded');

    const before = await service.aggregate(WINDOW_END - 1);

    // A cold restart: a brand-new repository + service instance over the same
    // durable directory must reproduce the report and mint nothing new.
    const restarted = new LocalM0BCohortEventRepository({
      rootDirectory: path.join(root, 'events'),
      windowStartMs: WINDOW_START,
      windowEndMs: WINDOW_END,
    });
    const after = await makeService(restarted).aggregate(WINDOW_END - 1);

    expect(after.totals).toEqual(before.totals);
    expect(after.byPrimaryJourney).toEqual(before.byPrimaryJourney);
    expect(after.quality.acceptedEventCount).toBe(before.quality.acceptedEventCount);
    expect(after.quality.duplicateEventCount).toBe(0);
  });
});
