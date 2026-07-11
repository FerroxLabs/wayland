/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  computeCssSyncDecision,
  resolveCssByActiveTheme,
  setExtensionThemesCache,
} from '@/renderer/utils/theme/themeCssSync';

afterEach(() => {
  setExtensionThemesCache([]);
});

describe('themeCssSync', () => {
  it('resolves extension-contributed themes alongside user themes', () => {
    setExtensionThemesCache([
      {
        id: 'ext-wl-project-workspace-appearance-project-workspace-polish',
        name: 'Project Workspace Polish',
        css: '[data-appearance-role="project-card"] { border-radius: 10px; }',
        isPreset: true,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);

    expect(resolveCssByActiveTheme('ext-wl-project-workspace-appearance-project-workspace-polish', [])).toContain(
      'project-card'
    );
  });

  it('heals saved custom CSS from an active extension theme', () => {
    setExtensionThemesCache([
      {
        id: 'ext-wl-project-workspace-appearance-project-workspace-polish',
        name: 'Project Workspace Polish',
        css: '[data-appearance-surface="projects-list"] { padding: 2px; }',
        isPreset: true,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);

    const decision = computeCssSyncDecision({
      savedCss: '',
      activeThemeId: 'ext-wl-project-workspace-appearance-project-workspace-polish',
      savedThemes: [],
      currentUiCss: '',
      lastUiCssUpdateAt: 0,
      now: 10_000,
    });

    expect(decision).toEqual({
      shouldSkipApply: false,
      shouldHealStorage: true,
      effectiveCss: '[data-appearance-surface="projects-list"] { padding: 2px; }',
    });
  });
});
