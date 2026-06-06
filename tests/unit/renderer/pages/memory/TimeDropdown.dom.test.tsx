/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for TimeDropdown.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback ?? _key,
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const React2 = await import('react');
  const MenuItem = ({
    children,
    onClick,
    'data-testid': testId,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    'data-testid'?: string;
  }) =>
    React2.createElement('div', { 'data-testid': testId, onClick, role: 'menuitem' }, children);

  const Menu = ({
    children,
    onClickMenuItem,
  }: {
    children: React.ReactNode;
    onClickMenuItem?: (key: string) => void;
  }) =>
    React2.createElement(
      'div',
      { 'data-testid': 'arco-menu' },
      React2.Children.map(children, (child) => {
        if (React2.isValidElement(child)) {
          const childKey = (child as React2.ReactElement).key ?? '';
          return React2.cloneElement(child as React2.ReactElement<Record<string, unknown>>, {
            onClick: () => onClickMenuItem?.(childKey),
          });
        }
        return child;
      }),
    );
  (Menu as { Item: typeof MenuItem }).Item = MenuItem;

  return {
    Dropdown: ({
      children,
      droplist,
    }: {
      children: React.ReactNode;
      droplist: React.ReactNode;
    }) => React2.createElement(React2.Fragment, null, children, droplist),
    Menu,
    DatePicker: ({ placeholder, onChange, 'data-testid': testId }: {
      placeholder?: string;
      onChange?: (val: string, date: Date | null) => void;
      'data-testid'?: string;
      size?: string;
    }) =>
      React2.createElement('input', {
        type: 'date',
        placeholder,
        'data-testid': testId,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          onChange?.(e.target.value, e.target.value ? new Date(e.target.value) : null),
      }),
  };
});

import TimeDropdown from '@renderer/pages/memory/components/TimeDropdown';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TimeDropdown', () => {
  it('renders the trigger button', () => {
    render(<TimeDropdown selected='all' onSelect={vi.fn()} />);
    expect(screen.getByTestId('time-dropdown-btn')).toBeTruthy();
  });

  it('shows "All time" label by default', () => {
    render(<TimeDropdown selected='all' onSelect={vi.fn()} />);
    expect(screen.getByTestId('time-dropdown-btn').textContent).toContain('All time');
  });

  it('renders built-in time options', () => {
    render(<TimeDropdown selected='all' onSelect={vi.fn()} />);
    expect(screen.getByTestId('time-option-all')).toBeTruthy();
    expect(screen.getByTestId('time-option-7d')).toBeTruthy();
    expect(screen.getByTestId('time-option-30d')).toBeTruthy();
    expect(screen.getByTestId('time-option-today')).toBeTruthy();
  });

  it('calls onSelect with "7d" when 7 days option clicked', () => {
    const onSelect = vi.fn();
    render(<TimeDropdown selected='all' onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('time-option-7d'));
    expect(onSelect).toHaveBeenCalledWith('7d');
  });

  it('calls onSelect with "30d" when 30 days option clicked', () => {
    const onSelect = vi.fn();
    render(<TimeDropdown selected='all' onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('time-option-30d'));
    expect(onSelect).toHaveBeenCalledWith('30d');
  });

  it('shows "7 days" label when selected is 7d', () => {
    render(<TimeDropdown selected='7d' onSelect={vi.fn()} />);
    expect(screen.getByTestId('time-dropdown-btn').textContent).toContain('7 days');
  });
});
