/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AcpSession feeds every `tool_call` / `tool_call_update` - the parent's and a
 * Fuigo sub-agent's - into PromptExecutor's in-flight tool tracking, which is
 * what keeps a long MCP call from tripping the idle prompt timeout. The
 * executor's timer behaviour is covered in PromptExecutor.toolTimeout.test.ts;
 * this pins the wiring and the configured ceiling.
 */
import type { SessionNotification } from '@agentclientprotocol/sdk';
import { describe, expect, it, vi } from 'vitest';
import { AcpSession } from '@process/acp/session/AcpSession';
import type { PromptExecutor } from '@process/acp/session/PromptExecutor';
import type { AgentConfig, ProtocolHandlers, SessionCallbacks } from '@process/acp/types';

const PARENT = 'parent-session';
const CHILD = 'child-session';

const agentConfig = {
  agentBackend: 'fuigo',
  agentSource: 'builtin',
  agentId: 'conv-1',
  cwd: process.cwd(),
} as AgentConfig;

function build(options?: { toolCallTimeoutMs?: number }) {
  const callbacks = {
    onMessage: vi.fn(),
    onSessionId: vi.fn(),
    onStatusChange: vi.fn(),
    onConfigUpdate: vi.fn(),
    onModelUpdate: vi.fn(),
    onModeUpdate: vi.fn(),
    onContextUsage: vi.fn(),
    onPermissionRequest: vi.fn(),
    onSignal: vi.fn(),
  } satisfies SessionCallbacks;
  const session = new AcpSession(agentConfig, () => ({}) as never, callbacks, options);
  const handlers = (session as unknown as { buildProtocolHandlers(): ProtocolHandlers }).buildProtocolHandlers();
  const executor = (session as unknown as { promptExecutor: PromptExecutor }).promptExecutor;
  const track = vi.spyOn(executor, 'trackToolCall');
  return { handlers, executor, track };
}

describe('AcpSession tool-call tracking', () => {
  it('reports the parent session tool call start and its terminal update', () => {
    const { handlers, track } = build();

    handlers.onSessionUpdate({
      sessionId: PARENT,
      update: { sessionUpdate: 'tool_call', toolCallId: 'tc-1', title: 'batch_run', status: 'pending' },
    } as SessionNotification);
    handlers.onSessionUpdate({
      sessionId: PARENT,
      update: { sessionUpdate: 'tool_call_update', toolCallId: 'tc-1', status: 'completed' },
    } as SessionNotification);
    handlers.onSessionUpdate({
      sessionId: PARENT,
      update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'done' } },
    } as SessionNotification);

    expect(track.mock.calls).toEqual([
      [`${PARENT}:tc-1`, 'batch_run', 'pending'],
      [`${PARENT}:tc-1`, undefined, 'completed'],
    ]);
  });

  it("reports a sub-agent's tool calls under the child session's key", () => {
    const { handlers, track } = build();
    handlers.onExtNotification!('_fuigo/session_notification', {
      sessionId: PARENT,
      update: {
        sessionUpdate: 'subagent_spawned',
        subagent_id: CHILD,
        parent_session_id: PARENT,
        child_session_id: CHILD,
        subagent_type: 'general-purpose',
        description: 'scan',
      },
    });

    handlers.onSessionUpdate({
      sessionId: CHILD,
      update: { sessionUpdate: 'tool_call', toolCallId: 'tc-1', title: 'batch_run' },
    } as SessionNotification);

    expect(track).toHaveBeenCalledWith(`${CHILD}:tc-1`, 'batch_run', undefined);
  });

  it('passes the configured tool-call ceiling to the executor', () => {
    const { executor } = build({ toolCallTimeoutMs: 60_000 });
    expect((executor as unknown as { toolCallTimeoutMs: number }).toolCallTimeoutMs).toBe(60_000);
    const defaults = build().executor as unknown as { toolCallTimeoutMs: number };
    expect(defaults.toolCallTimeoutMs).toBe(30 * 60_000);
  });
});
