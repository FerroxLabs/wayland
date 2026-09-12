/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo's AskUserQuestion over ACP: one ext request carrying N questions,
 * answered one card at a time, resolved as ONE typed response.
 */
import { describe, expect, it } from 'vitest';
import {
  isAskUserQuestionMethod,
  parseAskUserQuestionRequest,
  questionCallId,
  UserQuestionResolver,
} from '@process/acp/session/userQuestion';

const twoQuestions = {
  sessionId: 's1',
  toolCallId: 'tc-1',
  questions: [
    { question: 'Which colour?', options: [{ label: 'Red' }, { label: 'Blue', description: 'calm' }] },
    { question: 'Which size?', options: [{ label: 'S' }, { label: 'M' }], multiSelect: false },
  ],
  mode: 'default',
};

describe('ask_user_question wire parsing', () => {
  it('matches the method with and without the SDK ext prefix', () => {
    expect(isAskUserQuestionMethod('fuigo/ask_user_question')).toBe(true);
    expect(isAskUserQuestionMethod('_fuigo/ask_user_question')).toBe(true);
    expect(isAskUserQuestionMethod('fuigo/exit_plan_mode')).toBe(false);
  });

  it('parses Fuigo camelCase params and rejects a malformed request', () => {
    const parsed = parseAskUserQuestionRequest(twoQuestions);
    expect(parsed?.toolCallId).toBe('tc-1');
    expect(parsed?.questions[0].options[1]).toEqual({ label: 'Blue', description: 'calm' });
    expect(parseAskUserQuestionRequest({ toolCallId: 'x', questions: [{ question: 1 }] })).toBeNull();
    expect(parseAskUserQuestionRequest(null)).toBeNull();
  });
});

describe('UserQuestionResolver', () => {
  it('shows every question at once and resolves accepted answers keyed by question text', async () => {
    const r = new UserQuestionResolver();
    const shown: string[] = [];
    const done = r.ask(parseAskUserQuestionRequest(twoQuestions)!, (d) => shown.push(d.callId));
    expect(shown).toEqual([questionCallId('tc-1', 0), questionCallId('tc-1', 1)]);
    expect(r.answer(questionCallId('tc-1', 1), 'M')).toBe(true);
    expect(r.answer(questionCallId('tc-1', 0), 'Blue')).toBe(true);
    await expect(done).resolves.toEqual({
      outcome: 'accepted',
      answers: { 'Which colour?': ['Blue'], 'Which size?': ['M'] },
    });
    expect(r.has(questionCallId('tc-1', 0))).toBe(false);
  });

  it('cancels the whole request when any one question is cancelled', async () => {
    const r = new UserQuestionResolver();
    const done = r.ask(parseAskUserQuestionRequest(twoQuestions)!, () => {});
    r.answer(questionCallId('tc-1', 0), 'Red');
    r.answer(questionCallId('tc-1', 1), null);
    await expect(done).resolves.toEqual({ outcome: 'cancelled' });
  });

  it('ignores an answer for an unknown id and cancels everything on cancelAll', async () => {
    const r = new UserQuestionResolver();
    expect(r.answer('nope', 'x')).toBe(false);
    const done = r.ask(parseAskUserQuestionRequest(twoQuestions)!, () => {});
    r.cancelAll();
    await expect(done).resolves.toEqual({ outcome: 'cancelled' });
  });

  it('accepts an empty question list without waiting on anything', async () => {
    const r = new UserQuestionResolver();
    await expect(r.ask({ toolCallId: 't', questions: [] }, () => {})).resolves.toEqual({
      outcome: 'accepted',
      answers: {},
    });
  });
});
