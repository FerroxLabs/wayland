/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #997 - the COMPACT settings layout must not offer Wayland Core to a
 * WebUI/remote client either.
 *
 * `settingsSiderWcoreGating.dom.test.tsx` covers the wide-layout rail
 * (SettingsSider). This covers the other consumer: `getVisibleSettingsNavItems`
 * is the single expression behind `menuItems` in SettingsPageWrapper, which
 * feeds the mobile top-nav dropdown and `activeNavItem`. Without this, a
 * regression there silently re-offers the page on the compact layout.
 *
 * That would be a UX leak rather than a capability leak - the router gate still
 * refuses the destination and the server-side allowlist is untouched either way
 * - but a nav entry that bounces the user to General settings is exactly the
 * dead click this PR exists to remove.
 */

import { describe, expect, it } from 'vitest';
import {
  getBuiltinSettingsNavItems,
  getVisibleSettingsNavItems,
} from '@/renderer/pages/settings/components/SettingsPageWrapper';

const t = ((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key) as never;

describe('#997 SettingsPageWrapper compact nav gating', () => {
  it('offers Wayland Core on the Electron desktop runtime', () => {
    expect(getVisibleSettingsNavItems(true, t).map((item) => item.id)).toContain('wcore');
  });

  it('drops Wayland Core for a WebUI/remote client', () => {
    expect(getVisibleSettingsNavItems(false, t).map((item) => item.id)).not.toContain('wcore');
  });

  it('drops nothing else - the remote nav is the desktop nav minus wcore', () => {
    const desktop = getVisibleSettingsNavItems(true, t).map((item) => item.id);
    const remote = getVisibleSettingsNavItems(false, t).map((item) => item.id);

    expect(remote).toEqual(desktop.filter((id) => id !== 'wcore'));
    // Order is preserved, not just membership.
    expect(remote).toEqual([...remote].sort((a, b) => desktop.indexOf(a) - desktop.indexOf(b)));
  });

  it('leaves the catalog builder untouched - it is the nav order contract', () => {
    // getBuiltinSettingsNavItems must keep returning every id on BOTH runtimes;
    // SettingsPageWrapper.test.ts pins that list and must not be weakened.
    expect(getBuiltinSettingsNavItems(false, t).map((item) => item.id)).toContain('wcore');
    expect(getBuiltinSettingsNavItems(true, t).map((item) => item.id)).toContain('wcore');
  });
});
