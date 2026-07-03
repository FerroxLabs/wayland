/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The real SettingsPageWrapper drags in extension IPC, the command palette and
// global keybinds — none of which this page's logic needs. Stub it (and the
// scroll area) to plain passthroughs so the test exercises only the toggles.
vi.mock('@/renderer/pages/settings/components/SettingsPageWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/renderer/components/base/WaylandScrollArea', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import NavigationSettings from '@/renderer/pages/settings/NavigationSettings';
import { LOGO_VISIBLE_STORAGE_KEY } from '@/renderer/utils/ui/logoVisibility';
import { readHiddenNavItems } from '@/renderer/utils/ui/siderVisibility';

afterEach(() => {
  localStorage.clear();
});

describe('NavigationSettings', () => {
  it('renders a switch for the logo and every toggleable nav item', () => {
    render(<NavigationSettings />);
    expect(screen.getByTestId('nav-settings-logo-switch')).toBeInTheDocument();
    for (const id of [
      'conversations',
      'search',
      'projects',
      'assistants',
      'workflows',
      'scheduled',
      'teams',
      'memory',
    ]) {
      expect(screen.getByTestId(`nav-settings-item-switch-${id}`)).toBeInTheDocument();
    }
  });

  it('turning the logo switch on persists visibility', () => {
    render(<NavigationSettings />);
    fireEvent.click(screen.getByTestId('nav-settings-logo-switch'));
    expect(localStorage.getItem(LOGO_VISIBLE_STORAGE_KEY)).toBe('true');
  });

  it('turning a nav-item switch off hides that item', () => {
    render(<NavigationSettings />);
    // Items are visible by default → clicking hides them.
    fireEvent.click(screen.getByTestId('nav-settings-item-switch-search'));
    expect(readHiddenNavItems()).toContain('search');
  });
});
