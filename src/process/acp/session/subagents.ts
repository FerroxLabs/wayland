/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo sub-agents (the `Task` / `spawn_subagent` tool), over ACP.
 *
 * Wire shapes, captured from the staged 1.0.14 binary over stdio
 * (`fuigo-shell/.../extensions/notification.rs`, `agent/subagent/spawn.rs`):
 *
 * 1. Lifecycle rides the ext notification `fuigo/session_notification`
 *    (delivered by the SDK as `_fuigo/session_notification`) on the PARENT
 *    session, params `{ sessionId, update: { sessionUpdate, ...snake_case }, _meta }`:
 *      subagent_spawned  { subagent_id, child_session_id, parent_session_id,
 *                          subagent_type, description, model? }
 *      subagent_progress { subagent_id, tool_call_count, tokens_used, ... }  (~2s ticks)
 *      subagent_finished { subagent_id, status: completed|failed|cancelled,
 *                          error?, output?, tool_calls, turns, duration_ms }
 *    `subagent_spawned` is emitted BEFORE the child's first frame, by design.
 *
 * 2. The child's own activity is NOT tagged: its `agent_message_chunk`,
 *    `agent_thought_chunk`, `tool_call` and `tool_call_update` arrive as plain
 *    `session/update` frames on the same pipe with `sessionId = child_session_id`.
 *    Untouched, they splice the sub-agent's prose into the parent's bubble and
 *    render its tools as top-level cards.
 *
 * The tracker maps child session ids onto ONE `sub_agent` card per sub-agent
 * (merged by `msg_id = subagent_id` in composeMessage): the child's tool calls
 * become nested nodes, its streamed text the card body, and `subagent_finished`
 * settles the status and appends the final output when it was not streamed.
 */
import type { ActivityNode, IMessageSubAgent } from '@/common/chat/chatLib';
import { acpToolCallToNode } from '@/common/chat/activity/projectMessages';
import type { SessionNotification, ToolCallStatus } from '@agentclientprotocol/sdk';

export const FUIGO_SESSION_NOTIFICATION_METHOD = 'fuigo/session_notification';

export function isFuigoSessionNotificationMethod(method: string): boolean {
  return method === FUIGO_SESSION_NOTIFICATION_METHOD || method === `_${FUIGO_SESSION_NOTIFICATION_METHOD}`;
}

export type SubagentLifecycleUpdate =
  | {
      sessionUpdate: 'subagent_spawned';
      subagent_id: string;
      child_session_id: string;
      subagent_type?: string;
      description?: string;
    }
  | { sessionUpdate: 'subagent_progress'; subagent_id: string }
  | {
      sessionUpdate: 'subagent_finished';
      subagent_id: string;
      status?: string;
      error?: string | null;
      output?: string | null;
    };

/** The `subagent_*` update inside a `fuigo/session_notification`, or null for any other params. */
export function parseSubagentLifecycle(params: unknown): SubagentLifecycleUpdate | null {
  const update = (params as { update?: Record<string, unknown> } | null)?.update;
  if (!update || typeof update !== 'object' || typeof update.subagent_id !== 'string') return null;
  const kind = update.sessionUpdate;
  if (kind === 'subagent_spawned') {
    if (typeof update.child_session_id !== 'string') return null;
    return update as unknown as SubagentLifecycleUpdate;
  }
  if (kind === 'subagent_progress' || kind === 'subagent_finished') return update as unknown as SubagentLifecycleUpdate;
  return null;
}

type Card = IMessageSubAgent['content'];

type Tracked = { subagentId: string; agentName: string; body: string; toolStatus: Map<string, ToolCallStatus> };

const FINISHED_STATUS: Record<string, Card['status']> = { completed: 'done', failed: 'failed', cancelled: 'failed' };

export class SubagentTracker {
  private readonly bySubagent = new Map<string, Tracked>();
  private readonly byChildSession = new Map<string, Tracked>();

  constructor(private readonly conversationId: string) {}

  /** True when `sessionId` belongs to a sub-agent this tracker has seen spawn. */
  isChildSession(sessionId: string): boolean {
    return this.byChildSession.has(sessionId);
  }

  /** A `subagent_*` lifecycle update → the card delta to emit (null = nothing to show). */
  onLifecycle(update: SubagentLifecycleUpdate): IMessageSubAgent | null {
    if (update.sessionUpdate === 'subagent_spawned') {
      const agentName = update.description?.trim() || update.subagent_type || 'Sub-agent';
      const tracked: Tracked = { subagentId: update.subagent_id, agentName, body: '', toolStatus: new Map() };
      this.bySubagent.set(update.subagent_id, tracked);
      this.byChildSession.set(update.child_session_id, tracked);
      return this.card(tracked, 'running', '');
    }
    if (update.sessionUpdate === 'subagent_finished') {
      const tracked = this.bySubagent.get(update.subagent_id);
      if (!tracked) return null;
      const status = FINISHED_STATUS[update.status ?? ''] ?? 'done';
      // The output is normally streamed chunk by chunk as the child speaks; only
      // append it when the stream did not already carry it (a resumed child, a
      // child that produced it without prose).
      const output = update.output?.trim() ?? '';
      const parts: string[] = [];
      if (output && !tracked.body.trimEnd().endsWith(output)) parts.push(output);
      if (status === 'failed' && update.error) parts.push(update.error);
      let delta = '';
      for (const part of parts) delta += (tracked.body + delta ? '\n' : '') + part;
      tracked.body += delta;
      return this.card(tracked, status, delta);
    }
    return null;
  }

  /** A `session/update` frame on a child session → the card delta to emit (null = ignore). */
  onChildUpdate(notification: SessionNotification): IMessageSubAgent | null {
    const tracked = this.byChildSession.get(notification.sessionId);
    if (!tracked) return null;
    const update = notification.update;
    if (update.sessionUpdate === 'agent_message_chunk') {
      const text = update.content.type === 'text' ? update.content.text : '';
      if (!text) return null;
      tracked.body += text;
      return this.card(tracked, 'running', text);
    }
    if (update.sessionUpdate === 'tool_call' || update.sessionUpdate === 'tool_call_update') {
      const toolCallId = update.toolCallId;
      if (!toolCallId) return null;
      // An update without a status (Fuigo's title/rawInput refinement) keeps the node where it was.
      const status = update.status ?? tracked.toolStatus.get(toolCallId) ?? 'pending';
      tracked.toolStatus.set(toolCallId, status);
      const node = acpToolCallToNode({
        sessionId: notification.sessionId,
        update: { sessionUpdate: 'tool_call', toolCallId, status, title: update.title ?? '', kind: 'execute' },
      });
      const command = (update.rawInput as { command?: unknown } | null | undefined)?.command;
      if (typeof command === 'string' && command) node.command = command;
      return this.card(tracked, 'running', '', [node]);
    }
    return null;
  }

  private card(tracked: Tracked, status: Card['status'], body: string, nodes?: ActivityNode[]): IMessageSubAgent {
    return {
      id: tracked.subagentId,
      msg_id: tracked.subagentId,
      conversation_id: this.conversationId,
      type: 'sub_agent',
      position: 'left',
      status: status === 'running' ? 'work' : 'finish',
      content: {
        parentCallId: tracked.subagentId,
        agentName: tracked.agentName,
        status,
        body,
        ...(nodes ? { nodes } : {}),
      },
    };
  }
}
