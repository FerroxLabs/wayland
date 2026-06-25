/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MessageActions, {
  CHAT_RETRY_EVENT,
  EDIT_AND_RERUN_EVENT,
  type ChatRetryDetail,
  type ChatEditRerunDetail,
} from '@/renderer/pages/conversation/Messages/components/MessageActions';

vi.mock('@arco-design/web-react', () => ({ Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</> }));
vi.mock('@icon-park/react', () => ({
  Copy: () => <span data-testid='copy-icon' />,
  Edit: () => <span data-testid='edit-icon' />,
  PlayOne: () => <span data-testid='play-icon' />,
  PauseOne: () => <span data-testid='pause-icon' />,
  Refresh: () => <span data-testid='refresh-icon' />,
  Like: () => <span data-testid='like-icon' />,
  Unlike: () => <span data-testid='unlike-icon' />,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? _k }),
}));
vi.mock('@/renderer/styles/colors', () => ({ iconColors: { secondary: 'var(--text-secondary)', brand: 'var(--brand)' } }));

afterEach(() => {
  localStorage.clear();
});

const base = { onCopy: vi.fn(), messageId: 'm1', readText: 'hello world', display: 'always' as const };

describe('MessageActions', () => {
  it('assistant: renders copy + read-aloud + retry + 2 thumbs', () => {
    render(<MessageActions {...base} isUser={false} retryText='prompt' />);
    expect(screen.getByLabelText('Copy')).toBeTruthy();
    expect(screen.getByLabelText('Read aloud')).toBeTruthy();
    expect(screen.getByLabelText('Retry')).toBeTruthy();
    expect(screen.getByLabelText('Good response')).toBeTruthy();
    expect(screen.getByLabelText('Bad response')).toBeTruthy();
  });

  it('renders NOTHING when display is hidden (still streaming)', () => {
    const { container } = render(<MessageActions {...base} isUser={false} display='hidden' />);
    expect(container.firstChild).toBeNull();
  });

  it('user: renders copy; no read-aloud or retry; Edit shown when onEdit provided', () => {
    const onEdit = vi.fn();
    render(<MessageActions {...base} isUser onEdit={onEdit} />);
    expect(screen.getByLabelText('Copy')).toBeTruthy();
    expect(screen.getByLabelText('Edit')).toBeTruthy();
    expect(screen.queryByLabelText('Read aloud')).toBeNull();
    expect(screen.queryByLabelText('Retry')).toBeNull();
  });

  it('user: no Edit button when onEdit is not provided', () => {
    render(<MessageActions {...base} isUser />);
    expect(screen.getByLabelText('Copy')).toBeTruthy();
    expect(screen.queryByLabelText('Edit')).toBeNull();
  });

  it('user: clicking Edit calls onEdit', () => {
    const onEdit = vi.fn();
    render(<MessageActions {...base} isUser onEdit={onEdit} />);
    fireEvent.click(screen.getByLabelText('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('copy calls onCopy', () => {
    const onCopy = vi.fn();
    render(<MessageActions {...base} onCopy={onCopy} isUser={false} />);
    fireEvent.click(screen.getByLabelText('Copy'));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('thumbs PERSIST to localStorage and toggle off', () => {
    render(<MessageActions {...base} isUser={false} />);
    fireEvent.click(screen.getByLabelText('Good response'));
    expect(localStorage.getItem('wl:fb:m1')).toBe('up');
    fireEvent.click(screen.getByLabelText('Good response'));
    expect(localStorage.getItem('wl:fb:m1')).toBeNull();
  });

  it('retry dispatches CHAT_RETRY_EVENT with the prompt + conversation id', () => {
    const spy = vi.fn();
    const handler = (e: Event) => spy((e as CustomEvent<ChatRetryDetail>).detail);
    window.addEventListener(CHAT_RETRY_EVENT, handler);
    render(<MessageActions {...base} isUser={false} retryText='do it again' conversationId='c1' />);
    fireEvent.click(screen.getByLabelText('Retry'));
    expect(spy).toHaveBeenCalledWith({ conversationId: 'c1', text: 'do it again' });
    window.removeEventListener(CHAT_RETRY_EVENT, handler);
  });

  it('EDIT_AND_RERUN_EVENT is exported with the correct channel name', () => {
    expect(EDIT_AND_RERUN_EVENT).toBe('wl:chat-edit-rerun');
  });

  it('read-aloud calls speechSynthesis', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    Object.assign(window, { speechSynthesis: { speak, cancel } });
    // @ts-expect-error - minimal test stub for the utterance ctor
    window.SpeechSynthesisUtterance = vi.fn(function (this: { text: string; addEventListener: () => void }, text: string) {
      this.text = text;
      this.addEventListener = vi.fn();
    });
    render(<MessageActions {...base} isUser={false} readText='**read** me' />);
    fireEvent.click(screen.getByLabelText('Read aloud'));
    expect(speak).toHaveBeenCalledTimes(1);
  });
});
