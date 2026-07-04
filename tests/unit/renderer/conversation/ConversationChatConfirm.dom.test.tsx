/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #504: the AskUserQuestion approval prompt must render its choices (not an
 * empty box) and send the picked choice back to the engine as `answer`.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const confirmInvoke = vi.fn(() => Promise.resolve({ success: true }));
const listInvoke = vi.fn();
const checkInvoke = vi.fn(() => Promise.resolve(false));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      confirmation: {
        list: { invoke: (...a: unknown[]) => listInvoke(...a) },
        confirm: { invoke: (...a: unknown[]) => confirmInvoke(...a) },
        add: { on: vi.fn(() => () => {}) },
        remove: { on: vi.fn(() => () => {}) },
        update: { on: vi.fn(() => () => {}) },
      },
      approval: { check: { invoke: (...a: unknown[]) => checkInvoke(...a) } },
    },
  },
}));

vi.mock('@/renderer/hooks/context/ConversationContext', () => ({
  useConversationContextSafe: () => ({ type: 'wcore' }),
}));

vi.mock('@/renderer/utils/common', () => ({
  removeStack: () => () => {},
}));

vi.mock('@arco-design/web-react', () => ({
  Divider: () => <hr />,
  Typography: {
    Ellipsis: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  },
}));

import ConversationChatConfirm from '@/renderer/pages/conversation/components/ConversationChatConfirm';

const CONVERSATION_ID = 'conv-504';

const questionConfirmation = {
  conversation_id: CONVERSATION_ID,
  id: 'call-1',
  callId: 'call-1',
  action: 'question',
  title: 'Which offer structure fits Wayland?',
  description: 'Nail the offer',
  options: [
    { label: 'Founding Member deal', value: 'proceed_once', answer: 'Founding Member deal', description: 'Paid now' },
    { label: 'Free core + paid Pro', value: 'proceed_once', answer: 'Free core + paid Pro' },
    { label: 'messages.confirmation.no', value: 'cancel' },
  ],
};

describe('ConversationChatConfirm — AskUserQuestion (#504)', () => {
  beforeEach(() => {
    confirmInvoke.mockClear();
    listInvoke.mockReset();
    listInvoke.mockResolvedValue([questionConfirmation]);
  });

  it('renders the question and its choices instead of an empty prompt', async () => {
    render(
      <ConversationChatConfirm conversation_id={CONVERSATION_ID}>
        <div>child</div>
      </ConversationChatConfirm>
    );

    expect(await screen.findByText('Which offer structure fits Wayland?')).toBeTruthy();
    expect(screen.getByText('Founding Member deal')).toBeTruthy();
    expect(screen.getByText('Free core + paid Pro')).toBeTruthy();
    expect(screen.getByText('Paid now')).toBeTruthy(); // choice description surfaced
  });

  it('marks only the first choice (the yolo auto-pick) as Recommended', async () => {
    render(
      <ConversationChatConfirm conversation_id={CONVERSATION_ID}>
        <div>child</div>
      </ConversationChatConfirm>
    );

    // Wait for the choices to render, then assert exactly one Recommended badge
    // and that it sits on the first choice (choices[0], the auto-picked one).
    await screen.findByText('Founding Member deal');
    const badges = screen.getAllByTestId('confirm-question-recommended');
    expect(badges).toHaveLength(1);

    const firstChoice = screen.getByText('Founding Member deal').closest('[data-testid="confirm-question-choice"]');
    expect(firstChoice?.contains(badges[0])).toBe(true);
  });

  it('sends the picked choice as `answer` over the confirm channel', async () => {
    render(
      <ConversationChatConfirm conversation_id={CONVERSATION_ID}>
        <div>child</div>
      </ConversationChatConfirm>
    );

    const choice = await screen.findByText('Free core + paid Pro');
    fireEvent.click(choice);

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: CONVERSATION_ID,
        callId: 'call-1',
        data: 'proceed_once',
        answer: 'Free core + paid Pro',
      })
    );
  });
});

/**
 * #610: the wcore/acp mapper puts the REAL command into the approval prompt's
 * title/description ("Execute: <cmd>"). Inline credentials in that command must
 * be masked before they render — this is the approval-card leg of the timeline
 * redaction, caught by live-verify after the activity-step leg was already fixed.
 */
const execConfirmation = {
  conversation_id: CONVERSATION_ID,
  id: 'call-exec',
  callId: 'call-exec',
  action: 'exec',
  title: "Execute: echo 'Bearer sk-live-SECRETabcdef123456 api_key=MYSECRETVALUE99'",
  description: "Execute: echo 'Bearer sk-live-SECRETabcdef123456 api_key=MYSECRETVALUE99'",
  options: [
    { label: 'Yes, allow once', value: 'proceed_once' },
    { label: 'messages.confirmation.no', value: 'cancel' },
  ],
};

describe('ConversationChatConfirm — command secret redaction (#610)', () => {
  beforeEach(() => {
    confirmInvoke.mockClear();
    listInvoke.mockReset();
    listInvoke.mockResolvedValue([execConfirmation]);
  });

  it('masks inline secrets in the approval prompt title and description', async () => {
    render(
      <ConversationChatConfirm conversation_id={CONVERSATION_ID}>
        <div>child</div>
      </ConversationChatConfirm>
    );

    // The approve option still renders so the card is up.
    await screen.findByText('Yes, allow once');

    // No raw credential shape survives anywhere in the rendered card.
    expect(screen.queryByText(/sk-live-SECRETabcdef123456/)).toBeNull();
    expect(screen.queryByText(/MYSECRETVALUE99/)).toBeNull();
    expect(document.body.textContent).not.toContain('sk-live-SECRETabcdef123456');
    expect(document.body.textContent).not.toContain('MYSECRETVALUE99');

    // The mask is shown and the non-secret command shell is preserved.
    expect(document.body.textContent).toContain('••••••');
    expect(document.body.textContent).toContain('Execute: echo');
  });
});
