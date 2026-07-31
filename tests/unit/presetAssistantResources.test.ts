/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  loadPresetAssistantResources,
  type PresetAssistantResourceDeps,
} from '../../src/renderer/utils/model/presetAssistantResources';

function createDeps(overrides: Partial<PresetAssistantResourceDeps> = {}): PresetAssistantResourceDeps {
  return {
    readAssistantRule: vi.fn(async () => ''),
    readAssistantSkill: vi.fn(async () => ''),
    readBuiltinRule: vi.fn(async () => ''),
    readBuiltinSkill: vi.fn(async () => ''),
    getEnabledSkills: vi.fn(async () => undefined),
    getDisabledBuiltinSkills: vi.fn(async () => undefined),
    warn: vi.fn(),
    ...overrides,
  };
}

describe('loadPresetAssistantResources', () => {
  it('returns fallback rules when there is no custom assistant id', async () => {
    const deps = createDeps();

    await expect(
      loadPresetAssistantResources(
        {
          localeKey: 'zh-CN',
          fallbackRules: 'fallback rules',
        },
        deps
      )
    ).resolves.toEqual({
      rules: 'fallback rules',
      skills: '',
      enabledSkills: undefined,
      disabledBuiltinSkills: undefined,
    });
  });

  it('loads user resources and enabled skills first', async () => {
    const deps = createDeps({
      readAssistantRule: vi.fn(async () => 'user rules'),
      readAssistantSkill: vi.fn(async () => 'user skills'),
      getEnabledSkills: vi.fn(async () => ['pptx', 'xlsx']),
    });

    await expect(
      loadPresetAssistantResources(
        {
          customAgentId: 'assistant-1',
          localeKey: 'zh-CN',
          fallbackRules: 'fallback rules',
        },
        deps
      )
    ).resolves.toEqual({
      rules: 'user rules',
      skills: 'user skills',
      enabledSkills: ['pptx', 'xlsx'],
      disabledBuiltinSkills: undefined,
    });
  });

  it('falls back to builtin preset resources and warns when user resources fail', async () => {
    const deps = createDeps({
      readAssistantRule: vi.fn(async () => {
        throw new Error('missing user rule');
      }),
      readAssistantSkill: vi.fn(async () => {
        throw new Error('missing user skill');
      }),
      readBuiltinRule: vi.fn(async () => 'builtin rules'),
      readBuiltinSkill: vi.fn(async () => 'builtin skills'),
      getEnabledSkills: vi.fn(async () => ['moltbook']),
    });

    const result = await loadPresetAssistantResources(
      {
        customAgentId: 'builtin-moltbook',
        localeKey: 'zh-CN',
        fallbackRules: 'fallback rules',
      },
      deps
    );

    expect(result).toEqual({
      rules: 'builtin rules',
      skills: 'builtin skills',
      enabledSkills: ['moltbook'],
      disabledBuiltinSkills: undefined,
    });
    expect(deps.readBuiltinRule).toHaveBeenCalledOnce();
    expect(deps.readBuiltinSkill).toHaveBeenCalledOnce();
    expect(deps.warn).toHaveBeenCalledTimes(2);
  });

  it('does not revive Cowork legacy skill-file instructions', async () => {
    const deps = createDeps({
      readBuiltinRule: vi.fn(async () => 'cowork rules'),
      readBuiltinSkill: vi.fn(async () => 'obsolete cowork skills'),
      getEnabledSkills: vi.fn(async () => ['officecli-docx', 'pdf']),
    });

    await expect(
      loadPresetAssistantResources(
        {
          customAgentId: 'builtin-cowork',
          localeKey: 'en-US',
          fallbackRules: 'fallback rules',
        },
        deps
      )
    ).resolves.toEqual({
      rules: 'cowork rules',
      skills: '',
      enabledSkills: ['officecli-docx', 'pdf'],
      disabledBuiltinSkills: undefined,
    });
    expect(deps.readBuiltinRule).toHaveBeenCalledOnce();
    expect(deps.readBuiltinSkill).not.toHaveBeenCalled();
  });
});
