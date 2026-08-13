/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The LIVE conversation merge, which is the one the user actually sees.
 *
 * `content_replace` is honoured in TWO places: chatLib's `composeMessage` and
 * `composeMessageWithIndex` here. Only the first had tests, and this is the one
 * the running app uses — so the `replaceContent` ternary could have been deleted
 * with the whole suite still green and the user-visible fix silently dead.
 *
 * Worse, `hooks.ts` contains literal NUL bytes (index-key separators), so git
 * classifies it BINARY: the change is invisible in `git diff` and in any PR
 * review. Neither a reviewer nor CI would have caught the regression. These
 * tests are the only thing standing under that path.
 */
import { describe, expect, it } from 'vitest';
import type { TMessage } from '@/common/chat/chatLib';
import { buildMessageIndex, composeMessageWithIndex } from '@renderer/pages/conversation/Messages/hooks';

const assistant = (content: string, extra: Record<string, unknown> = {}): TMessage =>
  ({
    id: 'row-1',
    msg_id: 'turn-1',
    conversation_id: 'c1',
    type: 'text',
    position: 'left',
    content: { content, ...extra },
  }) as TMessage;

/** What main broadcasts once it has stripped the markup. */
const replacement = (content: string): TMessage =>
  ({
    id: 'new-id',
    msg_id: 'turn-1',
    conversation_id: 'c1',
    type: 'text',
    position: 'left',
    content: { content, replaceContent: true },
  }) as TMessage;

describe('composeMessageWithIndex — the live conversation merge', () => {
  it('replaces the rendered bubble instead of appending to it', () => {
    const raw = 'prose [CRON_PROPOSE] name: x [/CRON_PROPOSE] tail';
    const list = [assistant(raw)];
    const merged = composeMessageWithIndex(replacement('prose tail'), list, buildMessageIndex(list));

    expect(merged).toHaveLength(1);
    expect((merged[0].content as { content: string }).content).toBe('prose tail');
    // The whole point: the markup is gone, not appended to.
    expect((merged[0].content as { content: string }).content).not.toContain('[CRON_PROPOSE]');
  });

  it('still appends an ordinary streaming delta', () => {
    // The guard against "fixing" the replace path by breaking streaming.
    const list = [assistant('hello')];
    const merged = composeMessageWithIndex(assistant(' world'), list, buildMessageIndex(list));

    expect((merged[0].content as { content: string }).content).toBe('hello world');
  });

  it("keeps the bubble's other content fields when swapping the text", () => {
    const list = [assistant('raw', { cronMeta: { source: 'cron' }, truncatedDueToBudget: true })];
    const merged = composeMessageWithIndex(replacement('clean'), list, buildMessageIndex(list));

    const content = merged[0].content as Record<string, unknown>;
    expect(content.content).toBe('clean');
    expect(content.cronMeta).toEqual({ source: 'cron' });
    expect(content.truncatedDueToBudget).toBe(true);
  });

  it("cannot rewrite the USER's message even when it shares the turn id", () => {
    // A msg_id names the TURN, so the user's prompt carries the same one. The
    // index is keyed on position too; if that ever stopped being true, a
    // correction aimed at the reply would land on what the user typed.
    const userMsg = {
      id: 'row-user',
      msg_id: 'turn-1',
      conversation_id: 'c1',
      type: 'text',
      position: 'right',
      content: { content: 'schedule my morning report' },
    } as TMessage;

    const list = [userMsg];
    const merged = composeMessageWithIndex(replacement('assistant prose'), list, buildMessageIndex(list));

    expect((merged[0].content as { content: string }).content).toBe('schedule my morning report');
    // It opens its own bubble rather than overwriting theirs.
    expect(merged).toHaveLength(2);
  });
});
