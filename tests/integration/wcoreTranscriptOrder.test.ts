/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { composeMessage, transformMessage, type TMessage } from '@/common/chat/chatLib';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { WCoreAgent, type WCoreAgentOptions } from '@/process/agent/wcore';
import type { WCoreEvent } from '@/process/agent/wcore/protocol';
import { DesktopCoreV1Consumer } from '@/process/agent/wcore/desktopContractV1';
import { buildMessageIndex, composeMessageWithIndex } from '@/renderer/pages/conversation/Messages/hooks';

const conversationId = 'captured-order-conversation';
const capturedLines = readFileSync(
  path.resolve(process.cwd(), 'tests/fixtures/wcore/transcript-order-v0.13.12.jsonl'),
  'utf8'
)
  .trim()
  .split('\n');

function mapEvents(events: WCoreEvent[]): TMessage[] {
  const stream: Array<Omit<IResponseMessage, 'conversation_id'>> = [];
  const agent = new WCoreAgent({
    workspace: '/tmp/wcore-transcript-order',
    model: {} as never,
    onStreamEvent: (event) => stream.push(event as Omit<IResponseMessage, 'conversation_id'>),
  } as WCoreAgentOptions);
  const feed = (agent as unknown as { handleEvent: (event: WCoreEvent) => void }).handleEvent.bind(agent);
  events.forEach(feed);
  return stream.flatMap((event) => {
    const transformed = transformMessage({ ...event, conversation_id: conversationId });
    return transformed ? [transformed] : [];
  });
}

function mappedMessages(): TMessage[] {
  const consumer = new DesktopCoreV1Consumer();
  const events: WCoreEvent[] = [];
  for (const line of capturedLines) {
    const result = consumer.consumeLine(line);
    if (result.kind === 'event') events.push(result.event);
  }
  return mapEvents(events);
}

function describeOrder(messages: TMessage[]): string[] {
  return messages.flatMap((message) => {
    if (message.type === 'text') return [`text:${message.content.content}`];
    if (message.type === 'tool_group') {
      return message.content.map((tool) => `tool:${tool.callId}:${tool.status}`);
    }
    return [];
  });
}

const expectedOrder = [
  'text:A-before-first-tool. ',
  'tool:call-order-one:Success',
  'text:B-between-tools. ',
  'tool:call-order-two:Success',
  'text:C-final-answer.',
];

describe('captured WCore transcript ordering (#1224)', () => {
  it('concatenates adjacent deltas within one prose segment without adding whitespace', () => {
    const messages = mapEvents([
      { type: 'stream_start', msg_id: 'adjacent-turn' },
      { type: 'text_delta', msg_id: 'adjacent-turn', text: 'Hel' },
      { type: 'text_delta', msg_id: 'adjacent-turn', text: 'lo' },
    ]);
    const textMessages = messages.filter((message) => message.type === 'text');
    expect(new Set(textMessages.map((message) => message.segment_id)).size).toBe(1);
    const composed = messages.reduce<TMessage[]>((list, message) => composeMessage(message, list), []);
    expect(describeOrder(composed)).toEqual(['text:Hello']);
  });

  it('preserves frame order through the shared persistence composer', () => {
    const composed = mappedMessages().reduce<TMessage[]>((list, message) => composeMessage(message, list), []);
    expect(describeOrder(composed)).toEqual(expectedOrder);
  });

  it('preserves frame order through the indexed renderer composer', () => {
    const index = buildMessageIndex([]);
    const composed = mappedMessages().reduce<TMessage[]>(
      (list, message) => composeMessageWithIndex(message, list, index),
      []
    );
    expect(describeOrder(composed)).toEqual(expectedOrder);
  });
});
