/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo's AskUserQuestion, over ACP. The engine's tool blocks on the ext
 * request `fuigo/ask_user_question` (the SDK hands it to `Client.extMethod`
 * with the `_` ext prefix) and expects one typed response for the whole
 * request. Wire shapes are Fuigo's
 * (`fuigo-tools/.../ask_user_question/types.rs`, camelCase):
 *
 *   params   { sessionId, toolCallId, questions: [{ question, options:
 *              [{ label, description? }], multiSelect? }], mode }
 *   response { outcome: 'accepted', answers: { [question]: [label, ...] } }
 *            | { outcome: 'cancelled' }
 *
 * Desktop answers one question at a time through the existing confirmation
 * card (`IConfirmation` options carrying `answer`, #504): every question of a
 * request is surfaced at once, each under its own call id, and the request
 * resolves when the last one is answered - or the moment any one is
 * cancelled. `chat_about_this` / `skip_interview` (plan-mode paths) are not
 * offered; a cancel is the honest answer for those until a card exists.
 */

export const FUIGO_ASK_USER_QUESTION_METHOD = 'fuigo/ask_user_question';

export function isAskUserQuestionMethod(method: string): boolean {
  return method === FUIGO_ASK_USER_QUESTION_METHOD || method === `_${FUIGO_ASK_USER_QUESTION_METHOD}`;
}

export type UserQuestionOption = { label: string; description?: string };

export type UserQuestion = { question: string; options: UserQuestionOption[]; multiSelect?: boolean };

export type AskUserQuestionRequest = {
  sessionId?: string;
  toolCallId: string;
  questions: UserQuestion[];
  mode?: 'default' | 'plan';
};

export type AskUserQuestionResponse =
  | { outcome: 'accepted'; answers: Record<string, string[]> }
  | { outcome: 'cancelled' };

/** What the UI is asked to show for ONE question of a request. */
export type UserQuestionUIData = {
  /** `<toolCallId>:<index>` - the id the answer comes back under. */
  callId: string;
  question: string;
  options: UserQuestionOption[];
};

export function parseAskUserQuestionRequest(params: unknown): AskUserQuestionRequest | null {
  if (!params || typeof params !== 'object') return null;
  const p = params as Record<string, unknown>;
  if (typeof p.toolCallId !== 'string' || !Array.isArray(p.questions)) return null;
  const questions: UserQuestion[] = [];
  for (const q of p.questions) {
    if (!q || typeof q !== 'object') return null;
    const qq = q as Record<string, unknown>;
    if (typeof qq.question !== 'string' || !Array.isArray(qq.options)) return null;
    const options: UserQuestionOption[] = [];
    for (const o of qq.options) {
      if (!o || typeof o !== 'object' || typeof (o as { label?: unknown }).label !== 'string') return null;
      const oo = o as { label: string; description?: unknown };
      options.push({ label: oo.label, ...(typeof oo.description === 'string' && { description: oo.description }) });
    }
    questions.push({
      question: qq.question,
      options,
      multiSelect: qq.multiSelect === true || qq.multi_select === true,
    });
  }
  return { toolCallId: p.toolCallId, questions, ...(p.mode === 'plan' && { mode: 'plan' as const }) };
}

export function questionCallId(toolCallId: string, index: number): string {
  return `${toolCallId}:q${index}`;
}

type Pending = { resolve: (answer: string | null) => void };

/**
 * Holds the open questions of in-flight requests and turns per-question
 * answers back into Fuigo's single response.
 */
export class UserQuestionResolver {
  private readonly pending = new Map<string, Pending>();

  /** `null` from the UI means the user cancelled that question. */
  async ask(
    request: AskUserQuestionRequest,
    show: (data: UserQuestionUIData) => void
  ): Promise<AskUserQuestionResponse> {
    if (request.questions.length === 0) return { outcome: 'accepted', answers: {} };
    const answers = await Promise.all(
      request.questions.map(
        (q, i) =>
          new Promise<string | null>((resolve) => {
            const callId = questionCallId(request.toolCallId, i);
            this.pending.set(callId, { resolve });
            show({ callId, question: q.question, options: q.options });
          })
      )
    );
    if (answers.some((a) => a === null)) {
      // One cancel cancels the request; the sibling cards are dropped too.
      for (let i = 0; i < request.questions.length; i++) this.pending.delete(questionCallId(request.toolCallId, i));
      return { outcome: 'cancelled' };
    }
    const byQuestion: Record<string, string[]> = {};
    request.questions.forEach((q, i) => {
      byQuestion[q.question] = [answers[i] as string];
    });
    return { outcome: 'accepted', answers: byQuestion };
  }

  /** True when the id belonged to an open question. */
  answer(callId: string, answer: string | null): boolean {
    const entry = this.pending.get(callId);
    if (!entry) return false;
    this.pending.delete(callId);
    entry.resolve(answer);
    return true;
  }

  has(callId: string): boolean {
    return this.pending.has(callId);
  }

  cancelAll(): void {
    for (const [id, entry] of this.pending) {
      this.pending.delete(id);
      entry.resolve(null);
    }
  }
}
