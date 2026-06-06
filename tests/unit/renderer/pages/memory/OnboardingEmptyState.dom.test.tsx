/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Wave 4 - DOM tests for OnboardingEmptyState.
 *
 * Covers:
 *   - Title, subtitle, and textarea placeholder render with the right i18n keys.
 *   - Three starter chips render and fill the textarea on click.
 *   - Save with non-empty content calls `brainInvoke.invoke` with verb
 *     `memory_store` and the trimmed content payload.
 *   - Save with empty content is a no-op.
 *   - Successful invoke clears the textarea.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { brainInvokeMock } = vi.hoisted(() => ({
  brainInvokeMock: vi.fn<
    (args: { verb: string; args?: Record<string, unknown> }) => Promise<
      { ok: true } | { ok: false; error?: string }
    >
  >(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>(
    '@arco-design/web-react'
  );
  return {
    ...actual,
    Message: {
      ...actual.Message,
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      brainInvoke: { invoke: brainInvokeMock },
    },
  },
}));

import OnboardingEmptyState from '@renderer/pages/memory/state-branches/OnboardingEmptyState';

const getTextarea = (): HTMLTextAreaElement =>
  screen.getByTestId('memory-onboarding-empty-textarea') as HTMLTextAreaElement;

beforeEach(() => {
  brainInvokeMock.mockReset();
  brainInvokeMock.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
});

describe('OnboardingEmptyState', () => {
  it('renders title, subtitle, and the textarea placeholder', () => {
    render(<OnboardingEmptyState />);
    expect(screen.getByText('memory.empty.title')).toBeTruthy();
    expect(screen.getByText('memory.empty.subtitle')).toBeTruthy();
    const textarea = getTextarea();
    expect(textarea.getAttribute('placeholder')).toBe('memory.empty.placeholder');
  });

  it('renders the three starter chips', () => {
    render(<OnboardingEmptyState />);
    expect(screen.getByTestId('memory-onboarding-empty-chip1')).toBeTruthy();
    expect(screen.getByTestId('memory-onboarding-empty-chip2')).toBeTruthy();
    expect(screen.getByTestId('memory-onboarding-empty-chip3')).toBeTruthy();
    expect(screen.getByText('memory.empty.chip1')).toBeTruthy();
    expect(screen.getByText('memory.empty.chip2')).toBeTruthy();
    expect(screen.getByText('memory.empty.chip3')).toBeTruthy();
  });

  it('fills the textarea when a chip is clicked', () => {
    render(<OnboardingEmptyState />);
    const chip = screen.getByTestId('memory-onboarding-empty-chip2');
    act(() => {
      fireEvent.click(chip);
    });
    expect(getTextarea().value).toBe('memory.empty.chip2');
  });

  it('invokes brainInvoke with verb memory_store and the textarea content on save', async () => {
    render(<OnboardingEmptyState />);
    const textarea = getTextarea();
    act(() => {
      fireEvent.change(textarea, { target: { value: 'I prefer TypeScript' } });
    });
    const submit = screen.getByTestId('memory-onboarding-empty-submit');
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(brainInvokeMock).toHaveBeenCalledTimes(1);
    expect(brainInvokeMock).toHaveBeenCalledWith({
      verb: 'memory_store',
      args: { content: 'I prefer TypeScript' },
    });
  });

  it('does not call brainInvoke when the textarea is empty', async () => {
    render(<OnboardingEmptyState />);
    const submit = screen.getByTestId('memory-onboarding-empty-submit') as HTMLButtonElement;
    // Arco disables the button when empty; click should be a no-op regardless.
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(brainInvokeMock).not.toHaveBeenCalled();
  });

  it('clears the textarea after a successful save', async () => {
    render(<OnboardingEmptyState />);
    const textarea = getTextarea();
    act(() => {
      fireEvent.change(textarea, { target: { value: 'Remember this' } });
    });
    expect(getTextarea().value).toBe('Remember this');
    const submit = screen.getByTestId('memory-onboarding-empty-submit');
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(getTextarea().value).toBe('');
  });
});
