/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowSurface - W3.J composition root for the workflow launch surface
 * (SPEC §5.8). Mounted by GuidPage when `useWorkflowSession.isActive()`
 * resolves true. Owns layout + leaf-component wiring only; all state
 * mutations route through the `useWorkflowSession` hook so the hook stays
 * the single source of truth for session shape.
 *
 * Layout:
 *
 *   [WorkflowLaunchOverlay - shown until its 1.6s sequence completes]
 *   ┌────────────────────────────────────────┬─────────────┐
 *   │ WorkflowHeader                                       │
 *   │ AskCard × N (pending asks only)                      │
 *   │ {children}  ← caller's chat tape + input             │
 *   │                                        │ StepRail    │
 *   │                                        │  └─ Status  │
 *   └────────────────────────────────────────┴─────────────┘
 *
 * Status transitions:
 * - `complete`: header collapses (handled inside WorkflowHeader); rail
 *   slot renders `<WorkflowCompleteCard>` instead of `<WorkflowStepRail>`.
 * - `errored`:  root receives the `.errored` modifier class (amber tint).
 *
 * Auto-send hidden begin (SPEC MUST 1 + §14): on first overlay-completion
 * for a *fresh* session (no asks, every step still `todo`), the surface
 * fires one `conversation.sendMessage` to kick the agent. The current
 * `ISendMessageParams` shape has no hidden/internal flag, so for v1 we
 * send a normal "begin" message - W4 will add the hidden flag (TODO).
 */

import { Modal } from '@arco-design/web-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ipcBridge } from '@/common';
import type { WorkflowSession } from '@/common/types/workflowTypes';
import { useWorkflowSession } from '@/renderer/hooks/workflow/useWorkflowSession';
import { AskCard } from '@/renderer/pages/guid/components/workflow/AskCard';
import { WorkflowCompleteCard } from '@/renderer/pages/guid/components/workflow/WorkflowCompleteCard';
import { WorkflowHeader } from '@/renderer/pages/guid/components/workflow/WorkflowHeader';
import { WorkflowLaunchOverlay } from '@/renderer/pages/guid/components/workflow/WorkflowLaunchOverlay';
import { WorkflowStatusBar } from '@/renderer/pages/guid/components/workflow/WorkflowStatusBar';
import { WorkflowStepRail } from '@/renderer/pages/guid/components/workflow/WorkflowStepRail';

import styles from './WorkflowSurface.module.css';

export type WorkflowSurfaceProps = {
  sessionId: string;
  initialSession?: WorkflowSession;
  /** Slot for the existing chat tape + input (caller passes from GuidPage). */
  children: React.ReactNode;
  /** Suggested next workflows for the Complete card. Optional - caller can derive from category. */
  suggestedNext?: Array<{ slug: string; display: string }>;
  /** Fired when the user picks "Run again" on the Complete card. */
  onRunAgain?: () => void;
  /** Fired when the user clicks a suggested-next card. */
  onLaunchNext?: (slug: string) => void;
};

const isFreshLaunch = (session: WorkflowSession): boolean => {
  if (session.asks.length > 0) return false;
  return session.steps.every((step) => step.status === 'todo');
};

// Deterministic msg_id (no Date.now timestamp) - a cross-mount race in which
// two instances both fire begin will collapse to the same msg_id at the
// conversation layer rather than appearing as two distinct messages in the
// tape. This is the dedup mechanism for begin send racing.
const buildBeginMessageId = (sessionId: string): string => `workflow-begin-${sessionId}`;

/**
 * Wrap a user's answer in the structured `[workflow_answer]` envelope the
 * `WORKFLOW_PROTOCOL` system prompt instructs the agent to expect (SPEC §7).
 * Without this wrapper the agent has no machine-readable way to correlate
 * the answer with the originating `<ask>` marker.
 */
const buildWorkflowAnswerEnvelope = (askId: string, stepN: number, answer: string): string =>
  `[workflow_answer ask_id="${askId}" step_n="${stepN}"]\n<answer>${answer}</answer>\n[/workflow_answer]`;

export const WorkflowSurface: React.FC<WorkflowSurfaceProps> = ({
  sessionId,
  initialSession,
  children,
  suggestedNext,
  onRunAgain,
  onLaunchNext,
}) => {
  const session = useWorkflowSession(sessionId, initialSession);
  const [launched, setLaunched] = useState(false);
  const [paused, setPaused] = useState(false);

  const data = session.data;

  const handleOverlayComplete = useCallback(() => {
    setLaunched(true);
  }, []);

  const handlePauseToggle = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      if (next) {
        session.pause();
      } else {
        session.resume();
      }
      return next;
    });
  }, [session]);

  const handleEnd = useCallback(() => {
    Modal.confirm({
      title: 'End workflow?',
      content:
        'Ending this workflow will stop auto-advance and archive the session. You can keep chatting in the underlying conversation.',
      okText: 'End workflow',
      okButtonProps: { status: 'danger' },
      cancelText: 'Cancel',
      onOk: () => {
        void session.end();
      },
    });
  }, [session]);

  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: 'Delete workflow?',
      content:
        'This permanently removes the workflow session, including a stuck or stalled one. The underlying conversation is kept. This cannot be undone.',
      okText: 'Delete',
      okButtonProps: { status: 'danger' },
      cancelText: 'Cancel',
      onOk: () => {
        void session.remove();
      },
    });
  }, [session]);

  const handleJumpToStep = useCallback(
    (n: number) => {
      void session.jumpToStep(n);
    },
    [session]
  );

  const handleRunAutonomously = useCallback(
    (n: number) => {
      void session.runStepAutonomously(n);
    },
    [session]
  );

  const handleAskSubmit = useCallback(
    (askId: string, answer: string) => {
      void (async () => {
        try {
          await session.answerAsk(askId, answer);
        } catch (err) {
          console.warn('[WorkflowSurface] answerAsk failed:', err);
        }
        const conversationId = data?.conversation_id;
        if (!conversationId) return;
        // Find the ask to get step_n for the envelope. If somehow missing
        // (race with session refresh), fall back to step 0 - the envelope
        // is still well-formed and the agent's correlation by ask_id will
        // still work.
        const ask = data?.asks.find((a) => a.id === askId);
        const stepN = ask?.step_n ?? 0;
        const envelope = buildWorkflowAnswerEnvelope(askId, stepN, answer);
        try {
          await ipcBridge.conversation.sendMessage.invoke({
            input: envelope,
            msg_id: `workflow-ask-${askId}-${Date.now()}`,
            conversation_id: conversationId,
          });
        } catch (err) {
          console.warn('[WorkflowSurface] ask sendMessage failed:', err);
        }
      })();
    },
    [session, data?.conversation_id, data?.asks]
  );

  const handleAskSkip = useCallback(
    (askId: string) => {
      void session.answerAsk(askId, 'skip');
    },
    [session]
  );

  // Auto-send the hidden begin message exactly once per workflow session
  // lifetime. The guard is the persisted `begin_sent_at` field rather than a
  // component-local ref so the gate survives Strict Mode double-mount,
  // page refresh, and back-navigation.
  //
  // Race-safe order: route through `session.markBeginSent()` rather than
  // the raw IPC bridge so the hook's local `data` is updated synchronously
  // with the persisted value. This is what makes the Strict-Mode claim
  // actually hold - between the persistence landing and the hook setting
  // `data.begin_sent_at = <ms>`, a remount within the same instance still
  // sees the in-flight Promise's resolution (React batches setState into
  // the next commit), so the second mount's effect early-exits on the
  // updated gate value.
  //
  // Re-entrancy: `inFlightRef` blocks a second concurrent call to the
  // effect body within the same component lifetime, even before React has
  // a chance to commit the updated `data`. Without this, the effect can
  // fire twice in a single Strict-Mode mount cycle (effect → cleanup →
  // effect) because `data.begin_sent_at` is still null between the two
  // invocations.
  //
  // TODO(W4): when ISendMessageParams gains a hidden/internal flag, mark
  // this message so ChatTape skips rendering it.
  const inFlightRef = useRef(false);
  useEffect(() => {
    if (!launched || !data) return;
    if (data.begin_sent_at !== null) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const isResume = !isFreshLaunch(data);
    const at = Date.now();
    const conversationId = data.conversation_id;
    const workflowName = data.workflow_name;
    const sessionDataId = data.id;
    void session
      .markBeginSent(at)
      .then((updated) => {
        if (isResume) return;
        if (!updated) return;
        // Cross-mount race dedup: service.markBeginSent now uses the
        // passed `at` (not its own Date.now()), so we can verify whether
        // OUR call won the race by checking the returned timestamp.
        // If the stored value differs from our `at`, another mount won
        // first - its sendMessage will fire, ours must not.
        // (Confirmed needed: conversation layer does NOT dedup by msg_id,
        // so deterministic msg_id alone wouldn't stop the duplicate.)
        if (updated.begin_sent_at !== at) return;
        return ipcBridge.conversation.sendMessage.invoke({
          input: `begin ${workflowName}`,
          msg_id: buildBeginMessageId(sessionDataId),
          conversation_id: conversationId,
        });
      })
      .catch((err: unknown) => {
        // Roll back the in-flight guard so the user can retry by reloading
        // the surface - the persistence may have landed even if sendMessage
        // failed, in which case the next mount sees begin_sent_at set and
        // skips correctly.
        inFlightRef.current = false;
        console.warn('[WorkflowSurface] begin send failed:', err);
      });
  }, [launched, data, session]);

  if (!data) {
    return null;
  }

  const showOverlay = !launched;
  const isComplete = data.status === 'complete';
  const isErrored = data.status === 'errored';
  const rootClass = `${styles.root}${isErrored ? ` ${styles.errored}` : ''}`;
  const pendingAsks = data.asks.filter((ask) => ask.answer === null);

  if (showOverlay) {
    return (
      <div className={rootClass} data-testid='workflow-surface' data-launched='false'>
        <WorkflowLaunchOverlay
          workflowName={data.workflow_title}
          totalSteps={data.total_steps}
          onComplete={handleOverlayComplete}
        />
      </div>
    );
  }

  return (
    <div className={rootClass} data-testid='workflow-surface' data-launched='true' data-status={data.status}>
      <div className={styles.body}>
        <div className={styles.main}>
          <div className={styles.headerSlot}>
            <WorkflowHeader
              session={data}
              paused={paused}
              onPauseToggle={handlePauseToggle}
              onEnd={handleEnd}
              onDelete={handleDelete}
            />
          </div>
          {pendingAsks.length > 0 && (
            <div className={styles.asks} data-testid='workflow-surface-asks'>
              {pendingAsks.map((ask) => (
                <AskCard
                  key={ask.id}
                  ask={ask}
                  onSubmit={(answer) => handleAskSubmit(ask.id, answer)}
                  onSkip={() => handleAskSkip(ask.id)}
                />
              ))}
            </div>
          )}
          <div className={styles.children}>{children}</div>
        </div>

        <div className={styles.right} data-testid='workflow-surface-right'>
          {isComplete ? (
            <WorkflowCompleteCard
              session={data}
              suggestedNext={suggestedNext}
              onSaveRun={() => {
                // Save-run defaults to no-op for v1; W4 wires persistence.
              }}
              onRunAgain={() => onRunAgain?.()}
              onLaunchNext={(slug) => onLaunchNext?.(slug)}
            />
          ) : (
            <WorkflowStepRail session={data} onJumpToStep={handleJumpToStep} onRunAutonomously={handleRunAutonomously}>
              <WorkflowStatusBar session={data} />
            </WorkflowStepRail>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowSurface;
