/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { M0BRecordResult } from '@process/services/cohort/CohortBaselineService';
import type {
  M0BJourneyHandle,
  M0BJourneyStartResult,
} from '@process/services/cohort/instrumentation/CohortJourneyObserver';
import {
  CohortWorkJourneyAuthority,
  getWorkJourneyAuthority,
  recordWorkspaceChange,
  setWorkJourneyAuthority,
  type WorkJourneyRecorder,
} from '@process/services/cohort/instrumentation/CohortWorkJourneyAuthority';
import type { M0BPrimaryJourney } from '@process/services/cohort/types';
import { WorkspaceSnapshotService } from '@process/services/WorkspaceSnapshotService';

const SESSION = 'observation-session-1';
const PROCESS = 'process' as const;

/**
 * A closed spy standing in for the process-owned CohortJourneyObserver. It only
 * exposes the two calls the authority is allowed to make and records the exact
 * ordered start/terminal stream so the tests can prove closed pairs.
 */
class SpyRecorder implements WorkJourneyRecorder {
  readonly events: Array<{ journeyId: M0BPrimaryJourney; phase: 'start' | 'complete' }> = [];
  private readonly handleJourneys = new WeakMap<object, M0BPrimaryJourney>();

  async startJourney(journeyId: M0BPrimaryJourney): Promise<M0BJourneyStartResult> {
    this.events.push({ journeyId, phase: 'start' });
    const handle = Object.freeze({}) as M0BJourneyHandle;
    this.handleJourneys.set(handle, journeyId);
    return { status: 'recorded', handle };
  }

  async completeJourney(handle: M0BJourneyHandle): Promise<M0BRecordResult> {
    const journeyId = this.handleJourneys.get(handle as unknown as object);
    if (!journeyId) return { status: 'rejected', code: 'invalid_field', field: 'journeyHandle' };
    this.events.push({ journeyId, phase: 'complete' });
    return { status: 'recorded' };
  }

  /** Journeys that emitted a complete, ordered start→complete pair. */
  pairs(): M0BPrimaryJourney[] {
    const emitted: M0BPrimaryJourney[] = [];
    const started = new Set<M0BPrimaryJourney>();
    for (const event of this.events) {
      if (event.phase === 'start') started.add(event.journeyId);
      else if (started.has(event.journeyId)) emitted.push(event.journeyId);
    }
    return emitted;
  }

  count(journeyId: M0BPrimaryJourney, phase: 'start' | 'complete'): number {
    return this.events.filter((event) => event.journeyId === journeyId && event.phase === phase).length;
  }
}

function makeAuthority(sessionId = SESSION) {
  const recorder = new SpyRecorder();
  const authority = new CohortWorkJourneyAuthority({ recorder, sessionId });
  return { recorder, authority };
}

const WS = '/correlated/workspace';
const t = (n: number) => ({ occurredAtMs: n, sessionId: SESSION, origin: PROCESS });

/** Correlate a workspace to the session through a real conversation completion. */
async function correlate(authority: CohortWorkJourneyAuthority, workspace: string, conversationId = 'c-corr') {
  await authority.observeConversationCompletion({
    ...t(1),
    conversationId,
    turnAccepted: true,
    workspace,
  });
}

afterEach(() => setWorkJourneyAuthority(undefined));

describe('CohortWorkJourneyAuthority — four work-journey bindings', () => {
  it('emits exactly one closed chat.first-response pair from an accepted persisted turn', async () => {
    const { authority, recorder } = makeAuthority();

    const first = await authority.observeConversationCompletion({
      ...t(10),
      conversationId: 'conv-1',
      turnAccepted: true,
      workspace: WS,
    });
    expect(first).toEqual({ status: 'recorded', journey: 'chat.first-response' });

    // A second completion of the SAME conversation is a duplicate, never a second pair.
    const dup = await authority.observeConversationCompletion({
      ...t(11),
      conversationId: 'conv-1',
      turnAccepted: true,
    });
    expect(dup).toEqual({ status: 'ignored', reason: 'duplicate' });

    // An in-flight / not-yet-accepted turn is never terminal (model prose, partial turn).
    const partial = await authority.observeConversationCompletion({
      ...t(12),
      conversationId: 'conv-2',
      turnAccepted: false,
    });
    expect(partial).toEqual({ status: 'ignored', reason: 'turn-not-accepted' });

    expect(recorder.pairs()).toEqual(['chat.first-response']);
  });

  it('emits project.resume only for a persisted Project that already owns conversations', async () => {
    const { authority, recorder } = makeAuthority();

    const resume = await authority.observeProjectResume({
      ...t(20),
      projectId: 'proj-1',
      persisted: true,
      conversationCount: 3,
      workspace: WS,
    });
    expect(resume).toEqual({ status: 'recorded', journey: 'project.resume' });

    // A ProjectService CRUD result — a miss, or a freshly created empty Project — is not a resume.
    const miss = await authority.observeProjectResume({ ...t(21), projectId: 'proj-x', persisted: false, conversationCount: 0 });
    expect(miss).toEqual({ status: 'ignored', reason: 'not-a-resume' });
    const fresh = await authority.observeProjectResume({ ...t(22), projectId: 'proj-2', persisted: true, conversationCount: 0 });
    expect(fresh).toEqual({ status: 'ignored', reason: 'not-a-resume' });

    // Re-opening the same Project does not double-emit.
    const again = await authority.observeProjectResume({ ...t(23), projectId: 'proj-1', persisted: true, conversationCount: 4 });
    expect(again).toEqual({ status: 'ignored', reason: 'duplicate' });

    expect(recorder.pairs()).toEqual(['project.resume']);
  });

  it('binds cowork.create-artifact to a real WorkspaceSnapshotService.compare durable file', async () => {
    const { authority, recorder } = makeAuthority();
    setWorkJourneyAuthority(authority);

    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-cowork-'));
    const service = new WorkspaceSnapshotService();
    try {
      await service.init(workspace);
      // Correlate the workspace to the session the way production does (the same
      // workspace flowed through a conversation completion).
      await correlate(authority, workspace);

      // A change-free comparison under the correlated workspace is not an artifact.
      await service.compare(workspace);
      await vi.waitFor(() => expect(getWorkJourneyAuthority()).toBe(authority));
      expect(recorder.pairs()).not.toContain('cowork.create-artifact');

      // A real durable created file, observed by the real compare(), is the terminal.
      await fs.writeFile(path.join(workspace, 'artifact.md'), '# generated\n', 'utf-8');
      await service.compare(workspace);
      await vi.waitFor(() => expect(recorder.pairs()).toContain('cowork.create-artifact'));

      expect(recorder.count('cowork.create-artifact', 'start')).toBe(1);
      expect(recorder.count('cowork.create-artifact', 'complete')).toBe(1);

      // A second compare with the file still present does not re-emit the artifact.
      await service.compare(workspace);
      await vi.waitFor(() => expect(getWorkJourneyAuthority()).toBe(authority));
      expect(recorder.count('cowork.create-artifact', 'complete')).toBe(1);
    } finally {
      await service.dispose(workspace);
      await fs.rm(workspace, { recursive: true, force: true }).catch(() => undefined);
    }
  });

  it('emits developer.modify-and-verify only when a successful execute result follows a correlated change', async () => {
    const { authority, recorder } = makeAuthority();
    await correlate(authority, WS);

    // A verify with no prior correlated change fails closed (missing start).
    const early = await authority.observeVerificationResult({
      ...t(30),
      workspace: WS,
      kind: 'execute',
      isToolResult: true,
      success: true,
    });
    expect(early).toEqual({ status: 'ignored', reason: 'missing-modify' });

    // A real durable modification arms the journey.
    const armed = await authority.observeWorkspaceChange({ ...t(31), workspace: WS, createdCount: 0, modifiedCount: 1, deletedCount: 0 });
    expect(armed.status).toBe('recorded'); // also the cowork artifact terminal

    // A tool START (not a result) is never verification authority.
    const started = await authority.observeVerificationResult({ ...t(32), workspace: WS, kind: 'execute', isToolResult: false, success: true });
    expect(started).toEqual({ status: 'ignored', reason: 'not-a-tool-result' });

    // A failed command is never verification authority.
    const failed = await authority.observeVerificationResult({ ...t(33), workspace: WS, kind: 'execute', isToolResult: true, success: false });
    expect(failed).toEqual({ status: 'ignored', reason: 'verification-failed' });

    // A successful non-execute tool (an edit/read result) is never verification authority.
    const edit = await authority.observeVerificationResult({ ...t(34), workspace: WS, kind: 'edit', isToolResult: true, success: true });
    expect(edit).toEqual({ status: 'ignored', reason: 'not-verification' });

    // The successful execute result after the correlated change is the terminal.
    const verified = await authority.observeVerificationResult({ ...t(35), workspace: WS, kind: 'execute', isToolResult: true, success: true });
    expect(verified).toEqual({ status: 'recorded', journey: 'developer.modify-and-verify' });

    // No second developer terminal for the same correlated workspace.
    await authority.observeWorkspaceChange({ ...t(36), workspace: WS, createdCount: 0, modifiedCount: 1, deletedCount: 0 });
    const again = await authority.observeVerificationResult({ ...t(37), workspace: WS, kind: 'execute', isToolResult: true, success: true });
    expect(again).toEqual({ status: 'ignored', reason: 'duplicate' });

    expect(recorder.count('developer.modify-and-verify', 'start')).toBe(1);
    expect(recorder.count('developer.modify-and-verify', 'complete')).toBe(1);
  });
});

describe('CohortWorkJourneyAuthority — hostile near-miss rejection', () => {
  it('rejects renderer-origin evidence for every journey', async () => {
    const { authority, recorder } = makeAuthority();
    await correlate(authority, WS);

    const rendererOrigin = { occurredAtMs: 40, sessionId: SESSION, origin: 'renderer' as const };
    expect(await authority.observeConversationCompletion({ ...rendererOrigin, conversationId: 'r', turnAccepted: true })).toEqual({
      status: 'rejected',
      reason: 'renderer-origin',
    });
    expect(await authority.observeProjectResume({ ...rendererOrigin, projectId: 'r', persisted: true, conversationCount: 2 })).toEqual({
      status: 'rejected',
      reason: 'renderer-origin',
    });
    expect(await authority.observeWorkspaceChange({ ...rendererOrigin, workspace: WS, createdCount: 1, modifiedCount: 0, deletedCount: 0 })).toEqual({
      status: 'rejected',
      reason: 'renderer-origin',
    });
    expect(await authority.observeVerificationResult({ ...rendererOrigin, workspace: WS, kind: 'execute', isToolResult: true, success: true })).toEqual({
      status: 'rejected',
      reason: 'renderer-origin',
    });
    expect(recorder.events).toHaveLength(2); // only the correlating conversation pair
  });

  it('rejects cross-session evidence tagged with a foreign observation session', async () => {
    const { authority } = makeAuthority();
    const foreign = await authority.observeConversationCompletion({
      occurredAtMs: 50,
      sessionId: 'a-different-session',
      origin: PROCESS,
      conversationId: 'x',
      turnAccepted: true,
    });
    expect(foreign).toEqual({ status: 'rejected', reason: 'cross-session' });
  });

  it('never lets one session terminalize a journey correlated in another', async () => {
    const a = makeAuthority('session-a');
    const b = makeAuthority('session-b');
    await correlate(a.authority, WS);
    // Session B never correlated WS; a change/verify there is uncorrelated to B.
    await b.authority.observeWorkspaceChange({ occurredAtMs: 60, sessionId: 'session-b', origin: PROCESS, workspace: WS, createdCount: 1, modifiedCount: 0, deletedCount: 0 });
    const stray = await b.authority.observeVerificationResult({ occurredAtMs: 61, sessionId: 'session-b', origin: PROCESS, workspace: WS, kind: 'execute', isToolResult: true, success: true });
    expect(stray).toEqual({ status: 'ignored', reason: 'uncorrelated-workspace' });
    expect(b.recorder.pairs()).not.toContain('developer.modify-and-verify');
  });

  it('rejects an uncorrelated workspace file change as terminal authority', async () => {
    const { authority, recorder } = makeAuthority();
    const change = await authority.observeWorkspaceChange({ ...t(70), workspace: '/never/seen', createdCount: 5, modifiedCount: 2, deletedCount: 0 });
    expect(change).toEqual({ status: 'ignored', reason: 'uncorrelated-workspace' });
    expect(recorder.events).toHaveLength(0);
  });

  it('rejects a cross-workspace verify against a change in a different workspace', async () => {
    const { authority } = makeAuthority();
    const wsA = '/ws/a';
    const wsB = '/ws/b';
    await correlate(authority, wsA, 'c-a');
    await correlate(authority, wsB, 'c-b');
    await authority.observeWorkspaceChange({ ...t(80), workspace: wsA, createdCount: 0, modifiedCount: 1, deletedCount: 0 });
    // A verify in wsB has no armed change in wsB.
    const cross = await authority.observeVerificationResult({ ...t(81), workspace: wsB, kind: 'execute', isToolResult: true, success: true });
    expect(cross).toEqual({ status: 'ignored', reason: 'missing-modify' });
  });

  it('rejects stale, out-of-order evidence replayed before the last accepted timestamp', async () => {
    const { authority } = makeAuthority();
    await correlate(authority, WS);
    await authority.observeWorkspaceChange({ ...t(100), workspace: WS, createdCount: 0, modifiedCount: 1, deletedCount: 0 });
    // A replayed older comparison for the same workspace subject is stale.
    const stale = await authority.observeWorkspaceChange({ ...t(90), workspace: WS, createdCount: 0, modifiedCount: 1, deletedCount: 0 });
    expect(stale).toEqual({ status: 'rejected', reason: 'stale' });
  });

  it('rejects malformed evidence shapes before any journey logic', async () => {
    const { authority } = makeAuthority();
    expect(await authority.observeConversationCompletion({ ...t(110), conversationId: '', turnAccepted: true })).toEqual({ status: 'rejected', reason: 'malformed' });
    expect(await authority.observeProjectResume({ ...t(111), projectId: 'p', persisted: true, conversationCount: -1 })).toEqual({ status: 'rejected', reason: 'malformed' });
    expect(await authority.observeWorkspaceChange({ ...t(112), workspace: WS, createdCount: 1.5 as number, modifiedCount: 0, deletedCount: 0 })).toEqual({ status: 'rejected', reason: 'malformed' });
    expect(await authority.observeConversationCompletion({ occurredAtMs: Number.NaN, sessionId: SESSION, origin: PROCESS, conversationId: 'c', turnAccepted: true })).toEqual({ status: 'rejected', reason: 'malformed' });
  });

  it('is inert (no forwarding) when no observation session is installed', async () => {
    setWorkJourneyAuthority(undefined);
    // Must not throw; a production seam call with no authority is a no-op.
    expect(() => recordWorkspaceChange({ occurredAtMs: 120, workspace: WS, createdCount: 1, modifiedCount: 0, deletedCount: 0 })).not.toThrow();
    expect(getWorkJourneyAuthority()).toBeUndefined();
  });

  it('rejects an invalid session identity at construction', () => {
    const recorder = new SpyRecorder();
    expect(() => new CohortWorkJourneyAuthority({ recorder, sessionId: '' })).toThrow('WORK_JOURNEY_SESSION_ID_INVALID');
  });
});
