/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string | object; [k: string]: unknown }) => {
      const defaultValue = options?.defaultValue;
      if (typeof defaultValue === 'string') {
        // Resolve {{var}} interpolation against the options bag so the test
        // can assert on the rendered string just like react-i18next would.
        return defaultValue.replace(/{{\s*(\w+)\s*}}/g, (_match, name: string) => {
          const value = options?.[name];
          return typeof value === 'string' ? value : '';
        });
      }
      if (defaultValue && typeof defaultValue === 'object') {
        return Object.values(defaultValue)[0] as string;
      }
      return _key;
    },
  }),
}));

import Greeting from '@/renderer/pages/guid/components/newChatStarter/Greeting';

describe('<Greeting>', () => {
  // The greeting now picks one phrasing per time bucket via Math.random; pin it
  // to index 0 so each bucket renders its first (canonical) phrase.
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Morning" before noon with no name', () => {
    render(<Greeting now={new Date('2026-01-01T08:00:00')} displayName={null} />);
    expect(screen.getByTestId('new-chat-greeting').textContent).toBe('Morning');
  });

  it('renders "Afternoon, Sean" between 12:00 and 17:00 with a name', () => {
    render(<Greeting now={new Date('2026-01-01T14:00:00')} displayName='Sean' />);
    expect(screen.getByTestId('new-chat-greeting').textContent).toBe('Afternoon, Sean');
  });

  it('renders "Evening" between 17:00 and 21:00', () => {
    render(<Greeting now={new Date('2026-01-01T19:30:00')} displayName='' />);
    expect(screen.getByTestId('new-chat-greeting').textContent).toBe('Evening');
  });

  it('renders the night greeting at 22:00 with a whitespace-trimmed name', () => {
    render(<Greeting now={new Date('2026-01-01T22:00:00')} displayName='   Rory   ' />);
    // The night bucket's first phrase is 'Evening' (pool: Evening / Good evening / Winding down).
    expect(screen.getByTestId('new-chat-greeting').textContent).toBe('Evening, Rory');
  });
});
