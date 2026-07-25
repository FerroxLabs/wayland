/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ICreateConversationParams } from '@/common/adapter/ipcBridge';

const { mkdir, recordManagedWorkspaceProvenance } = vi.hoisted(() => ({
  mkdir: vi.fn(async () => undefined),
  recordManagedWorkspaceProvenance: vi.fn(async () => undefined),
}));

// createAcpAgent only touches the filesystem via fs mkdir + the skill-symlink
// helpers; stub them so the test exercises pure extra-field mapping.
vi.mock('fs/promises', () => ({
  default: {
    mkdir,
    realpath: vi.fn(async (value: string) => value),
    stat: vi.fn(async () => {
      throw new Error('ENOENT');
    }),
    lstat: vi.fn(async (value: string) => {
      // Separator-agnostic: the code under test resolves this path, and on
      // Windows path.resolve('/mock/work/x') is 'C:\\mock\\work\\x', so a
      // startsWith('/mock/work/') check missed every time and this mock threw
      // ENOENT on the runner while matching fine on POSIX.
      if (value.split(path.sep).join('/').includes('/mock/work/')) {
        return { isSymbolicLink: () => false, isDirectory: () => true, dev: 7, ino: 11 };
      }
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
vi.mock('@process/utils/utils', () => ({ getDataPath: vi.fn(() => '/mock/data') }));
vi.mock('@process/services/kickoff/installUuid', () => ({
  getInstallUuid: vi.fn(async () => 'desktop-test-installation'),
}));
vi.mock('@process/services/managedWorkspaceProvenance', () => ({ recordManagedWorkspaceProvenance }));
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

  it('records process-owned provenance when Desktop creates a temporary workspace', async () => {
    const conv = await createAcpAgent({
      type: 'acp',
      model: {} as never,
      name: 'Temporary Hermes',
      extra: { backend: 'hermes', customWorkspace: false },
    } as ICreateConversationParams);

    expect(recordManagedWorkspaceProvenance).toHaveBeenCalledWith({
      authorityRoot: '/mock/data',
      workRoot: '/mock/work',
      workspace: conv.extra.workspace,
      installationId: 'desktop-test-installation',
      creationIdentity: {
        canonicalRoot: '/mock/work',
        canonicalPath: conv.extra.workspace,
        device: 7,
        inode: 11,
      },
    });
  });

  it('never adopts a pre-existing predictable workspace or mints provenance for it', async () => {
    const now = 1_736_900_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    mkdir
      .mockImplementationOnce(async () => undefined)
      .mockRejectedValueOnce(Object.assign(new Error('already exists'), { code: 'EEXIST' }));

    const conv = await createAcpAgent({
      type: 'acp',
      model: {} as never,
      name: 'Temporary Hermes',
      extra: { backend: 'hermes', customWorkspace: false },
    } as ICreateConversationParams);

    const predictable = `/mock/work/hermes-temp-${now}`;
    expect(mkdir).toHaveBeenNthCalledWith(2, predictable, { recursive: false, mode: 0o700 });
    expect(conv.extra.workspace).not.toBe(predictable);
    expect(String(conv.extra.workspace)).toMatch(new RegExp(`^${predictable}\\d{39}$`));
    expect(recordManagedWorkspaceProvenance).toHaveBeenCalledWith(
      expect.objectContaining({ workspace: conv.extra.workspace })
    );
    expect(recordManagedWorkspaceProvenance).not.toHaveBeenCalledWith(
      expect.objectContaining({ workspace: predictable })
    );
  });

  it('never records managed provenance for a user-selected workspace', async () => {
    await createAcpAgent({
      type: 'acp',
      model: {} as never,
      name: 'Custom Hermes',
      extra: baseExtra({}),
    } as ICreateConversationParams);

    expect(recordManagedWorkspaceProvenance).not.toHaveBeenCalled();
  });
});
