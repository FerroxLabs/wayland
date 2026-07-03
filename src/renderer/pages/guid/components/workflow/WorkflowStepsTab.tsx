/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowStepsTab - the workflow "Steps" surface, rendered inside ChatLayout's
 * single collapsible right sider (as the "Steps" tab alongside "Workspace").
 *
 * This is the content that used to live in WorkflowSurface's own fixed 280px
 * `.right` column. Merging it into ChatLayout's sider (issue #116) collapses
 * the workflow screen's two right rails into one closeable, tabbed panel so the
 * chat body is no longer squeezed.
 *
 * Purely presentational: session state + the needs-input signal + the
 * jump/launch callbacks are owned by the caller (ChatConversation, off the
 * hoisted `useWorkflowSession`).
 */

import React from 'react';

import type { WorkflowSession } from '@/common/types/workflowTypes';
import { WorkflowCompleteCard } from './WorkflowCompleteCard';
import { WorkflowStatusBar } from './WorkflowStatusBar';
import { WorkflowStepRail } from './WorkflowStepRail';

export type WorkflowStepsTabProps = {
  /** The live workflow session, or null while it resolves. */
  session: WorkflowSession | null | undefined;
  /** True when the run is waiting on the user - the live step shows a blue "?". */
  needsInput: boolean;
  /** Jump the workflow to a step (rail row click). */
  onJumpToStep: (n: number) => void;
  /** Launch a workflow by slug/name - backs the Complete card CTAs. */
  onLaunchWorkflow: (workflowName: string) => void;
  /** Suggested next workflows for the Complete card. */
  suggestedNext?: Array<{ slug: string; display: string }>;
};

export const WorkflowStepsTab: React.FC<WorkflowStepsTabProps> = ({
  session,
  needsInput,
  onJumpToStep,
  onLaunchWorkflow,
  suggestedNext,
}) => {
  if (!session) return null;

  if (session.status === 'complete') {
    return (
      <WorkflowCompleteCard
        session={session}
        suggestedNext={suggestedNext}
        onRunAgain={() => onLaunchWorkflow(session.workflow_name)}
        onLaunchNext={(slug) => onLaunchWorkflow(slug)}
      />
    );
  }

  return (
    <WorkflowStepRail session={session} needsInput={needsInput} onJumpToStep={onJumpToStep} embedded>
      <WorkflowStatusBar session={session} />
    </WorkflowStepRail>
  );
};

export default WorkflowStepsTab;
