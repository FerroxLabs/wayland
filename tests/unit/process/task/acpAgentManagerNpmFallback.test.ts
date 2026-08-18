/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A builtin backend that publishes itself on npm declares `defaultCliPath`
 * (`npx <pkg>@<pin>`). Before this guard, that field was consulted for
 * EXTENSION rows and CUSTOM-AGENT rows only - builtin resolution stopped at
 * `cliCommand`. So Wayland Nano could be pinned to a released npm build and
 * still be unlaunchable on any machine that had never built the binary: the
 * pin declared a distribution nothing ever launched from, and the spawn died
 * with ENOENT on a bare `wayland-nano`.
 *
 * The ordering is the substance of this file, not the fallback itself:
 * a copy the USER installed has to keep winning. We only reach for npm when
 * PATH genuinely cannot serve the command - the case that is otherwise a
 * guaranteed failure.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGet, mockIsCliAvailable, mockResolveWNanoBinary } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockIsCliAvailable: vi.fn(),
  mockResolveWNanoBinary: vi.fn(),
}));

vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: { isCliAvailable: mockIsCliAvailable },
}));
// `resolveWNanoBinary` probes the REAL filesystem (userData override, bundled
// resource, dev resources) and runs BEFORE the PATH probe below, so leaving it
// unmocked made every assertion here depend on whether the machine happened to
// have Nano installed: green in CI, three failures on any developer box with a
// copy at ~/.local/bin/wayland-nano. The default is null - "no verified binary
// present" - which is the precondition the npm-fallback cases are about; the
// case that DOES have one sets it explicitly.
vi.mock('@process/agent/wnano/binaryResolver', () => ({
  resolveWNanoBinary: mockResolveWNanoBinary,
}));
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
import { ACP_BACKENDS_ALL, WNANO_NPX_PACKAGE, type AcpBackend } from '../../../../src/common/types/acpTypes';

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
    mockResolveWNanoBinary.mockReset();
    mockResolveWNanoBinary.mockReturnValue(null);
  });

  it('falls back to the pinned npm package when wayland-nano is NOT on PATH', async () => {
    mockIsCliAvailable.mockReturnValue(false);

    const res = await resolveBuiltin('wnano')({ backend: 'wnano' });

    expect(res.cliPath).toBe(`npx ${WNANO_NPX_PACKAGE}`);
    expect(mockIsCliAvailable).toHaveBeenCalledWith('wayland-nano');
  });

  it("prefers the user's own binary when wayland-nano IS on PATH", async () => {
    // A locally built or hand-installed copy must outrank anything we fetch:
    // the developer who built Nano from source expects to run what they built.
    mockIsCliAvailable.mockReturnValue(true);

    const res = await resolveBuiltin('wnano')({ backend: 'wnano' });

    expect(res.cliPath).toBe('wayland-nano');
    expect(res.cliPath).not.toContain('npx');
  });

  it('prefers a verified bundled binary over BOTH the npm pin and a bare PATH name', async () => {
    // The ordering this file exists to pin, and the branch the unmocked
    // filesystem was silently exercising: a resolved binary outranks the npm
    // fallback even when PATH cannot serve the bare command.
    mockIsCliAvailable.mockReturnValue(false);
    mockResolveWNanoBinary.mockReturnValue('/opt/wayland/resources/wayland-nano');

    const res = await resolveBuiltin('wnano')({ backend: 'wnano' });

    expect(res.cliPath).toBe('/opt/wayland/resources/wayland-nano');
    expect(res.cliPath).not.toContain('npx');
  });

  it('quotes a resolved binary path that contains whitespace', async () => {
    // macOS userData lives under "Application Support"; an unquoted path would
    // be split into two tokens by the spawn config.
    mockIsCliAvailable.mockReturnValue(false);
    mockResolveWNanoBinary.mockReturnValue('/Users/x/Application Support/wayland-nano');

    const res = await resolveBuiltin('wnano')({ backend: 'wnano' });

    expect(res.cliPath).toBe('"/Users/x/Application Support/wayland-nano"');
  });

  it('never overrides an explicitly configured cliPath, and does not even probe PATH', async () => {
    mockIsCliAvailable.mockReturnValue(false);

    const res = await resolveBuiltin('wnano')({ backend: 'wnano', cliPath: '/opt/custom/wayland-nano' });

    expect(res.cliPath).toBe('/opt/custom/wayland-nano');
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
    expect(withNpmFallback).toContain('wnano');
    expect(withNpmFallback.length).toBeGreaterThan(1);

    for (const id of withNpmFallback) {
      mockIsCliAvailable.mockReset();
      mockIsCliAvailable.mockReturnValue(false);
      const res = await resolveBuiltin(id)({ backend: id });
      expect(res.cliPath).toBe(ACP_BACKENDS_ALL[id].defaultCliPath);
    }
  });
});
