/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #252 reframe: the header ObservabilityToggle is the open/close entry point.
 * It reflects panelOpen via aria-pressed + Button type (primary when open) and
 * flips the shared, localStorage-backed settings store on click. The store is a
 * module-level singleton; reset it to defaults in beforeEach so ordering is
 * irrelevant (no resetModules re-import of the heavy ChatConversation tree).
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'wayland.observability.settings';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

// ChatConversation evaluates a large tree of sibling imports at module load.
// Keep the real Arco exports for the siblings, but override Button + Tooltip
// with stubs that forward `type` + `aria-pressed` so we can assert them. The
// factory is hoisted, so ArcoButton is defined inside it (no top-level ref).
vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Button: ({
      children,
      type,
      icon,
      onClick,
      ...props
    }: React.PropsWithChildren<{ type?: string; icon?: React.ReactNode; onClick?: () => void }>) => (
      <button type='button' data-arco-type={type} onClick={onClick} {...props}>
        {icon}
        {children}
      </button>
    ),
    Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/common', () => ({ ipcBridge: {} }));

import { ObservabilityToggle } from '@/renderer/pages/conversation/components/ChatConversation';
import { useObservabilitySettings } from '@/renderer/hooks/settings/useObservabilitySettings';

// Reset the module-level store to defaults before each test (the store survives
// across cases in one file). renderHook would be heavier; a tiny driver hook
// gives us the real update() to force a clean closed state.
const Resetter: React.FC = () => {
  const { update } = useObservabilitySettings();
  React.useEffect(() => {
    update('panelOpen', false);
    update('showCost', false);
  }, [update]);
  return null;
};

beforeEach(() => {
  const r = render(<Resetter />);
  r.unmount();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('ObservabilityToggle #252', () => {
  it('starts closed: aria-pressed false, default Button type', () => {
    render(<ObservabilityToggle />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('data-arco-type')).toBe('default');
  });

  it('opens on click: aria-pressed true, primary type, store persisted', () => {
    render(<ObservabilityToggle />);
    const btn = screen.getByRole('button');

    act(() => {
      fireEvent.click(btn);
    });

    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('data-arco-type')).toBe('primary');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ panelOpen: true });
  });
});
