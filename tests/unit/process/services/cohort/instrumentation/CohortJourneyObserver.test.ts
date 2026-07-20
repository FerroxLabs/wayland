/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

import type { CohortBaselineService, M0BRecordResult } from '@process/services/cohort/CohortBaselineService';
import { CohortJourneyObserver } from '@process/services/cohort/instrumentation/CohortJourneyObserver';
import {
  M0B_ACCESSIBILITY_SEVERITIES,
  M0B_PRIMARY_JOURNEYS,
  M0B_RETURN_REASONS,
  M0B_SUPPORT_CATEGORIES,
  M0B_ZERO_TOLERANCE_REASONS,
  type M0BCohortEvent,
} from '@process/services/cohort/types';

function harness(record = vi.fn(async (): Promise<M0BRecordResult> => ({ status: 'recorded' }))) {
  let nextId = 0;
  const service = { record } as unknown as CohortBaselineService;
  return {
    record,
    observer: new CohortJourneyObserver({
      service,
      installIdentity: 'private-install-identity',
      cohort: 'developer',
      shell: 'classic',
      now: () => 1_234,
      createId: () => `processid${String(++nextId).padStart(8, '0')}`,
    }),
  };
}

describe('CohortJourneyObserver', () => {
  it('owns all identity and emits one exact content-free session lifecycle', async () => {
    const { observer, record } = harness();

    await expect(observer.startSession()).resolves.toEqual({ status: 'recorded' });
    await expect(observer.endSession()).resolves.toEqual({ status: 'recorded' });

    expect(record).toHaveBeenCalledTimes(2);
    const [started, ended] = record.mock.calls.map(([event]) => event);
    expect(started).toEqual({
      schemaVersion: 1,
      eventId: 'processid00000002',
      participantIdHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      sessionId: 'processid00000001',
      occurredAtMs: 1_234,
      cohort: 'developer',
      shell: 'classic',
      kind: 'session_started',
    });
    expect(ended).toMatchObject({ kind: 'session_ended', sessionId: started.sessionId });
    expect(JSON.stringify(record.mock.calls)).not.toContain('private-install-identity');
  });

  it('records starts and terminals separately for every frozen primary journey', async () => {
    const { observer, record } = harness();
    await observer.startSession();

    const starts = await Promise.all(M0B_PRIMARY_JOURNEYS.map((journeyId) => observer.startJourney(journeyId)));
    await Promise.all(
      starts.map(async (started, index) => {
        expect(started.status).toBe('recorded');
        if (started.status !== 'recorded') throw new Error('test setup failed');
        const terminal =
          index % 2 === 0 ? observer.completeJourney(started.handle) : observer.failJourney(started.handle);
        await expect(terminal).resolves.toEqual({ status: 'recorded' });
      })
    );

    const journeyEvents = record.mock.calls
      .map(([event]) => event)
      .filter((event) => event.kind.startsWith('journey_'));
    expect(journeyEvents).toHaveLength(M0B_PRIMARY_JOURNEYS.length * 2);
    for (const journeyId of M0B_PRIMARY_JOURNEYS) {
      const [start, terminal] = journeyEvents.filter((event) => event.journeyId === journeyId);
      expect(start.kind).toBe('journey_started');
      expect(terminal.kind).toMatch(/^journey_(completed|failed)$/);
      expect(terminal.journeyRunId).toBe(start.journeyRunId);
    }
  });

  it('emits every closed support, accessibility, and stop category', async () => {
    let nextId = 0;
    const record = vi.fn(async (): Promise<M0BRecordResult> => ({ status: 'recorded' }));
    const observer = new CohortJourneyObserver({
      service: { record } as unknown as CohortBaselineService,
      installIdentity: 'private-install-identity',
      cohort: 'developer',
      shell: 'cockpit',
      now: () => 1_234,
      createId: () => `processid${String(++nextId).padStart(8, '0')}`,
    });
    await observer.startSession();

    await Promise.all(M0B_SUPPORT_CATEGORIES.map((category) => observer.recordSupportContact(category)));
    await Promise.all(M0B_ACCESSIBILITY_SEVERITIES.map((severity) => observer.recordAccessibilityViolation(severity)));
    await Promise.all(M0B_ZERO_TOLERANCE_REASONS.map((reason) => observer.recordZeroToleranceStop(reason)));

    const events = record.mock.calls.map(([event]) => event);
    expect(events.filter((event) => event.kind === 'support_contact').map((event) => event.category)).toEqual(
      M0B_SUPPORT_CATEGORIES
    );
    expect(events.filter((event) => event.kind === 'accessibility_violation').map((event) => event.severity)).toEqual(
      M0B_ACCESSIBILITY_SEVERITIES
    );
    expect(events.filter((event) => event.kind === 'zero_tolerance_stop').map((event) => event.reason)).toEqual(
      M0B_ZERO_TOLERANCE_REASONS
    );
  });

  it.each(M0B_RETURN_REASONS)('emits the frozen return reason %s from a fresh cockpit session', async (reason) => {
    let nextId = 0;
    const record = vi.fn(async (): Promise<M0BRecordResult> => ({ status: 'recorded' }));
    const observer = new CohortJourneyObserver({
      service: { record } as unknown as CohortBaselineService,
      installIdentity: `private-install-${reason}`,
      cohort: 'developer',
      shell: 'cockpit',
      now: () => 1_234,
      createId: () => `processid${String(++nextId).padStart(8, '0')}`,
    });

    await observer.startSession();
    await expect(observer.recordShellReturn(reason)).resolves.toEqual({ status: 'recorded' });
    expect(record.mock.calls.at(-1)?.[0]).toMatchObject({ kind: 'shell_returned_to_classic', reason });
  });

  it('rejects a second successful return event in the same cockpit session', async () => {
    let nextId = 0;
    const record = vi.fn(async (): Promise<M0BRecordResult> => ({ status: 'recorded' }));
    const observer = new CohortJourneyObserver({
      service: { record } as unknown as CohortBaselineService,
      installIdentity: 'private-install-identity',
      cohort: 'developer',
      shell: 'cockpit',
      now: () => 1_234,
      createId: () => `processid${String(++nextId).padStart(8, '0')}`,
    });

    await observer.startSession();
    await expect(observer.recordShellReturn('reliability')).resolves.toEqual({ status: 'recorded' });
    await expect(observer.recordShellReturn('performance')).resolves.toEqual({
      status: 'rejected',
      code: 'invalid_field',
      field: 'reason',
    });
    expect(record.mock.calls.filter(([entry]) => entry.kind === 'shell_returned_to_classic')).toHaveLength(1);
  });

  it('rejects case aliases, unknown values, objects, and content-shaped payloads before persistence', async () => {
    const { observer, record } = harness();
    await observer.startSession();
    const callsAfterStart = record.mock.calls.length;

    const attempts = [
      observer.startJourney('CHAT.FIRST-RESPONSE'),
      observer.startJourney({ journeyId: 'chat.first-response', prompt: 'private' }),
      observer.recordSupportContact('question'),
      observer.recordSupportContact({ category: 'bug', message: 'private' }),
      observer.recordAccessibilityViolation('minor'),
      observer.recordAccessibilityViolation({ severity: 'critical', path: '/private' }),
      observer.recordShellReturn('OTHER-NO-TEXT'),
      observer.recordShellReturn({ reason: 'reliability', url: 'https://private' }),
      observer.recordZeroToleranceStop('anything'),
      observer.recordZeroToleranceStop({ reason: 'approval-bypass', content: 'private' }),
    ];

    for (const result of await Promise.all(attempts)) expect(result.status).toBe('rejected');
    expect(record).toHaveBeenCalledTimes(callsAfterStart);
  });

  it('does not accept events before start, duplicate starts, or events after a terminal', async () => {
    const { observer, record } = harness();
    await expect(observer.recordSupportContact('bug')).resolves.toMatchObject({ status: 'rejected' });
    await expect(Promise.all([observer.startSession(), observer.startSession()])).resolves.toEqual([
      { status: 'recorded' },
      { status: 'recorded' },
    ]);
    expect(record.mock.calls.filter(([event]) => event.kind === 'session_started')).toHaveLength(1);
    await observer.crashSession();
    await expect(observer.startJourney('project.resume')).resolves.toMatchObject({ status: 'rejected' });
    await expect(observer.endSession()).resolves.toMatchObject({ status: 'rejected' });
    expect(record.mock.calls.at(-1)?.[0]).toMatchObject({ kind: 'session_crashed' });
  });

  it('rejects a return-to-Classic event from a Classic session', async () => {
    const { observer, record } = harness();
    await observer.startSession();
    await expect(observer.recordShellReturn('reliability')).resolves.toMatchObject({
      status: 'rejected',
      field: 'shell',
    });
    expect(record).toHaveBeenCalledTimes(1);
  });

  it('keeps failed persistence retryable and advances state only after a recorded result', async () => {
    const statuses: M0BRecordResult[] = [
      { status: 'storage_error' },
      { status: 'recorded' },
      { status: 'recorded' },
      { status: 'storage_error' },
      { status: 'recorded' },
    ];
    const record = vi.fn(async (): Promise<M0BRecordResult> => statuses.shift() ?? { status: 'recorded' });
    const { observer } = harness(record);

    await expect(observer.startSession()).resolves.toEqual({ status: 'storage_error' });
    await expect(observer.startSession()).resolves.toEqual({ status: 'recorded' });
    const journey = await observer.startJourney('project.resume');
    if (journey.status !== 'recorded') throw new Error('test setup failed');
    await expect(observer.completeJourney(journey.handle)).resolves.toEqual({ status: 'storage_error' });
    await expect(observer.completeJourney(journey.handle)).resolves.toEqual({ status: 'recorded' });
  });

  it('reuses lifecycle identity when an ambiguous storage failure is retried', async () => {
    const observedEvents: Array<{ eventId: string; kind: string }> = [];
    let firstAttempt = true;
    const record = vi.fn(async (event: { eventId: string; kind: string }): Promise<M0BRecordResult> => {
      // A repository can publish the event and still report a later durability
      // failure. The caller cannot know whether the first event is visible.
      observedEvents.push(event);
      if (firstAttempt) {
        firstAttempt = false;
        return { status: 'storage_error' };
      }
      return { status: 'recorded' };
    });
    const { observer } = harness(record as never);

    await expect(observer.startSession()).resolves.toEqual({ status: 'storage_error' });
    await expect(observer.startSession()).resolves.toEqual({ status: 'recorded' });

    expect(observedEvents).toHaveLength(2);
    expect(observedEvents[1]?.kind).toBe('session_started');
    expect(observedEvents[1]?.eventId).toBe(observedEvents[0]?.eventId);
  });

  it('replays exact journey and category events after ambiguous storage failures', async () => {
    const observedEvents: Array<{ eventId: string; kind: string; journeyRunId?: string }> = [];
    let failNext = false;
    const record = vi.fn(async (event: M0BCohortEvent): Promise<M0BRecordResult> => {
      observedEvents.push(event);
      if (failNext) {
        failNext = false;
        return { status: 'storage_error' };
      }
      return { status: 'recorded' };
    });
    const { observer } = harness(record);
    await observer.startSession();

    failNext = true;
    await expect(observer.startJourney('project.resume')).resolves.toEqual({ status: 'storage_error' });
    const journey = await observer.startJourney('project.resume');
    expect(journey.status).toBe('recorded');
    const [firstStart, retriedStart] = observedEvents.slice(-2);
    expect(retriedStart).toEqual(firstStart);

    if (journey.status !== 'recorded') throw new Error('test setup failed');
    failNext = true;
    await expect(observer.completeJourney(journey.handle)).resolves.toEqual({ status: 'storage_error' });
    await expect(observer.completeJourney(journey.handle)).resolves.toEqual({ status: 'recorded' });
    const [firstTerminal, retriedTerminal] = observedEvents.slice(-2);
    expect(retriedTerminal).toEqual(firstTerminal);

    failNext = true;
    await expect(observer.recordSupportContact('bug')).resolves.toEqual({ status: 'storage_error' });
    await expect(observer.recordSupportContact('bug')).resolves.toEqual({ status: 'recorded' });
    const [firstCategory, retriedCategory] = observedEvents.slice(-2);
    expect(retriedCategory).toEqual(firstCategory);
  });

  it('does not change an ambiguous terminal into a conflicting terminal', async () => {
    const record = vi.fn(
      async (event: M0BCohortEvent): Promise<M0BRecordResult> =>
        event.kind === 'session_ended' ? { status: 'storage_error' } : { status: 'recorded' }
    );
    const { observer } = harness(record);
    await observer.startSession();

    await expect(observer.endSession()).resolves.toEqual({ status: 'storage_error' });
    await expect(observer.crashSession()).resolves.toMatchObject({ status: 'rejected', field: 'sessionState' });
    expect(record.mock.calls.map(([event]) => event.kind)).toEqual(['session_started', 'session_ended']);
  });

  it('blocks new lifecycle evidence while a session terminal is ambiguous', async () => {
    const record = vi.fn(
      async (event: M0BCohortEvent): Promise<M0BRecordResult> =>
        event.kind === 'session_ended' ? { status: 'storage_error' } : { status: 'recorded' }
    );
    const { observer } = harness(record);
    await observer.startSession();

    await expect(observer.endSession()).resolves.toEqual({ status: 'storage_error' });
    await expect(observer.recordSupportContact('bug')).resolves.toMatchObject({
      status: 'rejected',
      field: 'sessionState',
    });
    expect(record.mock.calls.map(([event]) => event.kind)).toEqual(['session_started', 'session_ended']);
  });

  it('retains an unresolved journey as a start when the session ends', async () => {
    const { observer, record } = harness();
    await observer.startSession();
    const journey = await observer.startJourney('cowork.create-artifact');
    expect(journey.status).toBe('recorded');
    await observer.endSession();

    expect(record.mock.calls.map(([event]) => event.kind)).toEqual([
      'session_started',
      'journey_started',
      'session_ended',
    ]);
  });

  it('rejects forged and foreign journey handles without publishing a terminal', async () => {
    const first = harness();
    const second = harness();
    await first.observer.startSession();
    await second.observer.startSession();
    const journey = await first.observer.startJourney('developer.modify-and-verify');
    if (journey.status !== 'recorded') throw new Error('test setup failed');

    await expect(first.observer.completeJourney({})).resolves.toMatchObject({ status: 'rejected' });
    await expect(second.observer.completeJourney(journey.handle)).resolves.toMatchObject({ status: 'rejected' });
    expect(first.record.mock.calls.some(([event]) => event.kind === 'journey_completed')).toBe(false);
    expect(second.record.mock.calls.some(([event]) => event.kind === 'journey_completed')).toBe(false);
  });

  it('rejects invalid frozen assignment authority at construction', () => {
    const service = { record: vi.fn() } as unknown as CohortBaselineService;
    expect(
      () =>
        new CohortJourneyObserver({
          service,
          installIdentity: '',
          cohort: 'novice',
          shell: 'classic',
        })
    ).toThrow('M0B_OBSERVER_INSTALL_IDENTITY_INVALID');
    expect(
      () =>
        new CohortJourneyObserver({
          service,
          installIdentity: 'install',
          cohort: 'forged' as never,
          shell: 'classic',
        })
    ).toThrow('M0B_OBSERVER_COHORT_INVALID');
  });
});
