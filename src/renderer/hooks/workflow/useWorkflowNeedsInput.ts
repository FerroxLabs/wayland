/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * useWorkflowNeedsInput - derives the "the run is waiting on the user" signal
 * for a workflow session.
 *
 * "Is the agent currently producing output for this conversation?" is read from
 * the shared generating-conversations store (fed by responseStream /
 * turnCompleted). When it is NOT generating and the current step is not done,
 * the run is waiting on the user. The idle edge is debounced so the brief gap
 * between the user sending and the agent's first chunk does not flash the
 * "Needs you" beat.
 *
 * Extracted from WorkflowSurface so the chat body (WorkflowSurface) and the
 * merged Steps panel (WorkflowStepsTab, rendered in ChatLayout's right sider)
 * compute the exact same value from the same inputs.
 */

import { useEffect, useState } from 'react';
import type { WorkflowSession } from '@/common/types/workflowTypes';
import { useConversationListSync } from '@/renderer/pages/conversation/GroupedHistory/hooks/useConversationListSync';

export function useWorkflowNeedsInput(data: WorkflowSession | null | undefined): boolean {
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

  return (
    !!data &&
    data.status === 'active' &&
    data.begin_sent_at !== null &&
    data.run_mode === 'running' &&
    !currentStepTerminal &&
    idleStable
  );
}
