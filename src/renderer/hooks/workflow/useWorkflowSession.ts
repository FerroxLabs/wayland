/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reactive renderer hook for a single WorkflowSession. Backs the workflow
 * launch surface (right-rail step list, ask-card, autonomous-run badges) by
 * holding the canonical `WorkflowSession` state locally and exposing
 * mutation helpers that round-trip through the IPC bridge.
 *
 * The caller (`WorkflowSurface` mounted from `GuidPage`) passes the session
 * id once the underlying `workflow.start` response has resolved, plus the
 * `initialSession` payload from that same response so the hook can render
 * synchronously on first paint without a network round-trip. The bridge
 * intentionally does not expose a `findById` endpoint - `refresh()` uses
 * `findAllActive` and filters client-side, which is the path consumers hit
 * when stream marker parsing suggests the local state is stale.
 *
 * SPEC §5.10 (consumer expectations) + §6.4 (`workflow.updateSessionState`
 * patch shape). The patch dispatcher on the main side
 * (`src/process/bridge/workflowBridge.ts`) always tags renderer-driven
 * step transitions with `source = 'user'`; the optional `source` argument
 * on `applyStepMarker` is forwarded only for the symmetric W5 path (the
 * `dispatchAutonomousStep` worker reports back via its own channel).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ipcBridge } from '@/common';
import type {
  StepStatus,
  StepTransitionSource,
  WorkflowInteractivity,
  WorkflowSession,
} from '@/common/types/workflowTypes';

export type UseWorkflowSessionReturn = {
  data: WorkflowSession | null;
  loading: boolean;
  error: Error | null;
  /** True when data exists AND status is 'active' or 'errored'. */
  isActive: () => boolean;
  /** Send a "Now do step N" jump prompt and mark step N as 'now' locally. */
  jumpToStep: (n: number) => Promise<void>;
  /** Spawns autonomous worker for step N. Returns the dispatchId. Stubbed until W5. */
  runStepAutonomously: (n: number) => Promise<{ dispatchId: string }>;
  /** Records an answer for an outstanding ask. */
  answerAsk: (askId: string, answer: string) => Promise<void>;
  /** Local-only pause flag - does not call IPC. */
  pause: () => void;
  /** Local-only resume flag - does not call IPC. */
  resume: () => void;
  /**
   * The Continue affordance for an `awaiting_input` step-mode run. Flips
   * `run_mode` back to `running` via IPC (the bridge routes this to
   * `service.resume`) and sends a "continue" prompt so the parent driver loop
   * advances the next step on the resulting turn. Best-effort send.
   */
  resumeRun: () => Promise<void>;
  /**
   * Step-mode "Accept & continue" at the StepReviewBeat. Marks the active step
   * done, advances to the next step, and the main side sends the next-step
   * directive into the conversation. Hydrates local data with the resulting
   * session. Guarded against double-fire.
   */
  acceptStep: () => Promise<void>;
  /** Sends setSessionStatus='ended' via IPC. */
  end: () => Promise<void>;
  /** Permanently deletes the session via IPC (distinct from `end`, which only flips status). */
  remove: () => Promise<void>;
  /** Re-fetches the session from main via `findAllActive` + client-side filter. */
  refresh: () => Promise<void>;
  /** Apply a marker emitted by the stream parser to the session state (also persists via IPC). */
  applyStepMarker: (stepN: number, status: StepStatus, source?: StepTransitionSource) => Promise<void>;
  /**
   * Persist the hidden-begin send timestamp and hydrate local data with the
   * server's response. Used by WorkflowSurface to guarantee exactly-once
   * begin semantics. Calling without an `at` value defaults to `Date.now()`;
   * idempotent - the service no-ops if `begin_sent_at` is already set.
   * Returns the resulting session so callers can chain the send after the
   * persistence has both landed AND been reflected in local state.
   */
  markBeginSent: (at?: number) => Promise<WorkflowSession | null>;
  /**
   * Flip the interactivity mode (step-by-step vs fully-autonomous). Routes to
   * `service.setInteractivity` via IPC. Idempotent.
   */
  setInteractivity: (mode: WorkflowInteractivity) => Promise<void>;
  /**
   * Regress the run to step N. Routes to `service.backtrackToStep` via IPC.
   * Local data is updated with the resulting session.
   */
  backtrackToStep: (n: number) => Promise<void>;
};

const ACTIVE_STATUSES: ReadonlySet<WorkflowSession['status']> = new Set(['active', 'errored']);

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

export function useWorkflowSession(
  sessionId: string | undefined,
  initialSession?: WorkflowSession
): UseWorkflowSessionReturn {
  const [data, setData] = useState<WorkflowSession | null>(initialSession ?? null);
  // `loading` is true on the first IPC fetch when no seed is provided.
  const [loading, setLoading] = useState<boolean>(!initialSession && Boolean(sessionId));
  const [error, setError] = useState<Error | null>(null);

  // Local-only pause/resume flag. Surfaced to consumers as setter callbacks;
  // the actual reading happens via WorkflowStepRail's own state since the
  // hook intentionally never persists it.
  const pausedRef = useRef<boolean>(false);
  // Guards resumeRun against double-fire (a double-clicked Continue would
  // otherwise send two "Continue" turns and drive the step twice).
  const resumeInFlightRef = useRef<boolean>(false);
  // Guards acceptStep against double-fire (a double-clicked Accept would
  // otherwise advance two steps).
  const acceptInFlightRef = useRef<boolean>(false);

  // Stale-guard: keep the most recent sessionId so an in-flight refresh
  // doesn't overwrite state after the consumer switches sessions.
  const activeSessionIdRef = useRef<string | undefined>(sessionId);
  useEffect(() => {
    activeSessionIdRef.current = sessionId;
  }, [sessionId]);

  // Re-fetch a SINGLE session by id regardless of status. Unlike `refresh`
  // (findAllActive, which excludes completed/ended sessions), this resolves a
  // run even after it has finished - the path the live-sync subscription and
  // the initial mount need so a completed workflow shows its Complete card
  // instead of a frozen mid-run snapshot.
  const fetchById = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await ipcBridge.workflow.findById.invoke({ sessionId });
      if (activeSessionIdRef.current !== sessionId) return;
      if (result.session) {
        setData(result.session);
        setError(null);
      }
    } catch (err) {
      if (activeSessionIdRef.current !== sessionId) return;
      setError(toError(err));
    }
  }, [sessionId]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await ipcBridge.workflow.findAllActive.invoke({});
      if (activeSessionIdRef.current !== sessionId) return;
      const match = result.sessions.find((row) => row.session.id === sessionId);
      if (match) {
        setData(match.session);
      }
      setError(null);
    } catch (err) {
      if (activeSessionIdRef.current !== sessionId) return;
      setError(toError(err));
    } finally {
      if (activeSessionIdRef.current === sessionId) {
        setLoading(false);
      }
    }
  }, [sessionId]);

  // Initial fetch when no seed is provided but a sessionId is present. Use the
  // by-id path (not findAllActive) so re-opening an already-completed workflow
  // hydrates its terminal state rather than coming back empty.
  useEffect(() => {
    if (!sessionId || initialSession) return;
    setLoading(true);
    void fetchById().finally(() => {
      if (activeSessionIdRef.current === sessionId) setLoading(false);
    });
    // initialSession is intentionally excluded: we only want to fetch when the
    // consumer mounts us without a seed. Subsequent re-renders should NOT
    // re-trigger a fetch just because the caller passes a new seed reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, fetchById]);

  // Live-sync. The main-process driver loop (parentTurnDriver -> continueRun)
  // and the autonomous-step worker mutate the session SERVER-SIDE and emit
  // `sessionChanged`. The renderer holds `data` locally and otherwise only
  // updates it from its own mutation calls, so without this subscription a run
  // advancing or completing under the driver would never reach the rail,
  // header, or Complete card - the surface would freeze on the seed. Re-fetch by
  // id on every change to THIS session (delete clears it). This is the renderer
  // half of the auto-progression fix; the main half is the local-emitter
  // fan-out in ConversationTurnCompletionService.
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = ipcBridge.workflow.sessionChanged.on((event) => {
      if (event.session_id !== sessionId) return;
      if (event.action === 'delete') {
        if (activeSessionIdRef.current === sessionId) setData(null);
        return;
      }
      void fetchById();
    });
    return () => {
      unsubscribe?.();
    };
  }, [sessionId, fetchById]);

  const applyStepMarker = useCallback(
    async (
      stepN: number,
      status: StepStatus,
      // `source` is threaded to the main-side patch dispatcher so the stepCursor
      // no-forward-leapfrog guard can distinguish agent-narrated `<step>` markers
      // (`'parent'`) from explicit user rail jumps (`'user'`). Defaults to
      // `'user'` so callers may omit it (rail-jump callers do).
      source: StepTransitionSource = 'user'
    ) => {
      if (!sessionId) return;
      try {
        const result = await ipcBridge.workflow.updateSessionState.invoke({
          sessionId,
          patch: {
            setStepStatus: { n: stepN, status, completed_at: Date.now(), source },
          },
        });
        if (activeSessionIdRef.current !== sessionId) return;
        setData(result.session);
        setError(null);
      } catch (err) {
        if (activeSessionIdRef.current !== sessionId) return;
        setError(toError(err));
        throw err;
      }
    },
    [sessionId]
  );

  const jumpToStep = useCallback(
    async (n: number) => {
      if (!sessionId) return;
      // Persist the marker first so the rail re-renders even if the chat
      // send fails (network blip / stopped stream). The send-message call is
      // best-effort: a console.warn keeps it out of the user's error surface.
      await applyStepMarker(n, 'now', 'user');
      const conversationId = data?.conversation_id;
      if (!conversationId) return;
      try {
        await ipcBridge.conversation.sendMessage.invoke({
          input: `Now do step ${n}`,
          msg_id: `workflow-jump-${sessionId}-${n}-${Date.now()}`,
          conversation_id: conversationId,
        });
      } catch (err) {
        console.warn('[useWorkflowSession] jumpToStep send failed:', err);
      }
    },
    [sessionId, data?.conversation_id, applyStepMarker]
  );

  const answerAsk = useCallback(
    async (askId: string, answer: string) => {
      if (!sessionId) return;
      try {
        const result = await ipcBridge.workflow.updateSessionState.invoke({
          sessionId,
          patch: {
            answerAsk: { askId, answer, answered_at: Date.now() },
          },
        });
        if (activeSessionIdRef.current !== sessionId) return;
        setData(result.session);
        setError(null);
      } catch (err) {
        if (activeSessionIdRef.current !== sessionId) return;
        setError(toError(err));
        throw err;
      }
    },
    [sessionId]
  );

  const markBeginSent = useCallback(
    async (at: number = Date.now()): Promise<WorkflowSession | null> => {
      if (!sessionId) return null;
      try {
        const result = await ipcBridge.workflow.updateSessionState.invoke({
          sessionId,
          patch: { setBeginSent: at },
        });
        if (activeSessionIdRef.current !== sessionId) return null;
        setData(result.session);
        setError(null);
        return result.session;
      } catch (err) {
        if (activeSessionIdRef.current !== sessionId) return null;
        setError(toError(err));
        throw err;
      }
    },
    [sessionId]
  );

  const end = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await ipcBridge.workflow.updateSessionState.invoke({
        sessionId,
        patch: { setSessionStatus: 'ended' },
      });
      if (activeSessionIdRef.current !== sessionId) return;
      setData(result.session);
      setError(null);
    } catch (err) {
      if (activeSessionIdRef.current !== sessionId) return;
      setError(toError(err));
      throw err;
    }
  }, [sessionId]);

  const remove = useCallback(async () => {
    if (!sessionId) return;
    await ipcBridge.workflow.deleteSession.invoke({ sessionId });
    if (activeSessionIdRef.current !== sessionId) return;
    setData(null);
    setError(null);
  }, [sessionId]);

  const runStepAutonomously = useCallback(
    async (n: number) => {
      if (!sessionId) {
        throw new Error('useWorkflowSession.runStepAutonomously: no sessionId');
      }
      // Let the W5 stub's "not yet implemented" rejection propagate so the
      // calling step row can surface the message to the user. Once W5 lands,
      // this same shape returns a real dispatchId.
      return await ipcBridge.workflow.dispatchAutonomousStep.invoke({
        sessionId,
        stepN: n,
      });
    },
    [sessionId]
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  const resumeRun = useCallback(async () => {
    if (!sessionId) return;
    if (resumeInFlightRef.current) return;
    resumeInFlightRef.current = true;
    // Flip the persisted run gate back to `running` (bridge → service.resume),
    // then nudge the agent so the parent driver loop fires on the next turn.
    try {
      const result = await ipcBridge.workflow.updateSessionState.invoke({
        sessionId,
        patch: { setRunMode: 'running' },
      });
      if (activeSessionIdRef.current === sessionId) {
        setData(result.session);
        setError(null);
      }
    } catch (err) {
      if (activeSessionIdRef.current === sessionId) setError(toError(err));
      resumeInFlightRef.current = false;
      throw err;
    }
    const conversationId = data?.conversation_id;
    if (!conversationId) {
      resumeInFlightRef.current = false;
      return;
    }
    try {
      await ipcBridge.conversation.sendMessage.invoke({
        input: 'Continue with the next step.',
        msg_id: `workflow-continue-${sessionId}-${Date.now()}`,
        conversation_id: conversationId,
      });
    } catch (err) {
      console.warn('[useWorkflowSession] resumeRun send failed:', err);
    } finally {
      resumeInFlightRef.current = false;
    }
  }, [sessionId, data?.conversation_id]);

  const acceptStep = useCallback(async () => {
    if (!sessionId) return;
    if (acceptInFlightRef.current) return;
    acceptInFlightRef.current = true;
    try {
      const result = await ipcBridge.workflow.acceptStep.invoke({ sessionId });
      if (activeSessionIdRef.current === sessionId) {
        setData(result.session);
        setError(null);
      }
    } catch (err) {
      if (activeSessionIdRef.current === sessionId) setError(toError(err));
      throw err;
    } finally {
      acceptInFlightRef.current = false;
    }
  }, [sessionId]);

  const setInteractivity = useCallback(
    async (mode: WorkflowInteractivity) => {
      if (!sessionId) return;
      try {
        const result = await ipcBridge.workflow.updateSessionState.invoke({
          sessionId,
          patch: { setInteractivity: mode },
        });
        if (activeSessionIdRef.current !== sessionId) return;
        setData(result.session);
        setError(null);
      } catch (err) {
        if (activeSessionIdRef.current !== sessionId) return;
        setError(toError(err));
        throw err;
      }
    },
    [sessionId]
  );

  const backtrackToStep = useCallback(
    async (n: number) => {
      if (!sessionId) return;
      try {
        const result = await ipcBridge.workflow.updateSessionState.invoke({
          sessionId,
          patch: { backtrackToStep: n },
        });
        if (activeSessionIdRef.current !== sessionId) return;
        setData(result.session);
        setError(null);
      } catch (err) {
        if (activeSessionIdRef.current !== sessionId) return;
        setError(toError(err));
        throw err;
      }
    },
    [sessionId]
  );

  const isActive = useCallback(() => {
    return data !== null && ACTIVE_STATUSES.has(data.status);
  }, [data]);

  return {
    data,
    loading,
    error,
    isActive,
    jumpToStep,
    runStepAutonomously,
    answerAsk,
    pause,
    resume,
    resumeRun,
    acceptStep,
    end,
    remove,
    refresh,
    applyStepMarker,
    markBeginSent,
    setInteractivity,
    backtrackToStep,
  };
}
