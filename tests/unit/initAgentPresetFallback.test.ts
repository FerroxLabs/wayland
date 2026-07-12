/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ICreateConversationParams } from '@/common/adapter/ipcBridge';

// createAcpAgent only touches the filesystem via fs mkdir + the skill-symlink
// helpers; stub them so the test exercises pure extra-field mapping.
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn(async () => undefined),
    stat: vi.fn(async () => {
      throw new Error('ENOENT');
    }),
    lstat: vi.fn(async () => {
      throw new Error('ENOENT');
    }),
    symlink: vi.fn(async () => undefined),
    readdir: vi.fn(async () => []),
  },
}));
vi.mock('fs', () => ({ existsSync: vi.fn(() => false) }));
vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: vi.fn(() => '/mock/skills'),
  getBuiltinSkillsCopyDir: vi.fn(() => '/mock/builtin-skills'),
  getAutoSkillsDir: vi.fn(() => '/mock/auto-skills'),
  getSystemDir: vi.fn(() => ({ workDir: '/mock/work' })),
  ProcessConfig: { get: vi.fn(async () => undefined), set: vi.fn(async () => undefined) },
}));
vi.mock('@process/utils/openclawUtils', () => ({ computeOpenClawIdentityHash: vi.fn(() => 'h') }));
vi.mock('@/common/utils', () => ({ uuid: vi.fn(() => 'mock-uuid') }));

const baseExtra = (over: Record<string, unknown>): ICreateConversationParams['extra'] =>
  ({ workspace: '/tmp/ws', customWorkspace: true, backend: 'hermes', ...over }) as ICreateConversationParams['extra'];

describe('createAcpAgent - preset customAgentId fallback (#66)', () => {
  let createAcpAgent: (o: ICreateConversationParams) => Promise<{ extra: Record<string, unknown> }>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@process/utils/initAgent');
    createAcpAgent = mod.createAcpAgent as never;
  });

  it('backfills customAgentId from presetAssistantId when customAgentId is absent', async () => {
    // A 1:1 preset spawn: buildAgentConversationParams sets presetAssistantId only.
    // Without the fallback, customAgentId is undefined and the assistants-store
    // lookup misses → HERMES_PROFILE env is dropped.
    const conv = await createAcpAgent({
      type: 'acp',
      model: {} as never,
      name: 'Hermes (marketing)',
      extra: baseExtra({ presetAssistantId: 'hermes-profile-marketing' }),
    } as ICreateConversationParams);
    expect(conv.extra.customAgentId).toBe('hermes-profile-marketing');
    expect(conv.extra.presetAssistantId).toBe('hermes-profile-marketing');
  });

  it('keeps an explicit customAgentId (it wins over presetAssistantId)', async () => {
    const conv = await createAcpAgent({
      type: 'acp',
      model: {} as never,
      name: 'Custom',
      extra: baseExtra({ customAgentId: 'custom-42', presetAssistantId: 'hermes-profile-x' }),
    } as ICreateConversationParams);
    expect(conv.extra.customAgentId).toBe('custom-42');
  });

  it('leaves customAgentId undefined when neither id is present', async () => {
    const conv = await createAcpAgent({
      type: 'acp',
      model: {} as never,
      name: 'Plain',
      extra: baseExtra({}),
    } as ICreateConversationParams);
    expect(conv.extra.customAgentId).toBeUndefined();
  });
});
