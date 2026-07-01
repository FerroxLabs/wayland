/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// #504: AskUserQuestion confirmation mapping + answer channel.
//
// The engine (wayland-core ask_user_question.rs) still tags AskUserQuestion as
// the `info` ToolCategory, so before this fix its args were JSON.stringify'd
// into the generic `info` prompt and the dialog rendered blank. These tests
// pin the mapping that turns an AskUserQuestion tool_request into a structured
// `question` confirmation, plus the answer-encoding helpers that thread the
// chosen label back through `tool_approve.answer`.

import { describe, it, expect } from 'vitest';
import { buildAskUserConfirmation } from '@process/agent/wcore';
import { encodeAskUserAnswer, decodeAskUserAnswer, ASK_USER_ANSWER_PREFIX } from '@/common/chat/chatLib';

describe('buildAskUserConfirmation (#504 mapping)', () => {
  it('maps a well-formed AskUserQuestion payload to a question confirmation', () => {
    const detail = buildAskUserConfirmation({
      description: 'ask_user: Pick a backend',
      args: {
        question: 'Which backend should I use?',
        header: 'Backend selection',
        multiSelect: false,
        options: [
          { label: 'Anthropic', description: 'Claude models' },
          { label: 'OpenAI', description: 'GPT models', preview: 'gpt-4o' },
        ],
      },
    });

    expect(detail.type).toBe('question');
    expect(detail.question).toBe('Which backend should I use?');
    expect(detail.header).toBe('Backend selection');
    expect(detail.title).toBe('Backend selection'); // header wins for the title
    // multiSelect is intentionally NOT carried (single-answer only; see mapping doc).
    expect('multiSelect' in detail).toBe(false);
    expect(detail.options).toEqual([
      { label: 'Anthropic', description: 'Claude models' },
      { label: 'OpenAI', description: 'GPT models', preview: 'gpt-4o' },
    ]);
  });

  it('falls back to the tool description when question is missing, and drops header', () => {
    const detail = buildAskUserConfirmation({
      description: 'ask_user: fallback title',
      args: { options: [{ label: 'Yes', description: '' }] },
    });
    expect(detail.question).toBe('ask_user: fallback title');
    expect(detail.header).toBeUndefined();
    expect(detail.title).toBe('ask_user: fallback title');
    expect(detail.options).toEqual([{ label: 'Yes', description: '' }]);
  });

  it('is defensive against malformed options (non-array, missing/blank labels)', () => {
    const nonArray = buildAskUserConfirmation({
      description: 'q',
      args: { question: 'Q', options: 'not-an-array' },
    });
    expect(nonArray.options).toEqual([]);

    const partial = buildAskUserConfirmation({
      description: 'q',
      args: {
        question: 'Q',
        options: [
          { label: 'Keep', description: 'ok' },
          { label: '', description: 'dropped-empty-label' },
          { description: 'dropped-no-label' },
          null,
          'garbage',
        ],
      },
    });
    // Only the one entry with a non-empty string label survives.
    expect(partial.options).toEqual([{ label: 'Keep', description: 'ok' }]);
  });

  it('does not carry the engine multiSelect hint (single-answer only)', () => {
    // Even when the engine sends multiSelect:true, the confirmation stays
    // single-answer — the answer channel is a single string.
    const detail = buildAskUserConfirmation({
      description: 'q',
      args: { question: 'Q', multiSelect: true, options: [{ label: 'A', description: 'a' }] },
    });
    expect('multiSelect' in detail).toBe(false);
  });
});

describe('ask_user answer encoding (#504 answer channel)', () => {
  it('round-trips a chosen label through encode/decode', () => {
    const encoded = encodeAskUserAnswer('Use Anthropic');
    expect(encoded).toBe(`${ASK_USER_ANSWER_PREFIX}Use Anthropic`);
    expect(decodeAskUserAnswer(encoded)).toBe('Use Anthropic');
  });

  it('preserves labels that themselves contain the separator characters', () => {
    const tricky = 'A: b :: c — d';
    expect(decodeAskUserAnswer(encodeAskUserAnswer(tricky))).toBe(tricky);
  });

  it('returns null for normal confirmation outcomes (not an answer)', () => {
    expect(decodeAskUserAnswer('proceed_once')).toBeNull();
    expect(decodeAskUserAnswer('proceed_always')).toBeNull();
    expect(decodeAskUserAnswer('cancel')).toBeNull();
    expect(decodeAskUserAnswer('')).toBeNull();
  });
});
