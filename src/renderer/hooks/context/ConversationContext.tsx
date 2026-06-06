/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from 'react';
import type { StepStatus, StepTransitionSource } from '@/common/types/workflowTypes';

/**
 * Conversation context interface
 */
export interface ConversationContextValue {
  /**
   * Conversation ID
   */
  conversationId: string;

  /**
   * Workspace directory path
   */
  workspace?: string;

  /**
   * Conversation type
   */
  type: 'gemini' | 'acp' | 'codex' | 'openclaw-gateway' | 'nanobot' | 'remote' | 'wcore';

  /**
   * Cron job ID (if this conversation was created by a scheduled task)
   */
  cronJobId?: string;

  /**
   * When true, platform chat components should hide the SendBox (e.g. sub-agents in team mode)
   */
  hideSendBox?: boolean;

  /**
   * Workflow session ID, present when this conversation is part of an active
   * workflow launch surface. Used by MessageText to route assistant message
   * bodies through WorkflowMessageBody so step markers are stripped and
   * forwarded to the session rail.
   */
  workflowSessionId?: string;

  /**
   * Total step count for the active workflow session, hoisted from
   * `useWorkflowSession` in ChatConversation so per-message renderers do not
   * each subscribe to the workflow IPC (N+1 audit fix). `null` while the
   * session is loading or when there is no workflow.
   */
  workflowTotalSteps?: number | null;

  /**
   * Step-marker dispatcher hoisted from the same `useWorkflowSession`
   * subscription in ChatConversation. When non-null, per-message
   * `WorkflowMessageBody` instances forward parsed `<step>` markers through
   * this callback INSTEAD of mounting their own `useWorkflowSession` hook
   * (which would trigger N IPC fetches - one per assistant message).
   */
  workflowApplyStepMarker?:
    | ((stepN: number, status: StepStatus, source?: StepTransitionSource) => Promise<void>)
    | null;
}

/**
 * Conversation context - provides session-level info such as workspace path
 */
const ConversationContext = createContext<ConversationContextValue | null>(null);

/**
 * Conversation context provider
 */
export const ConversationProvider: React.FC<{
  children: React.ReactNode;
  value: ConversationContextValue;
}> = ({ children, value }) => {
  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

/**
 * Hook to use conversation context
 */
export const useConversationContext = (): ConversationContextValue => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversationContext must be used within ConversationProvider');
  }
  return context;
};

/**
 * Hook to safely use conversation context (returns null if not in provider)
 */
export const useConversationContextSafe = (): ConversationContextValue | null => {
  return useContext(ConversationContext);
};
