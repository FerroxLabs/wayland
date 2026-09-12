/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo launch contract.
 *
 * Fuigo 1.0.13 is the first release-stamped binary: folder trust is live, and
 * with stdin not a TTY an ungranted cwd is Untrusted without a prompt (project
 * instructions, skills and repo MCP silently dropped). 1.0.7 was dev-stamped
 * and auto-trusted everything, so nothing in the existing suite pinned this.
 * Each assertion here fails on the pre-cutover spawn: no `--trust`, a
 * per-conversation FUIGO_HOME, no `startupHints`, and a cost gauge that never
 * moved because Fuigo puts usage on `_meta`, not `usage_update`.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { mockGet, capturedAgentConfigs, isWorkspaceTrusted } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  capturedAgentConfigs: [] as Array<Record<string, unknown>>,
  isWorkspaceTrusted: vi.fn(() => false),
}));

vi.mock('electron', () => ({ app: { getPath: vi.fn(() => '/tmp/userData') } }));
const { ensureFuigoHomeMock } = vi.hoisted(() => ({ ensureFuigoHomeMock: vi.fn() }));
vi.mock('@process/agent/fuigo/launch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/process/agent/fuigo/launch')>();
  return { ...actual, ensureFuigoHome: ensureFuigoHomeMock };
});
vi.mock('@process/permissions/workspaceTrust', () => ({ isWorkspaceTrusted }));
vi.mock('@process/agent/fuigo/runtime', () => ({
  resolveFuigoBinary: vi.fn(() => ({ path: '/tmp/userData/bundled-fuigo/fuigo', version: '1.0.13' })),
}));
vi.mock('@process/connectors/fluxKey', () => ({ readConnectedFluxKey: vi.fn(async () => 'sk-flux-test') }));
vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn(), isProcessing: vi.fn(() => false) },
}));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: mockGet },
}));
vi.mock('@/common', () => ({ ipcBridge: { acpConversation: { responseStream: { emit: vi.fn() } } } }));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() =>
    Promise.resolve({ updateConversation: vi.fn(), getConversation: vi.fn(), getDriver: vi.fn(() => ({})) })
  ),
}));
vi.mock('@process/providers/storage/ProviderRepository', () => ({
  ProviderRepository: class {
    list() {
      return [];
    }
    listAll() {
      return [];
    }
    getAll() {
      return [];
    }
  },
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
vi.mock('@process/acp/compat/AcpAgentV2', () => ({
  AcpAgentV2: class {
    constructor(config: Record<string, unknown>) {
      capturedAgentConfigs.push(config);
    }
    start = vi.fn(async () => {});
    getModelInfo = vi.fn(() => null);
    stop = vi.fn();
    kill = vi.fn();
    cancelPrompt = vi.fn();
  },
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
vi.mock('@process/utils/initAgent', () => ({
  hasNativeSkillSupport: vi.fn(() => false),
  repairStagedTideSkill: vi.fn(async () => {}),
}));
vi.mock('@process/task/agentUtils', () => ({
  prepareFirstMessageWithSkillsIndex: vi.fn((x: string) => Promise.resolve({ content: x, loadedSkills: [] })),
  isConciergeAssistant: vi.fn(() => false),
}));
vi.mock('@/common/utils', () => ({ parseError: vi.fn((e: unknown) => e), uuid: vi.fn(() => 'test-uuid') }));
vi.mock('@/common/chat/chatLib', () => ({ transformMessage: vi.fn(), uuid: vi.fn(() => 'uuid') }));

import AcpAgentManager from '../../../src/process/task/AcpAgentManager';
import {
  FUIGO_MANAGED_CONFIG,
  buildFuigoAcpArgs,
  buildFuigoSessionMetadata,
  extractFuigoPromptUsage,
  fuigoCompatIsolationEnv,
  fuigoHomeDir,
  fuigoPluginDirs,
} from '../../../src/process/agent/fuigo/launch';
import { projectSessionMetadata } from '../../../src/process/acp/infra/AcpProtocol';

type Resolved = { cliPath?: string; customArgs?: string[]; customEnv?: Record<string, string> };

function resolve(data: Record<string, unknown>): Promise<Resolved> {
  const m = new AcpAgentManager({ conversation_id: 'c-fuigo', backend: 'fuigo', workspace: '/tmp/ws' });
  return (m as unknown as { resolveAgentCliConfig: (d: unknown) => Promise<Resolved> }).resolveAgentCliConfig({
    conversation_id: 'c-fuigo',
    backend: 'fuigo',
    workspace: '/tmp/ws',
    ...data,
  });
}

describe('launch helpers', () => {
  it('puts --trust among the global flags, before the agent subcommand', () => {
    expect(buildFuigoAcpArgs({ trusted: true })).toEqual(['--permission-mode', 'default', '--trust', 'agent', 'stdio']);
    expect(buildFuigoAcpArgs({ trusted: false })).toEqual(['--permission-mode', 'default', 'agent', 'stdio']);
  });

  it('passes a positive integer maxTurns as a global --max-turns flag, before the agent subcommand', () => {
    expect(buildFuigoAcpArgs({ trusted: true, maxTurns: 25 })).toEqual([
      '--permission-mode',
      'default',
      '--trust',
      '--max-turns',
      '25',
      'agent',
      'stdio',
    ]);
    // Fuigo's clap parser is `u32.range(1..)`: `0`, negatives and fractions would
    // kill the spawn at argv parse, so they are dropped rather than forwarded.
    for (const bad of [0, -3, 2.5, Number.NaN, undefined]) {
      expect(buildFuigoAcpArgs({ trusted: false, maxTurns: bad })).toEqual([
        '--permission-mode',
        'default',
        'agent',
        'stdio',
      ]);
    }
  });

  it('names the client and carries the nonInteractive startup hint', () => {
    expect(buildFuigoSessionMetadata({ nonInteractive: true })).toEqual({
      clientIdentifier: 'wayland-desktop',
      clientType: 'desktop',
      startupHints: { nonInteractive: true },
    });
  });

  it('carries staged skill roots as _meta.pluginDirs and omits the key without any', () => {
    expect(buildFuigoSessionMetadata({ nonInteractive: false, pluginDirs: ['/ws/.wayland'] })).toEqual({
      clientIdentifier: 'wayland-desktop',
      clientType: 'desktop',
      startupHints: { nonInteractive: false },
      pluginDirs: ['/ws/.wayland'],
    });
    expect(buildFuigoSessionMetadata({ nonInteractive: false, pluginDirs: [] })).not.toHaveProperty('pluginDirs');
    // The key must survive the projection onto the session/new request `_meta`.
    expect(
      projectSessionMetadata(buildFuigoSessionMetadata({ nonInteractive: false, pluginDirs: ['/ws/.wayland'] }))
    ).toHaveProperty('pluginDirs', ['/ws/.wayland']);
  });

  describe('fuigoPluginDirs', () => {
    let ws: string;
    beforeEach(() => {
      ws = mkdtempSync(join(tmpdir(), 'fuigo-plugin-dirs-'));
    });
    afterEach(() => {
      rmSync(ws, { recursive: true, force: true });
    });

    it('names the workspace .wayland root, whose skills/<name>/SKILL.md layout Fuigo loads as a plugin', () => {
      for (const name of ['market-open-report', 'pdf']) {
        mkdirSync(join(ws, '.wayland', 'skills', name), { recursive: true });
        writeFileSync(join(ws, '.wayland', 'skills', name, 'SKILL.md'), `---\nname: ${name}\n---\n`);
      }
      expect(fuigoPluginDirs(ws)).toEqual([join(ws, '.wayland')]);
    });

    it('is empty when no skills were staged (a non-project custom workspace)', () => {
      expect(fuigoPluginDirs(ws)).toEqual([]);
      mkdirSync(join(ws, '.wayland'));
      expect(fuigoPluginDirs(ws)).toEqual([]);
    });
  });

  it('shares one engine home across conversations', () => {
    expect(fuigoHomeDir('/u')).toBe(join('/u', 'fuigo'));
  });

  it('switches off every vendor-compat surface Fuigo would import from the user home', () => {
    const env = fuigoCompatIsolationEnv();
    expect(Object.keys(env)).toHaveLength(18);
    for (const vendor of ['CLAUDE', 'CURSOR', 'CODEX'])
      for (const surface of ['SKILLS', 'RULES', 'AGENTS', 'MCPS', 'HOOKS', 'SESSIONS'])
        expect(env[`FUIGO_${vendor}_${surface}_ENABLED`]).toBe('0');
  });

  describe('ensureFuigoHome', () => {
    // The module is mocked above so the manager test never touches disk; the
    // pure tests need the real writer.
    let ensureFuigoHome: typeof import('../../../src/process/agent/fuigo/launch').ensureFuigoHome;
    let root: string;
    beforeEach(async () => {
      ({ ensureFuigoHome } = await vi.importActual<typeof import('../../../src/process/agent/fuigo/launch')>(
        '../../../src/process/agent/fuigo/launch'
      ));
      root = mkdtempSync(join(tmpdir(), 'fuigo-home-'));
    });
    afterEach(() => rmSync(root, { recursive: true, force: true }));

    it('creates the home with a managed config that disables plugin auto-discovery', () => {
      const home = join(root, 'fuigo');
      ensureFuigoHome(home);
      const config = readFileSync(join(home, 'config.toml'), 'utf8');
      expect(config).toBe(FUIGO_MANAGED_CONFIG);
      expect(config).toMatch(/^\[plugins\]\nauto_discover = false$/m);
      // POSIX modes only: Windows reports 0o666 for every file.
      if (process.platform !== 'win32') expect(statSync(join(home, 'config.toml')).mode & 0o777).toBe(0o600);
    });

    it('rewrites a drifted config and leaves a current one untouched', () => {
      const home = join(root, 'fuigo');
      ensureFuigoHome(home);
      const file = join(home, 'config.toml');
      const before = statSync(file).mtimeMs;
      writeFileSync(file, '[plugins]\nauto_discover = true\n');
      ensureFuigoHome(home);
      expect(readFileSync(file, 'utf8')).toBe(FUIGO_MANAGED_CONFIG);
      // Unchanged content is not rewritten (no mtime churn on every spawn).
      const settled = statSync(file).mtimeMs;
      ensureFuigoHome(home);
      expect(statSync(file).mtimeMs).toBe(settled);
      expect(before).toBeLessThanOrEqual(settled);
    });
  });

  it('reads per-prompt usage from _meta.usage and converts USD ticks', () => {
    const usage = extractFuigoPromptUsage({
      usage: { totalTokens: 1200, inputTokens: 1000, outputTokens: 200, costUsdTicks: 25_000_000, numTurns: 1 },
    });
    expect(usage).toEqual({
      totalTokens: 1200,
      inputTokens: 1000,
      outputTokens: 200,
      costUsd: 0.0025,
      incomplete: false,
    });
  });

  it('drops a scrubbed or partial cost rather than fabricating one', () => {
    expect(extractFuigoPromptUsage({ usage: { totalTokens: 5 } })?.costUsd).toBeUndefined();
    expect(
      extractFuigoPromptUsage({ usage: { totalTokens: 5, costUsdTicks: 10, costIsPartial: true } })?.costUsd
    ).toBeUndefined();
    expect(extractFuigoPromptUsage({ usage: { totalTokens: 5, usageIsIncomplete: true } })?.incomplete).toBe(true);
    expect(extractFuigoPromptUsage(undefined)).toBeNull();
    expect(extractFuigoPromptUsage({})).toBeNull();
  });
});

describe('AcpAgentManager Fuigo spawn contract', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue(undefined);
    isWorkspaceTrusted.mockReset().mockReturnValue(false);
    capturedAgentConfigs.length = 0;
  });

  it('forwards Desktop workspace trust as --trust', async () => {
    isWorkspaceTrusted.mockReturnValue(true);
    const trusted = await resolve({});
    expect(isWorkspaceTrusted).toHaveBeenCalledWith('/tmp/ws');
    expect(trusted.customArgs).toEqual(['--permission-mode', 'default', '--trust', 'agent', 'stdio']);

    isWorkspaceTrusted.mockReturnValue(false);
    const untrusted = await resolve({});
    expect(untrusted.customArgs).toEqual(['--permission-mode', 'default', 'agent', 'stdio']);
  });

  it('forwards the conversation maxTurns to Fuigo as --max-turns', async () => {
    const capped = await resolve({ maxTurns: 40 });
    expect(capped.customArgs).toEqual(['--permission-mode', 'default', '--max-turns', '40', 'agent', 'stdio']);
    const uncapped = await resolve({});
    expect(uncapped.customArgs).not.toContain('--max-turns');
  });

  it('spawns against the shared engine home with the connected Flux key', async () => {
    const res = await resolve({});
    expect(res.cliPath).toBe('/tmp/userData/bundled-fuigo/fuigo');
    expect(res.customEnv).toMatchObject({
      FUIGO_HOME: join('/tmp/userData', 'fuigo'),
      FUIGO_API_KEY: 'sk-flux-test',
      FUIGO_MANAGED_BY_NPM: '1',
      ...fuigoCompatIsolationEnv(),
    });
    expect(ensureFuigoHomeMock).toHaveBeenCalledWith(join('/tmp/userData', 'fuigo'));
  });

  it('marks only unattended runs nonInteractive on the session request', async () => {
    const attended = new AcpAgentManager({ conversation_id: 'c-att', backend: 'fuigo', workspace: '/tmp/ws' });
    await attended.initAgent({ conversation_id: 'c-att', backend: 'fuigo', workspace: '/tmp/ws' } as never);
    const unattended = new AcpAgentManager({ conversation_id: 'c-un', backend: 'fuigo', workspace: '/tmp/ws' });
    await unattended.initAgent({
      conversation_id: 'c-un',
      backend: 'fuigo',
      workspace: '/tmp/ws',
      unattendedHoldDeadlineMs: 60_000,
    } as never);

    expect(capturedAgentConfigs).toHaveLength(2);
    const [att, un] = capturedAgentConfigs.map((c) => (c.extra as Record<string, unknown>).sessionMetadata);
    expect(att).toEqual(buildFuigoSessionMetadata({ nonInteractive: false }));
    expect(un).toEqual(buildFuigoSessionMetadata({ nonInteractive: true }));
  });

  it('passes the staged skill root on the session request only when skills were staged', async () => {
    const ws = mkdtempSync(join(tmpdir(), 'fuigo-session-skills-'));
    try {
      const staged = join(ws, 'staged');
      for (const name of ['market-open-report', 'pdf', 'wayland-help']) {
        mkdirSync(join(staged, '.wayland', 'skills', name), { recursive: true });
        writeFileSync(join(staged, '.wayland', 'skills', name, 'SKILL.md'), `---\nname: ${name}\n---\n`);
      }
      const bare = join(ws, 'bare');
      mkdirSync(bare);

      const withSkills = new AcpAgentManager({ conversation_id: 'c-sk', backend: 'fuigo', workspace: staged });
      await withSkills.initAgent({ conversation_id: 'c-sk', backend: 'fuigo', workspace: staged } as never);
      const without = new AcpAgentManager({ conversation_id: 'c-no', backend: 'fuigo', workspace: bare });
      await without.initAgent({ conversation_id: 'c-no', backend: 'fuigo', workspace: bare } as never);

      const [sk, no] = capturedAgentConfigs.map((c) => (c.extra as Record<string, unknown>).sessionMetadata);
      expect(sk).toMatchObject({ pluginDirs: [join(staged, '.wayland')] });
      expect(no).not.toHaveProperty('pluginDirs');
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it('leaves other backends without Fuigo session metadata', async () => {
    const m = new AcpAgentManager({ conversation_id: 'c-q', backend: 'qwen', workspace: '/tmp/ws' });
    await m.initAgent({ conversation_id: 'c-q', backend: 'qwen', workspace: '/tmp/ws' } as never);
    expect((capturedAgentConfigs[0].extra as Record<string, unknown>).sessionMetadata).toBeUndefined();
  });
});
