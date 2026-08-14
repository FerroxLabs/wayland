/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Acceptance test for the Phase-2b wiring fix. The 2b cross-audit (wf_6664cfc0)
 * found the headline feature was 100% dead: the only entry into concierge
 * proposal detection (processAgentResponse) is gated in every manager behind
 * hasCronCommands(), which is false for a [CONCIERGE_PROPOSE] block — so a
 * concierge-only turn never produced a card and leaked the raw tag.
 *
 * These tests pin BOTH halves of the fix:
 *  1. behavioral: a CONCIERGE_PROPOSE-only message routed through the middleware
 *     persists a concierge_propose message + broadcasts it + strips the raw tag.
 *  2. structural: each of the three managers gates the middleware call on
 *     hasConciergeProposals (so the wiring can't be silently dropped again).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TMessage } from '@/common/chat/chatLib';

const { addSpy, emitSpy, getMsgSpy, updateMsgSpy } = vi.hoisted(() => ({
  addSpy: vi.fn(),
  emitSpy: vi.fn(),
  getMsgSpy: vi.fn(),
  updateMsgSpy: vi.fn(),
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
  cronService: { listJobsByConversation: vi.fn(async () => []), addJob: vi.fn(), removeJob: vi.fn() },
}));
vi.mock('@process/services/database/export', () => ({
  getDatabase: vi.fn(async () => ({ getMessageByMsgId: getMsgSpy, updateMessage: updateMsgSpy })),
}));

import { processAgentResponse, processCronInMessage } from '@process/task/MessageMiddleware';

const PROPOSE_BLOCK =
  'Sure — here you go:\n[CONCIERGE_PROPOSE]\nkind: set_default_model\nengine: wcore\nmodel_id: m/x\nuse_model: x\nlabel: Model X\n[/CONCIERGE_PROPOSE]\nDone.';

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

describe('Concierge 2b middleware wiring (behavioral)', () => {
  beforeEach(() => {
    addSpy.mockClear();
    emitSpy.mockClear();
  });

  it('persists + broadcasts a concierge_propose message for a CONCIERGE_PROPOSE-only turn', async () => {
    const result = await processAgentResponse('c1', 'wcore', finishMsg(PROPOSE_BLOCK));

    // Persisted to the conversation DB so the bridge can find it on accept.
    expect(addSpy).toHaveBeenCalledTimes(1);
    const [, persisted] = addSpy.mock.calls[0];
    expect(persisted.type).toBe('concierge_propose');
    expect(persisted.content).toMatchObject({ kind: 'set_default_model', engine: 'wcore', status: 'pending' });

    // Broadcast so the renderer can render the card.
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'concierge_propose', conversation_id: 'c1' }));

    // The raw block is stripped from the display message.
    const displayText = (result.displayMessage?.content as { content?: string } | undefined)?.content ?? '';
    expect(displayText).not.toContain('[CONCIERGE_PROPOSE]');
    expect(displayText).toContain('Done.');
  });

  it('strips the raw tag even for a malformed block (no card, but no leak)', async () => {
    const malformed = '[CONCIERGE_PROPOSE]\nkind: set_default_model\nengine: bogus\n[/CONCIERGE_PROPOSE]';
    const result = await processAgentResponse('c1', 'wcore', finishMsg(`before ${malformed} after`));
    expect(addSpy).not.toHaveBeenCalled(); // invalid → no card
    const displayText = (result.displayMessage?.content as { content?: string } | undefined)?.content ?? '';
    expect(displayText).not.toContain('[CONCIERGE_PROPOSE]');
  });
});

describe('Concierge 2b persisted-text strip (no raw tag leaks into the saved bubble)', () => {
  beforeEach(() => {
    addSpy.mockClear();
    emitSpy.mockClear();
    getMsgSpy.mockReset();
    updateMsgSpy.mockReset();
  });

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

  it('overwrites the persisted turn row with stripped content (prose kept, tag gone)', async () => {
    // The streamed text row already holds the RAW block (what the manager persisted).
    getMsgSpy.mockReturnValue(rawRow(PROPOSE_BLOCK));

    await processCronInMessage('c1', 'wcore', finishMsg(PROPOSE_BLOCK), () => {});

    // Found the persisted row by msg_id and replaced it in place (not appended).
    expect(getMsgSpy).toHaveBeenCalledWith('c1', 'turn-1', 'text');
    expect(updateMsgSpy).toHaveBeenCalledTimes(1);
    const [rowId, updated] = updateMsgSpy.mock.calls[0];
    expect(rowId).toBe('row-1');

    const savedText = updated.content.content as string;
    expect(savedText).not.toContain('[CONCIERGE_PROPOSE]');
    expect(savedText).not.toContain('[/CONCIERGE_PROPOSE]');
    expect(savedText).toContain('Sure');
    expect(savedText).toContain('Done.');
  });

  it('does not touch the persisted row for a turn with no concierge block', async () => {
    getMsgSpy.mockReturnValue(rawRow('just a normal answer'));

    await processCronInMessage('c1', 'wcore', finishMsg('just a normal answer'), () => {});

    expect(updateMsgSpy).not.toHaveBeenCalled();
  });
});

describe('Concierge 2b manager gates (structural)', () => {
  it.each([
    'src/process/task/WCoreManager.ts',
    'src/process/task/GeminiAgentManager.ts',
    'src/process/task/AcpAgentManager.ts',
  ])('%s routes concierge proposals into the middleware (gate references hasConciergeProposals)', (rel) => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../../../', rel), 'utf-8');
    expect(src).toMatch(/import\s*\{\s*hasConciergeProposals\s*\}\s*from\s*'\.\/ConciergeProposeDetector'/);
    expect(src).toContain('hasConciergeProposals(');
  });
});
