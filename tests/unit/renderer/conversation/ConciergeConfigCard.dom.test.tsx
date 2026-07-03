/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IConciergeConfigContent } from '@/common/chat/conciergeConfig';

const { confirmSpy } = vi.hoisted(() => ({
  confirmSpy: vi.fn(async () => ({ ok: true as boolean })),
}));

const { fileBugReportSpy } = vi.hoisted(() => ({ fileBugReportSpy: vi.fn(async () => {}) }));
vi.mock('@/renderer/utils/bugReport', () => ({ fileBugReport: fileBugReportSpy }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@arco-design/web-react', () => {
  const Input: React.FC<Record<string, unknown>> & { Password?: React.FC<Record<string, unknown>> } = ({
    onChange,
    ['aria-label']: ariaLabel,
    ['data-testid']: testid,
    placeholder,
  }: Record<string, unknown>) => (
    <input
      aria-label={ariaLabel as string}
      data-testid={testid as string}
      placeholder={placeholder as string}
      onChange={(e) => (onChange as (v: string) => void)?.(e.target.value)}
    />
  );
  Input.Password = Input;
  const Typography = { Paragraph: ({ children }: { children?: React.ReactNode }) => <div>{children}</div> };
  return {
    Button: ({ children, onClick, disabled, ['data-testid']: testid }: Record<string, unknown>) => (
      <button
        type='button'
        disabled={disabled as boolean}
        data-testid={testid as string}
        onClick={onClick as () => void}
      >
        {children as React.ReactNode}
      </button>
    ),
    Input,
    Typography,
    Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Message: { error: vi.fn(), success: vi.fn() },
  };
});

vi.mock('@/common', () => ({
  ipcBridge: { conciergeConfig: { confirmProposal: { invoke: confirmSpy } } },
}));

import ConciergeConfigCard from '@/renderer/pages/conversation/Messages/components/ConciergeConfigCard';

const msg = (content: IConciergeConfigContent) => ({
  id: 'm1',
  msg_id: 'm1',
  conversation_id: 'c1',
  type: 'concierge_propose' as const,
  position: 'left' as const,
  content,
});

const acceptBtn = () => screen.getAllByRole('button').find((b) => b.textContent?.includes('concierge.config.accept'))!;

describe('<ConciergeConfigCard>', () => {
  beforeEach(() => confirmSpy.mockClear());
  afterEach(() => vi.clearAllMocks());

  it('set_default_model: Accept calls confirmProposal with action accept (no secret)', () => {
    render(
      <ConciergeConfigCard
        message={msg({
          kind: 'set_default_model',
          engine: 'wcore',
          modelId: 'm',
          useModel: 'u',
          label: 'X',
          status: 'pending',
        })}
      />
    );
    fireEvent.click(acceptBtn());
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'c1', msgId: 'm1', action: 'accept', secret: undefined })
    );
  });

  it('file_bug_report: Accept runs the bug-report flow then records acceptance (#464)', async () => {
    render(
      <ConciergeConfigCard message={msg({ kind: 'file_bug_report', summary: 'crash on start', status: 'pending' })} />
    );
    fireEvent.click(acceptBtn());
    await waitFor(() => expect(fileBugReportSpy).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'accept', secret: undefined }))
    );
  });

  it('provider_connect: Accept disabled until a key is typed, then sends it as secret', () => {
    render(
      <ConciergeConfigCard
        message={msg({ kind: 'provider_connect', providerId: 'openai', label: 'OpenAI', status: 'pending' })}
      />
    );
    expect(acceptBtn()).toBeDisabled();
    fireEvent.change(screen.getByTestId('concierge-api-key'), { target: { value: 'sk-abc-1234' } });
    expect(acceptBtn()).not.toBeDisabled();
    fireEvent.click(acceptBtn());
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'accept', secret: expect.objectContaining({ apiKey: 'sk-abc-1234' }) })
    );
  });

  it('add_mcp env values render masked (raw value absent from the DOM)', () => {
    render(
      <ConciergeConfigCard
        message={msg({
          kind: 'add_mcp',
          name: 'fs',
          command: 'npx',
          args: ['-y', 'srv'],
          env: { API_KEY: 'supersecret1234' },
          status: 'pending',
        })}
      />
    );
    const env = screen.getByTestId('mcp-env');
    expect(env.textContent).toContain('••••1234');
    expect(env.textContent).not.toContain('supersecret1234');
  });

  it('Cancel calls confirmProposal with action cancel', () => {
    render(
      <ConciergeConfigCard
        message={msg({ kind: 'edit_assistant', assistantId: 'a', label: 'A', rules: 'r', status: 'pending' })}
      />
    );
    const cancel = screen.getAllByRole('button').find((b) => b.textContent?.includes('concierge.config.cancel'))!;
    fireEvent.click(cancel);
    expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'cancel' }));
  });
});
