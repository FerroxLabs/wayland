/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #997 - the Wayland Core settings surface must not be reachable from a
 * WebUI/remote client.
 *
 * The page drives the local engine's `config.toml`, its profile directories and
 * the in-app engine updater; every `wcoreConfig.*` provider behind it is
 * remote-denied in `bridgeAllowlist.ts`. Before the fix the route and its nav
 * entry were ungated, so a paired browser could deep-link a page on which
 * nothing worked.
 *
 * `isElectronDesktop()` is `Boolean(window.electronAPI)`, which the DOM setup
 * installs globally - so "remote" here means deleting it, exactly the shape a
 * browser-served renderer has.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS_NAVIGATION_IDS, visibleSettingsNavigationIds } from '@/common/navigation';

vi.mock('@/renderer/hooks/context/AuthContext', () => ({
  useAuth: () => ({ status: 'authenticated' }),
}));

vi.mock('@/renderer/components/layout/AppLoader', () => ({
  default: () => <div data-testid='app-loader' />,
}));

vi.mock('@/renderer/pages/guid', () => ({
  default: () => <div data-testid='guid-page'>Guid</div>,
}));

vi.mock('@/renderer/pages/settings/WCoreConfig', () => ({
  default: () => <div data-testid='wcore-config-page'>WCore</div>,
}));

vi.mock('@/renderer/pages/settings/GeneralSettings', () => ({
  default: () => <div data-testid='general-settings-page'>General</div>,
}));

import PanelRoute from '@/renderer/components/layout/Router';

const LayoutShell: React.FC = () => <Outlet />;

const desktopApi = (window as unknown as { electronAPI?: unknown }).electronAPI;

/** Drop the Electron preload bridge so `isElectronDesktop()` reports a browser. */
function becomeRemoteClient(): void {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI;
  delete (globalThis as unknown as { electronAPI?: unknown }).electronAPI;
}

describe('#997 Wayland Core settings surface is desktop-only', () => {
  beforeEach(() => {
    window.location.hash = '#/guid';
  });

  afterEach(() => {
    (window as unknown as { electronAPI?: unknown }).electronAPI = desktopApi;
    (globalThis as unknown as { electronAPI?: unknown }).electronAPI = desktopApi;
  });

  it('redirects /settings/wcore-config away on a remote/web client', async () => {
    becomeRemoteClient();
    window.location.hash = '#/settings/wcore-config';

    render(<PanelRoute layout={<LayoutShell />} />);

    expect(await screen.findByTestId('general-settings-page')).toBeInTheDocument();
    expect(screen.queryByTestId('wcore-config-page')).toBeNull();
    expect(window.location.hash).toBe('#/settings/general');
  });

  it('redirects the legacy /settings/wcore deep link away too', async () => {
    becomeRemoteClient();
    window.location.hash = '#/settings/wcore';

    render(<PanelRoute layout={<LayoutShell />} />);

    expect(await screen.findByTestId('general-settings-page')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/settings/general');
  });

  it('still renders the page on the Electron desktop runtime', async () => {
    window.location.hash = '#/settings/wcore-config';

    render(<PanelRoute layout={<LayoutShell />} />);

    expect(await screen.findByTestId('wcore-config-page')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/settings/wcore-config');
  });

  it('keeps the shared visibility helper as the single source of truth', () => {
    expect(visibleSettingsNavigationIds(true)).toEqual([...SETTINGS_NAVIGATION_IDS]);
    expect(visibleSettingsNavigationIds(false)).not.toContain('wcore');
  });
});
