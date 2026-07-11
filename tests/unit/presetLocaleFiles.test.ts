/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { ASSISTANT_PRESETS } from '../../src/common/config/presets/assistantPresets';
import { planPresetLocaleFileCopies } from '../../src/process/utils/presetLocaleFiles';

describe('planPresetLocaleFileCopies', () => {
  it('copies every locale file that exists', () => {
    const plan = planPresetLocaleFileCopies({ 'en-US': 'a.md', 'zh-CN': 'a.zh-CN.md' }, () => true);

    expect(plan.copies).toEqual([
      { locale: 'en-US', file: 'a.md' },
      { locale: 'zh-CN', file: 'a.zh-CN.md' },
    ]);
    expect(plan.missing).toEqual([]);
    expect(plan.skipped).toEqual([]);
  });

  it('silently skips absent non-default locale variants when the default exists (#719)', () => {
    const exists = (file: string) => file === 'word-creator.md';
    const plan = planPresetLocaleFileCopies(
      {
        'en-US': 'word-creator.md',
        'zh-CN': 'word-creator.zh-CN.md',
        'ru-RU': 'word-creator.ru-RU.md',
      },
      exists
    );

    expect(plan.copies).toEqual([{ locale: 'en-US', file: 'word-creator.md' }]);
    // Never-authored locale variants fall back to en-US at read time - no warning.
    expect(plan.skipped).toEqual([
      { locale: 'zh-CN', file: 'word-creator.zh-CN.md' },
      { locale: 'ru-RU', file: 'word-creator.ru-RU.md' },
    ]);
    expect(plan.missing).toEqual([]);
  });

  it('still flags a missing default-locale file as a packaging error', () => {
    const plan = planPresetLocaleFileCopies({ 'en-US': 'gone.md', 'zh-CN': 'gone.zh-CN.md' }, () => false);

    expect(plan.copies).toEqual([]);
    expect(plan.skipped).toEqual([]);
    expect(plan.missing).toEqual([
      { locale: 'en-US', file: 'gone.md' },
      { locale: 'zh-CN', file: 'gone.zh-CN.md' },
    ]);
  });

  it('flags missing locale variants when there is no default locale to fall back to', () => {
    const plan = planPresetLocaleFileCopies({ 'zh-CN': 'only.zh-CN.md' }, () => false);

    expect(plan.missing).toEqual([{ locale: 'zh-CN', file: 'only.zh-CN.md' }]);
    expect(plan.skipped).toEqual([]);
  });

  it('copies an existing non-default locale variant alongside the default', () => {
    const exists = (file: string) => file === 'concierge.md' || file === 'concierge.zh-CN.md';
    const plan = planPresetLocaleFileCopies({ 'en-US': 'concierge.md', 'zh-CN': 'concierge.zh-CN.md' }, exists);

    expect(plan.copies).toEqual([
      { locale: 'en-US', file: 'concierge.md' },
      { locale: 'zh-CN', file: 'concierge.zh-CN.md' },
    ]);
    expect(plan.skipped).toEqual([]);
    expect(plan.missing).toEqual([]);
  });
});

describe('bundled preset resources (regression for #719)', () => {
  const projectRoot = path.resolve(__dirname, '..', '..');

  it('startup copy plan emits no warnings for any preset with a resourceDir', () => {
    const warnings: string[] = [];

    for (const preset of ASSISTANT_PRESETS) {
      if (!preset.resourceDir) continue;
      const dir = path.join(projectRoot, preset.resourceDir);
      const exists = (file: string) => existsSync(path.join(dir, file));

      const rulePlan = planPresetLocaleFileCopies(preset.ruleFiles, exists);
      for (const { file } of rulePlan.missing) {
        warnings.push(`${preset.id}: rule file missing: ${file}`);
      }

      if (preset.skillFiles) {
        const skillPlan = planPresetLocaleFileCopies(preset.skillFiles, exists);
        for (const { file } of skillPlan.missing) {
          warnings.push(`${preset.id}: skill file missing: ${file}`);
        }
      }
    }

    expect(warnings).toEqual([]);
  });
});
