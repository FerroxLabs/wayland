/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

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
  // The phrasing is now chosen deterministically from the date+hour (no
  // Math.random), so each fixed `now` maps to one stable phrase in its bucket.

  it('renders a morning greeting before noon with no name', () => {
    // 2026-01-01 08:00 → morning bucket, deterministic index 2 → 'Rise and shine'.
    render(<Greeting now={new Date('2026-01-01T08:00:00')} displayName={null} />);
    expect(screen.getByTestId('new-chat-greeting').textContent).toBe('Rise and shine');
  });

  it('renders an afternoon greeting between 12:00 and 17:00 with a name', () => {
    // 2026-01-01 14:00 → afternoon bucket, deterministic index 2 → 'Welcome back'.
    render(<Greeting now={new Date('2026-01-01T14:00:00')} displayName='Sean' />);
    expect(screen.getByTestId('new-chat-greeting').textContent).toBe('Welcome back, Sean');
  });

  it('renders an evening greeting between 17:00 and 21:00', () => {
    // 2026-01-01 19:30 → evening bucket, deterministic index 1 → 'Good evening'.
    render(<Greeting now={new Date('2026-01-01T19:30:00')} displayName='' />);
    expect(screen.getByTestId('new-chat-greeting').textContent).toBe('Good evening');
  });

  it('renders the night greeting at 22:00 with a whitespace-trimmed name', () => {
    // 2026-01-01 22:00 → night bucket, deterministic index 1 → 'Good evening'.
    render(<Greeting now={new Date('2026-01-01T22:00:00')} displayName='   Rory   ' />);
    expect(screen.getByTestId('new-chat-greeting').textContent).toBe('Good evening, Rory');
  });

  it('yields the same phrase across remounts at the same hour (no per-mount re-roll)', () => {
    // Regression guard for issue #8: a remount must not visibly change the
    // greeting text. Render, unmount, and render again at the same `now`.
    const now = new Date('2026-01-01T08:00:00');
    const first = render(<Greeting now={now} displayName={null} />);
    const firstText = screen.getByTestId('new-chat-greeting').textContent;
    first.unmount();

    render(<Greeting now={now} displayName={null} />);
    const secondText = screen.getByTestId('new-chat-greeting').textContent;

    expect(secondText).toBe(firstText);
  });
});
