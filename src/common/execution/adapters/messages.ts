/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import type { ExecutionBackend } from '../types';

const isExecutionMessage = (message: TMessage): boolean =>
  message.type === 'activity' ||
  message.type === 'execution_evidence' ||
  message.type === 'plan' ||
  message.type === 'tool_group' ||
  message.type === 'acp_permission' ||
  message.type === 'acp_tool_call';

const isAcpExecutionMessage = (message: TMessage): boolean =>
  message.type === 'acp_permission' || message.type === 'acp_tool_call' || message.type === 'plan';

/** Prevent completed historical turns from being replayed into the active run. */
export function selectCurrentExecutionMessages(
  backend: ExecutionBackend,
  messages: readonly TMessage[]
): readonly TMessage[] {
  if (backend === 'acp') {
    // ACP deliberately reuses one session across conversation turns. The user
    // message is the authoritative turn boundary; sessionId cannot distinguish
    // an old completed tool from the plan for the new turn.
    const latestUserIndex = messages.findLastIndex(
      (message) => message.type === 'text' && message.position === 'right'
    );
    if (latestUserIndex >= 0) return messages.slice(latestUserIndex + 1).filter(isAcpExecutionMessage);

    // Defensive fallback for partial/replayed streams that omit user bubbles.
    // A latest plan starts the only current turn we can identify without
    // inventing authority from the reused ACP session identifier.
    const execution = messages.filter(isAcpExecutionMessage);
    const latestPlanIndex = execution.findLastIndex((message) => message.type === 'plan');
    return latestPlanIndex >= 0 ? execution.slice(latestPlanIndex) : execution;
  }

  if (backend === 'wcore') {
    const latestUserIndex = messages.findLastIndex(
      (message) => message.type === 'text' && message.position === 'right'
    );
    const withPolicy = (current: readonly TMessage[]): readonly TMessage[] => {
      const latestPolicy = messages.findLast(
        (message) => message.type === 'execution_evidence' && message.content.event.type === 'execution_policy'
      );
      return latestPolicy && !current.includes(latestPolicy) ? [latestPolicy, ...current] : current;
    };

    if (latestUserIndex >= 0) {
      return withPolicy(messages.slice(latestUserIndex + 1).filter(isExecutionMessage));
    }

    // No user bubble to slice on - the conversations corrupted by the merge bug
    // this packet fixes have none. The generic tail below splits on `activity`
    // messages, which a plain tool-running WCore turn never produces, so it
    // returned a single trailing message and rendered eleven steps as one.
    //
    // WCore stamps every message of a turn with that turn's id in `msg_id`, so
    // the turn is recoverable without the user bubble. Take the last execution
    // message's turn and keep only its own - returning everything would replay
    // completed historical turns, which is precisely what this function exists
    // to prevent (both cross-audit legs reproduced that).
    const unbounded = messages.filter(isExecutionMessage);
    if (!unbounded.some((message) => message.type === 'activity')) {
      // `execution_evidence` carries a synthetic `execution-evidence:<key>`
      // msg_id, not the turn's, so a receipt landing last would be picked as
      // the turn and empty the panel. Choose the turn from turn-stamped
      // messages only; evidence is re-attached by withPolicy.
      const turnStamped = unbounded.filter((message) => message.type !== 'execution_evidence');
      const latestTurn = turnStamped[turnStamped.length - 1]?.msg_id;
      // Fail closed when nothing carries a turn id: with no boundary at all,
      // showing the tail is wrong but bounded, whereas showing everything
      // replays history.
      return withPolicy(
        latestTurn ? unbounded.filter((message) => message.msg_id === latestTurn) : turnStamped.slice(-1)
      );
    }
  }

  const execution = messages.filter(isExecutionMessage);
  const latestActivityIndex = execution.findLastIndex((message) => message.type === 'activity');
  if (latestActivityIndex < 0) return execution.slice(-1);
  const previousActivityIndex = execution
    .slice(0, latestActivityIndex)
    .findLastIndex((message) => message.type === 'activity');
  return execution.slice(previousActivityIndex + 1);
}
