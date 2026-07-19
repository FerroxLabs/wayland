/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';

import type { CohortBaselineService, M0BRecordResult } from '../CohortBaselineService';
import {
  M0B_ACCESSIBILITY_SEVERITIES,
  M0B_COHORTS,
  M0B_PRIMARY_JOURNEYS,
  M0B_RETURN_REASONS,
  M0B_SCHEMA_VERSION,
  M0B_SHELLS,
  M0B_SUPPORT_CATEGORIES,
  M0B_ZERO_TOLERANCE_REASONS,
  type M0BAccessibilitySeverity,
  type M0BCohort,
  type M0BCohortEvent,
  type M0BPrimaryJourney,
  type M0BReturnReason,
  type M0BShell,
  type M0BSupportCategory,
  type M0BZeroToleranceReason,
} from '../types';

declare const JOURNEY_HANDLE_BRAND: unique symbol;

/** An opaque, process-owned capability for completing one recorded journey. */
export type M0BJourneyHandle = Readonly<{ [JOURNEY_HANDLE_BRAND]: true }>;

export type M0BJourneyStartResult =
  | { status: 'recorded'; handle: M0BJourneyHandle }
  | Exclude<M0BRecordResult, { status: 'recorded' }>;

export type CohortJourneyObserverInput = Readonly<{
  service: CohortBaselineService;
  installIdentity: string;
  cohort: M0BCohort;
  shell: M0BShell;
  now?: () => number;
  createId?: () => string;
}>;

type SessionState = 'idle' | 'open' | 'ended' | 'crashed';
type JourneyState = {
  journeyRunId: string;
  journeyId: M0BPrimaryJourney;
  terminal: boolean;
};

const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === 'string' && values.includes(value as T);

const rejected = (field: string): Extract<M0BRecordResult, { status: 'rejected' }> => ({
  status: 'rejected',
  code: 'invalid_field',
  field,
});

/**
 * The sole process-owned construction boundary for M0B lifecycle evidence.
 * Callers select only closed categories. Identity, session IDs, event IDs, and
 * journey-run IDs are generated here and never accepted from renderer input.
 */
export class CohortJourneyObserver {
  private readonly participantIdHash: string;
  private readonly sessionId: string;
  private readonly now: () => number;
  private readonly createId: () => string;
  private readonly journeys = new WeakMap<object, JourneyState>();
  private readonly pendingEvents = new Map<string, M0BCohortEvent>();
  private sessionState: SessionState = 'idle';
  private operationTail: Promise<void> = Promise.resolve();

  constructor(private readonly input: CohortJourneyObserverInput) {
    if (typeof input.installIdentity !== 'string' || input.installIdentity.length === 0) {
      throw new Error('M0B_OBSERVER_INSTALL_IDENTITY_INVALID');
    }
    if (!isOneOf(input.cohort, M0B_COHORTS)) throw new Error('M0B_OBSERVER_COHORT_INVALID');
    if (!isOneOf(input.shell, M0B_SHELLS)) throw new Error('M0B_OBSERVER_SHELL_INVALID');

    this.now = input.now ?? Date.now;
    this.createId = input.createId ?? (() => randomUUID().replaceAll('-', ''));
    this.sessionId = this.createId();
    this.participantIdHash = createHash('sha256')
      .update(`wayland-m0b-participant/1\0${input.installIdentity}`)
      .digest('hex');
  }

  startSession(): Promise<M0BRecordResult> {
    return this.enqueue(async () => {
      if (this.sessionState === 'open' && !this.hasPendingSessionTerminal()) return { status: 'recorded' };
      if (this.sessionState !== 'idle') return rejected('sessionState');
      const { result } = await this.recordRetryable('session:start', () => this.event('session_started'));
      if (result.status === 'recorded') this.sessionState = 'open';
      return result;
    });
  }

  endSession(): Promise<M0BRecordResult> {
    return this.terminalSession('ended', 'session_ended');
  }

  crashSession(): Promise<M0BRecordResult> {
    return this.terminalSession('crashed', 'session_crashed');
  }

  startJourney(journeyId: unknown): Promise<M0BJourneyStartResult> {
    return this.enqueue(async () => {
      if (!this.canRecordSessionEvidence()) return rejected('sessionState');
      if (!isOneOf(journeyId, M0B_PRIMARY_JOURNEYS)) return rejected('journeyId');

      const { event, result } = await this.recordRetryable(`journey:start:${journeyId}`, () => ({
        ...this.event('journey_started'),
        journeyRunId: this.createId(),
        journeyId,
      }));
      if (result.status !== 'recorded') return result;

      const handle = Object.freeze({}) as M0BJourneyHandle;
      this.journeys.set(handle, {
        journeyRunId: event.journeyRunId,
        journeyId: event.journeyId,
        terminal: false,
      });
      return { status: 'recorded', handle };
    });
  }

  completeJourney(handle: unknown): Promise<M0BRecordResult> {
    return this.terminalJourney(handle, 'journey_completed');
  }

  failJourney(handle: unknown): Promise<M0BRecordResult> {
    return this.terminalJourney(handle, 'journey_failed');
  }

  recordSupportContact(category: unknown): Promise<M0BRecordResult> {
    return this.recordClosedValue('category', category, M0B_SUPPORT_CATEGORIES, (valid) => ({
      ...this.event('support_contact'),
      category: valid as M0BSupportCategory,
    }));
  }

  recordAccessibilityViolation(severity: unknown): Promise<M0BRecordResult> {
    return this.recordClosedValue('severity', severity, M0B_ACCESSIBILITY_SEVERITIES, (valid) => ({
      ...this.event('accessibility_violation'),
      severity: valid as M0BAccessibilitySeverity,
    }));
  }

  recordShellReturn(reason: unknown): Promise<M0BRecordResult> {
    return this.enqueue(async () => {
      if (!this.canRecordSessionEvidence()) return rejected('sessionState');
      if (this.input.shell !== 'cockpit') return rejected('shell');
      if (!isOneOf(reason, M0B_RETURN_REASONS)) return rejected('reason');
      const { result } = await this.recordRetryable(`shell-return:${reason}`, () => ({
        ...this.event('shell_returned_to_classic'),
        reason: reason as M0BReturnReason,
      }));
      return result;
    });
  }

  recordZeroToleranceStop(reason: unknown): Promise<M0BRecordResult> {
    return this.recordClosedValue('reason', reason, M0B_ZERO_TOLERANCE_REASONS, (valid) => ({
      ...this.event('zero_tolerance_stop'),
      reason: valid as M0BZeroToleranceReason,
    }));
  }

  private terminalSession(
    state: Extract<SessionState, 'ended' | 'crashed'>,
    kind: 'session_ended' | 'session_crashed'
  ): Promise<M0BRecordResult> {
    return this.enqueue(async () => {
      if (this.sessionState !== 'open') return rejected('sessionState');
      const pending = this.pendingEvents.get('session:terminal');
      if (pending && pending.kind !== kind) return rejected('sessionState');
      const { result } = await this.recordRetryable('session:terminal', () => this.event(kind));
      if (result.status === 'recorded') this.sessionState = state;
      return result;
    });
  }

  private terminalJourney(handle: unknown, kind: 'journey_completed' | 'journey_failed'): Promise<M0BRecordResult> {
    return this.enqueue(async () => {
      if (!this.canRecordSessionEvidence()) return rejected('sessionState');
      if (handle === null || (typeof handle !== 'object' && typeof handle !== 'function')) {
        return rejected('journeyHandle');
      }
      const journey = this.journeys.get(handle);
      if (!journey || journey.terminal) return rejected('journeyHandle');

      const key = `journey:terminal:${journey.journeyRunId}`;
      const pending = this.pendingEvents.get(key);
      if (pending && pending.kind !== kind) return rejected('journeyHandle');
      const { result } = await this.recordRetryable(key, () => ({
        ...this.event(kind),
        journeyRunId: journey.journeyRunId,
        journeyId: journey.journeyId,
      }));
      if (result.status === 'recorded') journey.terminal = true;
      return result;
    });
  }

  private recordClosedValue<T extends string>(
    field: string,
    value: unknown,
    allowed: readonly T[],
    build: (valid: T) => M0BCohortEvent
  ): Promise<M0BRecordResult> {
    return this.enqueue(async () => {
      if (!this.canRecordSessionEvidence()) return rejected('sessionState');
      if (!isOneOf(value, allowed)) return rejected(field);
      const { result } = await this.recordRetryable(`${field}:${value}`, () => build(value));
      return result;
    });
  }

  private event<
    K extends
      | 'session_started'
      | 'session_ended'
      | 'session_crashed'
      | 'journey_started'
      | 'journey_completed'
      | 'journey_failed'
      | 'accessibility_violation'
      | 'support_contact'
      | 'shell_returned_to_classic'
      | 'zero_tolerance_stop',
  >(kind: K) {
    return {
      schemaVersion: M0B_SCHEMA_VERSION,
      eventId: this.createId(),
      participantIdHash: this.participantIdHash,
      sessionId: this.sessionId,
      occurredAtMs: this.now(),
      cohort: this.input.cohort,
      shell: this.input.shell,
      kind,
    };
  }

  private async record(event: M0BCohortEvent): Promise<M0BRecordResult> {
    try {
      return await this.input.service.record(event);
    } catch {
      return { status: 'storage_error' };
    }
  }

  private hasPendingSessionTerminal(): boolean {
    return this.pendingEvents.has('session:terminal');
  }

  private canRecordSessionEvidence(): boolean {
    return this.sessionState === 'open' && !this.hasPendingSessionTerminal();
  }

  /**
   * A storage error is ambiguous: the repository may have atomically published
   * the event before a later durability step failed. Retrying must therefore
   * replay the exact event identity until a definitive result is observed.
   */
  private async recordRetryable<T extends M0BCohortEvent>(
    key: string,
    build: () => T
  ): Promise<{ event: T; result: M0BRecordResult }> {
    const existing = this.pendingEvents.get(key);
    const event = (existing ?? build()) as T;
    if (!existing) this.pendingEvents.set(key, event);
    const result = await this.record(event);
    if (result.status !== 'storage_error') this.pendingEvents.delete(key);
    return { event, result };
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationTail.then(operation, operation);
    this.operationTail = result.then(
      (): void => undefined,
      (): void => undefined
    );
    return result;
  }
}
