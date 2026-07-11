/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Settings sidebar - Packet 3A nav restructure contract.
 *
 * Spec §4.1: Settings → Providers is renamed to **Models**. Agents moves into
 * the **AI Models** nav group beside Models, joining Image Generation and
 * Voice. Workspace keeps Assistants, Skills & Tools, and Constitution.
 *
 * The sidebar reads its tab order from `BUILTIN_TAB_IDS` and decides where
 * group headers render from `GROUP_HEADER_BEFORE`. The test asserts both -
 * the visible label flips to "Models", the route is `models`, and the
 * AI Models group contains `models` + `agents` (with `images` + `voice`
 * still present per the spec).
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { extensionTabsMock } = vi.hoisted(() => ({
  extensionTabsMock: vi.fn(() => []),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // The sidebar passes defaults via `{ defaultValue: 'Models' }`; return the
    // default so the assertions read the English label instead of the i18n key.
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts === 'object' && typeof opts.defaultValue === 'string') {
        return opts.defaultValue;
      }
      // Group headers don't carry a default - strip the prefix and return the
      // last segment so the test can match "groupAiModels" / "groupWorkspace".
      const last = key.split('.').pop();
      return last ?? key;
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => React.createElement('span', null, i18nKey),
}));

// The sidebar pulls extension tabs through `ipcBridge.extensions.getSettingsTabs`.
// The test isn't about extension behavior - return an empty list and a no-op
// subscription so the sidebar settles on its builtin order.
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
  isElectronDesktop: () => true,
  resolveExtensionAssetUrl: (url: string) => url,
}));

// Import after the mocks register.
import SettingsSider, {
  BUILTIN_TAB_IDS,
  LEGACY_ANCHOR_REMAP,
} from '../../../src/renderer/pages/settings/components/SettingsSider';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsSider - Packet 3A nav restructure', () => {
  beforeEach(() => {
    extensionTabsMock.mockReturnValue([]);
  });

  it('renames the legacy Providers sidebar entry to "Models" pointing at /settings/models', () => {
    render(
      <MemoryRouter>
        <SettingsSider />
      </MemoryRouter>
    );

    const modelsItem = document.querySelector('[data-settings-id="models"]');
    expect(modelsItem).not.toBeNull();
    expect(modelsItem?.getAttribute('data-settings-path')).toBe('models');
    // The visible label is the new "Models" string (the legacy "Providers"
    // label is no longer rendered from a builtin entry).
    expect(modelsItem?.textContent).toContain('Models');
    expect(document.querySelector('[data-settings-id="providers"]')).toBeNull();
  });

  it('places Models, Agents, Image Generation, and Voice in the AI Models group', () => {
    // The group is structural: `BUILTIN_TAB_IDS` defines order, and the spec
    // says AI Models contains Models · Agents · Image Generation · Voice in
    // that order. Assert the contract on the constant - the sidebar render
    // is just a side-effect of it.
    const aiModelsStart = BUILTIN_TAB_IDS.indexOf('models');
    expect(aiModelsStart).toBeGreaterThanOrEqual(0);
    expect(BUILTIN_TAB_IDS[aiModelsStart]).toBe('models');
    expect(BUILTIN_TAB_IDS[aiModelsStart + 1]).toBe('agents');
    expect(BUILTIN_TAB_IDS[aiModelsStart + 2]).toBe('images');
    expect(BUILTIN_TAB_IDS[aiModelsStart + 3]).toBe('voice');
  });

  it('keeps Workspace (assistants, skills, constitution) ahead of AI Models', () => {
    // The Agents entry is no longer in Workspace - it lives next to Models.
    // The Workspace group must still hold the other three entries.
    const workspaceIds = ['assistants', 'skills', 'constitution'];
    for (const id of workspaceIds) {
      const idx = BUILTIN_TAB_IDS.indexOf(id);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(BUILTIN_TAB_IDS.indexOf('models'));
    }
  });

  it('remaps legacy /providers, /gemini, and /model extension anchors to the new Models tab', () => {
    // Extensions that anchor their settings tab to the OLD `providers` /
    // `gemini` / `model` ids should land beside the new `models` tab so an
    // unmodified extension keeps working after the rename.
    expect(LEGACY_ANCHOR_REMAP.providers).toBe('models');
    expect(LEGACY_ANCHOR_REMAP.gemini).toBe('models');
    expect(LEGACY_ANCHOR_REMAP.model).toBe('models');
  });

  it('renders the AI Models group header before the Models item', async () => {
    render(
      <MemoryRouter>
        <SettingsSider />
      </MemoryRouter>
    );

    // The group header appears as a sibling immediately before the `models`
    // item. The mock returns the last segment of the i18n key, so the header
    // text is "groupAiModels".
    const header = await screen.findByText('groupAiModels');
    expect(header).toBeTruthy();
    // The header should sit before the Models row in DOM order - that is the
    // contract from `GROUP_HEADER_BEFORE` plus the sidebar render loop.
    const modelsItem = document.querySelector('[data-settings-id="models"]');
    expect(modelsItem).not.toBeNull();
    expect(header.compareDocumentPosition(modelsItem as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps extension settings tabs out of the main Settings sidebar', async () => {
    extensionTabsMock.mockReturnValue([
      {
        id: 'ext-noisy-tools',
        name: 'Noisy Tools',
        entryUrl: 'wayland-asset://extension/noisy/settings.html',
        position: { anchor: 'extensions', placement: 'after' },
      },
    ]);

    render(
      <MemoryRouter>
        <SettingsSider />
      </MemoryRouter>
    );

    expect(document.querySelector('[data-settings-id="extensions"]')).not.toBeNull();
    expect(document.querySelector('[data-settings-id="ext-noisy-tools"]')).toBeNull();
  });
});
