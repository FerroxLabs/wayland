/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// #504: the AskUserQuestion confirmation must render its choices (not a blank
// dialog) and each choice must be selectable, sending the encoded answer back
// through the confirm channel. This renders the real ConfirmationDetails
// component from MessageToolGroup with a `question` confirmation.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ASK_USER_ANSWER_PREFIX } from '@/common/chat/chatLib';

// i18n: return defaultValue/key verbatim so choice labels (which are literals,
// not i18n keys) read stable.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown> & { defaultValue?: string }) => opts?.defaultValue ?? key,
  }),
}));

// Heavy sibling module that pulls electron/IPC transitively; ConfirmationDetails
// only needs the ImagePreviewContext symbol to exist.
vi.mock('../../src/renderer/pages/conversation/Messages/MessageList', () => ({
  ImagePreviewContext: React.createContext({ inPreviewGroup: false }),
}));

vi.mock('@/common', () => ({ ipcBridge: {} }));

import { ConfirmationDetails } from '@/renderer/pages/conversation/Messages/components/MessageToolGroup';

const questionContent = {
  callId: 'call-1',
  description: 'ask_user: Which backend?',
  name: 'AskUserQuestion',
  renderOutputAsMarkdown: false,
  status: 'Confirming' as const,
  confirmationDetails: {
    type: 'question' as const,
    title: 'Backend selection',
    question: 'Which backend should I use?',
    header: 'Backend selection',
    options: [
      { label: 'Anthropic', description: 'Claude models' },
      { label: 'OpenAI', description: 'GPT models' },
    ],
  },
};

describe('ConfirmationDetails — AskUserQuestion (#504)', () => {
  it('renders the question text and each choice (not blank)', () => {
    render(<ConfirmationDetails content={questionContent} onConfirm={vi.fn()} />);
    // Question text is visible (rendered both as the body and the prompt line).
    expect(screen.getAllByText(/Which backend should I use\?/).length).toBeGreaterThan(0);
    // Each choice label + description renders as a selectable option.
    expect(screen.getByText('Anthropic — Claude models')).toBeTruthy();
    expect(screen.getByText('OpenAI — GPT models')).toBeTruthy();
  });

  it('sends the encoded chosen label when a choice is selected and confirmed', () => {
    const onConfirm = vi.fn();
    render(<ConfirmationDetails content={questionContent} onConfirm={onConfirm} />);

    // Select the second choice, then confirm.
    fireEvent.click(screen.getByText('OpenAI — GPT models'));
    fireEvent.click(screen.getByText('messages.confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(`${ASK_USER_ANSWER_PREFIX}OpenAI`);
  });
});
