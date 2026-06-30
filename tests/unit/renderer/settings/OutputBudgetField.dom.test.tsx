/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// i18n: return the defaultValue (reference English) so assertions read stable copy.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: Record<string, unknown> & { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

import OutputBudgetField, {
  DEFAULT_FIXED_BUDGET,
} from '../../../../src/renderer/pages/settings/WCoreConfig/components/OutputBudgetField';

describe('OutputBudgetField (#468)', () => {
  it('Auto mode: shows no numeric input', () => {
    render(<OutputBudgetField value={{ mode: 'auto' }} onChange={vi.fn()} />);
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(screen.getByText('Auto')).toBeTruthy();
    expect(screen.getByText('Fixed')).toBeTruthy();
  });

  it('flipping Auto → Fixed emits a fixed preference with the default value', () => {
    const onChange = vi.fn();
    render(<OutputBudgetField value={{ mode: 'auto' }} onChange={onChange} />);
    fireEvent.click(screen.getByText('Fixed'));
    expect(onChange).toHaveBeenCalledWith({ mode: 'fixed', value: DEFAULT_FIXED_BUDGET });
  });

  it('Fixed mode: renders the numeric input and flipping back to Auto emits auto', () => {
    const onChange = vi.fn();
    render(<OutputBudgetField value={{ mode: 'fixed', value: 16000 }} onChange={onChange} />);
    // numeric input is present in Fixed mode
    expect(screen.getByRole('spinbutton')).toBeTruthy();
    fireEvent.click(screen.getByText('Auto'));
    expect(onChange).toHaveBeenCalledWith({ mode: 'auto' });
  });

  it('treats a Fixed preference with no value as the default (not 0/undefined)', () => {
    const onChange = vi.fn();
    render(<OutputBudgetField value={{ mode: 'fixed' }} onChange={onChange} />);
    // switching mode round-trips through the resolved default, never 0/undefined
    fireEvent.click(screen.getByText('Auto'));
    fireEvent.click(screen.getByText('Fixed'));
    expect(onChange).toHaveBeenLastCalledWith({ mode: 'fixed', value: DEFAULT_FIXED_BUDGET });
  });
});
