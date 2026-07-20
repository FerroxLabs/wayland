/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { M0BRecordResult } from '../CohortBaselineService';
import type { M0BJourneyHandle, M0BJourneyStartResult } from './CohortJourneyObserver';
import { M0B_ZERO_TOLERANCE_REASONS, type M0BZeroToleranceReason } from '../types';

/**
 * The minimal process-owned recording capability this authority needs. The
 * production {@link CohortJourneyObserver} satisfies it structurally, but the
 * narrow surface keeps the incident authority testable without a live
 * observation session and guarantees it can only emit the closed
 * automation-journey, session-terminal, and zero-tolerance events.
 */
export interface IncidentRecorder {
  startJourney(journeyId: 'operator.run-automation'): Promise<M0BJourneyStartResult>;
  completeJourney(handle: M0BJourneyHandle): Promise<M0BRecordResult>;
  failJourney(handle: M0BJourneyHandle): Promise<M0BRecordResult>;
  endSession(): Promise<M0BRecordResult>;
  crashSession(): Promise<M0BRecordResult>;
  recordZeroToleranceStop(reason: M0BZeroToleranceReason): Promise<M0BRecordResult>;
}

/**
 * Every incident submission carries the frozen observation session it belongs
 * to, the process-owned origin, and a monotonic clock. Renderer-origin,
 * cross-session, malformed, and stale evidence fail closed before any terminal
 * is emitted.
 */
type EvidenceBase = Readonly<{
  sessionId: string;
  occurredAtMs: number;
  origin: 'process' | 'renderer';
}>;

/**
 * `operator.run-automation` seam. A single automation run is identified by one
 * correlated `runId` that flows from the scheduler executor, the workflow parent
 * driver, and the schedule projector. `started` arms and opens the journey;
 * `completed`/`failed` is the terminal and requires the run to have started.
 */
export type AutomationRunEvidence = EvidenceBase &
  Readonly<{
    runId: string;
    phase: 'started' | 'completed' | 'failed';
  }>;

/**
 * WCore/ACP manager and watchdog lifecycle seam. A `normal` process exit is the
 * `session_ended` terminal; an unexpected exit or a watchdog-detected stall is
 * the `session_crashed` terminal. Neither can become the other.
 */
export type SessionTerminalEvidence = EvidenceBase &
  Readonly<{
    kind: 'normal' | 'crash';
  }>;

/**
 * Explicit user-stop, WCore runaway halt, and fail-closed security/authority
 * stop seam. It is authoritative for a `zero_tolerance_stop` ONLY when its typed
 * `reason` maps to the closed {@link M0B_ZERO_TOLERANCE_REASONS} enum; a benign
 * stop (a user stop, a loop-detection halt) carries no such reason and mints no
 * evidence.
 */
export type IncidentStopEvidence = EvidenceBase &
  Readonly<{
    source: 'user-stop' | 'runaway-halt' | 'security-stop';
    /** Free-form typed reason. Only an exact zero-tolerance enum member mints evidence. */
    reason: string;
  }>;

export type IncidentRejectReason = 'renderer-origin' | 'cross-session' | 'malformed' | 'stale';

export type IncidentIgnoreReason =
  | 'duplicate-start'
  | 'missing-start'
  | 'duplicate-terminal'
  | 'duplicate-session-terminal'
  | 'not-zero-tolerance';

export type IncidentClass =
  | 'operator.run-automation'
  | 'session_ended'
  | 'session_crashed'
  | 'zero_tolerance_stop';

export type IncidentOutcome =
  | { status: 'recorded'; incident: IncidentClass }
  | { status: 'armed'; incident: 'operator.run-automation' }
  | { status: 'ignored'; reason: IncidentIgnoreReason }
  | { status: 'rejected'; reason: IncidentRejectReason }
  | { status: 'observer-error'; detail: Exclude<M0BRecordResult, { status: 'recorded' }> | M0BJourneyStartResult };

type AutomationRunState = {
  handle: M0BJourneyHandle;
  terminalized: boolean;
};

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

const isZeroToleranceReason = (value: string): value is M0BZeroToleranceReason =>
  (M0B_ZERO_TOLERANCE_REASONS as readonly string[]).includes(value);

/**
 * Process-owned correlation and terminal authority for the automation journey
 * (`operator.run-automation`), the normal/crash session terminals, and the
 * zero-tolerance stop incident. It never infers a terminal from renderer state,
 * model prose, a benign stop, or a loop-detection halt. Each recognised run
 * emits exactly one closed start/terminal pair; the session emits exactly one
 * terminal; and a zero-tolerance stop is minted only for a reason that maps to
 * the closed enum. Every duplicate, replayed, cross-session, missing-start, and
 * unmapped submission fails closed without publishing evidence.
 */
export class CohortIncidentAuthority {
  private readonly recorder: IncidentRecorder;
  readonly sessionId: string;

  private readonly runs = new Map<string, AutomationRunState>();
  private sessionTerminalized = false;
  private readonly mintedZeroToleranceReasons = new Set<M0BZeroToleranceReason>();
  /** Per-subject monotonic clock so replayed, older evidence is stale, not terminal. */
  private readonly subjectClock = new Map<string, number>();
  /** Serialize every submission so a start always resolves before its terminal. */
  private operationTail: Promise<void> = Promise.resolve();

  constructor(input: Readonly<{ recorder: IncidentRecorder; sessionId: string }>) {
    if (!isNonEmptyString(input.sessionId)) throw new Error('INCIDENT_AUTHORITY_SESSION_ID_INVALID');
    this.recorder = input.recorder;
    this.sessionId = input.sessionId;
  }

  /**
   * `operator.run-automation`: correlate one automation run by its `runId`. The
   * first `started` opens the journey; a `completed`/`failed` for a started run
   * is the terminal. A terminal with no prior start, or a second start/terminal
   * for the same run, fails closed.
   */
  observeAutomationRun(evidence: AutomationRunEvidence): Promise<IncidentOutcome> {
    return this.enqueue(() => this.runAutomation(evidence));
  }

  private async runAutomation(evidence: AutomationRunEvidence): Promise<IncidentOutcome> {
    const gate = this.gate(
      evidence,
      `automation:${evidence.runId}`,
      isNonEmptyString(evidence.runId) &&
        (evidence.phase === 'started' || evidence.phase === 'completed' || evidence.phase === 'failed')
    );
    if (gate) return gate;

    if (evidence.phase === 'started') {
      if (this.runs.has(evidence.runId)) return { status: 'ignored', reason: 'duplicate-start' };
      const started = await this.recorder.startJourney('operator.run-automation');
      if (started.status !== 'recorded') return { status: 'observer-error', detail: started };
      this.runs.set(evidence.runId, { handle: started.handle, terminalized: false });
      return { status: 'armed', incident: 'operator.run-automation' };
    }

    const run = this.runs.get(evidence.runId);
    if (!run) return { status: 'ignored', reason: 'missing-start' };
    if (run.terminalized) return { status: 'ignored', reason: 'duplicate-terminal' };

    const terminal =
      evidence.phase === 'completed'
        ? await this.recorder.completeJourney(run.handle)
        : await this.recorder.failJourney(run.handle);
    if (terminal.status !== 'recorded') return { status: 'observer-error', detail: terminal };
    run.terminalized = true;
    return { status: 'recorded', incident: 'operator.run-automation' };
  }

  /**
   * Normal (`session_ended`) or crash (`session_crashed`) session terminal from
   * the WCore/ACP manager lifecycle or a watchdog. Exactly one session terminal
   * is authoritative; a later terminal of either kind fails closed.
   */
  observeSessionTerminal(evidence: SessionTerminalEvidence): Promise<IncidentOutcome> {
    return this.enqueue(() => this.runSessionTerminal(evidence));
  }

  private async runSessionTerminal(evidence: SessionTerminalEvidence): Promise<IncidentOutcome> {
    const gate = this.gate(evidence, 'session:terminal', evidence.kind === 'normal' || evidence.kind === 'crash');
    if (gate) return gate;

    if (this.sessionTerminalized) return { status: 'ignored', reason: 'duplicate-session-terminal' };

    const terminal = evidence.kind === 'normal' ? await this.recorder.endSession() : await this.recorder.crashSession();
    if (terminal.status !== 'recorded') return { status: 'observer-error', detail: terminal };
    this.sessionTerminalized = true;
    return { status: 'recorded', incident: evidence.kind === 'normal' ? 'session_ended' : 'session_crashed' };
  }

  /**
   * Explicit stop incident. A `zero_tolerance_stop` is minted only when the
   * typed `reason` maps to the closed enum; any other reason (a benign user
   * stop, a runaway loop halt) mints no evidence. Each mapped reason is minted at
   * most once per session so replay cannot double-count a stop.
   */
  observeIncidentStop(evidence: IncidentStopEvidence): Promise<IncidentOutcome> {
    return this.enqueue(() => this.runIncidentStop(evidence));
  }

  private async runIncidentStop(evidence: IncidentStopEvidence): Promise<IncidentOutcome> {
    const gate = this.gate(
      evidence,
      `stop:${evidence.reason}`,
      isNonEmptyString(evidence.reason) &&
        (evidence.source === 'user-stop' || evidence.source === 'runaway-halt' || evidence.source === 'security-stop')
    );
    if (gate) return gate;

    if (!isZeroToleranceReason(evidence.reason)) return { status: 'ignored', reason: 'not-zero-tolerance' };
    if (this.mintedZeroToleranceReasons.has(evidence.reason)) return { status: 'ignored', reason: 'duplicate-terminal' };

    const recorded = await this.recorder.recordZeroToleranceStop(evidence.reason);
    if (recorded.status !== 'recorded') return { status: 'observer-error', detail: recorded };
    this.mintedZeroToleranceReasons.add(evidence.reason);
    return { status: 'recorded', incident: 'zero_tolerance_stop' };
  }

  /**
   * Shared fail-closed gate: reject renderer-origin, cross-session, malformed,
   * and stale (replayed older-than-last) evidence before any incident logic
   * runs. Returns a rejection outcome to short-circuit, or `null` to proceed.
   */
  private gate(
    evidence: EvidenceBase,
    subjectKey: string,
    shapeValid: boolean
  ): Extract<IncidentOutcome, { status: 'rejected' }> | null {
    if (evidence.origin !== 'process') return { status: 'rejected', reason: 'renderer-origin' };
    if (evidence.sessionId !== this.sessionId) return { status: 'rejected', reason: 'cross-session' };
    if (typeof evidence.occurredAtMs !== 'number' || !Number.isFinite(evidence.occurredAtMs) || evidence.occurredAtMs < 0) {
      return { status: 'rejected', reason: 'malformed' };
    }
    if (!shapeValid) return { status: 'rejected', reason: 'malformed' };

    const last = this.subjectClock.get(subjectKey);
    if (last !== undefined && evidence.occurredAtMs < last) return { status: 'rejected', reason: 'stale' };
    this.subjectClock.set(subjectKey, last === undefined ? evidence.occurredAtMs : Math.max(last, evidence.occurredAtMs));
    return null;
  }

  private enqueue(operation: () => Promise<IncidentOutcome>): Promise<IncidentOutcome> {
    const result = this.operationTail.then(operation, operation);
    this.operationTail = result.then(
      (): void => undefined,
      (): void => undefined
    );
    return result;
  }
}

/**
 * Single process-owned incident authority for the running observation session.
 * It stays `undefined` until a live observation runtime installs one, which
 * keeps every production seam binding inert (a no-op) until real observation
 * begins.
 */
let installedAuthority: CohortIncidentAuthority | undefined;

export function setIncidentAuthority(authority: CohortIncidentAuthority | undefined): void {
  installedAuthority = authority;
}

export function getIncidentAuthority(): CohortIncidentAuthority | undefined {
  return installedAuthority;
}

/** Evidence forwarded by a production seam; the session tag and origin are filled from the authority. */
type SeamEvidence<T extends EvidenceBase> = Omit<T, 'sessionId' | 'origin'>;

const seamTag = (authority: CohortIncidentAuthority): Pick<EvidenceBase, 'sessionId' | 'origin'> => ({
  sessionId: authority.sessionId,
  origin: 'process',
});

// Instrumentation must never disturb the production seam: swallow all errors.
const swallowInstrumentationError = (): void => undefined;

export function recordAutomationRun(evidence: SeamEvidence<AutomationRunEvidence>): void {
  const authority = installedAuthority;
  if (!authority) return;
  const full: AutomationRunEvidence = { ...evidence, ...seamTag(authority) };
  void authority.observeAutomationRun(full).catch(swallowInstrumentationError);
}

export function recordSessionTerminal(evidence: SeamEvidence<SessionTerminalEvidence>): void {
  const authority = installedAuthority;
  if (!authority) return;
  const full: SessionTerminalEvidence = { ...evidence, ...seamTag(authority) };
  void authority.observeSessionTerminal(full).catch(swallowInstrumentationError);
}

export function recordIncidentStop(evidence: SeamEvidence<IncidentStopEvidence>): void {
  const authority = installedAuthority;
  if (!authority) return;
  const full: IncidentStopEvidence = { ...evidence, ...seamTag(authority) };
  void authority.observeIncidentStop(full).catch(swallowInstrumentationError);
}
