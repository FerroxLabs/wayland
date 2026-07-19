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
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';

const spawnMock = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ spawn: spawnMock }));
vi.mock('@process/agent/wcore/binaryResolver', () => ({ resolveWCoreBinary: () => '/fake/wcore' }));
vi.mock('@process/agent/wcore/envBuilder', () => ({
  buildEngineSpawnEnv: () => ({}),
  buildSpawnConfig: () => ({ args: [], env: {}, projectConfig: undefined, resolvedMaxTokens: undefined }),
  planVaultPassphraseDelivery: () => ({ mode: 'env', env: {}, stdio: ['pipe', 'pipe', 'pipe'] }),
}));
// #710: vault provisioning is out of scope here - resolve "no unlock material"
// so the spawn takes the legacy three-slot stdio path (and never touches the
// real keychain/config dir from a unit test).
vi.mock('@process/secrets', () => ({
  VAULT_PASSPHRASE_CHILD_FD: 3,
  resolveSpawnVaultPassphrase: () => Promise.resolve(null),
}));
vi.mock('@process/agent/wcore/profilePaths', () => ({
  resolveActiveConfigDir: () => Promise.resolve('/fake/home'),
  acquireProfileLaunchLease: () => Promise.resolve(async () => {}),
}));
vi.mock('@process/agent/wcore/toolKeyStore', () => ({
  getToolKeyStore: () => Promise.resolve({ collectForwardedEnv: () => ({}) }),
}));
// start() may also resolve the connected `openai` provider's key (to prefer the
// API-key surface for an OpenAI-family model rebound off Anthropic). This model is
// platform 'openai' so that gated path never runs here, but mock the export so the
// named import resolves and a future gate change can't turn it into a real
// DB/keychain read that would break the microtask-only spawn flush below.
vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({
  hydrateModelForSpawn: (m: unknown) => Promise.resolve(m),
  resolveModelSecretsForSpawn: () => Promise.resolve(null),
}));
const killChildMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('@process/agent/acp/utils', () => ({ killChild: killChildMock }));
// start() reads the ChatGPT OAuth token file (real fs I/O) to pick the keyless
// provider surface; mock it so the read resolves on a microtask (the spawn flush
// below only spins microtasks) and never touches the real ~/.codex/auth.json.
vi.mock('@process/onboarding/codexAuthFile', () => ({ readCodexAuthFile: vi.fn().mockResolvedValue(null) }));

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
async function flushUntilSpawned(child: FakeChild, expectedSpawnCount = 1): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if (spawnMock.mock.calls.length >= expectedSpawnCount && child.listenerCount('exit') >= 2) return;
    // oxlint-disable-next-line no-await-in-loop -- each bounded probe must observe listener attachment
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(0);
    // oxlint-disable-next-line no-await-in-loop -- each bounded probe must observe listener attachment
    else await new Promise((resolve) => setImmediate(resolve));
  }
  throw new Error(`WCore child ${expectedSpawnCount} did not finish attaching its production listeners`);
}

function baseOptions(): WCoreAgentOptions {
  return {
    workspace: testWorkspace,
    model: { name: 'test', useModel: 'test-model', platform: 'openai', baseUrl: '' } as WCoreAgentOptions['model'],
    onStreamEvent: vi.fn(),
  };
}

let testWorkspace = '';

describe('WCoreAgent init-failure surfacing (#484)', () => {
  beforeEach(() => {
    testWorkspace = mkdtempSync(path.join(tmpdir(), 'wcore-stderr-'));
    spawnMock.mockReset();
    killChildMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    rmSync(testWorkspace, { recursive: true, force: true });
  });

  it('includes the engine stderr tail in the exit rejection', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    // Let start() reach the point where it has wired the stderr/exit listeners.
    await flushUntilSpawned(child);

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

    await flushUntilSpawned(child);
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

    // Flush the async setup (including the real canonical-workspace lookup) so
    // listeners are attached before stderr/timeout events are injected.
    await flushUntilSpawned(child);
    child.stderr.write('waiting for provider handshake...\n');
    await vi.advanceTimersByTimeAsync(0);

    // Fire the 30s ready timeout; the engine never emitted 'ready' or exited.
    await vi.advanceTimersByTimeAsync(30_000);

    const err = (await result) as Error;
    expect(err.message).toContain('wcore ready timeout (30s)');
    expect(err.message).toContain('waiting for provider handshake');
  });

  it('resume-fallback tears down the stale child, resets the tail, and surfaces only the retry error (#484 audit)', async () => {
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);

    const agent = new WCoreAgent({ ...baseOptions(), resume: 'session-abc' });
    const result = agent.start().catch((e: unknown) => e);

    // First (resume) attempt spawns, logs stderr, then never becomes ready.
    await flushUntilSpawned(first);
    first.stderr.write('attempt 1: resume session not found\n');
    await vi.advanceTimersByTimeAsync(0);

    // The 30s ready-timeout fires → resume fallback: the stale (still-alive)
    // child must be killed and its listeners detached before the retry spawns.
    await vi.advanceTimersByTimeAsync(30_000);
    await flushUntilSpawned(second, 2);

    expect(killChildMock).toHaveBeenCalledWith(first, false);
    expect(spawnMock).toHaveBeenCalledTimes(2);

    // A late stderr chunk from the orphaned first child must NOT leak into the
    // retry's buffer (its listeners were removed).
    first.stderr.write('attempt 1: late noise\n');
    await vi.advanceTimersByTimeAsync(0);

    // The retry fails with its own reason.
    second.stderr.write('attempt 2: no API key configured\n');
    await vi.advanceTimersByTimeAsync(0);
    second.emit('exit', 1);

    const err = (await result) as Error;
    expect(err.message).toContain('wcore exited with code 1 during init');
    expect(err.message).toContain('no API key configured');
    expect(err.message).not.toContain('attempt 1');
  });

  it('redacts high-confidence secret tokens from the surfaced stderr (#484 audit)', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    await flushUntilSpawned(child);
    child.stderr.write('auth failed with key sk-abcdef0123456789ABCDEF for provider openai\n');
    await Promise.resolve();
    child.emit('exit', 1);

    const err = (await result) as Error;
    // The human-readable reason survives; the token does not.
    expect(err.message).toContain('auth failed');
    expect(err.message).toContain('[redacted]');
    expect(err.message).not.toContain('sk-abcdef0123456789ABCDEF');
  });

  it('replays the pinned v1 ready and ordinary lifecycle through the production raw stdout boundary', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const onStreamEvent = vi.fn();
    const agent = new WCoreAgent({ ...baseOptions(), onStreamEvent });
    const started = agent.start();

    await flushUntilSpawned(child);
    const contractRoot = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1');
    child.stdout.write(`${readFileSync(path.join(contractRoot, 'events/ready.json'), 'utf8').trimEnd()}\n`);
    await started;

    child.stdout.write(
      [
        { type: 'stream_start', msg_id: 'wire-msg-1' },
        { type: 'text_delta', msg_id: 'wire-msg-1', text: 'wire-ok' },
        { type: 'stream_end', msg_id: 'wire-msg-1', finish_reason: 'stop' },
      ]
        .map((event) => JSON.stringify(event))
        .join('\n') + '\n'
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(onStreamEvent).toHaveBeenCalledWith({ type: 'start', data: '', msg_id: 'wire-msg-1' });
    expect(onStreamEvent).toHaveBeenCalledWith({ type: 'content', data: 'wire-ok', msg_id: 'wire-msg-1' });
    expect(onStreamEvent).toHaveBeenCalledWith({
      type: 'finish',
      data: { finish_reason: 'stop' },
      msg_id: 'wire-msg-1',
    });
    await agent.kill();
  });

  it('reports child termination even when the engine exits before the first turn', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const onProcessTerminated = vi.fn();
    const agent = new WCoreAgent({ ...baseOptions(), onProcessTerminated });
    const started = agent.start().catch(() => undefined);

    await flushUntilSpawned(child);
    child.emit('exit', 1);
    await started;

    expect(onProcessTerminated).toHaveBeenCalledOnce();
    expect(onProcessTerminated).toHaveBeenCalledWith(1);
  });

  it('reports post-turn child termination after stream_end cleared the active message', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const onProcessExit = vi.fn();
    const onProcessTerminated = vi.fn();
    const agent = new WCoreAgent({ ...baseOptions(), onProcessExit, onProcessTerminated });
    const started = agent.start();

    await flushUntilSpawned(child);
    const contractRoot = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1');
    child.stdout.write(`${readFileSync(path.join(contractRoot, 'events/ready.json'), 'utf8').trimEnd()}\n`);
    await started;
    await agent.send('hello', 'turn-1');
    child.stdout.write(
      `${JSON.stringify({ type: 'stream_start', msg_id: 'turn-1' })}\n${JSON.stringify({ type: 'stream_end', msg_id: 'turn-1', finish_reason: 'stop' })}\n`
    );
    await new Promise((resolve) => setImmediate(resolve));

    child.emit('exit', 0);

    expect(onProcessExit).not.toHaveBeenCalled();
    expect(onProcessTerminated).toHaveBeenCalledOnce();
    expect(onProcessTerminated).toHaveBeenCalledWith(0);
  });

  it('kills the producer when the production raw stdout boundary receives invalid UTF-8', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const agent = new WCoreAgent(baseOptions());
    void agent.start().catch(() => {});

    await flushUntilSpawned(child);
    child.stdout.write(Buffer.from([0xc3, 0x28, 0x0a]));
    await new Promise((resolve) => setImmediate(resolve));

    expect(killChildMock).toHaveBeenCalledWith(child, false);
  });

  it('retains failed tree-shutdown authority after the root exit clears its child slot', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const agent = new WCoreAgent(baseOptions());
    void agent.start().catch(() => {});
    await flushUntilSpawned(child);

    const failure = new Error('descendant exit remains unproved');
    killChildMock.mockRejectedValueOnce(failure);
    const shutdown = agent.kill();
    child.emit('exit', 0);

    await expect(shutdown).rejects.toBe(failure);
    expect(agent.isAlive).toBe(false);
    await expect(agent.kill()).rejects.toBe(failure);
    expect(killChildMock).toHaveBeenCalledTimes(1);
  });

  it('retries the same retained child identity when tree shutdown fails before root exit', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const agent = new WCoreAgent(baseOptions());
    void agent.start().catch(() => {});
    await flushUntilSpawned(child);

    killChildMock.mockRejectedValueOnce(new Error('temporary tree probe failure')).mockResolvedValueOnce(undefined);
    await expect(agent.kill()).rejects.toThrow('temporary tree probe failure');
    expect(agent.isAlive).toBe(true);

    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenNthCalledWith(1, child, false);
    expect(killChildMock).toHaveBeenNthCalledWith(2, child, false);
    expect(agent.isAlive).toBe(false);
  });
});
