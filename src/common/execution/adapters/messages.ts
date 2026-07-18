/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import type { ExecutionBackend } from '../types';

const isExecutionMessage = (message: TMessage): boolean =>
  message.type === 'activity' ||
  message.type === 'plan' ||
  message.type === 'tool_group' ||
  message.type === 'acp_permission' ||
  message.type === 'acp_tool_call';

function acpSessionId(message: TMessage): string | undefined {
  if (message.type === 'acp_permission' || message.type === 'acp_tool_call' || message.type === 'plan') {
    return message.content.sessionId;
  }
  return undefined;
}

/** Prevent completed historical turns from being replayed into the active run. */
export function selectCurrentExecutionMessages(
  backend: ExecutionBackend,
  messages: readonly TMessage[]
): readonly TMessage[] {
  if (backend === 'acp') {
    const sessionId = messages.toReversed().map(acpSessionId).find(Boolean);
    return sessionId ? messages.filter((message) => acpSessionId(message) === sessionId) : [];
  }

  const execution = messages.filter(isExecutionMessage);
  const latestActivityIndex = execution.findLastIndex((message) => message.type === 'activity');
  if (latestActivityIndex < 0) return execution.slice(-1);
  const previousActivityIndex = execution
    .slice(0, latestActivityIndex)
    .findLastIndex((message) => message.type === 'activity');
  return execution.slice(previousActivityIndex + 1);
}
