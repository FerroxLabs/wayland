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
    icon,
    type: _type,
    size: _size,
    ...rest
  }: React.ComponentProps<'button'> & {
    type?: string;
    size?: string;
    icon?: React.ReactNode;
  }) => (
    <button type='button' onClick={onClick} {...rest}>
      {icon}
      {children}
    </button>
  ),
}));

vi.mock('swr', () => ({
  default: () => ({ data: [] as Record<string, unknown>[] }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    extensions: {
      getAssistants: { invoke: () => Promise.resolve([] as Record<string, unknown>[]) },
    },
  },
}));

import IntentSuggestionPanel from '@/renderer/pages/guid/components/newChatStarter/IntentSuggestionPanel';
import { INTENTS } from '@/renderer/pages/guid/intents';

describe('<IntentSuggestionPanel>', () => {
  it('renders all 5 prompts for the given intent', () => {
    render(<IntentSuggestionPanel intent='sell' onSelect={() => {}} onClose={() => {}} />);
    const rows = screen.getAllByTestId('intent-suggestion-row');
    expect(rows).toHaveLength(5);
    const ids = rows.map((row) => row.getAttribute('data-target-assistant-id'));
    expect(ids).toEqual(INTENTS.sell.prompts.map((p) => p.targetAssistantId));
  });

  it('fires onSelect with the prompt object when a row is clicked', () => {
    const onSelect = vi.fn();
    render(<IntentSuggestionPanel intent='write' onSelect={onSelect} onClose={() => {}} />);
    const firstRow = screen.getAllByTestId('intent-suggestion-row')[0];
    fireEvent.click(firstRow);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(INTENTS.write.prompts[0]);
  });

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<IntentSuggestionPanel intent='research' onSelect={() => {}} onClose={onClose} />);
    const closeBtn = screen.getByLabelText('Close suggestions');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the resolvable assistant name on each row when in the preset map', () => {
    render(<IntentSuggestionPanel intent='build' onSelect={() => {}} onClose={() => {}} />);
    // build → ui-ux-pro-max maps to a built-in preset. Confirm the row text
    // includes that preset's display name (resolved via ASSISTANT_PRESETS).
    expect(screen.getByText(/UI\/UX Pro Max/i)).toBeTruthy();
  });
});
