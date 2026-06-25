// @vitest-environment jsdom

/**
 * #83 - Storage actions that need the desktop runtime must not look clickable
 * in the browser WebUI. On desktop the button is a normal, clickable Button; in
 * the browser it is disabled (no onClick) with a "desktop app required" reason.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en-US' },
  }),
}));

const desktop = { value: true };
vi.mock('@renderer/utils/platform', () => ({
  isElectronDesktop: () => desktop.value,
}));

import DesktopActionButton from '@renderer/pages/settings/StorageSettings/DesktopActionButton';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DesktopActionButton (#83)', () => {
  it('on desktop: renders an enabled button that fires onClick', () => {
    desktop.value = true;
    const onClick = vi.fn();
    render(<DesktopActionButton onClick={onClick}>Open</DesktopActionButton>);

    const btn = screen.getByRole('button', { name: /Open/i });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('in the browser WebUI: renders disabled and does NOT fire onClick', () => {
    desktop.value = false;
    const onClick = vi.fn();
    render(<DesktopActionButton onClick={onClick}>Open</DesktopActionButton>);

    const btn = screen.getByRole('button', { name: /Open/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
