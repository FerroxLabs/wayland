/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AcpSession routing for a Fuigo sub-agent: the `_fuigo/session_notification`
 * ext notification opens the card, and every later `session/update` carrying
 * the child's session id lands on that card instead of the parent's
 * transcript (text bubble, top-level tool card, ConfigTracker).
 */
import type { SessionNotification } from '@agentclientprotocol/sdk';
import { describe, expect, it, vi } from 'vitest';
import type { TMessage } from '@/common/chat/chatLib';
import { AcpSession } from '@process/acp/session/AcpSession';
import type { AgentConfig, ProtocolHandlers, SessionCallbacks } from '@process/acp/types';

const PARENT = 'parent-session';
const CHILD = 'child-session';

const agentConfig: AgentConfig = {
  agentBackend: 'fuigo',
  agentSource: 'builtin',
  agentId: 'conv-1',
  cwd: process.cwd(),
} as AgentConfig;

const text = (sessionId: string, t: string): SessionNotification => ({
  sessionId,
  update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: t } },
});

function build() {
  const messages: TMessage[] = [];
  const callbacks = {
    onMessage: (m: TMessage) => messages.push(m),
    onSessionId: vi.fn(),
    onStatusChange: vi.fn(),
    onConfigUpdate: vi.fn(),
    onModelUpdate: vi.fn(),
    onModeUpdate: vi.fn(),
    onContextUsage: vi.fn(),
    onPermissionRequest: vi.fn(),
    onSignal: vi.fn(),
  } satisfies SessionCallbacks;
  const session = new AcpSession(agentConfig, () => ({}) as never, callbacks);
  const handlers = (session as unknown as { buildProtocolHandlers(): ProtocolHandlers }).buildProtocolHandlers();
  return { messages, callbacks, handlers };
}

describe('AcpSession sub-agent routing', () => {
  it('folds the child session into a sub_agent card and keeps the parent transcript clean', () => {
    const { messages, callbacks, handlers } = build();

    handlers.onSessionUpdate(text(PARENT, "I'll spawn the sub-agent now."));
    handlers.onExtNotification!('_fuigo/session_notification', {
      sessionId: PARENT,
      update: {
        sessionUpdate: 'subagent_spawned',
        subagent_id: CHILD,
        parent_session_id: PARENT,
        child_session_id: CHILD,
        subagent_type: 'general-purpose',
        description: 'Count files under ./src',
      },
    });
    handlers.onSessionUpdate(text(CHILD, 'Counting...'));
    handlers.onSessionUpdate({
      sessionId: CHILD,
      update: { sessionUpdate: 'tool_call', toolCallId: 'tc-child', title: 'run_terminal_command' },
    });
    handlers.onSessionUpdate({
      sessionId: CHILD,
      update: {
        sessionUpdate: 'available_commands_update',
        availableCommands: [{ name: 'child-only', description: '' }],
      },
    });
    handlers.onExtNotification!('_fuigo/session_notification', {
      sessionId: PARENT,
      update: {
        sessionUpdate: 'subagent_finished',
        subagent_id: CHILD,
        child_session_id: CHILD,
        status: 'completed',
        output: '3',
      },
    });
    handlers.onSessionUpdate(text(PARENT, 'Sub-agent result: 3 files.'));

    const types = messages.map((m) => `${m.type}:${m.type === 'text' ? m.content.content : m.msg_id}`);
    expect(types).toEqual([
      "text:I'll spawn the sub-agent now.",
      `sub_agent:${CHILD}`,
      `sub_agent:${CHILD}`,
      `sub_agent:${CHILD}`,
      `sub_agent:${CHILD}`,
      'text:Sub-agent result: 3 files.',
    ]);
    // The child's command list never reached the parent's ConfigTracker.
    expect(callbacks.onConfigUpdate).not.toHaveBeenCalled();
  });

  it('ignores other Fuigo ext notifications and unknown sessions untouched', () => {
    const { messages, handlers } = build();
    handlers.onExtNotification!('_fuigo/session_notification', {
      sessionId: PARENT,
      update: { sessionUpdate: 'model_changed', model_id: 'flux-fast' },
    });
    handlers.onExtNotification!('_fuigo/queue/changed', { sessionId: PARENT, entries: [] });
    expect(messages).toEqual([]);
    // A session no subagent_spawned announced is still the parent's transcript (pre-existing behaviour).
    handlers.onSessionUpdate(text('stranger', 'hi'));
    expect(messages.map((m) => m.type)).toEqual(['text']);
  });
});
