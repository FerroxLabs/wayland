/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="@testing-library/jest-dom/vitest" />

/**
 * #730 — a local extension settings iframe (sandboxed, no same-origin) can't
 * read the host's theme, so the host must forward Wayland's resolved app theme.
 * These tests pin that: the initial `aion:init` carries the resolved theme, and
 * a live app-theme switch reposts it via `aion:theme` (so the panel stops
 * rendering light inside always-dark Wayland).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@/common/adapter/ipcBridge', () => ({
  extensions: {
    getExtI18nForLocale: { invoke: vi.fn().mockResolvedValue({}) },
    getAgentActivitySnapshot: { invoke: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('@/renderer/components/media/WebviewHost', () => ({ default: () => null }));

vi.mock('@/renderer/utils/platform', () => ({
  resolveExtensionAssetUrl: (url: string) => url,
}));

vi.mock('@/renderer/pages/settings/utils/waylandUpdaterBridge', () => ({
  runWaylandUpdaterExtensionCheck: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en-US' } }),
}));

import ExtensionSettingsTabContent from '@/renderer/components/settings/SettingsModal/contents/ExtensionSettingsTabContent';

const LOCAL_URL = 'wayland-asset://wayland-updater/settings/updater.html';

function renderTab() {
  const utils = render(<ExtensionSettingsTabContent entryUrl={LOCAL_URL} tabId='t1' extensionName='wayland-updater' />);
  const iframe = utils.container.querySelector('iframe') as HTMLIFrameElement;
  const post = vi.spyOn(iframe.contentWindow as Window, 'postMessage').mockImplementation(() => {});
  return { ...utils, iframe, post };
}

beforeEach(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
});

describe('ExtensionSettingsTabContent theme forwarding (#730)', () => {
  it('includes the resolved app theme in the aion:init payload', async () => {
    const { iframe, post } = renderTab();
    // onLoad clears the loading flag, which triggers the locale/theme init post.
    fireEvent.load(iframe);

    await waitFor(() => {
      const init = post.mock.calls.find((c) => (c[0] as { type?: string })?.type === 'aion:init')?.[0] as
        | { theme?: string }
        | undefined;
      expect(init?.theme).toBe('dark');
    });
  });

  it('reposts the theme via aion:theme when the app theme changes', async () => {
    const { post } = renderTab();

    document.documentElement.setAttribute('data-theme', 'light');

    await waitFor(() => {
      const themeMsg = post.mock.calls.find((c) => (c[0] as { type?: string })?.type === 'aion:theme')?.[0] as
        | { theme?: string }
        | undefined;
      expect(themeMsg?.theme).toBe('light');
    });
  });
});
