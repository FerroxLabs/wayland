/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Regression test for the [CRON_PROPOSE] raw-markup leak, found by driving the
 * Smart Trader "schedule my morning report" arc live on Core 0.13.0: the
 * confirmation card rendered correctly, but the raw
 * `[CRON_PROPOSE] ... [/CRON_PROPOSE]` block sat above it in the chat bubble in
 * plain sight.
 *
 * Cause: `persistStrippedTurnText` — which overwrites the already-streamed raw
 * turn row with the stripped display text — existed and worked, but was gated on
 * `hasConciergeProposals()` alone. Cron blocks took the same leak path Concierge
 * used to and never got the same cleanup.
 *
 * These tests pin the cron half of that gate. The Concierge half is covered by
 * conciergeMiddlewareIntegration.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TMessage } from '@/common/chat/chatLib';
import { composeMessage, transformMessage } from '@/common/chat/chatLib';

const { addSpy, emitSpy, getMsgSpy, updateMsgSpy, addJobSpy } = vi.hoisted(() => ({
  addSpy: vi.fn(),
  emitSpy: vi.fn(),
  getMsgSpy: vi.fn(),
  updateMsgSpy: vi.fn(),
  addJobSpy: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: { conversation: { responseStream: { emit: emitSpy } } },
}));
vi.mock('@process/utils/message', () => ({
  addMessage: addSpy,
  addOrUpdateMessage: vi.fn(),
  // persistStrippedTurnText drains the write queue before reading the row back.
  // Omitting it here does not fail loudly: the call throws into that function's
  // best-effort catch and the strip silently no-ops, which is the very bug the
  // drain exists to fix.
  flushConversationMessages: vi.fn(async () => {}),
}));
vi.mock('@/common/utils', () => {
  let n = 0;
  return { uuid: () => `id-${++n}` };
});
vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: { listJobsByConversation: vi.fn(async () => []), addJob: addJobSpy, removeJob: vi.fn() },
}));
vi.mock('@process/services/database/export', () => ({
  getDatabase: vi.fn(async () => ({ getMessageByMsgId: getMsgSpy, updateMessage: updateMsgSpy })),
}));

import { processAgentResponse, processCronInMessage } from '@process/task/MessageMiddleware';

/** Shaped exactly like the block Smart Trader emitted in the live run. */
const PROPOSE_BLOCK = [
  "That's set at 8:00 AM, before the open, Monday through Friday.",
  '[CRON_PROPOSE]',
  'name: Weekday morning market report',
  'schedule: 0 8 * * 1-5',
  'schedule_description: Every weekday at 8:00 AM',
  'message: Run the morning report using the market-open-report skill.',
  '[/CRON_PROPOSE]',
  'Take a look at the card — you can edit the time or cancel.',
].join('\n');

function finishMsg(content: string): TMessage {
  return {
    id: 'turn-1',
    msg_id: 'turn-1',
    conversation_id: 'c1',
    type: 'text',
    position: 'left',
    content: { content },
    status: 'finish',
    createdAt: 0,
  } as TMessage;
}

function rawRow(content: string) {
  return {
    success: true as const,
    data: {
      id: 'row-1',
      msg_id: 'turn-1',
      conversation_id: 'c1',
      type: 'text' as const,
      position: 'left' as const,
      content: { content },
      status: 'finish' as const,
      createdAt: 0,
    },
  };
}

describe('[CRON_PROPOSE] persisted-text strip', () => {
  beforeEach(() => {
    addSpy.mockClear();
    emitSpy.mockClear();
    getMsgSpy.mockReset();
    updateMsgSpy.mockReset();
    addJobSpy.mockReset();
  });

  it('builds a stripped display message that keeps the prose and drops the markup', async () => {
    const result = await processAgentResponse('c1', 'wcore', finishMsg(PROPOSE_BLOCK));

    const displayText = (result.displayMessage?.content as { content?: string } | undefined)?.content ?? '';
    expect(displayText).not.toContain('[CRON_PROPOSE]');
    expect(displayText).not.toContain('[/CRON_PROPOSE]');
    expect(displayText).toContain('Monday through Friday');
    expect(displayText).toContain('Take a look at the card');
  });

  it('renders the confirmation card without creating the job (propose is not create)', async () => {
    await processAgentResponse('c1', 'wcore', finishMsg(PROPOSE_BLOCK));

    const proposeCards = addSpy.mock.calls.filter(([, m]) => m?.type === 'cron_propose');
    expect(proposeCards).toHaveLength(1);
    expect(proposeCards[0][1].content).toMatchObject({
      name: 'Weekday morning market report',
      schedule: '0 8 * * 1-5',
    });
    // The card is the ask; the row must not exist until the user clicks Yes.
    expect(addJobSpy).not.toHaveBeenCalled();
  });

  it('overwrites the persisted raw turn row so the markup never survives a reload', async () => {
    // What the manager already streamed + persisted: the RAW block.
    getMsgSpy.mockReturnValue(rawRow(PROPOSE_BLOCK));

    await processCronInMessage('c1', 'wcore', finishMsg(PROPOSE_BLOCK), () => {});

    expect(getMsgSpy).toHaveBeenCalledWith('c1', 'turn-1', 'text');
    expect(updateMsgSpy).toHaveBeenCalledTimes(1);

    const [rowId, updated] = updateMsgSpy.mock.calls[0];
    expect(rowId).toBe('row-1');

    const savedText = updated.content.content as string;
    expect(savedText).not.toContain('[CRON_PROPOSE]');
    expect(savedText).not.toContain('[/CRON_PROPOSE]');
    expect(savedText).toContain('Monday through Friday');
  });

  it('leaves an ordinary turn with no cron block untouched', async () => {
    getMsgSpy.mockReturnValue(rawRow('just a normal answer'));

    await processCronInMessage('c1', 'wcore', finishMsg('just a normal answer'), () => {});

    expect(updateMsgSpy).not.toHaveBeenCalled();
  });

  /**
   * The DB overwrite above only helps someone who reloads the conversation. The
   * person watching the turn land — the one the live demo is for — keeps seeing
   * the raw block, because the renderer already drew it from the stream and
   * nothing re-reads the row. These pin the broadcast that fixes that.
   */
  it('broadcasts the cleaned text so the already-rendered bubble is corrected', async () => {
    getMsgSpy.mockReturnValue(rawRow(PROPOSE_BLOCK));

    await processCronInMessage('c1', 'wcore', finishMsg(PROPOSE_BLOCK), () => {});

    const replaces = emitSpy.mock.calls.filter(([e]) => e?.type === 'content_replace');
    expect(replaces).toHaveLength(1);

    const event = replaces[0][0];
    expect(event.conversation_id).toBe('c1');
    expect(event.msg_id).toBe('turn-1');
    expect(event.data.content).not.toContain('[CRON_PROPOSE]');
    expect(event.data.content).toContain('Monday through Friday');
  });

  it('does not broadcast a correction for a turn that had nothing to strip', async () => {
    getMsgSpy.mockReturnValue(rawRow('just a normal answer'));

    await processCronInMessage('c1', 'wcore', finishMsg('just a normal answer'), () => {});

    expect(emitSpy.mock.calls.filter(([e]) => e?.type === 'content_replace')).toHaveLength(0);
  });

  it("never overwrites the user's own prompt, even when it is the only row that matches", async () => {
    // A msg_id names the TURN: WCore stamps the same one on the user's prompt
    // and the assistant's reply, and the DB lookup has no `position` clause. So
    // if the assistant row is not on disk yet, this lookup returns what the USER
    // TYPED - and overwriting it with the model's answer is unrecoverable. This
    // repo has shipped that exact bug once already.
    getMsgSpy.mockReturnValue({
      success: true as const,
      data: {
        id: 'row-user',
        msg_id: 'turn-1',
        conversation_id: 'c1',
        type: 'text' as const,
        position: 'right' as const,
        content: { content: 'schedule my morning report' },
        status: 'finish' as const,
        createdAt: 0,
      },
    });

    await processCronInMessage('c1', 'wcore', finishMsg(PROPOSE_BLOCK), () => {});

    expect(updateMsgSpy).not.toHaveBeenCalled();
    expect(emitSpy.mock.calls.filter(([e]) => e?.type === 'content_replace')).toHaveLength(0);
  });

  it('does not claim the text is clean when the DB write failed', async () => {
    // Broadcasting a correction the database rejected shows a fixed bubble over
    // a row that still holds the markup - it re-leaks on reload.
    getMsgSpy.mockReturnValue(rawRow(PROPOSE_BLOCK));
    updateMsgSpy.mockReturnValue({ success: false, error: 'disk full' });

    await processCronInMessage('c1', 'wcore', finishMsg(PROPOSE_BLOCK), () => {});

    expect(updateMsgSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy.mock.calls.filter(([e]) => e?.type === 'content_replace')).toHaveLength(0);
  });

  it('does not broadcast when the raw row cannot be found (nothing was persisted to correct)', async () => {
    getMsgSpy.mockReturnValue({ success: false as const, data: undefined });

    await processCronInMessage('c1', 'wcore', finishMsg(PROPOSE_BLOCK), () => {});

    expect(updateMsgSpy).not.toHaveBeenCalled();
    expect(emitSpy.mock.calls.filter(([e]) => e?.type === 'content_replace')).toHaveLength(0);
  });
});

/**
 * The renderer half. A `content_replace` frame has to survive two hops to reach
 * the bubble: transformMessage must mark it, and the merge must honour the mark
 * instead of appending it like every other text delta.
 */
describe('content_replace swaps the bubble instead of extending it', () => {
  const bubble = (content: string): TMessage =>
    ({
      id: 'row-1',
      msg_id: 'turn-1',
      conversation_id: 'c1',
      type: 'text',
      position: 'left',
      content: { content },
      createdAt: 0,
    }) as TMessage;

  it('marks the transformed message and renders it as the assistant', () => {
    const out = transformMessage({
      type: 'content_replace',
      conversation_id: 'c1',
      msg_id: 'turn-1',
      data: { content: 'clean prose' },
    });

    expect(out?.type).toBe('text');
    expect(out?.position).toBe('left');
    const outContent = out?.content as { content: string; replaceContent?: boolean } | undefined;
    expect(outContent?.content).toBe('clean prose');
    expect(outContent?.replaceContent).toBe(true);
  });

  it('replaces the accumulated text rather than concatenating', () => {
    const list = [bubble(`prose ${'[CRON_PROPOSE]'} raw ${'[/CRON_PROPOSE]'}`)];
    const merged = composeMessage(
      { ...bubble('prose'), content: { content: 'prose', replaceContent: true } } as TMessage,
      list
    );

    expect(merged).toHaveLength(1);
    expect((merged[0].content as { content: string }).content).toBe('prose');
  });

  it('does not persist the transport flag onto the merged message', () => {
    const merged = composeMessage(
      { ...bubble('prose'), content: { content: 'prose', replaceContent: true } } as TMessage,
      [bubble('raw')]
    );

    expect((merged[0].content as { replaceContent?: boolean }).replaceContent).toBeUndefined();
  });

  it("keeps the bubble's other content fields when it swaps the text", () => {
    // A `content_replace` frame carries the corrected TEXT and nothing else, so
    // substituting the whole content object drops everything the bubble already
    // had. The DB rewrite and the renderer's own merge both spread the existing
    // content first; this path has to agree with them, or a live bubble loses
    // fields that the stored row keeps and they diverge until reload.
    const existing = {
      ...bubble('raw'),
      content: {
        content: 'raw',
        cronMeta: { source: 'cron', cronJobId: 'j1', cronJobName: 'n', triggeredAt: 1 },
        truncatedDueToBudget: true,
      },
    } as TMessage;

    const merged = composeMessage(
      { ...bubble('clean'), content: { content: 'clean', replaceContent: true } } as TMessage,
      [existing]
    );

    const content = merged[0].content as Record<string, unknown>;
    expect(content.content).toBe('clean');
    expect(content.cronMeta).toEqual({ source: 'cron', cronJobId: 'j1', cronJobName: 'n', triggeredAt: 1 });
    expect(content.truncatedDueToBudget).toBe(true);
    expect(content.replaceContent).toBeUndefined();
  });

  it('still appends an ordinary delta — the replace path must not swallow streaming', () => {
    const merged = composeMessage({ ...bubble(' world') } as TMessage, [bubble('hello')]);

    expect((merged[0].content as { content: string }).content).toBe('hello world');
  });
});
