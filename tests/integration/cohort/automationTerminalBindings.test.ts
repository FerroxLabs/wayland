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

import { CohortBaselineService, type M0BRecordResult } from '@process/services/cohort/CohortBaselineService';
import { LocalM0BCohortEventRepository } from '@process/services/cohort/LocalCohortEventRepository';
import { createM0BClassicBaselineConfig } from '@process/services/cohort/policy';
import {
  CohortIncidentAuthority,
  getIncidentAuthority,
  recordAutomationRun,
  recordIncidentStop,
  recordSessionTerminal,
  setIncidentAuthority,
  type IncidentRecorder,
} from '@process/services/cohort/instrumentation/CohortIncidentAuthority';
import type {
  M0BJourneyHandle,
  M0BJourneyStartResult,
} from '@process/services/cohort/instrumentation/CohortJourneyObserver';
import {
  CohortObservationIncidentIngestor,
  describeObservationPublicKey,
  issueObservationIncident,
  type ObservationEnvelopeSource,
  type ObservationIncident,
  type ObservationIncidentPayload,
  type ObservationIncidentPolicy,
  type ObservationTrustedPublicKey,
} from '@process/services/cohort/instrumentation/CohortObservationIncidentIngestor';
import { M0B_DAY_MS, type M0BZeroToleranceReason } from '@process/services/cohort/types';

const SESSION = 'observation-session-1';
const PROCESS = 'process' as const;

type RecorderEvent =
  | { type: 'journey-start' }
  | { type: 'journey-complete' }
  | { type: 'journey-fail' }
  | { type: 'session-end' }
  | { type: 'session-crash' }
  | { type: 'zero-tolerance'; reason: M0BZeroToleranceReason };

/**
 * A closed spy for the process-owned CohortJourneyObserver. It exposes only the
 * calls the incident authority may make and records the exact ordered stream so
 * the tests can prove closed pairs and terminals.
 */
class SpyIncidentRecorder implements IncidentRecorder {
  readonly events: RecorderEvent[] = [];
  private readonly handles = new WeakSet<object>();

  async startJourney(): Promise<M0BJourneyStartResult> {
    this.events.push({ type: 'journey-start' });
    const handle = Object.freeze({}) as M0BJourneyHandle;
    this.handles.add(handle as unknown as object);
    return { status: 'recorded', handle };
  }

  async completeJourney(handle: M0BJourneyHandle): Promise<M0BRecordResult> {
    if (!this.handles.has(handle as unknown as object)) return { status: 'rejected', code: 'invalid_field' };
    this.events.push({ type: 'journey-complete' });
    return { status: 'recorded' };
  }

  async failJourney(handle: M0BJourneyHandle): Promise<M0BRecordResult> {
    if (!this.handles.has(handle as unknown as object)) return { status: 'rejected', code: 'invalid_field' };
    this.events.push({ type: 'journey-fail' });
    return { status: 'recorded' };
  }

  async endSession(): Promise<M0BRecordResult> {
    this.events.push({ type: 'session-end' });
    return { status: 'recorded' };
  }

  async crashSession(): Promise<M0BRecordResult> {
    this.events.push({ type: 'session-crash' });
    return { status: 'recorded' };
  }

  async recordZeroToleranceStop(reason: M0BZeroToleranceReason): Promise<M0BRecordResult> {
    this.events.push({ type: 'zero-tolerance', reason });
    return { status: 'recorded' };
  }

  types(): RecorderEvent['type'][] {
    return this.events.map((event) => event.type);
  }
}

function makeAuthority(sessionId = SESSION) {
  const recorder = new SpyIncidentRecorder();
  const authority = new CohortIncidentAuthority({ recorder, sessionId });
  return { recorder, authority };
}

const t = (n: number) => ({ occurredAtMs: n, sessionId: SESSION, origin: PROCESS });

afterEach(() => setIncidentAuthority(undefined));

describe('CohortIncidentAuthority — operator.run-automation terminal binding', () => {
  it('emits exactly one closed start/complete pair for a correlated run', async () => {
    const { authority, recorder } = makeAuthority();

    const started = await authority.observeAutomationRun({ ...t(10), runId: 'job-a:1000', phase: 'started' });
    expect(started).toEqual({ status: 'armed', incident: 'operator.run-automation' });

    const done = await authority.observeAutomationRun({ ...t(11), runId: 'job-a:1000', phase: 'completed' });
    expect(done).toEqual({ status: 'recorded', incident: 'operator.run-automation' });

    expect(recorder.types()).toEqual(['journey-start', 'journey-complete']);
  });

  it('emits a fail terminal for an error run and never completes it', async () => {
    const { authority, recorder } = makeAuthority();
    await authority.observeAutomationRun({ ...t(20), runId: 'job-b:2000', phase: 'started' });
    const failed = await authority.observeAutomationRun({ ...t(21), runId: 'job-b:2000', phase: 'failed' });
    expect(failed).toEqual({ status: 'recorded', incident: 'operator.run-automation' });
    expect(recorder.types()).toEqual(['journey-start', 'journey-fail']);
  });

  it('correlates the scheduler start with the projector terminal across surfaces by runId', async () => {
    const { authority, recorder } = makeAuthority();
    // WorkerTaskManagerJobExecutor opens the run; ScheduleRunProjector closes it.
    const runId = 'daily-report:1700000000000';
    expect((await authority.observeAutomationRun({ ...t(30), runId, phase: 'started' })).status).toBe('armed');
    expect((await authority.observeAutomationRun({ ...t(31), runId, phase: 'completed' })).status).toBe('recorded');
    // Re-projecting the schedule page replays the terminal; it never double-emits.
    const replay = await authority.observeAutomationRun({ ...t(32), runId, phase: 'completed' });
    expect(replay).toEqual({ status: 'ignored', reason: 'duplicate-terminal' });
    expect(recorder.types()).toEqual(['journey-start', 'journey-complete']);
  });

  it('rejects a terminal with no correlated start (a projector outcome for an unseen run)', async () => {
    const { authority, recorder } = makeAuthority();
    const orphan = await authority.observeAutomationRun({ ...t(40), runId: 'never-started:9', phase: 'completed' });
    expect(orphan).toEqual({ status: 'ignored', reason: 'missing-start' });
    expect(recorder.events).toHaveLength(0);
  });

  it('ignores a duplicate start for an already-open run', async () => {
    const { authority, recorder } = makeAuthority();
    await authority.observeAutomationRun({ ...t(50), runId: 'job-c:5', phase: 'started' });
    const dup = await authority.observeAutomationRun({ ...t(51), runId: 'job-c:5', phase: 'started' });
    expect(dup).toEqual({ status: 'ignored', reason: 'duplicate-start' });
    expect(recorder.types()).toEqual(['journey-start']);
  });

  it('rejects renderer-origin, cross-session, stale, and malformed automation evidence', async () => {
    const { authority, recorder } = makeAuthority();
    await authority.observeAutomationRun({ ...t(60), runId: 'job-d:6', phase: 'started' });

    expect(
      await authority.observeAutomationRun({ occurredAtMs: 61, sessionId: SESSION, origin: 'renderer', runId: 'job-d:6', phase: 'completed' })
    ).toEqual({ status: 'rejected', reason: 'renderer-origin' });
    expect(
      await authority.observeAutomationRun({ occurredAtMs: 62, sessionId: 'other', origin: PROCESS, runId: 'job-d:6', phase: 'completed' })
    ).toEqual({ status: 'rejected', reason: 'cross-session' });
    expect(
      await authority.observeAutomationRun({ ...t(59), runId: 'job-d:6', phase: 'completed' })
    ).toEqual({ status: 'rejected', reason: 'stale' });
    expect(
      await authority.observeAutomationRun({ ...t(63), runId: '', phase: 'completed' })
    ).toEqual({ status: 'rejected', reason: 'malformed' });

    // None of the hostile submissions terminalized the run.
    expect(recorder.types()).toEqual(['journey-start']);
  });
});

describe('CohortIncidentAuthority — normal/crash session terminals', () => {
  it('records a normal session end and a crash as distinct closed terminals', async () => {
    const normal = makeAuthority('sess-normal');
    expect(await normal.authority.observeSessionTerminal({ occurredAtMs: 1, sessionId: 'sess-normal', origin: PROCESS, kind: 'normal' })).toEqual({
      status: 'recorded',
      incident: 'session_ended',
    });
    expect(normal.recorder.types()).toEqual(['session-end']);

    const crash = makeAuthority('sess-crash');
    expect(await crash.authority.observeSessionTerminal({ occurredAtMs: 1, sessionId: 'sess-crash', origin: PROCESS, kind: 'crash' })).toEqual({
      status: 'recorded',
      incident: 'session_crashed',
    });
    expect(crash.recorder.types()).toEqual(['session-crash']);
  });

  it('a crash after a normal end cannot become a second terminal', async () => {
    const { authority, recorder } = makeAuthority();
    await authority.observeSessionTerminal({ ...t(10), kind: 'normal' });
    const late = await authority.observeSessionTerminal({ ...t(11), kind: 'crash' });
    expect(late).toEqual({ status: 'ignored', reason: 'duplicate-session-terminal' });
    expect(recorder.types()).toEqual(['session-end']);
  });

  it('rejects renderer-origin session terminals', async () => {
    const { authority, recorder } = makeAuthority();
    const rendererCrash = await authority.observeSessionTerminal({ occurredAtMs: 5, sessionId: SESSION, origin: 'renderer', kind: 'crash' });
    expect(rendererCrash).toEqual({ status: 'rejected', reason: 'renderer-origin' });
    expect(recorder.events).toHaveLength(0);
  });
});

describe('CohortIncidentAuthority — zero-tolerance stop incident', () => {
  it('mints a zero_tolerance_stop only for a reason in the closed enum', async () => {
    const { authority, recorder } = makeAuthority();
    const minted = await authority.observeIncidentStop({ ...t(10), source: 'security-stop', reason: 'approval-bypass' });
    expect(minted).toEqual({ status: 'recorded', incident: 'zero_tolerance_stop' });
    expect(recorder.events).toEqual([{ type: 'zero-tolerance', reason: 'approval-bypass' }]);
  });

  it('a benign user stop or runaway halt mints no evidence (a failure cannot become a stop)', async () => {
    const { authority, recorder } = makeAuthority();
    expect(await authority.observeIncidentStop({ ...t(20), source: 'user-stop', reason: 'user-requested-stop' })).toEqual({
      status: 'ignored',
      reason: 'not-zero-tolerance',
    });
    expect(await authority.observeIncidentStop({ ...t(21), source: 'runaway-halt', reason: 'repeated-read' })).toEqual({
      status: 'ignored',
      reason: 'not-zero-tolerance',
    });
    expect(recorder.events).toHaveLength(0);
  });

  it('does not double-mint the same zero-tolerance reason on replay', async () => {
    const { authority, recorder } = makeAuthority();
    await authority.observeIncidentStop({ ...t(30), source: 'security-stop', reason: 'permission-widening' });
    const replay = await authority.observeIncidentStop({ ...t(31), source: 'security-stop', reason: 'permission-widening' });
    expect(replay).toEqual({ status: 'ignored', reason: 'duplicate-terminal' });
    expect(recorder.events).toHaveLength(1);
  });

  it('rejects renderer-origin and cross-session stop evidence', async () => {
    const { authority, recorder } = makeAuthority();
    expect(await authority.observeIncidentStop({ occurredAtMs: 1, sessionId: SESSION, origin: 'renderer', source: 'security-stop', reason: 'receipt-forgery' })).toEqual({
      status: 'rejected',
      reason: 'renderer-origin',
    });
    expect(await authority.observeIncidentStop({ occurredAtMs: 1, sessionId: 'foreign', origin: PROCESS, source: 'security-stop', reason: 'receipt-forgery' })).toEqual({
      status: 'rejected',
      reason: 'cross-session',
    });
    expect(recorder.events).toHaveLength(0);
  });
});

describe('CohortIncidentAuthority — inert seams and construction', () => {
  it('is a no-op when no observation session is installed', () => {
    setIncidentAuthority(undefined);
    expect(() => recordAutomationRun({ occurredAtMs: 1, runId: 'x:1', phase: 'started' })).not.toThrow();
    expect(() => recordSessionTerminal({ occurredAtMs: 1, kind: 'crash' })).not.toThrow();
    expect(() => recordIncidentStop({ occurredAtMs: 1, source: 'security-stop', reason: 'approval-bypass' })).not.toThrow();
    expect(getIncidentAuthority()).toBeUndefined();
  });

  it('forwards through the installed authority and tags process origin + session', async () => {
    const { authority, recorder } = makeAuthority();
    setIncidentAuthority(authority);
    recordAutomationRun({ occurredAtMs: 1, runId: 'seam:1', phase: 'started' });
    recordAutomationRun({ occurredAtMs: 2, runId: 'seam:1', phase: 'completed' });
    // Fire-and-forget seams are serialized by the authority; drain the tail.
    await authority.observeSessionTerminal({ ...t(3), kind: 'normal' });
    expect(recorder.types()).toEqual(['journey-start', 'journey-complete', 'session-end']);
  });

  it('rejects an invalid session identity at construction', () => {
    const recorder = new SpyIncidentRecorder();
    expect(() => new CohortIncidentAuthority({ recorder, sessionId: '' })).toThrow('INCIDENT_AUTHORITY_SESSION_ID_INVALID');
  });
});

// ---------------------------------------------------------------------------
// CohortObservationIncidentIngestor — authenticated support/accessibility.
// ---------------------------------------------------------------------------

const WINDOW_START = 1_800_000_000_000;
const WINDOW_END = WINDOW_START + 14 * M0B_DAY_MS;
const OCCURRED_AT = WINDOW_START + M0B_DAY_MS;
const PARTICIPANT = 'a'.repeat(64);
const INSTALL_PARTICIPANT = 'b'.repeat(64);
const CANDIDATE_COMMIT = `sha256:${'c'.repeat(64)}` as const;
const CANDIDATE_TREE = `sha256:${'d'.repeat(64)}` as const;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const protocolPath = path.resolve(scriptDir, '../../../contracts/cohort/m0b-usability-protocol.json');
const PROTOCOL_DIGEST = `sha256:${createHash('sha256').update(readFileSync(protocolPath)).digest('hex')}` as const;

const roots: string[] = [];

function makeKeypair(): { keyId: string; privateKey: KeyObject; descriptor: ObservationTrustedPublicKey } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const keyId = 'm0b-observer-key-1';
  return { keyId, privateKey, descriptor: describeObservationPublicKey(keyId, publicKey) };
}

function makePayload(
  keyId: string,
  incident: ObservationIncident,
  overrides: Partial<ObservationIncidentPayload> = {}
): ObservationIncidentPayload {
  return {
    schemaVersion: 1,
    protocolDigest: PROTOCOL_DIGEST,
    candidateCommit: CANDIDATE_COMMIT,
    candidateTree: CANDIDATE_TREE,
    appVersion: '0.11.18-wave5',
    installParticipantHash: INSTALL_PARTICIPANT,
    participantIdHash: PARTICIPANT,
    sessionId: 'obs-session-01',
    windowStartMs: WINDOW_START,
    windowEndMs: WINDOW_END,
    occurredAtMs: OCCURRED_AT,
    cohort: 'developer',
    shell: 'cockpit',
    terminalBinding: 'terminal-binding-01',
    incident,
    signerKeyId: keyId,
    nonce: 'nonce-000000000001',
    ...overrides,
  };
}

function makePolicy(descriptor: ObservationTrustedPublicKey): ObservationIncidentPolicy {
  return {
    expected: {
      protocolDigest: PROTOCOL_DIGEST,
      candidateCommit: CANDIDATE_COMMIT,
      candidateTree: CANDIDATE_TREE,
      appVersion: '0.11.18-wave5',
      installParticipantHash: INSTALL_PARTICIPANT,
      window: { startMs: WINDOW_START, endMs: WINDOW_END },
      cohort: 'developer',
      shell: 'cockpit',
    },
    trustedPublicKeys: [descriptor],
  };
}

async function makeService(source?: ObservationEnvelopeSource): Promise<{
  service: CohortBaselineService;
  ingestor: CohortObservationIncidentIngestor;
  policyKey: ReturnType<typeof makeKeypair>;
}> {
  const root = await mkdtempP(path.join(os.tmpdir(), 'wayland-m0b-incident-'));
  roots.push(root);
  const repository = new LocalM0BCohortEventRepository({
    rootDirectory: path.join(root, 'events'),
    windowStartMs: WINDOW_START,
    windowEndMs: WINDOW_END,
  });
  const config = createM0BClassicBaselineConfig({
    appVersion: '0.11.18-wave5',
    windowStartMs: WINDOW_START,
    privacyMode: 'structured-cohort-uat',
  });
  const policyKey = makeKeypair();
  const service = new CohortBaselineService(repository, config, { enabled: true, acceptedAtMs: WINDOW_START }, undefined);
  const ingestor = new CohortObservationIncidentIngestor({ service, policy: makePolicy(policyKey.descriptor), source });
  return { service, ingestor, policyKey };
}

/**
 * An observation session always opens with a `session_started` bearing the same
 * identity the signed incidents carry; without it the aggregator contract-rejects
 * the incident (missing_session_start), which is exactly the correlation the
 * incident inherits.
 */
async function seedSession(service: CohortBaselineService): Promise<void> {
  const result = await service.record({
    schemaVersion: 1,
    eventId: 'obs-session-start-0001',
    participantIdHash: PARTICIPANT,
    sessionId: 'obs-session-01',
    occurredAtMs: WINDOW_START + 100,
    cohort: 'developer',
    shell: 'cockpit',
    kind: 'session_started',
  });
  expect(result.status).toBe('recorded');
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rmP(root, { recursive: true, force: true })));
});

describe('CohortObservationIncidentIngestor — authenticated incident admission', () => {
  it('admits a signed support_contact and it surfaces once in the aggregate', async () => {
    const { service, ingestor, policyKey } = await makeService();
    await seedSession(service);
    const envelope = issueObservationIncident(
      makePayload(policyKey.keyId, { kind: 'support_contact', category: 'blocked' }),
      { keyId: policyKey.keyId, privateKey: policyKey.privateKey }
    );

    const outcome = await ingestor.ingest(envelope);
    expect(outcome.status).toBe('admitted');

    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.supportContactCount).toBe(1);
    expect(report.totals.accessibilityViolationCount).toBe(0);
  });

  it('admits a signed accessibility_violation', async () => {
    const { service, ingestor, policyKey } = await makeService();
    await seedSession(service);
    const envelope = issueObservationIncident(
      makePayload(policyKey.keyId, { kind: 'accessibility_violation', severity: 'critical' }, { nonce: 'nonce-000000000002' }),
      { keyId: policyKey.keyId, privateKey: policyKey.privateKey }
    );
    expect((await ingestor.ingest(envelope)).status).toBe('admitted');
    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.accessibilityViolationCount).toBe(1);
  });

  it('a restart/replay of the identical envelope cannot mint a second incident', async () => {
    const { service, ingestor, policyKey } = await makeService();
    await seedSession(service);
    const envelope = issueObservationIncident(
      makePayload(policyKey.keyId, { kind: 'support_contact', category: 'bug' }),
      { keyId: policyKey.keyId, privateKey: policyKey.privateKey }
    );
    expect((await ingestor.ingest(envelope)).status).toBe('admitted');
    expect((await ingestor.ingest(envelope)).status).toBe('admitted');
    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.supportContactCount).toBe(1);
  });

  it('fails closed on conflicting reuse of the (protocol_digest, signer_key_id, nonce) tuple', async () => {
    const { service, ingestor, policyKey } = await makeService();
    await seedSession(service);
    const first = issueObservationIncident(
      makePayload(policyKey.keyId, { kind: 'support_contact', category: 'blocked' }, { nonce: 'nonce-conflict-00001' }),
      { keyId: policyKey.keyId, privateKey: policyKey.privateKey }
    );
    // Same tuple, different admitted content: must collide on the derived event id.
    const conflicting = issueObservationIncident(
      makePayload(policyKey.keyId, { kind: 'support_contact', category: 'how-to' }, { nonce: 'nonce-conflict-00001' }),
      { keyId: policyKey.keyId, privateKey: policyKey.privateKey }
    );
    expect((await ingestor.ingest(first)).status).toBe('admitted');
    expect(await ingestor.ingest(conflicting)).toEqual({ status: 'denied', reason: 'replayed' });
    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.supportContactCount).toBe(1);
  });

  it('denies an unknown signer and a tampered signature without emitting evidence', async () => {
    const { service, ingestor, policyKey } = await makeService();
    const strangerKey = generateKeyPairSync('ed25519');
    const forged = issueObservationIncident(makePayload(policyKey.keyId, { kind: 'support_contact', category: 'setup' }), {
      keyId: policyKey.keyId,
      privateKey: strangerKey.privateKey,
    });
    expect(await ingestor.ingest(forged)).toEqual({ status: 'denied', reason: 'untrusted-signer' });

    // Same descriptor keyId, but signed by a stranger whose fingerprint differs → untrusted.
    const authentic = issueObservationIncident(makePayload(policyKey.keyId, { kind: 'support_contact', category: 'setup' }), {
      keyId: policyKey.keyId,
      privateKey: policyKey.privateKey,
    });
    const tampered = new Uint8Array(authentic);
    tampered[tampered.length - 3] ^= 0xff; // corrupt a signature byte inside the canonical JSON
    const tamperedOutcome = await ingestor.ingest(tampered);
    expect(tamperedOutcome.status).toBe('denied');

    const report = await service.aggregate(WINDOW_END - 1);
    expect(report.totals.supportContactCount).toBe(0);
  });

  it('denies protocol, candidate, install, window, and scope mismatches', async () => {
    const { ingestor, policyKey } = await makeService();
    const sign = (payload: ObservationIncidentPayload) =>
      issueObservationIncident(payload, { keyId: policyKey.keyId, privateKey: policyKey.privateKey });
    const support: ObservationIncident = { kind: 'support_contact', category: 'blocked' };

    expect((await ingestor.ingest(sign(makePayload(policyKey.keyId, support, { protocolDigest: `sha256:${'0'.repeat(64)}`, nonce: 'nonce-mismatch-0001' })))).status).toBe('denied');
    expect((await ingestor.ingest(sign(makePayload(policyKey.keyId, support, { candidateCommit: `sha256:${'9'.repeat(64)}`, nonce: 'nonce-mismatch-0002' })))).status).toBe('denied');
    expect((await ingestor.ingest(sign(makePayload(policyKey.keyId, support, { installParticipantHash: 'f'.repeat(64), nonce: 'nonce-mismatch-0003' })))).status).toBe('denied');
    expect((await ingestor.ingest(sign(makePayload(policyKey.keyId, support, { windowStartMs: WINDOW_START + 1, windowEndMs: WINDOW_END + 1, nonce: 'nonce-mismatch-0004' })))).status).toBe('denied');
    expect((await ingestor.ingest(sign(makePayload(policyKey.keyId, support, { cohort: 'novice', nonce: 'nonce-mismatch-0005' })))).status).toBe('denied');
    expect((await ingestor.ingest(sign(makePayload(policyKey.keyId, support, { occurredAtMs: WINDOW_END + M0B_DAY_MS, nonce: 'nonce-mismatch-0006' })))).status).toBe('denied');
  });

  it('rejects non-envelope inputs (renderer prose, a bug report, a generic error) as malformed', async () => {
    const { ingestor } = await makeService();
    expect(await ingestor.ingest(new TextEncoder().encode('captureBugReport'))).toEqual({ status: 'denied', reason: 'malformed-envelope' });
    expect(await ingestor.ingest(new TextEncoder().encode('{"kind":"support_contact"}'))).toEqual({ status: 'denied', reason: 'malformed-envelope' });
    expect(await ingestor.ingest('not-even-bytes')).toEqual({ status: 'denied', reason: 'malformed-envelope' });
  });
});

describe('CohortBaselineService — drains the observation ingestor before aggregation', () => {
  it('admits only queued signed envelopes and never fabricates from an empty inbox', async () => {
    const root = await mkdtempP(path.join(os.tmpdir(), 'wayland-m0b-drain-'));
    roots.push(root);
    const repository = new LocalM0BCohortEventRepository({
      rootDirectory: path.join(root, 'events'),
      windowStartMs: WINDOW_START,
      windowEndMs: WINDOW_END,
    });
    const config = createM0BClassicBaselineConfig({ appVersion: '0.11.18-wave5', windowStartMs: WINDOW_START, privacyMode: 'structured-cohort-uat' });
    const policyKey = makeKeypair();

    let inbox: Uint8Array[] = [];
    const source: ObservationEnvelopeSource = { list: async () => inbox };

    // The ingestor and the service share one repository; the service drains the
    // ingestor before it reads the window.
    let ingestor!: CohortObservationIncidentIngestor;
    const service = new CohortBaselineService(repository, config, { enabled: true, acceptedAtMs: WINDOW_START }, {
      ingestPending: () => ingestor.ingestPending(),
    });
    ingestor = new CohortObservationIncidentIngestor({ service, policy: makePolicy(policyKey.descriptor), source });
    await seedSession(service);

    // Empty inbox: aggregation invents nothing.
    const empty = await service.aggregate(WINDOW_END - 1);
    expect(empty.totals.supportContactCount).toBe(0);

    // Queue one authentic envelope; the next aggregate drains and admits it once.
    inbox = [
      issueObservationIncident(makePayload(policyKey.keyId, { kind: 'support_contact', category: 'blocked' }), {
        keyId: policyKey.keyId,
        privateKey: policyKey.privateKey,
      }),
    ];
    const filled = await service.aggregate(WINDOW_END - 1);
    expect(filled.totals.supportContactCount).toBe(1);

    // Re-draining the same inbox never double-counts.
    const again = await service.aggregate(WINDOW_END - 1);
    expect(again.totals.supportContactCount).toBe(1);
  });
});
