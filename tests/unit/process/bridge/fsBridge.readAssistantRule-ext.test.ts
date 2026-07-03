/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Regression test for C1 (cross-audit 2026-05-24): extension-contributed
// assistants (ext-*) shipped without ever reaching the LLM as a system prompt
// because the on-disk filename pattern `${assistantId}.${locale}.md` did not
// match the bare-named files in the waylandteams bundle. The fix in
// fsBridge.readAssistantResource consults ExtensionRegistry first for ext-*
// ids and returns the registry record's `context` field.
//
// This test asserts: when readAssistantRule is invoked for an ext-* id and
// the registry has a matching record with non-empty `context`, the registry
// content is returned. When no registry match exists, the function falls
// through to the (failing) filename lookup and returns ''.

import { describe, expect, it, vi, beforeEach } from 'vitest';

const FAKE_CONTEXT_BODY =
  '# Quiet Money\n\nYou are an educational money coach, not a licensed financial, tax, legal, or insurance professional.';

const mockGetAssistants = vi.fn<() => Array<Record<string, unknown>>>(() => []);

vi.mock('@office-ai/platform', () => {
  const captured = new Map<string, (args: unknown) => unknown>();
  const buildProvider = () => ({
    provider: (cb: (args: unknown) => unknown) => {
      captured.set('LAST', cb);
      return cb;
    },
    invoke: vi.fn(),
  });
  return {
    bridge: {
      buildProvider,
      buildEmitter: () => ({ emit: vi.fn(), on: vi.fn() }),
    },
    __captured: captured,
  };
});

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: () => '/mock/skills',
  getBuiltinSkillsDir: () => '/mock/skills/_builtin',
  getBuiltinSkillsCopyDir: () => '/mock/builtin-skills',
  getAutoSkillsDir: () => '/mock/builtin-skills/_builtin',
  getSystemDir: () => ({
    workDir: '/mock/work',
    cacheDir: '/mock/cache',
    logDir: '/mock/logs',
    platform: 'linux',
    arch: 'x64',
  }),
  getAssistantsDir: () => '/nonexistent/mock/assistants',
  ProcessConfig: {
    get: vi.fn(async () => []),
    set: vi.fn(async () => undefined),
  },
}));

vi.mock('@process/extensions/ExtensionRegistry', () => ({
  ExtensionRegistry: {
    getInstance: () => ({
      getAssistants: mockGetAssistants,
    }),
  },
}));

// Make readAssistantRule provider capturable via ipcBridge mock so we can
// invoke the handler directly without booting the full bridge ecosystem.
const capturedReadAssistantRule = { handler: null as null | ((args: unknown) => Promise<string>) };
vi.mock('@/common', () => ({
  ipcBridge: {
    fs: {
      getFilesByDir: { provider: vi.fn() },
      listWorkspaceFiles: { provider: vi.fn() },
      getImageBase64: { provider: vi.fn() },
      fetchRemoteImage: { provider: vi.fn() },
      readFile: { provider: vi.fn() },
      readFileBuffer: { provider: vi.fn() },
      createTempFile: { provider: vi.fn() },
      createUploadFile: { provider: vi.fn() },
      writeFile: { provider: vi.fn() },
      createZip: { provider: vi.fn() },
      cancelZip: { provider: vi.fn() },
      getFileMetadata: { provider: vi.fn() },
      copyFilesToWorkspace: { provider: vi.fn() },
      removeEntry: { provider: vi.fn() },
      renameEntry: { provider: vi.fn() },
      moveEntry: { provider: vi.fn() },
      readBuiltinRule: { provider: vi.fn() },
      readBuiltinSkill: { provider: vi.fn() },
      readAssistantRule: {
        provider: (cb: (args: unknown) => Promise<string>) => {
          capturedReadAssistantRule.handler = cb;
        },
      },
      writeAssistantRule: { provider: vi.fn() },
      deleteAssistantRule: { provider: vi.fn() },
      readAssistantSkill: { provider: vi.fn() },
      writeAssistantSkill: { provider: vi.fn() },
      deleteAssistantSkill: { provider: vi.fn() },
      listAvailableSkills: { provider: vi.fn() },
      listBuiltinAutoSkills: { provider: vi.fn() },
      readSkillInfo: { provider: vi.fn() },
      importSkill: { provider: vi.fn() },
      scanForSkills: { provider: vi.fn() },
      detectCommonSkillPaths: { provider: vi.fn() },
      detectAndCountExternalSkills: { provider: vi.fn() },
      importSkillWithSymlink: { provider: vi.fn() },
      deleteSkill: { provider: vi.fn() },
      getSkillPaths: { provider: vi.fn() },
      exportSkillWithSymlink: { provider: vi.fn() },
      getCustomExternalPaths: { provider: vi.fn() },
      addCustomExternalPath: { provider: vi.fn() },
      removeCustomExternalPath: { provider: vi.fn() },
      enableSkillsMarket: { provider: vi.fn() },
      disableSkillsMarket: { provider: vi.fn() },
    },
    fileStream: { contentUpdate: { emit: vi.fn() } },
  },
}));

describe('fsBridge.readAssistantRule - ext-* registry-context branch (C1 regression)', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockGetAssistants.mockReset();
    capturedReadAssistantRule.handler = null;
    const { initFsBridge } = await import('@process/bridge/fsBridge');
    initFsBridge();
    expect(capturedReadAssistantRule.handler).toBeTypeOf('function');
  });

  it('returns the registry record context for ext-* ids when the registry has a match', async () => {
    mockGetAssistants.mockReturnValue([
      {
        id: 'ext-quiet-money',
        isPreset: true,
        context: FAKE_CONTEXT_BODY,
      },
    ]);

    const result = await capturedReadAssistantRule.handler!({
      assistantId: 'ext-quiet-money',
      locale: 'en-US',
    });

    expect(result).toBe(FAKE_CONTEXT_BODY);
    expect(mockGetAssistants).toHaveBeenCalled();
  });

  it('falls through to filename lookup (and returns "") when registry has no ext-* match', async () => {
    mockGetAssistants.mockReturnValue([]);

    const result = await capturedReadAssistantRule.handler!({
      assistantId: 'ext-nonexistent',
      locale: 'en-US',
    });

    // Filename lookup against /nonexistent/mock/assistants and builtin
    // candidate dirs will fail; final return is the empty-string fallback.
    expect(result).toBe('');
  });

  it('does NOT consult registry for non-ext ids (builtin-* keeps existing path)', async () => {
    mockGetAssistants.mockReturnValue([
      {
        id: 'builtin-quiet-money',
        isPreset: true,
        context: 'SHOULD_NOT_BE_RETURNED',
      },
    ]);

    const result = await capturedReadAssistantRule.handler!({
      assistantId: 'builtin-quiet-money',
      locale: 'en-US',
    });

    // builtin-* still goes through filename lookup; registry-context branch is
    // ext-* only by design. Filename lookup fails against the mocked dir, so
    // we get '' here - but importantly NOT the SHOULD_NOT_BE_RETURNED string.
    expect(result).not.toBe('SHOULD_NOT_BE_RETURNED');
    expect(mockGetAssistants).not.toHaveBeenCalled();
  });

  it('falls through to filename lookup when registry record exists but context is empty', async () => {
    mockGetAssistants.mockReturnValue([
      {
        id: 'ext-empty-context',
        isPreset: true,
        context: '',
      },
    ]);

    const result = await capturedReadAssistantRule.handler!({
      assistantId: 'ext-empty-context',
      locale: 'en-US',
    });

    // Empty context triggers the fall-through; filename lookup fails too;
    // result is the final '' fallback.
    expect(result).toBe('');
  });
});
