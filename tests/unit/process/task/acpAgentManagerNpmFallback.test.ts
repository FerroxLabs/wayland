/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A builtin backend that publishes itself on npm declares `defaultCliPath`
 * (`npx <pkg>@<pin>`). Before this guard, that field was consulted for
 * EXTENSION rows and CUSTOM-AGENT rows only - builtin resolution stopped at
 * `cliCommand`, so a backend pinned to a released npm build was still
 * unlaunchable on any machine that had never installed the CLI: the pin
 * declared a distribution nothing ever launched from, and the spawn died with
 * ENOENT on the bare command.
 *
 * The ordering is the substance of this file, not the fallback itself:
 * a copy the USER installed has to keep winning. We only reach for npm when
 * PATH genuinely cannot serve the command - the case that is otherwise a
 * guaranteed failure. The bundled Fuigo engine is the exception: it is never
 * a PATH lookup, so its verified bundled binary wins over everything.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGet, mockIsCliAvailable, mockResolveFuigoBinary } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockIsCliAvailable: vi.fn(),
  mockResolveFuigoBinary: vi.fn(),
}));

vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: { isCliAvailable: mockIsCliAvailable },
}));
// `resolveFuigoBinary` probes the REAL filesystem (bundled resource, dev
// resources), so leaving it unmocked would make the Fuigo cases depend on
// whether this machine has a staged engine.
vi.mock('@process/agent/fuigo/runtime', () => ({
  resolveFuigoBinary: mockResolveFuigoBinary,
}));
vi.mock('@process/permissions/workspaceTrust', () => ({ isWorkspaceTrusted: vi.fn(() => false) }));
vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn(), isProcessing: vi.fn(() => false) },
}));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: mockGet },
}));
vi.mock('@/common', () => ({ ipcBridge: { acpConversation: { responseStream: { emit: vi.fn() } } } }));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve({ updateConversation: vi.fn(), getConversation: vi.fn() })),
}));
vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: vi.fn(),
  nextTickToLocalFinish: vi.fn((cb: () => void) => cb()),
}));
vi.mock('@process/channels/agent/ChannelEventBus', () => ({
  channelEventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn(), emitAgentMessage: vi.fn() },
}));
vi.mock('@process/utils/previewUtils', () => ({ handlePreviewOpenEvent: vi.fn() }));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: vi.fn(() => ({ getAll: vi.fn(() => []), getAcpAdapters: vi.fn(() => []) })) },
}));
vi.mock('@process/agent/acp', () => ({
  AcpAgent: class {
    sendMessage = vi.fn().mockResolvedValue({ success: true });
    stop = vi.fn();
    kill = vi.fn();
    cancelPrompt = vi.fn();
  },
}));
vi.mock('@process/task/BaseAgentManager', () => ({
  default: class {
    conversation_id = '';
    workspace = '';
    yoloMode = false;
    currentMode = 'default';
    constructor(_type: string, data: Record<string, unknown>) {
      if (data?.conversation_id) this.conversation_id = data.conversation_id as string;
      if (data?.workspace) this.workspace = data.workspace as string;
    }
    isYoloMode() {
      return false;
    }
  },
}));
vi.mock('@process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: { getInstance: () => ({ notifyPotentialCompletion: vi.fn() }) },
}));
vi.mock('@process/task/IpcAgentEventEmitter', () => ({ IpcAgentEventEmitter: vi.fn() }));
vi.mock('@process/task/CronCommandDetector', () => ({ hasCronCommands: vi.fn(() => false) }));
vi.mock('@process/task/MessageMiddleware', () => ({
  extractTextFromMessage: vi.fn(() => ''),
  processCronInMessage: vi.fn((x: unknown) => x),
}));
vi.mock('@process/task/ThinkTagDetector', () => ({ stripThinkTags: vi.fn((x: unknown) => x) }));
vi.mock('@process/utils/initAgent', () => ({ hasNativeSkillSupport: vi.fn(() => false) }));
vi.mock('@process/task/agentUtils', () => ({
  prepareFirstMessageWithSkillsIndex: vi.fn((x: string) => Promise.resolve({ content: x, loadedSkills: [] })),
}));
vi.mock('@/common/utils', () => ({ parseError: vi.fn((e: unknown) => e), uuid: vi.fn(() => 'test-uuid') }));
vi.mock('@/common/chat/chatLib', () => ({ transformMessage: vi.fn(), uuid: vi.fn(() => 'uuid') }));

import AcpAgentManager from '../../../../src/process/task/AcpAgentManager';
import { ACP_BACKENDS_ALL, CODEX_ACP_NPX_PACKAGE, type AcpBackend } from '../../../../src/common/types/acpTypes';

type Resolver = (data: Record<string, unknown>) => Promise<{ cliPath?: string }>;

function resolveBuiltin(backend: AcpBackend): Resolver {
  const manager = new AcpAgentManager({ conversation_id: 'c1', backend, workspace: '/tmp/ws' });
  return (data) => (manager as unknown as { resolveBuiltinBackendConfig: Resolver }).resolveBuiltinBackendConfig(data);
}

describe('resolveBuiltinBackendConfig — npm fallback for builtins', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue(undefined);
    mockIsCliAvailable.mockReset();
    mockResolveFuigoBinary.mockReset();
    mockResolveFuigoBinary.mockReturnValue(null);
  });

  it('falls back to the pinned npm package when codex is NOT on PATH', async () => {
    mockIsCliAvailable.mockReturnValue(false);

    const res = await resolveBuiltin('codex')({ backend: 'codex' });

    expect(res.cliPath).toBe(`npx ${CODEX_ACP_NPX_PACKAGE}`);
    expect(mockIsCliAvailable).toHaveBeenCalledWith('codex');
  });

  it("prefers the user's own binary when codex IS on PATH", async () => {
    // A locally installed copy must outrank anything we fetch.
    mockIsCliAvailable.mockReturnValue(true);

    const res = await resolveBuiltin('codex')({ backend: 'codex' });

    expect(res.cliPath).toBe('codex');
    expect(res.cliPath).not.toContain('npx');
  });

  it('resolves the bundled Fuigo engine from the app bundle, never from PATH', async () => {
    // The bundled engine is not a PATH lookup: a stray `fuigo` on PATH must not
    // shadow the verified bundled binary.
    mockIsCliAvailable.mockReturnValue(true);
    mockResolveFuigoBinary.mockReturnValue({ path: '/opt/wayland/resources/fuigo', source: 'bundled' });

    const res = await resolveBuiltin('fuigo')({ backend: 'fuigo', workspace: '/tmp/ws' });

    expect(res.cliPath).toBe('/opt/wayland/resources/fuigo');
    expect(res.cliPath).not.toBe('fuigo');
    expect(mockIsCliAvailable).not.toHaveBeenCalled();
  });

  it('quotes a resolved Fuigo binary path that contains whitespace', async () => {
    // macOS userData lives under "Application Support"; an unquoted path would
    // be split into two tokens by the spawn config.
    mockResolveFuigoBinary.mockReturnValue({ path: '/Users/x/Application Support/fuigo', source: 'bundled' });

    const res = await resolveBuiltin('fuigo')({ backend: 'fuigo', workspace: '/tmp/ws' });

    expect(res.cliPath).toBe('"/Users/x/Application Support/fuigo"');
  });

  it('refuses to launch Fuigo when no verified bundled binary is present', async () => {
    mockResolveFuigoBinary.mockReturnValue(null);

    await expect(resolveBuiltin('fuigo')({ backend: 'fuigo', workspace: '/tmp/ws' })).rejects.toThrow(
      'Verified bundled Fuigo engine is unavailable.'
    );
  });

  it('never overrides an explicitly configured cliPath, and does not even probe PATH', async () => {
    mockIsCliAvailable.mockReturnValue(false);

    const res = await resolveBuiltin('codex')({ backend: 'codex', cliPath: '/opt/custom/codex' });

    expect(res.cliPath).toBe('/opt/custom/codex');
    expect(mockIsCliAvailable).not.toHaveBeenCalled();
  });

  it('leaves a backend with no defaultCliPath untouched and skips the PATH probe entirely', async () => {
    // The probe is an execSync `which`. Backends without an npm fallback are the
    // large majority, and paying a process spawn on every one of their launches
    // to learn nothing would be a real regression on the spawn path.
    mockIsCliAvailable.mockReturnValue(false);
    expect(ACP_BACKENDS_ALL.goose.defaultCliPath).toBeUndefined();

    const res = await resolveBuiltin('goose')({ backend: 'goose' });

    expect(res.cliPath).toBe(ACP_BACKENDS_ALL.goose.cliCommand);
    expect(mockIsCliAvailable).not.toHaveBeenCalled();
  });

  it('applies the same rule to every builtin that publishes an npm fallback', async () => {
    // Guards the general rule rather than the single case that motivated it, so
    // a backend gaining a defaultCliPath later inherits the behaviour by default.
    const withNpmFallback = (Object.keys(ACP_BACKENDS_ALL) as AcpBackend[]).filter(
      (id) => ACP_BACKENDS_ALL[id].defaultCliPath && ACP_BACKENDS_ALL[id].cliCommand
    );
    // Known-positive control: if this list is ever empty the assertions below
    // would vacuously pass and prove nothing.
    expect(withNpmFallback).toContain('codex');
    expect(withNpmFallback.length).toBeGreaterThan(1);

    for (const id of withNpmFallback) {
      mockIsCliAvailable.mockReset();
      mockIsCliAvailable.mockReturnValue(false);
      const res = await resolveBuiltin(id)({ backend: id });
      expect(res.cliPath).toBe(ACP_BACKENDS_ALL[id].defaultCliPath);
    }
  });
});
