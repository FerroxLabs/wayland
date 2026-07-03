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

import { Modal, Radio } from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { ipcBridge } from '@/common';
import type { WorkflowInteractivity, WorkflowSession } from '@/common/types/workflowTypes';
import { useWorkflowSession } from '@/renderer/hooks/workflow/useWorkflowSession';
import { useConversationListSync } from '@/renderer/pages/conversation/GroupedHistory/hooks/useConversationListSync';
import { AskCard } from '@/renderer/pages/guid/components/workflow/AskCard';
import { QueuedSteeringChip } from '@/renderer/pages/guid/components/workflow/QueuedSteeringChip';
import { WorkflowNeedsInputCard } from '@/renderer/pages/guid/components/workflow/WorkflowNeedsInputCard';
import { StepReviewBeat } from '@/renderer/pages/guid/components/workflow/StepReviewBeat';
import { WorkflowClarifyCard } from '@/renderer/pages/guid/components/workflow/WorkflowClarifyCard';
import { WorkflowCompleteCard } from '@/renderer/pages/guid/components/workflow/WorkflowCompleteCard';
import { WorkflowHeader } from '@/renderer/pages/guid/components/workflow/WorkflowHeader';
import { WorkflowLaunchOverlay } from '@/renderer/pages/guid/components/workflow/WorkflowLaunchOverlay';
import { WorkflowStatusBar } from '@/renderer/pages/guid/components/workflow/WorkflowStatusBar';
import { WorkflowStepRail } from '@/renderer/pages/guid/components/workflow/WorkflowStepRail';
import { useWorkflowRailSlot } from '@/renderer/pages/guid/components/workflow/WorkflowRailSlot';
import {
  WorkflowViewModeProvider,
  useWorkflowViewModeState,
} from '@/renderer/pages/guid/components/workflow/workflowViewMode';

import styles from './WorkflowSurface.module.css';

export type WorkflowSurfaceProps = {
  sessionId: string;
  initialSession?: WorkflowSession;
  /** Slot for the existing chat tape + input (caller passes from GuidPage). */
  children: React.ReactNode;
  /** Suggested next workflows for the Complete card. Optional - caller can derive from category. */
  suggestedNext?: Array<{ slug: string; display: string }>;
  /**
   * Launch a workflow by its slug/name. Backs both Complete-card CTAs:
   * "Run again" passes this session's own `workflow_name`, "Up next" passes
   * the suggested slug. The caller (ChatConversation) routes to the launcher.
   */
  onLaunchWorkflow?: (workflowName: string) => void;
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
  onLaunchWorkflow,
}) => {
  const { t } = useTranslation();
  const session = useWorkflowSession(sessionId, initialSession);
  // Build #116: when a tabbed sider is present, the step rail is portaled into
  // its "Steps" tab instead of a second fixed rail beside the chat.
  const railSlot = useWorkflowRailSlot();
  const [launched, setLaunched] = useState(false);
  const [clarified, setClarified] = useState(false);
  const contextNoteRef = useRef<string>('');
  const noteSentRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const viewModeValue = useWorkflowViewModeState();

  const data = session.data;

  // "Is the agent currently producing output for this conversation?" - read from
  // the shared generating-conversations store (fed by responseStream /
  // turnCompleted). When it is NOT generating and the step is not done, the run
  // is waiting on the user. Debounce the idle edge so the brief gap between the
  // user sending and the agent's first chunk does not flash the "Needs you"
  // beat.
  const { isConversationGenerating } = useConversationListSync();
  const responding = data ? isConversationGenerating(data.conversation_id) : false;
  const [idleStable, setIdleStable] = useState(false);
  useEffect(() => {
    if (responding) {
      setIdleStable(false);
      return;
    }
    const id = window.setTimeout(() => setIdleStable(true), 600);
    return () => window.clearTimeout(id);
  }, [responding]);

  const liveStep = data?.steps.find((s) => s.n === data.current_step);
  const currentStepTerminal = liveStep
    ? liveStep.status === 'done' || liveStep.status === 'skipped' || liveStep.status === 'errored'
    : false;
  // The "spinning forever" case: the run is nominally `running` but the agent
  // has gone idle without completing the step - it asked the user something in
  // prose (no structured marker), so the engine never flipped to awaiting_input.
  // Surface the blue "Needs you" beat. (A formal awaiting_input is handled by
  // the StepReviewBeat below - that's the step-complete Accept/Revise/Go-back
  // gate, a different kind of "your move".)
  const needsInput =
    !!data &&
    data.status === 'active' &&
    data.begin_sent_at !== null &&
    data.run_mode === 'running' &&
    !currentStepTerminal &&
    idleStable;

  // There is exactly ONE input - the conversation composer at the bottom. When
  // the run needs the user, jump them to it: scroll the end of the question
  // into view and focus the composer. The blue notice points here; clicking it
  // does the same. No second input, so the user is never asked "which box?".
  const composerHostRef = useRef<HTMLDivElement>(null);
  const focusComposer = useCallback(() => {
    const root = composerHostRef.current;
    if (!root) return;
    const panels = root.querySelectorAll('section[data-step]');
    const lastPanel = panels[panels.length - 1];
    if (lastPanel) lastPanel.scrollIntoView({ block: 'end', behavior: 'smooth' });
    const textarea = root.querySelector('.sendbox-panel textarea');
    if (textarea instanceof HTMLTextAreaElement) textarea.focus();
  }, []);
  useEffect(() => {
    if (!needsInput) return;
    const id = window.setTimeout(focusComposer, 160);
    return () => window.clearTimeout(id);
  }, [needsInput, focusComposer]);

  // Thread step titles + the live session + the needs-input flag into the
  // view-mode context so the WorkflowTranscript (mounted deep inside the chat
  // tree) can render the step-panel surface and the blue "Needs you" treatment.
  const viewModeProviderValue = useMemo(
    () => ({
      ...viewModeValue,
      stepTitles: (data?.steps ?? []).map((s) => s.title),
      session: data ?? undefined,
      needsInput,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewModeValue.mode, viewModeValue.isWorkflow, data, needsInput]
  );

  const handleClarifyStart = useCallback((note: string) => {
    contextNoteRef.current = note.trim();
    setClarified(true);
  }, []);

  const handleContinue = useCallback(() => {
    // StepReviewBeat "Accept & continue": mark the active step done, advance to
    // the next step, and let the main side send the next-step directive. This
    // replaces the old bare resumeRun (which only re-armed the gate and nudged
    // the agent, never marking the step terminal - so the run sat `now` forever).
    void session.acceptStep().catch((err) => {
      console.warn('[WorkflowSurface] acceptStep failed:', err);
    });
  }, [session]);

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

  const handleSetInteractivity = useCallback(
    (mode: WorkflowInteractivity) => {
      void session.setInteractivity(mode).catch((err) => {
        console.warn('[WorkflowSurface] setInteractivity failed:', err);
      });
    },
    [session]
  );

  const handleRevise = useCallback(() => {
    const conversationId = data?.conversation_id;
    const stepN = data?.current_step ?? 1;
    if (!conversationId) return;
    void ipcBridge.conversation.sendMessage
      .invoke({
        input: `Please revise step ${stepN} and show the updated result.`,
        msg_id: `workflow-revise-${sessionId}-${stepN}-${Date.now()}`,
        conversation_id: conversationId,
      })
      .catch((err: unknown) => {
        console.warn('[WorkflowSurface] revise send failed:', err);
      });
  }, [data?.conversation_id, data?.current_step, sessionId]);

  const handleGoBack = useCallback(() => {
    const currentStep = data?.current_step;
    if (currentStep == null || currentStep <= 1) return;
    void session.backtrackToStep(currentStep - 1).catch((err) => {
      console.warn('[WorkflowSurface] backtrackToStep failed:', err);
    });
  }, [session, data?.current_step]);

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
    if (!clarified) return;
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
        return ipcBridge.conversation.sendMessage
          .invoke({
            input: `begin ${workflowName}`,
            msg_id: buildBeginMessageId(sessionDataId),
            conversation_id: conversationId,
          })
          .then(() => {
            // #121: send the optional context note as a SECOND message only
            // AFTER the begin send is accepted. `sendMessage` resolves once the
            // agent session is active, so the note no longer races the session
            // bootstrap into a "cannot send in prompting state" rejection (which
            // dropped the note and left the agent hunting for context).
            // Best-effort: a failure is logged, never fatal.
            const note = contextNoteRef.current;
            if (!note || noteSentRef.current) return;
            noteSentRef.current = true;
            contextNoteRef.current = '';
            return ipcBridge.conversation.sendMessage
              .invoke({
                input: note,
                msg_id: `workflow-clarify-note-${sessionDataId}-${at}`,
                conversation_id: conversationId,
              })
              .catch((err: unknown) => {
                console.warn('[WorkflowSurface] clarify note send failed:', err);
              });
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
  }, [launched, clarified, data, session]);

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

  // Show the clarify card only for fresh sessions (begin_sent_at null) that
  // have not yet been confirmed by the user. Resumed sessions bypass it.
  const showClarifyCard = data.begin_sent_at === null && !clarified;

  // The step rail (or, on completion, the complete card). Built here so it can be
  // rendered either into the tabbed sider (portal) or the legacy inline column.
  const railContent = isComplete ? (
    <WorkflowCompleteCard
      session={data}
      suggestedNext={suggestedNext}
      onRunAgain={() => onLaunchWorkflow?.(data.workflow_name)}
      onLaunchNext={(slug) => onLaunchWorkflow?.(slug)}
    />
  ) : (
    <WorkflowStepRail session={data} needsInput={needsInput} onJumpToStep={handleJumpToStep}>
      <WorkflowStatusBar session={data} />
    </WorkflowStepRail>
  );

  return (
    <WorkflowViewModeProvider value={viewModeProviderValue}>
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
                onSetInteractivity={handleSetInteractivity}
              />
            </div>
            <div className={styles.viewToggle}>
              <Radio.Group
                type='button'
                size='small'
                value={viewModeValue.mode}
                onChange={(v) => viewModeValue.setMode(v as 'workflow' | 'conversation')}
              >
                <Radio value='workflow'>{t('workflow.view.workflow')}</Radio>
                <Radio value='conversation'>{t('workflow.view.conversation')}</Radio>
              </Radio.Group>
            </div>
            {showClarifyCard ? (
              <WorkflowClarifyCard
                workflowTitle={data.workflow_title}
                mode={data.interactivity}
                onSetMode={(m) =>
                  void session.setInteractivity(m).catch((err) => {
                    console.warn('[WorkflowSurface] setInteractivity failed:', err);
                  })
                }
                onStart={handleClarifyStart}
              />
            ) : (
              <>
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
                {/* Engine-flagged step gate → review beat (Accept / Revise / Go back).
                    Running-but-idle (asked in prose) → the blue Needs-you card below. */}
                {data.run_mode === 'awaiting_input' && (
                  <StepReviewBeat
                    currentStep={data.current_step}
                    totalSteps={data.total_steps}
                    onAccept={handleContinue}
                    onRevise={handleRevise}
                    onGoBack={handleGoBack}
                  />
                )}
                <div
                  className={styles.children}
                  ref={composerHostRef}
                  data-needsinput={needsInput ? 'true' : undefined}
                >
                  {needsInput ? (
                    <WorkflowNeedsInputCard onActivate={focusComposer} />
                  ) : (
                    data.run_mode === 'running' && (
                      <QueuedSteeringChip
                        // TODO(W5): wire onInterrupt to conversation stop IPC when available
                        onInterrupt={undefined}
                      />
                    )
                  )}
                  {children}
                </div>
              </>
            )}
          </div>

          {/* Build #116: the rail is the same element whether it lands in the
              tabbed sider's Steps tab (portal) or, for a standalone mount with no
              sider bridge, the legacy inline 280px column. */}
          {railSlot.hasSlotHost ? (
            railSlot.slotEl && createPortal(railContent, railSlot.slotEl)
          ) : (
            <div className={styles.right} data-testid='workflow-surface-right'>
              {railContent}
            </div>
          )}
        </div>
      </div>
    </WorkflowViewModeProvider>
  );
};

export default WorkflowSurface;
