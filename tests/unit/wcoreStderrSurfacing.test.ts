/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #484 - a wcore spawn that dies during init (e.g. a keyless model) must surface
 * the engine's real bail reason (its last stderr) instead of an opaque
 * "wcore exited with code N". A hung engine that logged an error but never
 * exited must likewise surface that stderr on the 30s ready-timeout.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

const spawnMock = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ spawn: spawnMock }));
vi.mock('@process/agent/wcore/binaryResolver', () => ({ resolveWCoreBinary: () => '/fake/wcore' }));
vi.mock('@process/agent/wcore/envBuilder', () => ({
  buildEngineSpawnEnv: () => ({}),
  buildSpawnConfig: () => ({ args: [], env: {}, projectConfig: undefined, resolvedMaxTokens: undefined }),
}));
vi.mock('@process/agent/wcore/profilePaths', () => ({
  resolveActiveConfigDir: () => Promise.resolve('/fake/home'),
}));
vi.mock('@process/agent/wcore/toolKeyStore', () => ({
  getToolKeyStore: () => Promise.resolve({ collectForwardedEnv: () => ({}) }),
}));
vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({
  hydrateModelForSpawn: (m: unknown) => Promise.resolve(m),
}));
vi.mock('@process/agent/acp/utils', () => ({ killChild: vi.fn() }));

import { WCoreAgent } from '@process/agent/wcore';
import type { WCoreAgentOptions } from '@process/agent/wcore';

type FakeChild = EventEmitter & {
  stdout: PassThrough;
  stderr: PassThrough;
  stdin: PassThrough;
  kill: ReturnType<typeof vi.fn>;
  pid: number;
};

function makeChild(): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = new PassThrough();
  child.kill = vi.fn();
  child.pid = 4242;
  return child;
}

/** Spin the microtask queue until start() has actually spawned the child (so its
 *  stderr/exit listeners are attached), without guessing the await count. */
async function flushUntilSpawned(): Promise<void> {
  for (let i = 0; i < 100 && spawnMock.mock.calls.length === 0; i++) {
    await Promise.resolve();
  }
}

function baseOptions(): WCoreAgentOptions {
  return {
    workspace: '/ws',
    model: { name: 'test', useModel: 'test-model', platform: 'openai', baseUrl: '' } as WCoreAgentOptions['model'],
    onStreamEvent: vi.fn(),
  };
}

describe('WCoreAgent init-failure surfacing (#484)', () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('includes the engine stderr tail in the exit rejection', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    // Let start() reach the point where it has wired the stderr/exit listeners.
    await flushUntilSpawned();

    child.stderr.write('error: no API key configured for provider "openai"\n');
    await Promise.resolve();
    child.emit('exit', 1);

    const err = (await result) as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('wcore exited with code 1 during init');
    expect(err.message).toContain('no API key configured');
  });

  it('falls back to the bare exit message when there is no stderr', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    await flushUntilSpawned();
    child.emit('exit', 127);

    const err = (await result) as Error;
    expect(err.message).toBe('wcore exited with code 127 during init');
  });

  it('includes the engine stderr tail in the 30s ready-timeout rejection', async () => {
    vi.useFakeTimers();
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    // Flush the async setup (mocked awaits) so listeners are attached.
    await vi.advanceTimersByTimeAsync(0);
    child.stderr.write('waiting for provider handshake...\n');
    await vi.advanceTimersByTimeAsync(0);

    // Fire the 30s ready timeout; the engine never emitted 'ready' or exited.
    await vi.advanceTimersByTimeAsync(30_000);

    const err = (await result) as Error;
    expect(err.message).toContain('wcore ready timeout (30s)');
    expect(err.message).toContain('waiting for provider handshake');
  });
});
