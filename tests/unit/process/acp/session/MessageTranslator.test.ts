// tests/unit/process/acp/session/MessageTranslator.test.ts
import { describe, it, expect } from 'vitest';
import { MessageTranslator } from '@process/acp/session/MessageTranslator';
import type { SessionNotification } from '@agentclientprotocol/sdk';

describe('MessageTranslator', () => {
  it('translates agent_message_chunk to TMessage', () => {
    const translator = new MessageTranslator();
    const notification: SessionNotification = {
      sessionId: 'sess-1',
      update: {
        sessionUpdate: 'agent_message_chunk',
        messageId: 'msg-1',
        content: { type: 'text', text: 'Hello' },
      },
    };
    const messages = translator.translate(notification);
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0].type).toBeDefined();
  });

  it('accumulates chunks for same messageId', () => {
    const translator = new MessageTranslator();
    translator.translate({
      sessionId: 's1',
      update: {
        sessionUpdate: 'agent_message_chunk',
        messageId: 'm1',
        content: { type: 'text', text: 'Hello ' },
      },
    });
    const msgs = translator.translate({
      sessionId: 's1',
      update: {
        sessionUpdate: 'agent_message_chunk',
        messageId: 'm1',
        content: { type: 'text', text: 'world' },
      },
    });
    expect(msgs.length).toBeGreaterThanOrEqual(1);
  });

  it('translates tool_call to TMessage', () => {
    const translator = new MessageTranslator();
    const messages = translator.translate({
      sessionId: 's1',
      update: {
        sessionUpdate: 'tool_call',
        toolCallId: 'tc-1',
        title: 'read_file',
        rawInput: { path: '/foo' },
      },
    });
    expect(messages.length).toBeGreaterThanOrEqual(1);
  });

  it('onTurnEnd clears completed entries (INV-S-12)', () => {
    const translator = new MessageTranslator();
    translator.translate({
      sessionId: 's1',
      update: {
        sessionUpdate: 'agent_message_chunk',
        messageId: 'm1',
        content: { type: 'text', text: 'test' },
      },
    });
    expect(translator.activeEntryCount).toBeGreaterThan(0);
    translator.onTurnEnd();
    expect(translator.activeEntryCount).toBe(0);
  });

  it('reset clears all state', () => {
    const translator = new MessageTranslator();
    translator.translate({
      sessionId: 's1',
      update: {
        sessionUpdate: 'agent_message_chunk',
        messageId: 'm1',
        content: { type: 'text', text: 'test' },
      },
    });
    translator.reset();
    expect(translator.activeEntryCount).toBe(0);
  });

  it('returns empty array for config-type updates (handled by AcpSession directly)', () => {
    const translator = new MessageTranslator();
    const msgs = translator.translate({
      sessionId: 's1',
      update: { sessionUpdate: 'current_mode_update', currentModeId: 'code' },
    });
    expect(msgs).toEqual([]);
  });

  // Accumulate every emitted text delta the way the renderer does (append by
  // msg_id), so the test asserts on the final on-screen text per message.
  const renderText = (translator: MessageTranslator, chunks: Array<{ messageId?: string; text: string }>) => {
    const byId = new Map<string, string>();
    for (const c of chunks) {
      const msgs = translator.translate({
        sessionId: 's1',
        update: { sessionUpdate: 'agent_message_chunk', messageId: c.messageId, content: { type: 'text', text: c.text } },
      } as unknown as SessionNotification);
      for (const m of msgs) {
        if (m.type === 'text') {
          byId.set(m.msg_id ?? '', (byId.get(m.msg_id ?? '') ?? '') + (m.content as { content: string }).content);
        }
      }
    }
    return byId;
  };

  it('does not double text when undefined-id deltas are followed by the full text under a real messageId (regression: PongPong)', () => {
    const translator = new MessageTranslator();
    // claude-code-acp emits: a thought claims the messageId, deltas stream under
    // messageId=undefined, then the full text repeats under the real messageId.
    translator.translate({
      sessionId: 's1',
      update: { sessionUpdate: 'agent_thought_chunk', messageId: 'msg_real', content: { type: 'text', text: '' } },
    } as unknown as SessionNotification);
    const byId = renderText(translator, [
      { messageId: undefined, text: '' },
      { messageId: undefined, text: 'A' },
      { messageId: undefined, text: ' Notion server is now connecting.' },
      { messageId: 'msg_real', text: 'A Notion server is now connecting.' },
    ]);
    expect(Array.from(byId.values())).toEqual(['A Notion server is now connecting.']);
  });

  it('does not double a single-chunk reply repeated under a real messageId (Pong -> not PongPong)', () => {
    const translator = new MessageTranslator();
    const byId = renderText(translator, [
      { messageId: undefined, text: 'Pong' },
      { messageId: 'msg_real', text: 'Pong' },
    ]);
    expect(Array.from(byId.values())).toEqual(['Pong']);
  });

  it('still accumulates normal incremental deltas without dropping text', () => {
    const translator = new MessageTranslator();
    const byId = renderText(translator, [
      { messageId: 'm1', text: 'Hello ' },
      { messageId: 'm1', text: 'wor' },
      { messageId: 'm1', text: 'ld' },
    ]);
    expect(Array.from(byId.values())).toEqual(['Hello world']);
  });

  // ─── Safe-variant doubling dedup (#184: scenarios A / B / D + identical turns) ───

  // Sum ALL emitted text deltas (any msg_id) into the single visible string the
  // user sees for the assistant's reply.
  const visible = (
    translator: MessageTranslator,
    chunks: Array<{ kind?: 'text' | 'tool' | 'plan'; messageId?: string; text?: string }>
  ): string => {
    let out = '';
    for (const c of chunks) {
      let notif: SessionNotification;
      if (c.kind === 'tool') {
        notif = {
          sessionId: 's1',
          update: { sessionUpdate: 'tool_call', toolCallId: 'tc-x', title: 'run', rawInput: {} },
        } as unknown as SessionNotification;
      } else if (c.kind === 'plan') {
        notif = {
          sessionId: 's1',
          update: { sessionUpdate: 'plan', entries: [{ content: 'step', status: 'pending' }] },
        } as unknown as SessionNotification;
      } else {
        notif = {
          sessionId: 's1',
          update: {
            sessionUpdate: 'agent_message_chunk',
            messageId: c.messageId,
            content: { type: 'text', text: c.text ?? '' },
          },
        } as unknown as SessionNotification;
      }
      for (const m of translator.translate(notif)) {
        if (m.type === 'text') out += (m.content as { content: string }).content;
      }
    }
    return out;
  };

  it('Scenario A: turn-end wipe then late real-id full-text restate does not double', () => {
    const translator = new MessageTranslator();
    let out = visible(translator, [{ messageId: undefined, text: 'reply with exactly X' }]);
    translator.onTurnEnd();
    out += visible(translator, [{ messageId: 'msg_real', text: 'reply with exactly X' }]);
    expect(out).toBe('reply with exactly X');
  });

  it('Scenario B: Flux non-prefix restate of the full text does not double', () => {
    const translator = new MessageTranslator();
    const out = visible(translator, [
      { messageId: 'a', text: 'Done.' },
      { messageId: 'b', text: 'Done.' },
    ]);
    expect(out).toBe('Done.');
  });

  it('Scenario D: plan/tool clear then full-text restate does not double', () => {
    const translator = new MessageTranslator();
    const out = visible(translator, [
      { messageId: 'm1', text: 'Building the thing.' },
      { kind: 'plan' },
      { kind: 'tool' },
      { messageId: 'm2', text: 'Building the thing.' },
    ]);
    expect(out).toBe('Building the thing.');
  });

  it('Safe-variant: two separate identical user-prompt turns BOTH emit', () => {
    const translator = new MessageTranslator();
    translator.onTurnStart();
    const out1 = visible(translator, [{ messageId: 'm1', text: 'X' }]);
    translator.onTurnEnd();
    translator.onTurnStart();
    const out2 = visible(translator, [{ messageId: 'm2', text: 'X' }]);
    translator.onTurnEnd();
    expect(out1).toBe('X');
    expect(out2).toBe('X');
  });

  // ─── Plan/todo card stability (regression: stacked "To do list" cards) ───

  // Return the msg_id emitted for one plan/TodoWrite update.
  const planMsgId = (translator: MessageTranslator, entries: Array<{ content: string; status: string }>): string => {
    const msgs = translator.translate({
      sessionId: 's1',
      update: { sessionUpdate: 'plan', entries },
    } as unknown as SessionNotification);
    return msgs.find((m) => m.type === 'plan')?.msg_id ?? '';
  };

  it('reuses one msg_id across evolving plan updates within a turn (no stacked todo cards)', () => {
    const translator = new MessageTranslator();
    translator.onTurnStart();
    const id1 = planMsgId(translator, [{ content: 'a', status: 'pending' }]);
    // A tool_call between plan updates clears messageMap — it must NOT orphan the
    // plan id (that orphaning was the doubling bug). The next plan update has to
    // reuse the same id so the renderer merges, not stacks.
    translator.translate({
      sessionId: 's1',
      update: { sessionUpdate: 'tool_call', toolCallId: 'tc-1', title: 'TodoWrite', rawInput: {} },
    } as unknown as SessionNotification);
    const id2 = planMsgId(translator, [
      { content: 'a', status: 'completed' },
      { content: 'b', status: 'in_progress' },
    ]);
    const id3 = planMsgId(translator, [
      { content: 'a', status: 'completed' },
      { content: 'b', status: 'completed' },
      { content: 'c', status: 'pending' },
    ]);
    expect(id1).toBeTruthy();
    expect(id2).toBe(id1);
    expect(id3).toBe(id1);
  });

  it('starts a fresh plan card id on a new turn', () => {
    const translator = new MessageTranslator();
    translator.onTurnStart();
    const id1 = planMsgId(translator, [{ content: 'a', status: 'pending' }]);
    translator.onTurnEnd();
    translator.onTurnStart();
    const id2 = planMsgId(translator, [{ content: 'a', status: 'pending' }]);
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id2).not.toBe(id1);
  });
});
