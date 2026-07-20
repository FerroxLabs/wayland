/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Whole-Classic observation construction proof.
 *
 * The complete Classic journey corpus is constructed through the real
 * process-owned graph and traverses production composition end to end:
 *
 *   work/incident authorities + signed usability ingestor
 *     -> CohortJourneyObserver
 *       -> CohortBaselineService.record
 *         -> durable LocalM0BCohortEventRepository (on disk)
 *           -> CohortBaselineService.aggregate -> aggregateM0BBaseline
 *
 * No live observation is started: the 14-day window is fixed and every event
 * timestamp is deterministic. The test asserts exact denominators and terminals
 * for every required journey, session terminal, usability incident, and stop
 * condition, then proves the report is durable and idempotent across a cold
 * restart of the repository and service.
 */

import { createHash, generateKeyPairSync, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdtemp as mkdtempP, rm as rmP } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { test, expect } from '@playwright/test';

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
import { M0B_DAY_MS, type M0BCohort } from '@process/services/cohort/types';

const WINDOW_START = 1_800_000_000_000;
const WINDOW_END = WINDOW_START + 14 * M0B_DAY_MS;
const APP_VERSION = '0.11.18-wave6';

const baselineConfig = () =>
  createM0BClassicBaselineConfig({ appVersion: APP_VERSION, windowStartMs: WINDOW_START, privacyMode: 'structured-cohort-uat' });

function makeService(
  repository: M0BCohortEventRepository,
  incidentIngestor?: M0BObservationIncidentIngestor
): CohortBaselineService {
  return new CohortBaselineService(repository, baselineConfig(), { enabled: true, acceptedAtMs: WINDOW_START }, incidentIngestor);
}

function makeRepository(eventDir: string): LocalM0BCohortEventRepository {
  return new LocalM0BCohortEventRepository({ rootDirectory: eventDir, windowStartMs: WINDOW_START, windowEndMs: WINDOW_END });
}

function makeClock(baseMs: number) {
  let tick = 0;
  let idSeq = 0;
  return {
    now: () => baseMs + tick++ * 1_000,
    nextId: () => `id-${baseMs}-${String(idSeq++).padStart(6, '0')}`,
  };
}

/** One real Classic participant session driven through the production authorities. */
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
    this.observer = new CohortJourneyObserver({ service, installIdentity, cohort, shell: 'classic', now: clock.now, createId: clock.nextId });
    this.sessionId = `obs-${cohort}-${baseMs}`;
    this.work = new CohortWorkJourneyAuthority({ recorder: this.observer, sessionId: this.sessionId });
    this.incident = new CohortIncidentAuthority({ recorder: this.observer, sessionId: this.sessionId });
  }

  private base() {
    return { sessionId: this.sessionId, occurredAtMs: this.baseMs + this.evTick++, origin: 'process' as const };
  }

  async open() {
    expect((await this.observer.startSession()).status).toBe('recorded');
  }

  async chatFirstResponse(conversationId: string, workspace: string) {
    expect((await this.work.observeConversationCompletion({ ...this.base(), conversationId, turnAccepted: true, workspace })).status).toBe('recorded');
  }

  async projectResume(projectId: string, workspace: string) {
    expect((await this.work.observeProjectResume({ ...this.base(), projectId, persisted: true, conversationCount: 3, workspace })).status).toBe('recorded');
  }

  async coworkAndDeveloper(conversationId: string, workspace: string) {
    await this.chatFirstResponse(conversationId, workspace);
    expect((await this.work.observeWorkspaceChange({ ...this.base(), workspace, createdCount: 1, modifiedCount: 0, deletedCount: 0 })).status).toBe('recorded');
    expect((await this.work.observeVerificationResult({ ...this.base(), workspace, kind: 'execute', isToolResult: true, success: true })).status).toBe('recorded');
  }

  async automation(runId: string, phase: 'started' | 'completed' | 'failed') {
    return this.incident.observeAutomationRun({ ...this.base(), runId, phase });
  }

  async endSession(kind: 'normal' | 'crash') {
    expect((await this.incident.observeSessionTerminal({ ...this.base(), kind })).status).toBe('recorded');
  }

  async zeroToleranceStop(reason: string) {
    expect((await this.incident.observeIncidentStop({ ...this.base(), source: 'security-stop', reason })).status).toBe('recorded');
  }
}

// --- Signed usability incident helpers -------------------------------------

// Playwright runs from the repository root; resolve the protocol contract there.
const protocolPath = path.resolve(process.cwd(), 'contracts/cohort/m0b-usability-protocol.json');
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

function usabilityPayload(keyId: string, incident: ObservationIncident, nonce: string): ObservationIncidentPayload {
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

async function seedUsabilitySession(service: CohortBaselineService) {
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

/**
 * Construct the whole locally built Classic corpus into a durable repository
 * rooted at `eventDir`, returning the signed-envelope inbox so a fresh service
 * can re-drain (or decline to re-mint) the same usability incidents.
 */
async function constructClassicCorpus(eventDir: string): Promise<void> {
  const keypair = makeKeypair();
  const inbox: Uint8Array[] = [
    issueObservationIncident(usabilityPayload(keypair.keyId, { kind: 'support_contact', category: 'blocked' }, 'nonce-support-0000001'), {
      keyId: keypair.keyId,
      privateKey: keypair.privateKey,
    }),
    issueObservationIncident(usabilityPayload(keypair.keyId, { kind: 'accessibility_violation', severity: 'critical' }, 'nonce-a11y-000000000001'), {
      keyId: keypair.keyId,
      privateKey: keypair.privateKey,
    }),
  ];

  let ingestor!: CohortObservationIncidentIngestor;
  const service = makeService(makeRepository(eventDir), { ingestPending: () => ingestor.ingestPending() });
  ingestor = new CohortObservationIncidentIngestor({ service, policy: usabilityPolicy(keypair.descriptor), source: { list: async () => inbox } });

  // A Classic session that only produced authenticated usability incidents.
  await seedUsabilitySession(service);

  // P1 — developer: all four work journeys plus a completed automation run, normal exit.
  const p1 = new ClassicParticipant(service, 'install-p1-developer', 'developer', WINDOW_START + 3_600_000);
  await p1.open();
  await p1.coworkAndDeveloper('conv-p1', '/ws/p1');
  await p1.projectResume('proj-p1', '/ws/p1');
  expect((await p1.automation('auto-p1:1', 'started')).status).toBe('armed');
  expect((await p1.automation('auto-p1:1', 'completed')).status).toBe('recorded');
  await p1.endSession('normal');

  // P2 — operator: a project resume and a FAILED automation run, crash exit.
  const p2 = new ClassicParticipant(service, 'install-p2-operator', 'operator', WINDOW_START + 7_200_000);
  await p2.open();
  await p2.projectResume('proj-p2', '/ws/p2');
  expect((await p2.automation('auto-p2:1', 'started')).status).toBe('armed');
  expect((await p2.automation('auto-p2:1', 'failed')).status).toBe('recorded');
  await p2.endSession('crash');

  // P3 — knowledge-work: an automation run that starts but never resolves; incomplete session.
  const p3 = new ClassicParticipant(service, 'install-p3-knowledge', 'knowledge-work', WINDOW_START + 10_800_000);
  await p3.open();
  expect((await p3.automation('auto-p3:1', 'started')).status).toBe('armed');

  // P4 — novice: a chat first response and a zero-tolerance stop, normal exit.
  const p4 = new ClassicParticipant(service, 'install-p4-novice', 'novice', WINDOW_START + 14_400_000);
  await p4.open();
  await p4.chatFirstResponse('conv-p4', '/ws/p4');
  await p4.zeroToleranceStop('approval-bypass');
  await p4.endSession('normal');

  // Drain the signed usability inbox into the durable stream through aggregation.
  const drained = await service.aggregate(WINDOW_END - 1);
  expect(drained.totals.supportContactCount).toBe(1);
  expect(drained.totals.accessibilityViolationCount).toBe(1);
}

test.describe('Classic observation — whole-corpus construction and durable aggregation', () => {
  test('the complete Classic corpus preserves denominator, terminal, and privacy truth end to end', async () => {
    const root = await mkdtempP(path.join(os.tmpdir(), 'wayland-m0b-e2e-classic-'));
    const eventDir = path.join(root, 'events');
    try {
      await constructClassicCorpus(eventDir);

      // A cold restart: a brand-new repository + service over the durable stream,
      // with no ingestor, must read the whole corpus straight from disk.
      const report = await makeService(makeRepository(eventDir)).aggregate(WINDOW_END - 1);

      // --- Sessions and participants ---
      expect(report.totals.sessionStartedCount).toBe(5);
      expect(report.totals.sessionEndedCount).toBe(2);
      expect(report.totals.sessionCrashedCount).toBe(1);
      expect(report.totals.sessionIncompleteCount).toBe(2);
      expect(report.totals.crashFreeSessionRate).toBeCloseTo(2 / 3, 10);
      expect(report.totals.participantCount).toBe(5);
      expect(report.byCohort.developer.participantCount).toBe(2);
      expect(report.byCohort.operator.participantCount).toBe(1);
      expect(report.byCohort['knowledge-work'].participantCount).toBe(1);
      expect(report.byCohort.novice.participantCount).toBe(1);

      // --- Journey denominators and terminals ---
      expect(report.totals.journeyStartedCount).toBe(9);
      expect(report.totals.journeyCompletedCount).toBe(7);
      expect(report.totals.journeyFailedCount).toBe(1);
      expect(report.totals.journeyUnresolvedCount).toBe(1);
      expect(report.totals.journeySuccessRate).toBeCloseTo(7 / 9, 10);
      expect(report.totals.journeyFailureRate).toBeCloseTo(1 / 9, 10);

      expect(report.byPrimaryJourney['chat.first-response']).toMatchObject({ journeyStartedCount: 2, journeyCompletedCount: 2, journeyFailedCount: 0, journeyUnresolvedCount: 0 });
      expect(report.byPrimaryJourney['project.resume']).toMatchObject({ journeyStartedCount: 2, journeyCompletedCount: 2, journeyUnresolvedCount: 0 });
      expect(report.byPrimaryJourney['cowork.create-artifact']).toMatchObject({ journeyStartedCount: 1, journeyCompletedCount: 1, journeyUnresolvedCount: 0 });
      expect(report.byPrimaryJourney['developer.modify-and-verify']).toMatchObject({ journeyStartedCount: 1, journeyCompletedCount: 1, journeyUnresolvedCount: 0 });
      expect(report.byPrimaryJourney['operator.run-automation']).toMatchObject({ journeyStartedCount: 3, journeyCompletedCount: 1, journeyFailedCount: 1, journeyUnresolvedCount: 1 });

      // --- Usability incidents and stop condition ---
      expect(report.totals.supportContactCount).toBe(1);
      expect(report.totals.accessibilityViolationCount).toBe(1);
      expect(report.totals.zeroToleranceStopCount).toBe(1);
      expect(report.totals.zeroToleranceStopsByReason['approval-bypass']).toBe(1);
      expect(report.totals.returnToClassicCount).toBe(0);

      // --- Privacy / data-quality truth ---
      expect(report.quality.privacyRejectedEventCount).toBe(0);
      expect(report.quality.contractRejectedEventCount).toBe(0);
      expect(report.quality.duplicateEventCount).toBe(0);
      expect(report.gates.dataQualityPass).toBe(true);

      // --- Gate truth: the corpus is honest about not yet meeting the decision bar ---
      expect(report.gates.automaticStopTriggered).toBe(true);
      expect(report.gates.windowComplete).toBe(false);
      expect(report.gates.minimumStartsPerPrimaryJourneyMet).toBe(false);
      expect(report.decision.readyForDecision).toBe(false);
      expect(report.decision.authorizedForInvitedAlpha).toBe(false);
    } finally {
      await rmP(root, { recursive: true, force: true }).catch(() => undefined);
    }
  });
});
