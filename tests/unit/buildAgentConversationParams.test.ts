/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { describe, expect, it } from 'vitest';
import { buildAgentConversationParams } from '../../src/common/utils/buildAgentConversationParams';

describe('buildAgentConversationParams', () => {
  it('builds ACP params for regular backends', () => {
    const params = buildAgentConversationParams({
      backend: 'qwen',
      name: 'Conversation Name',
      agentName: 'Qwen Code',
      workspace: '/workspace',
      model: {} as any,
      cliPath: '/usr/local/bin/qwen',
      currentModelId: 'qwen3-coder-plus',
      sessionMode: 'yolo',
      extra: {
        teamId: 'team-1',
      },
    });

    expect(params).toEqual({
      type: 'acp',
      name: 'Conversation Name',
      model: {},
      extra: expect.objectContaining({
        workspace: '/workspace',
        customWorkspace: true,
        backend: 'qwen',
        agentName: 'Qwen Code',
        cliPath: '/usr/local/bin/qwen',
        currentModelId: 'qwen3-coder-plus',
        sessionMode: 'yolo',
        teamId: 'team-1',
      }),
    });
  });

  it('builds preset gemini params with rules and enabled skills', () => {
    const params = buildAgentConversationParams({
      backend: 'gemini',
      name: 'Preset Gemini',
      agentName: 'Preset Gemini',
      workspace: '/workspace',
      model: { id: 'provider-1', useModel: 'gemini-2.0-flash' } as any,
      customAgentId: 'assistant-1',
      isPreset: true,
      presetAgentType: 'gemini',
      presetResources: {
        rules: 'PRESET RULES',
        enabledSkills: ['skill-a'],
      },
    });

    expect(params).toEqual({
      type: 'gemini',
      name: 'Preset Gemini',
      model: { id: 'provider-1', useModel: 'gemini-2.0-flash' },
      extra: expect.objectContaining({
        workspace: '/workspace',
        customWorkspace: true,
        presetAssistantId: 'assistant-1',
        presetRules: 'PRESET RULES',
        enabledSkills: ['skill-a'],
      }),
    });
  });

  it('pre-loads an assistant’s assigned skills into sessionSkills (merged + deduped with staged)', () => {
    const params = buildAgentConversationParams({
      backend: 'gemini',
      name: 'Copy Assistant',
      workspace: '/workspace',
      model: { id: 'p', useModel: 'gemini-2.0-flash' } as any,
      customAgentId: 'assistant-1',
      isPreset: true,
      presetAgentType: 'gemini',
      presetResources: { rules: 'R', enabledSkills: ['officecli', 'copywriting'] },
      // A skill the user also staged in the composer "+" menu.
      extra: { sessionSkills: ['copywriting', 'staged-only'] },
    });
    const skills = (params.extra as { sessionSkills?: string[] }).sessionSkills ?? [];
    expect(skills).toEqual(expect.arrayContaining(['officecli', 'copywriting', 'staged-only']));
    // Deduped - 'copywriting' appears once.
    expect(skills.filter((s) => s === 'copywriting')).toHaveLength(1);
  });

  it('does not pre-load any sessionSkills when the assistant has no explicit skill list (uses all skills)', () => {
    const params = buildAgentConversationParams({
      backend: 'gemini',
      name: 'Open Assistant',
      workspace: '/workspace',
      model: { id: 'p', useModel: 'gemini-2.0-flash' } as any,
      customAgentId: 'assistant-2',
      isPreset: true,
      presetAgentType: 'gemini',
      presetResources: { rules: 'R', enabledSkills: [] },
    });
    expect((params.extra as { sessionSkills?: string[] }).sessionSkills).toBeUndefined();
  });

  it('builds remote params with remote agent id', () => {
    const params = buildAgentConversationParams({
      backend: 'remote',
      name: 'Remote Conversation',
      workspace: '/workspace',
      model: {} as any,
      customAgentId: 'remote-agent-id',
    });

    expect(params).toEqual({
      type: 'remote',
      name: 'Remote Conversation',
      model: {},
      extra: expect.objectContaining({
        workspace: '/workspace',
        customWorkspace: true,
        remoteAgentId: 'remote-agent-id',
      }),
    });
  });

  // Fuigo cutover: Teams emit the first-party engine as the literal
  // `wayland-core`. It is a NEW launch, so it routes to the Fuigo ACP backend -
  // never to a fresh Core conversation, and never to `acp` with the alias left
  // in `extra.backend` (which spawns nothing: "No CLI path for backend").
  it('routes the team `wayland-core` backend to acp + fuigo (not wcore)', () => {
    const params = buildAgentConversationParams({
      backend: 'wayland-core',
      name: 'Team Member',
      workspace: '/workspace',
      model: {} as never,
    });
    expect(params.type).toBe('acp');
    expect(params.extra).toHaveProperty('backend', 'fuigo');
  });

  // Vendored agent-profile specialists carry no real backend and leak their
  // preset type `agent-profile`. They are Fuigo presets: the persona lands on
  // `presetContext` (the key the ACP path reads) with backend `fuigo`.
  it('routes an agent-profile specialist to acp + fuigo with its persona on presetContext', () => {
    const params = buildAgentConversationParams({
      backend: 'agent-profile',
      name: 'Agent Profile Specialist',
      workspace: '/workspace',
      model: {} as never,
      isPreset: true,
      presetAgentType: 'agent-profile',
      presetResources: { rules: 'PERSONA' },
    });
    expect(params.type).toBe('acp');
    expect(params.extra).toHaveProperty('backend', 'fuigo');
    expect(params.extra).toHaveProperty('presetContext', 'PERSONA');
    expect(params.extra).not.toHaveProperty('presetRules');
  });

  it('keeps a literal `wcore` backend on the Core manager (existing conversations)', () => {
    const params = buildAgentConversationParams({
      backend: 'wcore',
      name: 'Existing Core Chat',
      workspace: '/workspace',
      model: {} as never,
    });
    expect(params.type).toBe('wcore');
    expect(params.extra).not.toHaveProperty('backend');
  });
});
