/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #997 - the settings rail must not offer "Wayland Core" to a WebUI/remote
 * client. The route guard in Router.tsx closes the deep-link door; this closes
 * the one the user can actually click.
 *
 * Mirrors the mock setup of settingsSiderNav.dom.test.tsx, flipping only
 * `isElectronDesktop` so the same sidebar is asserted on both runtimes.
 */

import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { extensionTabsMock, isElectronDesktopMock } = vi.hoisted(() => ({
  extensionTabsMock: vi.fn(() => []),
  isElectronDesktopMock: vi.fn(() => true),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts === 'object' && typeof opts.defaultValue === 'string') {
        return opts.defaultValue;
      }
      return key.split('.').pop() ?? key;
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => React.createElement('span', null, i18nKey),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  extensions: {
    getSettingsTabs: { invoke: vi.fn(() => Promise.resolve(extensionTabsMock())) },
    stateChanged: { on: vi.fn(() => () => {}) },
  },
}));

vi.mock('@/renderer/hooks/system/useExtI18n', () => ({
  useExtI18n: () => ({ resolveExtTabName: (tab: { name: string }) => tab.name }),
}));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => isElectronDesktopMock(),
  resolveExtensionAssetUrl: (url: string) => url,
}));

import SettingsSider from '@/renderer/pages/settings/components/SettingsSider';

const renderSider = () =>
  render(
    <MemoryRouter>
      <SettingsSider />
    </MemoryRouter>
  );

describe('#997 SettingsSider gates the Wayland Core entry on the desktop runtime', () => {
  beforeEach(() => {
    extensionTabsMock.mockReturnValue([]);
    isElectronDesktopMock.mockReturnValue(true);
  });

  it('renders the Wayland Core entry in the Electron desktop app', () => {
    renderSider();

    const item = document.querySelector('[data-settings-id="wcore"]');
    expect(item).not.toBeNull();
    expect(item?.getAttribute('data-settings-path')).toBe('wcore-config');
  });

  it('omits the Wayland Core entry for a WebUI/remote client', () => {
    isElectronDesktopMock.mockReturnValue(false);

    renderSider();

    expect(document.querySelector('[data-settings-id="wcore"]')).toBeNull();
    // Only the desktop-only entry is dropped - the rest of the rail is intact.
    expect(document.querySelector('[data-settings-id="models"]')).not.toBeNull();
    expect(document.querySelector('[data-settings-id="general"]')).not.toBeNull();
  });

  it('drops the ENGINE group header with it rather than orphaning it', () => {
    // `wcore` anchors that header and is its only member, so a remote rail must
    // not render a group heading with nothing underneath.
    renderSider();
    expect(screen.queryByText('groupEngine')).not.toBeNull();

    cleanup();
    isElectronDesktopMock.mockReturnValue(false);
    renderSider();

    expect(screen.queryByText('groupEngine')).toBeNull();
    // Neighbouring group headings are untouched.
    expect(screen.queryByText('groupAiModels')).not.toBeNull();
    expect(screen.queryByText('groupIntegrations')).not.toBeNull();
  });
});
