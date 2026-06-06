/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowMessageBody - thin adapter that routes an assistant message body
 * through `WorkflowAwareMessage` when the enclosing conversation belongs to
 * a workflow session.
 *
 * Workflow conversations set `workflowSessionId` in `ConversationContext`.
 * When present, this component:
 *   - Passes the body through the AST-authoritative finalize() pass so
 *     `<step>` and `<ask>` markers are stripped before the markdown renderer
 *     sees the text.
 *   - Forwards every parsed `step` marker through the hoisted
 *     `workflowApplyStepMarker` callback from `ConversationContext`.
 *   - No-ops `ask` markers for v1 (the WorkflowSurface AskCard handles them
 *     via IPC-pushed session state; the parser result here is informational).
 *
 * Non-workflow conversations (no `workflowSessionId`) are a zero-overhead
 * pass-through: children receives the body verbatim and no IPC is touched.
 *
 * `totalSteps` AND the marker dispatcher are both read from
 * `ConversationContext` (hoisted in `ChatConversation` from a single
 * `useWorkflowSession(...)` call). This component intentionally does NOT
 * call `useWorkflowSession` itself - doing so would re-introduce the N+1
 * `findAllActive` IPC fan-out on first render (one fetch per assistant
 * message), which the W0 → W0.6 audit explicitly closed.
 *
 * Before the hoisted session loads, totalSteps falls back to a permissive
 * ceiling (999) so markers with any valid step number are accepted rather
 * than silently discarded while the initial IPC fetch is in flight. If
 * `workflowApplyStepMarker` is not yet populated (context still hydrating)
 * the marker dispatch is a no-op - the next render will see the populated
 * callback and the next marker batch will fire normally.
 *
 * Spec: .planning/brainstorm/2026-05-25-workflow-launch-surface/SPEC.md §8, §11.2
 */

import React, { useCallback } from 'react';
import { WorkflowAwareMessage } from '@/renderer/pages/guid/components/workflow/WorkflowAwareMessage';
import { useConversationContextSafe } from '@/renderer/hooks/context/ConversationContext';
import type { WorkflowMarker } from '@/common/types/workflowTypes';

/** Fallback ceiling used before the session data resolves. */
const UNLOADED_TOTAL_STEPS = 999;

export type WorkflowMessageBodyProps = {
  /** Workflow session ID from ConversationContext, or undefined for non-workflow conversations. */
  workflowSessionId: string | undefined;
  /** Full (possibly marker-bearing) message body string. */
  body: string;
  /** Render the (possibly-stripped) body. Called with the cleaned text. */
  children: (cleanedBody: string) => React.ReactNode;
};

/**
 * Routes an assistant message body through WorkflowAwareMessage when the
 * conversation has a workflow session, so step markers are stripped from the
 * rendered text and forwarded into session rail state via the hoisted
 * `workflowApplyStepMarker` callback. Pass-through for non-workflow
 * conversations.
 */
export const WorkflowMessageBody: React.FC<WorkflowMessageBodyProps> = ({ workflowSessionId, body, children }) => {
  const conversationContext = useConversationContextSafe();
  const hoistedTotalSteps = conversationContext?.workflowTotalSteps ?? null;
  const totalSteps = hoistedTotalSteps ?? UNLOADED_TOTAL_STEPS;
  const applyStepMarker = conversationContext?.workflowApplyStepMarker ?? null;

  const handleMarker = useCallback(
    (marker: WorkflowMarker) => {
      if (!workflowSessionId) return;
      if (marker.kind === 'step') {
        // applyStepMarker may briefly be null while the context populates;
        // dropping the marker is the right behavior - the next render with a
        // non-null callback will pick up the next batch from the stream.
        if (applyStepMarker !== null) {
          void applyStepMarker(marker.n, marker.status, 'parent');
        }
      }
      // ask markers are no-op for v1 - WorkflowSurface reads asks from
      // IPC-pushed session state, not from the message body.
    },
    [applyStepMarker, workflowSessionId]
  );

  if (!workflowSessionId) {
    return <>{children(body)}</>;
  }

  return (
    <WorkflowAwareMessage body={body} totalSteps={totalSteps} onMarker={handleMarker}>
      {(cleanedBody) => <>{children(cleanedBody)}</>}
    </WorkflowAwareMessage>
  );
};
