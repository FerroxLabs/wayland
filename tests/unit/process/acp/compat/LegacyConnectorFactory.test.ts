import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentConfig, ProtocolHandlers } from '@process/acp/types';

const mocks = vi.hoisted(() => ({
  connectCodex: vi.fn(),
  connectClaude: vi.fn(),
  connectCodebuddy: vi.fn(),
  spawnGenericBackend: vi.fn(),
}));

vi.mock('@process/agent/acp/acpConnectors', () => ({
  connectCodex: mocks.connectCodex,
  connectClaude: mocks.connectClaude,
  connectCodebuddy: mocks.connectCodebuddy,
  spawnGenericBackend: mocks.spawnGenericBackend,
}));

// Mock ProcessAcpClient to avoid real child process / SDK interaction.
// We only test that the factory wires the correct spawnFn.
const mockProcessAcpClientInstances: Array<{ spawnFn: () => Promise<unknown>; options: unknown }> = [];

vi.mock('@process/acp/infra/ProcessAcpClient', () => ({
  ProcessAcpClient: class MockProcessAcpClient {
    constructor(spawnFn: () => Promise<unknown>, options: unknown) {
      mockProcessAcpClientInstances.push({ spawnFn, options });
    }
  },
}));

import { LegacyConnectorFactory } from '@process/acp/compat/LegacyConnectorFactory';

function makeConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    agentBackend: 'codex',
    agentSource: 'builtin',
    agentId: 'test-id',
    cwd: '/tmp/test',
    ...overrides,
  };
}

function makeHandlers(): ProtocolHandlers {
  return {
    onSessionUpdate: vi.fn(),
    onRequestPermission: vi.fn(),
    onReadTextFile: vi.fn(),
    onWriteTextFile: vi.fn(),
  };
}

function makeFakeChild() {
  return {
    pid: 12345,
    stdin: { destroyed: false, end: vi.fn() },
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
    once: vi.fn(),
    kill: vi.fn(),
    unref: vi.fn(),
  };
}

describe('LegacyConnectorFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessAcpClientInstances.length = 0;
  });

  it('creates a ProcessAcpClient via create()', () => {
    const factory = new LegacyConnectorFactory();
    const handlers = makeHandlers();
    const client = factory.create(makeConfig(), handlers);
    expect(client).toBeDefined();
    expect(mockProcessAcpClientInstances).toHaveLength(1);
    expect(mockProcessAcpClientInstances[0].options).toEqual({
      backend: 'codex',
      handlers,
    });
  });

  describe('npx-based backends - spawnFn wiring', () => {
    it('uses connectCodex for codex backend', async () => {
      const child = makeFakeChild();
      mocks.connectCodex.mockImplementation(async (_cwd: string, hooks: { setup: (r: unknown) => Promise<void> }) => {
        await hooks.setup({ child, isDetached: false });
      });

      const factory = new LegacyConnectorFactory();
      factory.create(makeConfig({ agentBackend: 'codex' }), makeHandlers());

      // Invoke the spawnFn to verify it calls connectCodex
      const { spawnFn } = mockProcessAcpClientInstances[0];
      const result = await spawnFn();
      expect(mocks.connectCodex).toHaveBeenCalledWith('/tmp/test', expect.any(Object), undefined);
      expect(result).toBe(child);
    });

    it('threads config.env (the Flux routing surface) into the npx connector', async () => {
      // Regression: the V2 factory previously called connectFn(cwd, hooks) and
      // dropped config.env, so a flux-routed claude spawn never received
      // ANTHROPIC_BASE_URL / CLAUDE_CONFIG_DIR and the bridge hit native Anthropic.
      const child = makeFakeChild();
      mocks.connectClaude.mockImplementation(
        async (_cwd: string, hooks: { setup: (r: unknown) => Promise<void> }) => {
          await hooks.setup({ child, isDetached: true });
        }
      );
      const env = {
        ANTHROPIC_BASE_URL: 'https://api.fluxrouter.ai/anthropic',
        ANTHROPIC_MODEL: 'flux-auto',
        CLAUDE_CONFIG_DIR: '/tmp/flux-claude-home',
      };

      const factory = new LegacyConnectorFactory();
      factory.create(makeConfig({ agentBackend: 'claude', env }), makeHandlers());

      const { spawnFn } = mockProcessAcpClientInstances[0];
      await spawnFn();
      expect(mocks.connectClaude).toHaveBeenCalledWith('/tmp/test', expect.any(Object), env);
    });

    it('uses connectClaude for claude backend', async () => {
      const child = makeFakeChild();
      mocks.connectClaude.mockImplementation(async (_cwd: string, hooks: { setup: (r: unknown) => Promise<void> }) => {
        await hooks.setup({ child, isDetached: true });
      });

      const factory = new LegacyConnectorFactory();
      factory.create(makeConfig({ agentBackend: 'claude' }), makeHandlers());

      const { spawnFn } = mockProcessAcpClientInstances[0];
      await spawnFn();
      expect(mocks.connectClaude).toHaveBeenCalledWith('/tmp/test', expect.any(Object), undefined);
    });

    it('uses connectCodebuddy for codebuddy backend', async () => {
      const child = makeFakeChild();
      mocks.connectCodebuddy.mockImplementation(
        async (_cwd: string, hooks: { setup: (r: unknown) => Promise<void> }) => {
          await hooks.setup({ child, isDetached: true });
        }
      );

      const factory = new LegacyConnectorFactory();
      factory.create(makeConfig({ agentBackend: 'codebuddy' }), makeHandlers());

      const { spawnFn } = mockProcessAcpClientInstances[0];
      await spawnFn();
      expect(mocks.connectCodebuddy).toHaveBeenCalledWith('/tmp/test', expect.any(Object), undefined);
    });

    // B1: NPX_BACKENDS is keyed by backend name, so claude/codex/codebuddy used to
    // short-circuit to the npx bridge BEFORE the launch/command guard was reached.
    // An installed agent's descriptor was therefore discarded in silence - no throw,
    // no warning, and the npx bridge ran a DIFFERENT binary than the one installed.
    // These three are exactly the backends K-05 ships an installer for.
    for (const [backend, connectMock] of [
      ['claude', 'connectClaude'],
      ['codex', 'connectCodex'],
      ['codebuddy', 'connectCodebuddy'],
    ] as const) {
      it(`prefers an installed launch spec over the npx bridge for ${backend}`, async () => {
        const child = makeFakeChild();
        mocks.spawnGenericBackend.mockResolvedValue({ child, isDetached: true });
        mocks[connectMock].mockImplementation(async (_cwd: string, hooks: { setup: (r: unknown) => Promise<void> }) => {
          await hooks.setup({ child: makeFakeChild(), isDetached: true });
        });

        const launch = {
          command: 'C:\\Program Files\\Wayland\\resources\\bundled-bun\\win32-x64\\bun.exe',
          args: [`C:\\Users\\John Smith\\AppData\\Local\\Wayland\\agents\\${backend}\\cli-entry.js`],
        };

        const factory = new LegacyConnectorFactory();
        factory.create(makeConfig({ agentBackend: backend, launch, args: ['--acp'] }), makeHandlers());

        const { spawnFn } = mockProcessAcpClientInstances[0];
        const result = await spawnFn();

        expect(mocks[connectMock]).not.toHaveBeenCalled();
        expect(mocks.spawnGenericBackend).toHaveBeenCalledWith(backend, '', '/tmp/test', ['--acp'], undefined, launch);
        expect(result).toBe(child);
      });
    }

    it('still uses the npx bridge for claude when there is no launch spec', async () => {
      const child = makeFakeChild();
      mocks.connectClaude.mockImplementation(async (_cwd: string, hooks: { setup: (r: unknown) => Promise<void> }) => {
        await hooks.setup({ child, isDetached: true });
      });

      const factory = new LegacyConnectorFactory();
      factory.create(makeConfig({ agentBackend: 'claude', launch: undefined }), makeHandlers());

      const { spawnFn } = mockProcessAcpClientInstances[0];
      await spawnFn();
      expect(mocks.connectClaude).toHaveBeenCalledWith('/tmp/test', expect.any(Object), undefined);
      expect(mocks.spawnGenericBackend).not.toHaveBeenCalled();
    });

    it('rejects when connect function fails', async () => {
      mocks.connectCodex.mockRejectedValue(new Error('npx failed'));

      const factory = new LegacyConnectorFactory();
      factory.create(makeConfig({ agentBackend: 'codex' }), makeHandlers());

      const { spawnFn } = mockProcessAcpClientInstances[0];
      await expect(spawnFn()).rejects.toThrow('npx failed');
    });
  });

  describe('generic/custom backends', () => {
    it('uses spawnGenericBackend when command is provided', async () => {
      const child = makeFakeChild();
      mocks.spawnGenericBackend.mockResolvedValue({ child, isDetached: true });

      const factory = new LegacyConnectorFactory();
      factory.create(
        makeConfig({
          agentBackend: 'goose',
          agentSource: 'custom',
          command: '/usr/local/bin/goose',
          args: ['acp'],
          env: { GOOSE_KEY: 'xxx' },
        }),
        makeHandlers()
      );

      const { spawnFn } = mockProcessAcpClientInstances[0];
      const result = await spawnFn();
      expect(mocks.spawnGenericBackend).toHaveBeenCalledWith(
        'goose',
        '/usr/local/bin/goose',
        '/tmp/test',
        ['acp'],
        { GOOSE_KEY: 'xxx' },
        // No launch spec for a non-installed agent: the legacy command string is
        // still the only source, so the trailing arg is undefined.
        undefined
      );
      expect(result).toBe(child);
    });

    it('forwards an installed agent launch spec instead of a command string', async () => {
      const child = makeFakeChild();
      mocks.spawnGenericBackend.mockResolvedValue({ child, isDetached: true });

      const launch = {
        command: 'C:\\Program Files\\Wayland\\resources\\bundled-bun\\win32-x64\\bun.exe',
        args: ['C:\\Users\\John Smith\\AppData\\Local\\Wayland\\agents\\qwen\\cli-entry.js'],
      };

      const factory = new LegacyConnectorFactory();
      factory.create(
        makeConfig({
          agentBackend: 'qwen',
          agentSource: 'extension',
          command: undefined,
          launch,
          args: ['--acp'],
          env: undefined,
        }),
        makeHandlers()
      );

      const { spawnFn } = mockProcessAcpClientInstances[0];
      const result = await spawnFn();
      // An installed agent has no cliPath at all, so the old `if (config.command)`
      // guard would have thrown "No CLI path" before ever reaching spawn.
      expect(mocks.spawnGenericBackend).toHaveBeenCalledWith('qwen', '', '/tmp/test', ['--acp'], undefined, launch);
      expect(result).toBe(child);
    });

    // B4: `launch` arrives from the persisted conversation `extra`, which is
    // untyped JSON at runtime (workerTaskManagerSingleton spreads `...c.extra`
    // through an `any`). A truthiness check therefore accepts shapes the type
    // forbids. A malformed descriptor must never reach spawn.
    const MALFORMED_LAUNCH: Array<[string, unknown]> = [
      ['missing args', { command: 'x' }],
      ['args not an array', { command: 'x', args: '--acp' }],
      ['args holding non-strings', { command: 'x', args: [1, 2] }],
      ['missing command', { args: ['--acp'] }],
      ['empty command', { command: '   ', args: [] }],
      ['not an object', 'C:\\bun.exe'],
    ];

    for (const [label, launch] of MALFORMED_LAUNCH) {
      it(`fails loudly rather than spawning a malformed launch spec (${label})`, async () => {
        const factory = new LegacyConnectorFactory();
        factory.create(
          makeConfig({
            agentBackend: 'qwen',
            command: undefined,
            launch: launch as AgentConfig['launch'],
          }),
          makeHandlers()
        );

        const { spawnFn } = mockProcessAcpClientInstances[0];
        await expect(spawnFn()).rejects.toThrow('No CLI path');
        expect(mocks.spawnGenericBackend).not.toHaveBeenCalled();
      });

      it(`falls back to the legacy command string when the launch spec is malformed (${label})`, async () => {
        const child = makeFakeChild();
        mocks.spawnGenericBackend.mockResolvedValue({ child, isDetached: true });

        const factory = new LegacyConnectorFactory();
        factory.create(
          makeConfig({
            agentBackend: 'goose',
            command: '/usr/local/bin/goose',
            args: ['acp'],
            launch: launch as AgentConfig['launch'],
          }),
          makeHandlers()
        );

        const { spawnFn } = mockProcessAcpClientInstances[0];
        await spawnFn();
        expect(mocks.spawnGenericBackend).toHaveBeenCalledWith(
          'goose',
          '/usr/local/bin/goose',
          '/tmp/test',
          ['acp'],
          undefined,
          undefined
        );
      });
    }

    it('throws when no command and no npx backend', async () => {
      const factory = new LegacyConnectorFactory();
      factory.create(
        makeConfig({ agentBackend: 'unknown-backend' as AgentConfig['agentBackend'], command: undefined }),
        makeHandlers()
      );

      const { spawnFn } = mockProcessAcpClientInstances[0];
      await expect(spawnFn()).rejects.toThrow('No CLI path');
    });
  });
});
