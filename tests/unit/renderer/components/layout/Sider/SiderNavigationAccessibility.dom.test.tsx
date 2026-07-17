/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const translations: Record<string, string> = {
  'common.back': 'Back',
  'common.settings': 'Settings',
  'conversations.siderEntry': 'Conversations',
  'settings.darkMode': 'Dark mode',
  'settings.googleLogout': 'Log out',
  'settings.lightMode': 'Light mode',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => translations[key] ?? options?.defaultValue ?? key,
  }),
}));

vi.mock('@renderer/components/layout/Sider/SiderFooter/SiderFooterQuickActions', () => ({
  SiderFooterQuickActions: () => null,
}));

import SiderFooter from '@renderer/components/layout/Sider/SiderFooter';
import SiderSessionsEntry from '@renderer/components/layout/Sider/SiderNav/SiderSessionsEntry';

describe('sidebar navigation accessibility', () => {
  it.each([false, true])('renders the conversations entry as a named button when collapsed=%s', (collapsed) => {
    const onClick = vi.fn();
    render(
      <SiderSessionsEntry
        isMobile={false}
        isActive={false}
        collapsed={collapsed}
        siderTooltipProps={{}}
        onClick={onClick}
      />
    );

    const button = screen.getByRole('button', { name: 'Conversations' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders settings, logout, and theme actions as named buttons', () => {
    const onSettingsClick = vi.fn();
    const onLogoutClick = vi.fn();
    const onThemeToggle = vi.fn();
    render(
      <SiderFooter
        isMobile={false}
        isSettings
        theme='dark'
        siderTooltipProps={{}}
        onSettingsClick={onSettingsClick}
        onThemeToggle={onThemeToggle}
        showLogout
        onLogoutClick={onLogoutClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    fireEvent.click(screen.getByRole('button', { name: 'Light mode' }));

    expect(onSettingsClick).toHaveBeenCalledOnce();
    expect(onLogoutClick).toHaveBeenCalledOnce();
    expect(onThemeToggle).toHaveBeenCalledOnce();
  });
});
