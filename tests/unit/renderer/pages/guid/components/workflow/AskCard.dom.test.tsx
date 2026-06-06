/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

// DOM tests for AskCard (SPEC §5.6 - STR 5).
// Verifies the 5 input variants render and submit correctly, the "or skip"
// link fires onSkip, and an already-answered ask collapses to a read-only
// summary with no input affordances.

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en-US' },
  }),
}));

import { AskCard } from '@/renderer/pages/guid/components/workflow/AskCard';
import type { AskRecord } from '@/common/types/workflowTypes';

const NOW = 1_700_000_000_000;

const baseAsk = (overrides: Partial<AskRecord> = {}): AskRecord => ({
  id: 'ask-1',
  step_n: 3,
  question: 'What is your monthly budget?',
  type: 'text',
  options: null,
  max: null,
  placeholder: 'e.g. $500',
  answer: null,
  asked_at: NOW,
  answered_at: null,
  ...overrides,
});

const getSend = () => screen.getByTestId('askcard-send') as HTMLButtonElement;
const getSkip = () => screen.getByTestId('askcard-skip') as HTMLButtonElement;

describe('AskCard', () => {
  it('renders the question above the input', () => {
    render(<AskCard ask={baseAsk()} onSubmit={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText('What is your monthly budget?')).toBeTruthy();
  });

  describe('type=text', () => {
    it('types into Input → Send fires onSubmit with typed value', () => {
      const onSubmit = vi.fn();
      render(<AskCard ask={baseAsk()} onSubmit={onSubmit} onSkip={vi.fn()} />);

      const input = document.querySelector(
        'input[placeholder="e.g. $500"]'
      ) as HTMLInputElement;
      expect(input).toBeTruthy();
      fireEvent.change(input, { target: { value: 'monthly recurring' } });
      fireEvent.click(getSend());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith('monthly recurring');
    });
  });

  describe('type=number', () => {
    it('types into InputNumber → Send fires onSubmit with stringified value', () => {
      const onSubmit = vi.fn();
      render(
        <AskCard
          ask={baseAsk({ type: 'number', placeholder: 'Budget in USD' })}
          onSubmit={onSubmit}
          onSkip={vi.fn()}
        />
      );

      const numberInput = document.querySelector(
        'input[placeholder="Budget in USD"]'
      ) as HTMLInputElement;
      expect(numberInput).toBeTruthy();
      fireEvent.change(numberInput, { target: { value: '500' } });
      fireEvent.click(getSend());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith('500');
    });
  });

  describe('type=choice', () => {
    it('clicks option → Send fires onSubmit with chosen string', () => {
      const onSubmit = vi.fn();
      render(
        <AskCard
          ask={baseAsk({ type: 'choice', options: ['Zapier', 'n8n', 'Make'] })}
          onSubmit={onSubmit}
          onSkip={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'n8n' }));
      fireEvent.click(getSend());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith('n8n');
    });

    it('clicking a different chip changes selection', () => {
      const onSubmit = vi.fn();
      render(
        <AskCard
          ask={baseAsk({ type: 'choice', options: ['A', 'B', 'C'] })}
          onSubmit={onSubmit}
          onSkip={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'A' }));
      fireEvent.click(screen.getByRole('button', { name: 'C' }));
      fireEvent.click(getSend());

      expect(onSubmit).toHaveBeenCalledWith('C');
    });
  });

  describe('type=boolean', () => {
    it('clicks Yes → fires onSubmit("Yes") immediately', () => {
      const onSubmit = vi.fn();
      render(
        <AskCard ask={baseAsk({ type: 'boolean' })} onSubmit={onSubmit} onSkip={vi.fn()} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith('Yes');
    });

    it('clicks No → fires onSubmit("No") immediately', () => {
      const onSubmit = vi.fn();
      render(
        <AskCard ask={baseAsk({ type: 'boolean' })} onSubmit={onSubmit} onSkip={vi.fn()} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith('No');
    });
  });

  describe('type=rating', () => {
    it('clicks 3-star → Send fires onSubmit("3")', () => {
      const onSubmit = vi.fn();
      render(
        <AskCard
          ask={baseAsk({ type: 'rating', max: 5 })}
          onSubmit={onSubmit}
          onSkip={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('askcard-star-3'));
      fireEvent.click(getSend());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith('3');
    });

    it('stars 1..N fill up to the selected rating', () => {
      render(
        <AskCard
          ask={baseAsk({ type: 'rating', max: 5 })}
          onSubmit={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('askcard-star-3'));

      // Stars 1..3 should carry data-filled=true; 4..5 should be false.
      expect(screen.getByTestId('askcard-star-1').getAttribute('data-filled')).toBe('true');
      expect(screen.getByTestId('askcard-star-2').getAttribute('data-filled')).toBe('true');
      expect(screen.getByTestId('askcard-star-3').getAttribute('data-filled')).toBe('true');
      expect(screen.getByTestId('askcard-star-4').getAttribute('data-filled')).toBe('false');
      expect(screen.getByTestId('askcard-star-5').getAttribute('data-filled')).toBe('false');
    });
  });

  it('clicking "or skip" fires onSkip', () => {
    const onSkip = vi.fn();
    render(<AskCard ask={baseAsk()} onSubmit={vi.fn()} onSkip={onSkip} />);

    fireEvent.click(getSkip());
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('renders read-only state when already answered: shows answer + "(answered)" label, no input/send/skip', () => {
    render(
      <AskCard
        ask={baseAsk({ answer: '$500/month', answered_at: NOW + 1000 })}
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    // Question + answer + (answered) marker visible.
    expect(screen.getByText('What is your monthly budget?')).toBeTruthy();
    expect(screen.getByText('$500/month')).toBeTruthy();
    expect(screen.getByText(/answered/i)).toBeTruthy();

    // No input affordances.
    expect(screen.queryByTestId('askcard-send')).toBeNull();
    expect(screen.queryByTestId('askcard-skip')).toBeNull();
    expect(document.querySelector('input[placeholder="e.g. $500"]')).toBeNull();
  });
});
