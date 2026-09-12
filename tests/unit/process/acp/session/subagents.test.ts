/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo sub-agent frames → ONE `sub_agent` card. The sequence below is the
 * stdio capture from the staged 1.0.14 binary (`spawn_subagent` with
 * subagent_type general-purpose, one `run_terminal_command` inside), ids and
 * field names verbatim, text chunks coalesced.
 */
import type { SessionNotification } from '@agentclientprotocol/sdk';
import { describe, expect, it } from 'vitest';
import { composeMessage, transformMessage, type IMessageSubAgent, type TMessage } from '@/common/chat/chatLib';
import { toResponseMessage } from '@process/acp/compat/typeBridge';
import {
  isFuigoSessionNotificationMethod,
  parseSubagentLifecycle,
  SubagentTracker,
} from '@process/acp/session/subagents';

const PARENT = '01a0951f-7dc7-7362-970a-35ef058e614d';
const CHILD = '01a0951f-8daa-74a1-ae92-c661d239426c';
const TOOL = 'call_00_ET_metW0GC3yrUbob0QcV7K5433';

const spawned = {
  sessionId: PARENT,
  update: {
    sessionUpdate: 'subagent_spawned',
    subagent_id: CHILD,
    parent_session_id: PARENT,
    parent_prompt_id: 'a64fafdd-8b5f-40e8-aa3c-896085c22b50',
    child_session_id: CHILD,
    subagent_type: 'general-purpose',
    description: 'Count files under ./src',
    effective_context_source: 'new',
    model: 'flux-fast',
  },
  _meta: { eventId: `${PARENT}-14`, agentTimestampMs: 1789208268209 },
};

const progress = {
  sessionId: PARENT,
  update: {
    sessionUpdate: 'subagent_progress',
    subagent_id: CHILD,
    parent_session_id: PARENT,
    child_session_id: CHILD,
    duration_ms: 4080,
    turn_count: 1,
    tool_call_count: 1,
    tokens_used: 8841,
    context_window_tokens: 128000,
    context_usage_pct: 6,
    tools_used: ['run_terminal_command'],
    error_count: 0,
  },
};

const OUTPUT = 'Command run: `find ./src -type f | wc -l` → file count: **3**.';

const finished = {
  sessionId: PARENT,
  update: {
    sessionUpdate: 'subagent_finished',
    subagent_id: CHILD,
    child_session_id: CHILD,
    status: 'completed',
    tool_calls: 1,
    turns: 1,
    duration_ms: 5048,
    tokens_used: 8927,
    output: OUTPUT,
    will_wake: false,
  },
  _meta: { eventId: `${PARENT}-102`, agentTimestampMs: 1789208273281 },
};

const text = (sessionId: string, t: string): SessionNotification => ({
  sessionId,
  update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: t } },
});

const childFrames: SessionNotification[] = [
  text(CHILD, "I'll check whether `./src` exists and count its files."),
  { sessionId: CHILD, update: { sessionUpdate: 'tool_call', toolCallId: TOOL, title: 'run_terminal_command' } },
  {
    sessionId: CHILD,
    update: {
      sessionUpdate: 'tool_call_update',
      toolCallId: TOOL,
      title: 'Execute `find ./src -type f | wc -l`',
      kind: 'execute',
      rawInput: {
        variant: 'Bash',
        command: 'find ./src -type f | wc -l',
        description: 'Count files',
        is_background: false,
      },
      content: [{ type: 'content', content: { type: 'text', text: 'Count files' } }],
    },
  },
  {
    sessionId: CHILD,
    update: {
      sessionUpdate: 'tool_call_update',
      toolCallId: TOOL,
      status: 'in_progress',
      content: [{ type: 'content', content: { type: 'text', text: '       3\n' } }],
    },
  },
  {
    sessionId: CHILD,
    update: {
      sessionUpdate: 'tool_call_update',
      toolCallId: TOOL,
      status: 'completed',
      content: [{ type: 'content', content: { type: 'text', text: '       3\n' } }],
    },
  },
  text(CHILD, OUTPUT),
];

/** Fold deltas the way the DB writer and the renderer do. */
const fold = (deltas: TMessage[]): TMessage[] => deltas.reduce<TMessage[]>((list, m) => composeMessage(m, list), []);

describe('fuigo/session_notification parsing', () => {
  it('matches the method with and without the SDK ext prefix', () => {
    expect(isFuigoSessionNotificationMethod('_fuigo/session_notification')).toBe(true);
    expect(isFuigoSessionNotificationMethod('fuigo/session_notification')).toBe(true);
    expect(isFuigoSessionNotificationMethod('_fuigo/queue/changed')).toBe(false);
  });

  it('accepts the three subagent_* updates and nothing else on that channel', () => {
    expect(parseSubagentLifecycle(spawned)?.sessionUpdate).toBe('subagent_spawned');
    expect(parseSubagentLifecycle(progress)?.sessionUpdate).toBe('subagent_progress');
    expect(parseSubagentLifecycle(finished)?.sessionUpdate).toBe('subagent_finished');
    expect(
      parseSubagentLifecycle({ sessionId: PARENT, update: { sessionUpdate: 'model_changed', model_id: 'x' } })
    ).toBeNull();
    expect(
      parseSubagentLifecycle({ sessionId: PARENT, update: { sessionUpdate: 'subagent_spawned', subagent_id: 'a' } })
    ).toBeNull();
    expect(parseSubagentLifecycle(null)).toBeNull();
  });
});

describe('SubagentTracker', () => {
  const run = () => {
    const tracker = new SubagentTracker('conv-1');
    const deltas: TMessage[] = [];
    const push = (m: IMessageSubAgent | null) => m && deltas.push(m);
    push(tracker.onLifecycle(parseSubagentLifecycle(spawned)!));
    for (const frame of childFrames.slice(0, 3)) push(tracker.onChildUpdate(frame));
    push(tracker.onLifecycle(parseSubagentLifecycle(progress)!));
    for (const frame of childFrames.slice(3)) push(tracker.onChildUpdate(frame));
    push(tracker.onLifecycle(parseSubagentLifecycle(finished)!));
    return { tracker, deltas };
  };

  it('knows the child session only after subagent_spawned', () => {
    const tracker = new SubagentTracker('conv-1');
    expect(tracker.isChildSession(CHILD)).toBe(false);
    expect(tracker.onChildUpdate(childFrames[0])).toBeNull();
    tracker.onLifecycle(parseSubagentLifecycle(spawned)!);
    expect(tracker.isChildSession(CHILD)).toBe(true);
    expect(tracker.isChildSession(PARENT)).toBe(false);
  });

  it('folds the captured sequence into one card: description, nested tool, streamed text, done', () => {
    const { deltas } = run();
    // spawned + text + tool_call + 3 updates + text + finished; the progress tick shows nothing.
    expect(deltas).toHaveLength(8);
    expect(deltas.every((m) => m.type === 'sub_agent' && m.msg_id === CHILD)).toBe(true);

    const cards = fold(deltas);
    expect(cards).toHaveLength(1);
    const card = cards[0] as IMessageSubAgent;
    expect(card.content).toEqual({
      parentCallId: CHILD,
      agentName: 'Count files under ./src',
      status: 'done',
      body: `I'll check whether \`./src\` exists and count its files.${OUTPUT}`,
      nodes: [
        {
          id: TOOL,
          kind: 'tool',
          callId: TOOL,
          name: 'Execute `find ./src -type f | wc -l`',
          status: 'done',
          command: 'find ./src -type f | wc -l',
        },
      ],
    });
  });

  it('is running until subagent_finished, and a status-less tool update does not regress the node', () => {
    const { deltas } = run();
    const beforeFinish = fold(deltas.slice(0, -1))[0] as IMessageSubAgent;
    expect(beforeFinish.content.status).toBe('running');
    expect(beforeFinish.content.nodes?.[0].status).toBe('done');
    // The title-only refinement after tool_call carried no status: still running, not "done".
    const afterRefinement = fold(deltas.slice(0, 4))[0] as IMessageSubAgent;
    expect(afterRefinement.content.nodes?.[0]).toMatchObject({
      status: 'running',
      name: 'Execute `find ./src -type f | wc -l`',
    });
  });

  it('appends the final output only when the stream did not already carry it', () => {
    const tracker = new SubagentTracker('conv-1');
    tracker.onLifecycle(parseSubagentLifecycle(spawned)!);
    tracker.onChildUpdate(text(CHILD, 'Looking...'));
    const done = tracker.onLifecycle(parseSubagentLifecycle(finished)!)!;
    expect(done.content.body).toBe(`\n${OUTPUT}`);
    expect(done.status).toBe('finish');
  });

  it('maps failed and cancelled to a failed card carrying the error', () => {
    for (const status of ['failed', 'cancelled']) {
      const tracker = new SubagentTracker('conv-1');
      tracker.onLifecycle(parseSubagentLifecycle(spawned)!);
      const failed = tracker.onLifecycle({
        sessionUpdate: 'subagent_finished',
        subagent_id: CHILD,
        status,
        error: 'context window exhausted',
      })!;
      expect(failed.content.status).toBe('failed');
      expect(failed.content.body).toBe('context window exhausted');
    }
  });

  it('ignores the child thoughts, commands and config frames', () => {
    const tracker = new SubagentTracker('conv-1');
    tracker.onLifecycle(parseSubagentLifecycle(spawned)!);
    const thought: SessionNotification = {
      sessionId: CHILD,
      update: { sessionUpdate: 'agent_thought_chunk', content: { type: 'text', text: 'hmm' } },
    };
    const commands: SessionNotification = {
      sessionId: CHILD,
      update: { sessionUpdate: 'available_commands_update', availableCommands: [] },
    };
    expect(tracker.onChildUpdate(thought)).toBeNull();
    expect(tracker.onChildUpdate(commands)).toBeNull();
  });
});

describe('sub_agent card through the compat bridge', () => {
  it('survives toResponseMessage → transformMessage with its merge key', () => {
    const tracker = new SubagentTracker('conv-1');
    const delta = tracker.onLifecycle(parseSubagentLifecycle(spawned)!)!;
    const wire = toResponseMessage(delta, 'conv-1');
    expect(wire.type).toBe('sub_agent');
    const back = transformMessage(wire);
    expect(back).toMatchObject({ type: 'sub_agent', msg_id: CHILD, position: 'left', content: delta.content });
  });
});
