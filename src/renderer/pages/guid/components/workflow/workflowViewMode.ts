/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from 'react';
import type { WorkflowSession } from '@/common/types/workflowTypes';

export type WorkflowViewMode = 'workflow' | 'conversation';

export type WorkflowViewModeContextValue = {
  mode: WorkflowViewMode;
  setMode: (m: WorkflowViewMode) => void;
  isWorkflow: boolean;
  /** Step titles (1-based by index) so the transcript can label step-tag dividers. */
  stepTitles?: string[];
  /**
   * The live workflow session. The transcript is mounted deep in the chat tree
   * and has no other access to step statuses / current_step / run_mode, which
   * it needs to render the step-panel surface (not just a chat).
   */
  session?: WorkflowSession;
  /**
   * True when the run is waiting on the user (the agent's turn ended and the
   * current step isn't done). Drives the blue "Needs you" treatment on the
   * active panel + rail instead of the orange "working" spinner.
   */
  needsInput?: boolean;
};

const defaultValue: WorkflowViewModeContextValue = {
  mode: 'conversation',
  setMode: () => undefined,
  isWorkflow: false,
  stepTitles: [],
};

const WorkflowViewModeContext = createContext<WorkflowViewModeContextValue>(defaultValue);

export const WorkflowViewModeProvider: React.FC<{
  value: WorkflowViewModeContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return React.createElement(WorkflowViewModeContext.Provider, { value }, children);
};

/**
 * Safe hook - returns the safe default when called outside a WorkflowViewModeProvider
 * (non-workflow conversations). isWorkflow will be false, so guards in MessageList
 * will be inert.
 */
export const useWorkflowViewMode = (): WorkflowViewModeContextValue => {
  return useContext(WorkflowViewModeContext);
};

/**
 * Convenience hook for building the provider value with local state.
 * Used in WorkflowSurface.
 */
export const useWorkflowViewModeState = (): WorkflowViewModeContextValue => {
  const [mode, setMode] = useState<WorkflowViewMode>('workflow');
  return { mode, setMode, isWorkflow: true };
};
