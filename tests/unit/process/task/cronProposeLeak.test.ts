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
vi.mock('@process/utils/message', () => ({ addMessage: addSpy, addOrUpdateMessage: vi.fn() }));
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
});
