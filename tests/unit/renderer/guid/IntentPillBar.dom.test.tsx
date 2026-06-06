/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; [k: string]: unknown }) => {
      const dv = options?.defaultValue ?? _key;
      return typeof dv === 'string'
        ? dv.replace(/{{\s*(\w+)\s*}}/g, (_m, name: string) => String(options?.[name] ?? ''))
        : _key;
    },
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    onClick,
    className,
    type: _type,
    size: _size,
    shape: _shape,
    ...rest
  }: React.ComponentProps<'button'> & {
    type?: string;
    size?: string;
    shape?: string;
  }) => (
    <button type='button' onClick={onClick} className={className} {...rest}>
      {children}
    </button>
  ),
}));

import IntentPillBar from '@/renderer/pages/guid/components/newChatStarter/IntentPillBar';
import { INTENT_KEYS } from '@/renderer/pages/guid/intents';

describe('<IntentPillBar>', () => {
  it('renders one button per intent', () => {
    render(<IntentPillBar activeIntent={null} onSelect={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(INTENT_KEYS.length);
    const dataIntents = tabs.map((tab) => tab.getAttribute('data-intent'));
    expect(dataIntents).toEqual([...INTENT_KEYS]);
  });

  it('reflects the active intent via aria-selected', () => {
    render(<IntentPillBar activeIntent='build' onSelect={() => {}} />);
    const active = screen.getByRole('tab', { selected: true });
    expect(active.getAttribute('data-intent')).toBe('build');
  });

  it('calls onSelect with the intent key when a pill is clicked', () => {
    const onSelect = vi.fn();
    render(<IntentPillBar activeIntent={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('tab', { name: /write/i }));
    expect(onSelect).toHaveBeenCalledWith('write');
  });

  it('calls onSelect(null) when the active pill is clicked again (toggle off)', () => {
    const onSelect = vi.fn();
    render(<IntentPillBar activeIntent='research' onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('tab', { name: /research/i }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
