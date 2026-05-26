/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en-US' } }),
}));

// Factories defined inside mocks to avoid hoisting issues with top-level consts.
// Spy refs exposed via `vi.hoisted` so test body can assert on them.
const { navigateSpy, confirmProposalSpy } = vi.hoisted(() => ({
  navigateSpy: vi.fn(),
  confirmProposalSpy: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateSpy,
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    cron: {
      confirmProposal: {
        invoke: confirmProposalSpy,
      },
    },
  },
}));

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CronProposeCard from '../../../src/renderer/pages/conversation/Messages/components/CronProposeCard';
import type { IMessageCronPropose } from '../../../src/common/chat/chatLib';

function makeProposeMsg(overrides: Partial<IMessageCronPropose['content']> = {}): IMessageCronPropose {
  return {
    id: 'propose_test_id',
    msg_id: 'propose_test_msg_id',
    conversation_id: 'conv-1',
    type: 'cron_propose',
    position: 'left',
    content: {
      name: 'Daily AI News',
      schedule: '0 9 * * *',
      scheduleDescription: 'Every day at 9:00 AM',
      prompt: 'Go find the latest AI news and write a newsletter.',
      parseError: false,
      status: 'pending',
      ...overrides,
    },
    createdAt: Date.now(),
    status: 'finish',
  };
}

describe('CronProposeCard', () => {
  beforeEach(() => {
    navigateSpy.mockClear();
    confirmProposalSpy.mockClear();
  });

  it('pending state renders title, fields, and 3 action buttons (Yes enabled)', () => {
    render(<CronProposeCard message={makeProposeMsg()} />);
    expect(screen.getByText('cron.propose.title')).toBeTruthy();
    expect(screen.getByText('Daily AI News')).toBeTruthy();
    expect(screen.getByText('Every day at 9:00 AM')).toBeTruthy();
    expect(screen.getByText('Go find the latest AI news and write a newsletter.')).toBeTruthy();
    expect(screen.getByText('cron.propose.yes')).toBeTruthy();
    expect(screen.getByText('cron.propose.edit')).toBeTruthy();
    expect(screen.getByText('cron.propose.cancel')).toBeTruthy();
    // Yes button enabled when no parse error
    const yesBtn = screen.getByText('cron.propose.yes').closest('button');
    expect(yesBtn?.disabled).toBe(false);
  });

  it('pending + parseError disables Yes button and shows error tag', () => {
    render(<CronProposeCard message={makeProposeMsg({ parseError: true })} />);
    expect(screen.getByText('cron.propose.parseError')).toBeTruthy();
    const yesBtn = screen.getByText('cron.propose.yes').closest('button');
    expect(yesBtn?.disabled).toBe(true);
  });

  it('accepted state shows confirmation + View task button when cronJobId set', () => {
    render(<CronProposeCard message={makeProposeMsg({ status: 'accepted', cronJobId: 'cron_abc' })} />);
    expect(screen.getByText('cron.propose.accepted')).toBeTruthy();
    expect(screen.getByText('cron.propose.viewTask')).toBeTruthy();
  });

  it('cancelled state shows dismissed text and no action buttons', () => {
    render(<CronProposeCard message={makeProposeMsg({ status: 'cancelled' })} />);
    expect(screen.getByText('cron.propose.cancelled')).toBeTruthy();
    expect(screen.queryByText('cron.propose.yes')).toBeNull();
  });

  it('clicking Yes invokes confirmProposal with action=accept + correct ids', () => {
    render(<CronProposeCard message={makeProposeMsg()} />);
    fireEvent.click(screen.getByText('cron.propose.yes').closest('button')!);
    expect(confirmProposalSpy).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      msgId: 'propose_test_msg_id',
      action: 'accept',
    });
  });

  it('clicking Edit invokes confirmProposal with action=edit', () => {
    render(<CronProposeCard message={makeProposeMsg()} />);
    fireEvent.click(screen.getByText('cron.propose.edit').closest('button')!);
    expect(confirmProposalSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'edit' }));
  });

  it('clicking Cancel invokes confirmProposal with action=cancel', () => {
    render(<CronProposeCard message={makeProposeMsg()} />);
    fireEvent.click(screen.getByText('cron.propose.cancel').closest('button')!);
    expect(confirmProposalSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'cancel' }));
  });

  it('clicking View task on accepted state navigates to /scheduled/:jobId', () => {
    render(<CronProposeCard message={makeProposeMsg({ status: 'accepted', cronJobId: 'cron_abc' })} />);
    fireEvent.click(screen.getByText('cron.propose.viewTask').closest('button')!);
    expect(navigateSpy).toHaveBeenCalledWith('/scheduled/cron_abc');
  });
});
