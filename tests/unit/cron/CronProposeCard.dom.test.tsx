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
const { navigateSpy, confirmProposalSpy, emitterEmitSpy, messageErrorSpy, messageSuccessSpy } =
  vi.hoisted(() => ({
    navigateSpy: vi.fn(),
    confirmProposalSpy: vi.fn(() => Promise.resolve({ ok: true, jobId: 'cron_test' })),
    emitterEmitSpy: vi.fn(),
    messageErrorSpy: vi.fn(),
    messageSuccessSpy: vi.fn(),
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

vi.mock('@/renderer/utils/emitter', () => ({
  emitter: {
    emit: emitterEmitSpy,
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
  return {
    ...actual,
    Message: { ...actual.Message, error: messageErrorSpy, success: messageSuccessSpy },
  };
});

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
    emitterEmitSpy.mockClear();
    messageErrorSpy.mockClear();
    messageSuccessSpy.mockClear();
    // Reset to default success behavior; individual tests override
    confirmProposalSpy.mockImplementation(() => Promise.resolve({ ok: true, jobId: 'cron_test' }));
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

  // v0.6.2.6.1 cross-audit fixes

  it('rapid double-click on Yes only fires confirmProposal once (Codex C-R-01 / Gemini G-R-01)', async () => {
    // Hold confirmProposal in-flight so the second click hits the resolving guard
    let resolveFirst: (v: { ok: true; jobId: string }) => void = () => {};
    confirmProposalSpy.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    );
    render(<CronProposeCard message={makeProposeMsg()} />);
    const yesBtn = screen.getByText('cron.propose.yes').closest('button')!;
    fireEvent.click(yesBtn);
    fireEvent.click(yesBtn);
    fireEvent.click(yesBtn);
    expect(confirmProposalSpy).toHaveBeenCalledTimes(1);
    resolveFirst({ ok: true, jobId: 'cron_test' });
  });

  it('Edit success emits cron.modal.openWithProposal with editPayload (Gemini G-P-01)', async () => {
    confirmProposalSpy.mockResolvedValueOnce({
      ok: true,
      editPayload: {
        conversationId: 'conv-1',
        conversationTitle: 'Test Chat',
        agentType: 'claude',
        initialName: 'Test Cron',
        initialPrompt: 'Do thing daily',
        initialSchedule: '0 9 * * *',
        initialScheduleDescription: 'Every day at 9:00 AM',
      },
    });
    render(<CronProposeCard message={makeProposeMsg()} />);
    fireEvent.click(screen.getByText('cron.propose.edit').closest('button')!);
    await new Promise((r) => setTimeout(r, 0));
    expect(emitterEmitSpy).toHaveBeenCalledWith(
      'cron.modal.openWithProposal',
      expect.objectContaining({
        conversationId: 'conv-1',
        initialName: 'Test Cron',
        initialSchedule: '0 9 * * *',
      })
    );
  });

  it('IPC failure surfaces user-visible error toast (Codex C-R-04 / Gemini G-R-05)', async () => {
    confirmProposalSpy.mockResolvedValueOnce({ ok: false, reason: 'cron_expr_validation_failed' });
    render(<CronProposeCard message={makeProposeMsg()} />);
    fireEvent.click(screen.getByText('cron.propose.yes').closest('button')!);
    await new Promise((r) => setTimeout(r, 0));
    expect(messageErrorSpy).toHaveBeenCalled();
  });

  it('successful accept fires success toast (Codex C-P-04)', async () => {
    confirmProposalSpy.mockResolvedValueOnce({ ok: true, jobId: 'cron_xyz' });
    render(<CronProposeCard message={makeProposeMsg()} />);
    fireEvent.click(screen.getByText('cron.propose.yes').closest('button')!);
    await new Promise((r) => setTimeout(r, 0));
    expect(messageSuccessSpy).toHaveBeenCalled();
  });

  it('processing state renders without action buttons', () => {
    render(<CronProposeCard message={makeProposeMsg({ status: 'processing' })} />);
    expect(screen.queryByText('cron.propose.yes')).toBeNull();
    expect(screen.getByText('cron.propose.title')).toBeTruthy();
  });
});
