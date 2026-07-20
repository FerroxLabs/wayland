/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { M0BRecordResult } from '../CohortBaselineService';
import type { M0BJourneyHandle, M0BJourneyStartResult } from './CohortJourneyObserver';
import type { M0BPrimaryJourney } from '../types';

/**
 * The minimal process-owned recording capability this authority needs. The
 * production {@link CohortJourneyObserver} satisfies it structurally, but the
 * narrow surface keeps the correlation authority testable without a live
 * observation session and guarantees it can only emit closed lifecycle pairs.
 */
export interface WorkJourneyRecorder {
  startJourney(journeyId: M0BPrimaryJourney): Promise<M0BJourneyStartResult>;
  completeJourney(handle: M0BJourneyHandle): Promise<M0BRecordResult>;
}

/**
 * Every evidence submission carries the frozen observation session it belongs
 * to, the process-owned origin, and a monotonic clock. Renderer-origin,
 * cross-session, malformed, and stale evidence fail closed before any journey
 * is emitted.
 */
type EvidenceBase = Readonly<{
  sessionId: string;
  occurredAtMs: number;
  origin: 'process' | 'renderer';
}>;

/** `chat.first-response` terminal seam: an accepted, persisted completed turn. */
export type ConversationCompletionEvidence = EvidenceBase &
  Readonly<{
    conversationId: string;
    /** True only after the process loads the persisted conversation and accepts a real completed turn. */
    turnAccepted: boolean;
    workspace?: string;
  }>;

/** `project.resume` terminal seam: `project.get` returned a persisted Project + its conversation set. */
export type ProjectResumeEvidence = EvidenceBase &
  Readonly<{
    projectId: string;
    /** True only when the process returned an actually-persisted Project (not a miss, not a fresh create). */
    persisted: boolean;
    /** Number of conversations the persisted Project already owns; resume requires prior work. */
    conversationCount: number;
    workspace?: string;
  }>;

/** Durable-file seam: what `WorkspaceSnapshotService.compare` actually observed under a workspace. */
export type WorkspaceChangeEvidence = EvidenceBase &
  Readonly<{
    workspace: string;
    createdCount: number;
    modifiedCount: number;
    deletedCount: number;
  }>;

/** Backend tool-result seam: a completed tool result observed by WCoreManager / AcpAgentManager. */
export type VerificationResultEvidence = EvidenceBase &
  Readonly<{
    workspace: string;
    conversationId?: string;
    /** The tool's execution class. Only `execute` results are verification authority. */
    kind: 'execute' | 'edit' | 'read' | 'other';
    /** A real terminal tool RESULT, never a tool start/pending frame. */
    isToolResult: boolean;
    /** The tool result succeeded. A failed command is never verification authority. */
    success: boolean;
  }>;

export type WorkJourneyRejectReason =
  | 'cross-session'
  | 'renderer-origin'
  | 'malformed'
  | 'stale';

export type WorkJourneyIgnoreReason =
  | 'duplicate'
  | 'turn-not-accepted'
  | 'not-a-resume'
  | 'no-durable-artifact'
  | 'uncorrelated-workspace'
  | 'missing-modify'
  | 'not-a-tool-result'
  | 'not-verification'
  | 'verification-failed';

export type WorkJourneyOutcome =
  | { status: 'recorded'; journey: M0BPrimaryJourney }
  | { status: 'armed'; journey: 'developer.modify-and-verify' }
  | { status: 'ignored'; reason: WorkJourneyIgnoreReason }
  | { status: 'rejected'; reason: WorkJourneyRejectReason }
  | { status: 'observer-error'; detail: Exclude<M0BRecordResult, { status: 'recorded' }> | M0BJourneyStartResult };

type WorkspaceCorrelation = {
  coworkTerminalized: boolean;
  developerTerminalized: boolean;
  pendingModify: boolean;
};

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isFiniteCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/**
 * Process-owned correlation and terminal authority for the first four user-work
 * journeys. It never infers a journey from renderer state, model prose, a tool
 * start, a document conversion, a CRUD call, a failed command, or an
 * uncorrelated file change. Each recognised journey emits exactly one closed
 * start/terminal pair through {@link WorkJourneyRecorder}; every duplicate,
 * missing-start, cross-session, cross-workspace, stale, and out-of-order
 * submission fails closed without publishing a terminal.
 */
export class CohortWorkJourneyAuthority {
  private readonly recorder: WorkJourneyRecorder;
  readonly sessionId: string;

  /** Workspaces correlated to this session by a conversation completion or Project resume. */
  private readonly correlatedWorkspaces = new Map<string, WorkspaceCorrelation>();
  private readonly terminalizedConversations = new Set<string>();
  private readonly terminalizedProjects = new Set<string>();
  /** Per-subject monotonic clock so replayed, older evidence is stale, not terminal. */
  private readonly subjectClock = new Map<string, number>();

  constructor(input: Readonly<{ recorder: WorkJourneyRecorder; sessionId: string }>) {
    if (!isNonEmptyString(input.sessionId)) throw new Error('WORK_JOURNEY_SESSION_ID_INVALID');
    this.recorder = input.recorder;
    this.sessionId = input.sessionId;
  }

  /** `chat.first-response`: the first accepted, persisted completed turn of a conversation. */
  async observeConversationCompletion(evidence: ConversationCompletionEvidence): Promise<WorkJourneyOutcome> {
    const gate = this.gate(evidence, `conversation:${evidence.conversationId}`, isNonEmptyString(evidence.conversationId));
    if (gate) return gate;

    if (evidence.turnAccepted !== true) return { status: 'ignored', reason: 'turn-not-accepted' };
    this.correlateWorkspace(evidence.workspace);

    if (this.terminalizedConversations.has(evidence.conversationId)) {
      return { status: 'ignored', reason: 'duplicate' };
    }

    const emitted = await this.emitPair('chat.first-response');
    if (emitted.status === 'recorded') this.terminalizedConversations.add(evidence.conversationId);
    return emitted;
  }

  /** `project.resume`: `project.get` returned a persisted Project that already owns conversations. */
  async observeProjectResume(evidence: ProjectResumeEvidence): Promise<WorkJourneyOutcome> {
    const gate = this.gate(
      evidence,
      `project:${evidence.projectId}`,
      isNonEmptyString(evidence.projectId) && isFiniteCount(evidence.conversationCount)
    );
    if (gate) return gate;

    // A miss, or a freshly created empty Project, is a CRUD result - never a resume.
    if (evidence.persisted !== true || evidence.conversationCount <= 0) {
      return { status: 'ignored', reason: 'not-a-resume' };
    }
    this.correlateWorkspace(evidence.workspace);

    if (this.terminalizedProjects.has(evidence.projectId)) {
      return { status: 'ignored', reason: 'duplicate' };
    }

    const emitted = await this.emitPair('project.resume');
    if (emitted.status === 'recorded') this.terminalizedProjects.add(evidence.projectId);
    return emitted;
  }

  /**
   * Durable-file authority. A created/modified file under a correlated workspace
   * is the `cowork.create-artifact` terminal and also arms
   * `developer.modify-and-verify`. An uncorrelated workspace or a change-free
   * comparison is never terminal.
   */
  async observeWorkspaceChange(evidence: WorkspaceChangeEvidence): Promise<WorkJourneyOutcome> {
    const gate = this.gate(
      evidence,
      `workspace:${evidence.workspace}`,
      isNonEmptyString(evidence.workspace) &&
        isFiniteCount(evidence.createdCount) &&
        isFiniteCount(evidence.modifiedCount) &&
        isFiniteCount(evidence.deletedCount)
    );
    if (gate) return gate;

    const correlation = this.correlatedWorkspaces.get(evidence.workspace);
    if (!correlation) return { status: 'ignored', reason: 'uncorrelated-workspace' };

    const durableArtifact = evidence.createdCount > 0 || evidence.modifiedCount > 0;
    if (!durableArtifact) return { status: 'ignored', reason: 'no-durable-artifact' };

    // A correlated durable change arms the developer verify terminal regardless
    // of whether the cowork artifact terminal has already been emitted.
    correlation.pendingModify = true;

    if (correlation.coworkTerminalized) return { status: 'armed', journey: 'developer.modify-and-verify' };

    const emitted = await this.emitPair('cowork.create-artifact');
    if (emitted.status === 'recorded') {
      correlation.coworkTerminalized = true;
      return emitted;
    }
    return emitted;
  }

  /**
   * `developer.modify-and-verify`: a successful `execute` tool RESULT that
   * follows a correlated durable modification in the same workspace. A tool
   * start, a failed command, a non-execute tool, or a verify with no prior
   * correlated change is never terminal.
   */
  async observeVerificationResult(evidence: VerificationResultEvidence): Promise<WorkJourneyOutcome> {
    const gate = this.gate(
      evidence,
      `verify:${evidence.workspace}`,
      isNonEmptyString(evidence.workspace)
    );
    if (gate) return gate;

    const correlation = this.correlatedWorkspaces.get(evidence.workspace);
    if (!correlation) return { status: 'ignored', reason: 'uncorrelated-workspace' };
    if (evidence.isToolResult !== true) return { status: 'ignored', reason: 'not-a-tool-result' };
    if (evidence.kind !== 'execute') return { status: 'ignored', reason: 'not-verification' };
    if (evidence.success !== true) return { status: 'ignored', reason: 'verification-failed' };
    if (!correlation.pendingModify) return { status: 'ignored', reason: 'missing-modify' };
    if (correlation.developerTerminalized) return { status: 'ignored', reason: 'duplicate' };

    const emitted = await this.emitPair('developer.modify-and-verify');
    if (emitted.status === 'recorded') {
      correlation.developerTerminalized = true;
      correlation.pendingModify = false;
    }
    return emitted;
  }

  private correlateWorkspace(workspace: string | undefined): void {
    if (!isNonEmptyString(workspace)) return;
    if (!this.correlatedWorkspaces.has(workspace)) {
      this.correlatedWorkspaces.set(workspace, {
        coworkTerminalized: false,
        developerTerminalized: false,
        pendingModify: false,
      });
    }
  }

  /**
   * Shared fail-closed gate: reject renderer-origin, cross-session, malformed,
   * and stale (replayed older-than-last) evidence before any journey logic runs.
   * Returns a rejection outcome to short-circuit, or `null` to proceed.
   */
  private gate(
    evidence: EvidenceBase,
    subjectKey: string,
    shapeValid: boolean
  ): Extract<WorkJourneyOutcome, { status: 'rejected' }> | null {
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

  private async emitPair(journey: M0BPrimaryJourney): Promise<WorkJourneyOutcome> {
    const started = await this.recorder.startJourney(journey);
    if (started.status !== 'recorded') return { status: 'observer-error', detail: started };
    const terminal = await this.recorder.completeJourney(started.handle);
    if (terminal.status !== 'recorded') return { status: 'observer-error', detail: terminal };
    return { status: 'recorded', journey };
  }
}

/**
 * Single process-owned authority for the running observation session. It stays
 * `undefined` until a live observation runtime installs one, which keeps every
 * production seam binding inert (a no-op) until real observation begins.
 */
let installedAuthority: CohortWorkJourneyAuthority | undefined;

export function setWorkJourneyAuthority(authority: CohortWorkJourneyAuthority | undefined): void {
  installedAuthority = authority;
}

export function getWorkJourneyAuthority(): CohortWorkJourneyAuthority | undefined {
  return installedAuthority;
}

/** Evidence forwarded by a production seam; the session tag and origin are filled from the authority. */
type SeamEvidence<T extends EvidenceBase> = Omit<T, 'sessionId' | 'origin'>;

/** The session/origin fields every seam evidence gains from the installed authority. */
const seamTag = (authority: CohortWorkJourneyAuthority): Pick<EvidenceBase, 'sessionId' | 'origin'> => ({
  sessionId: authority.sessionId,
  origin: 'process',
});

// Instrumentation must never disturb the production seam: swallow all errors.
const swallowInstrumentationError = (): void => undefined;

export function recordConversationCompletion(evidence: SeamEvidence<ConversationCompletionEvidence>): void {
  const authority = installedAuthority;
  if (!authority) return;
  const full: ConversationCompletionEvidence = { ...evidence, ...seamTag(authority) };
  void authority.observeConversationCompletion(full).catch(swallowInstrumentationError);
}

export function recordProjectResume(evidence: SeamEvidence<ProjectResumeEvidence>): void {
  const authority = installedAuthority;
  if (!authority) return;
  const full: ProjectResumeEvidence = { ...evidence, ...seamTag(authority) };
  void authority.observeProjectResume(full).catch(swallowInstrumentationError);
}

export function recordWorkspaceChange(evidence: SeamEvidence<WorkspaceChangeEvidence>): void {
  const authority = installedAuthority;
  if (!authority) return;
  const full: WorkspaceChangeEvidence = { ...evidence, ...seamTag(authority) };
  void authority.observeWorkspaceChange(full).catch(swallowInstrumentationError);
}

export function recordVerificationResult(evidence: SeamEvidence<VerificationResultEvidence>): void {
  const authority = installedAuthority;
  if (!authority) return;
  const full: VerificationResultEvidence = { ...evidence, ...seamTag(authority) };
  void authority.observeVerificationResult(full).catch(swallowInstrumentationError);
}
