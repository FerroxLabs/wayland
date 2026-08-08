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
  // K-02: startFailureReason.ts imports this from the same (mocked) module
  // specifier, so it must be stubbed here too - otherwise the stripped-config
  // classification silently never matches and the DIA-02 hedge cases below
  // pass for the wrong reason (proven RED live before this line was added -
  // both cases threw "No WCORE_DESKTOP_MCP_PROFILE export is defined").
  WCORE_DESKTOP_MCP_PROFILE: '__wayland_desktop_session',
  // Same trap: the spawn pushes `--assistant <this>`, so an unstubbed export
  // puts `undefined` in argv and spawn throws before a single production
  // listener is attached - which surfaces as 33 unrelated-looking failures.
  WCORE_DESKTOP_HOST_ASSISTANT: 'wayland-desktop',
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
// K-02: imported from the (mocked) real module specifier so this can never
// silently drift from the real reserved-profile constant.
import { WCORE_DESKTOP_MCP_PROFILE } from '@process/agent/wcore/envBuilder';

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

/**
 * Wait until start() has actually spawned the child (so its stderr/exit
 * listeners are attached), without guessing the await count.
 *
 * `start()` awaits real filesystem and keystore work before it reaches spawn():
 * readCodexAuthFile, loadForwardedToolKeys, resolveActiveConfigDir,
 * resolveSpawnVaultPassphrase. Flushing the microtask queue does not wait for
 * any of that - 100 flushes complete in microseconds - so the previous loop was
 * really just betting that the I/O finished first. It did on a developer
 * machine and did not on the ubuntu runner, where every case in this suite that
 * calls this helper failed with "did not finish attaching its production
 * listeners".
 *
 * So each attempt now yields real wall-clock time as well as flushing pending
 * microtasks. The real timer is captured at module load because these cases
 * install fake timers, which would otherwise make the sleep instantaneous
 * again.
 */
const realSetTimeout = globalThis.setTimeout;
const SPAWN_POLL_ATTEMPTS = 1_000;

async function flushUntilSpawned(child: FakeChild, expectedSpawnCount = 1): Promise<void> {
  for (let i = 0; i < SPAWN_POLL_ATTEMPTS; i++) {
    if (spawnMock.mock.calls.length >= expectedSpawnCount && child.listenerCount('exit') >= 2) return;
    // oxlint-disable-next-line no-await-in-loop -- each bounded probe must observe listener attachment
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(0);
    // Real 1ms tick: lets the pending fs/keystore work actually make progress.
    // oxlint-disable-next-line no-await-in-loop -- each bounded probe must observe listener attachment
    await new Promise((resolve) => realSetTimeout(resolve, 1));
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

  it('declares an assistant identity so Core 0.12.26 accepts runtime MCP declarations', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);
    await flushUntilSpawned(child);
    child.emit('exit', 0);
    await result;

    // Core 0.12.26 `scope_host_runtime_mcp` rejects every wire-added MCP server
    // with "active assistant identity is required for a runtime MCP
    // declaration" when this is absent. Live-verified: without it the session's
    // tool pool is empty and no MCP tool can ever run.
    const args = spawnMock.mock.calls[0][1] as string[];
    const index = args.indexOf('--assistant');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(args[index + 1]).toBe('wayland-desktop');
  });

  it('omits the assistant identity in raw engine mode', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent({ ...baseOptions(), rawEngineMode: true });
    const result = agent.start().catch((e: unknown) => e);
    await flushUntilSpawned(child);
    child.emit('exit', 0);
    await result;

    expect(spawnMock.mock.calls[0][1] as string[]).not.toContain('--assistant');
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

  it('refuses a resume fallback when the stale engine tree cannot be proved stopped', async () => {
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);
    killChildMock.mockRejectedValueOnce(new Error('stale resume engine tree remains alive'));

    const agent = new WCoreAgent({ ...baseOptions(), resume: 'session-unsafe-fallback' });
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.advanceTimersByTimeAsync(0);

    expect(killChildMock).toHaveBeenCalledWith(first, false);
    // A second engine would share the same profile with an unproved stale tree.
    // Fallback must fail closed before a successor can be spawned.
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(await started).toMatchObject({ message: 'stale resume engine tree remains alive' });
  });

  it('retries only the retained resume child identity after a transient tree-proof failure', async () => {
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);
    killChildMock
      .mockRejectedValueOnce(new Error('transient stale-tree probe failure'))
      .mockResolvedValueOnce(undefined);

    const agent = new WCoreAgent({ ...baseOptions(), resume: 'session-retry-authority' });
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(await started).toMatchObject({ message: 'transient stale-tree probe failure' });
    expect(spawnMock).toHaveBeenCalledTimes(1);

    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenNthCalledWith(1, first, false);
    expect(killChildMock).toHaveBeenNthCalledWith(2, first, false);
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it('shares resume tree proof with concurrent disposal and never spawns a fallback successor', async () => {
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);
    let resolveTreeProof!: () => void;
    killChildMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveTreeProof = resolve;
      })
    );

    const agent = new WCoreAgent({ ...baseOptions(), resume: 'session-concurrent-dispose' });
    const restore = vi.fn();
    (
      agent as unknown as {
        projectConfigTransaction: { restore: () => void };
      }
    ).projectConfigTransaction = { restore };
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(killChildMock).toHaveBeenCalledOnce());

    const disposed = agent.kill();
    expect(killChildMock).toHaveBeenCalledOnce();
    first.emit('exit', 1);
    expect(restore).not.toHaveBeenCalled();
    resolveTreeProof();

    await expect(disposed).resolves.toBeUndefined();
    expect(await started).toMatchObject({ message: 'Wayland Core agent was stopped during resume fallback' });
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(killChildMock).toHaveBeenCalledWith(first, false);
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(restore).toHaveBeenCalledOnce();
  });

  it('restores config and spawns a resume successor only after exact stale-tree proof succeeds', async () => {
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);
    let resolveTreeProof!: () => void;
    killChildMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveTreeProof = resolve;
      })
    );
    const restore = vi.fn();

    const agent = new WCoreAgent({ ...baseOptions(), resume: 'session-root-exit-proof-success' });
    (
      agent as unknown as {
        projectConfigTransaction: { restore: () => void };
      }
    ).projectConfigTransaction = { restore };
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(killChildMock).toHaveBeenCalledOnce());

    first.emit('exit', 1);
    expect(restore).not.toHaveBeenCalled();
    expect(spawnMock).toHaveBeenCalledTimes(1);

    resolveTreeProof();
    await flushUntilSpawned(second, 2);
    expect(restore).toHaveBeenCalledOnce();
    expect(spawnMock).toHaveBeenCalledTimes(2);

    second.emit('exit', 1);
    expect(await started).toMatchObject({ message: 'wcore exited with code 1 during init' });
  });

  it('retains launch config when the stale resume root exits before tree proof settles', async () => {
    vi.useFakeTimers();
    const first = makeChild();
    spawnMock.mockReturnValue(first);
    let rejectTreeProof!: (error: Error) => void;
    killChildMock.mockReturnValueOnce(
      new Promise<void>((_resolve, reject) => {
        rejectTreeProof = reject;
      })
    );
    const restore = vi.fn();

    const agent = new WCoreAgent({ ...baseOptions(), resume: 'session-root-exit-before-tree-proof' });
    (
      agent as unknown as {
        projectConfigTransaction: { restore: () => void };
      }
    ).projectConfigTransaction = { restore };
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(killChildMock).toHaveBeenCalledOnce());

    // Root exit is notification only. Descendants can remain alive while the
    // process-tree proof is pending, so launch config must stay pinned.
    first.emit('exit', 1);
    expect(restore).not.toHaveBeenCalled();

    rejectTreeProof(new Error('resume descendant still alive'));
    expect(await started).toMatchObject({ message: 'resume descendant still alive' });
    expect(restore).not.toHaveBeenCalled();

    killChildMock.mockResolvedValueOnce(undefined);
    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenNthCalledWith(2, first, false);
    expect(restore).toHaveBeenCalledOnce();
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it('redacts JWTs, labelled assignments and raw Authorization tokens (K-02/K-03 cross-audit)', async () => {
    // Codex 5.6 Sol found the redactor missed these shapes entirely, so an
    // engine echoing any of them before failing put a live credential into the
    // conversation error bubble and the event buses.
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r';
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    await flushUntilSpawned(child);
    child.stderr.write(`token ${jwt} rejected\n`);
    child.stderr.write('config line: api_key = "TOTALLY-OPAQUE-VALUE-1234"\n');
    child.stderr.write('Authorization: aGVsbG93b3JsZHRoaXNpc2Fsb25ndG9rZW4=\n');
    await Promise.resolve();
    child.emit('exit', 1);

    const err = (await result) as Error;
    expect(err.message).not.toContain(jwt);
    expect(err.message).not.toContain('TOTALLY-OPAQUE-VALUE-1234');
    expect(err.message).not.toContain('aGVsbG93b3JsZHRoaXNpc2Fsb25ndG9rZW4');
    // The label stays so the diagnostic still reads sensibly.
    expect(err.message).toContain('api_key');
    expect(err.message).toContain('[redacted]');
  });

  it('does not redact ordinary diagnostic text that merely looks tokenish', async () => {
    // The redactor must stay conservative: over-redaction destroys the very
    // diagnostics K-02 exists to surface.
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    await flushUntilSpawned(child);
    child.stderr.write('failed loading /Users/someone/Library/Application Support/wayland-core/config.toml\n');
    await Promise.resolve();
    child.emit('exit', 1);

    const err = (await result) as Error;
    expect(err.message).toContain('config.toml');
    expect(err.message).not.toContain('[redacted]');
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

  it('retains failed tree-shutdown identity after root exit for an exact retry', async () => {
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

    killChildMock.mockResolvedValueOnce(undefined);
    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenNthCalledWith(1, child, false);
    expect(killChildMock).toHaveBeenNthCalledWith(2, child, false);
    expect(agent.isAlive).toBe(false);
  });

  it('retains launch config and child identity after an unrequested root exit until tree proof succeeds', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const restore = vi.fn();
    const agent = new WCoreAgent(baseOptions());
    (
      agent as unknown as {
        projectConfigTransaction: { restore: () => void };
      }
    ).projectConfigTransaction = { restore };
    const started = agent.start().catch((error: unknown) => error);
    await flushUntilSpawned(child);

    // A root can crash while descendants remain alive. Root exit alone cannot
    // release config or discard the only identity from which a tree scan can
    // begin, even when no shutdown attempt was already in flight.
    child.emit('exit', 1);
    expect(await started).toMatchObject({ message: 'wcore exited with code 1 during init' });
    expect(restore).not.toHaveBeenCalled();
    expect(agent.isAlive).toBe(false);

    killChildMock.mockResolvedValueOnce(undefined);
    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenCalledWith(child, false);
    expect(restore).toHaveBeenCalledOnce();
    expect(agent.isAlive).toBe(false);
  });

  it('retains ready-process identity after an unrequested crash without replaying terminal effects', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const stdinWrite = vi.spyOn(child.stdin, 'write');
    const restore = vi.fn();
    const onProcessTerminated = vi.fn();
    const agent = new WCoreAgent({ ...baseOptions(), onProcessTerminated });
    (
      agent as unknown as {
        projectConfigTransaction: { restore: () => void };
      }
    ).projectConfigTransaction = { restore };
    const started = agent.start();
    await flushUntilSpawned(child);

    const contractRoot = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1');
    child.stdout.write(`${readFileSync(path.join(contractRoot, 'events/ready.json'), 'utf8').trimEnd()}\n`);
    await started;
    // Ready consumption legitimately releases startup config once.
    expect(restore).toHaveBeenCalledOnce();

    child.emit('exit', 1);
    child.emit('exit', 1);
    expect(onProcessTerminated).toHaveBeenCalledOnce();
    expect(agent.isAlive).toBe(false);
    expect(restore).toHaveBeenCalledOnce();

    const writesAtExit = stdinWrite.mock.calls.length;
    agent.ping();
    expect(stdinWrite).toHaveBeenCalledTimes(writesAtExit);

    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(killChildMock).toHaveBeenCalledWith(child, false);
    expect(agent.isAlive).toBe(false);
    expect(restore).toHaveBeenCalledOnce();
  });

  it('fails closed after an active ready transport crash without post-exit writes or watchdog carryover', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const onProcessExit = vi.fn();
    const agent = new WCoreAgent({ ...baseOptions(), onProcessExit });
    const started = agent.start();
    await flushUntilSpawned(child);

    const contractRoot = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1');
    child.stdout.write(`${readFileSync(path.join(contractRoot, 'events/ready.json'), 'utf8').trimEnd()}\n`);
    await started;

    const stdinWrite = vi.spyOn(child.stdin, 'write');
    await agent.send('active turn', 'active-turn');
    expect(stdinWrite).toHaveBeenCalledOnce();

    // #853: Node fires 'exit' as (code, signal) — signal is null on a code-exit.
    // The agent forwards both, so onProcessExit now carries the signal arg.
    child.emit('exit', 1, null);
    child.emit('exit', 1, null);
    expect(agent.isAlive).toBe(false);
    expect(onProcessExit).toHaveBeenCalledOnce();
    expect(onProcessExit).toHaveBeenCalledWith(1, 'active-turn', null);

    const writesAtExit = stdinWrite.mock.calls.length;
    agent.ping();
    expect(stdinWrite).toHaveBeenCalledTimes(writesAtExit);
    await expect(agent.send('next turn', 'post-active-crash')).rejects.toThrow('exited');
    expect(stdinWrite).toHaveBeenCalledTimes(writesAtExit);

    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(killChildMock).toHaveBeenCalledWith(child, false);
  });

  it('fails a post-crash turn immediately while retaining the exited child for tree proof', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const agent = new WCoreAgent(baseOptions());
    const started = agent.start();
    await flushUntilSpawned(child);

    const contractRoot = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1');
    child.stdout.write(`${readFileSync(path.join(contractRoot, 'events/ready.json'), 'utf8').trimEnd()}\n`);
    await started;
    child.emit('exit', 1);

    let sendError: unknown;
    try {
      await agent.send('do not silently drop this turn', 'post-crash-turn');
    } catch (error) {
      sendError = error;
    } finally {
      await agent.kill();
    }

    expect(sendError).toBeInstanceOf(Error);
    expect((sendError as Error).message).toContain('exited');
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(killChildMock).toHaveBeenCalledWith(child, false);
  });

  it('fails a turn immediately when stdio closes before the root process exits', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const agent = new WCoreAgent(baseOptions());
    const started = agent.start();
    await flushUntilSpawned(child);

    const contractRoot = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1');
    child.stdout.write(`${readFileSync(path.join(contractRoot, 'events/ready.json'), 'utf8').trimEnd()}\n`);
    await started;

    const stdinWrite = vi.spyOn(child.stdin, 'write');
    const startWatchdog = vi.spyOn(agent as unknown as { startStallWatchdog: () => void }, 'startStallWatchdog');
    child.stdin.destroy();
    expect(child.stdin.writable).toBe(false);

    let sendError: unknown;
    try {
      await agent.send('do not silently drop this turn', 'closed-stdio-turn');
    } catch (error) {
      sendError = error;
    } finally {
      await agent.kill();
    }

    expect(sendError).toBeInstanceOf(Error);
    expect((sendError as Error).message).toContain('transport');
    expect(agent.isAlive).toBe(false);
    expect((agent as unknown as { activeMsgId: string | null }).activeMsgId).toBeNull();
    expect(startWatchdog).not.toHaveBeenCalled();
    expect(stdinWrite).not.toHaveBeenCalled();
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(killChildMock).toHaveBeenCalledWith(child, false);
  });

  it('marks an explicit stdin close as dead transport while retaining exact shutdown identity', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const agent = new WCoreAgent(baseOptions());
    const started = agent.start();
    await flushUntilSpawned(child);

    const contractRoot = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1');
    child.stdout.write(`${readFileSync(path.join(contractRoot, 'events/ready.json'), 'utf8').trimEnd()}\n`);
    await started;

    const stdinWrite = vi.spyOn(child.stdin, 'write');
    const startWatchdog = vi.spyOn(agent as unknown as { startStallWatchdog: () => void }, 'startStallWatchdog');
    child.stdin.emit('close');

    expect(agent.isAlive).toBe(false);
    await expect(agent.send('closed pipe turn', 'closed-pipe-turn')).rejects.toThrow('transport');
    expect((agent as unknown as { activeMsgId: string | null }).activeMsgId).toBeNull();
    expect(startWatchdog).not.toHaveBeenCalled();
    expect(stdinWrite).not.toHaveBeenCalled();

    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(killChildMock).toHaveBeenCalledWith(child, false);
  });

  it('handles a synchronous stdin write error without losing root-exit or tree-proof authority', async () => {
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

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const startWatchdog = vi.spyOn(agent as unknown as { startStallWatchdog: () => void }, 'startStallWatchdog');
    vi.spyOn(child.stdin, 'write').mockImplementationOnce((() => {
      child.stdin.emit('error', new Error('closed during write'));
      return true;
    }) as typeof child.stdin.write);

    await expect(agent.send('raced turn', 'stdin-error-race')).rejects.toThrow('transport');
    const warningCount = warn.mock.calls.length;
    warn.mockRestore();
    expect(warningCount).toBe(1);
    expect(agent.isAlive).toBe(false);
    expect((agent as unknown as { activeMsgId: string | null }).activeMsgId).toBeNull();
    expect(startWatchdog).not.toHaveBeenCalled();
    expect(onProcessExit).not.toHaveBeenCalled();

    child.emit('exit', 1);
    child.emit('exit', 1);
    expect(onProcessTerminated).toHaveBeenCalledOnce();

    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(killChildMock).toHaveBeenCalledWith(child, false);
  });

  it('fails an active turn once when stdin errors before a later close and repeated root exit', async () => {
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
    await agent.send('active before pipe failure', 'active-pipe-turn');

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    child.stdin.emit('error', new Error('pipe failed after write'));
    child.stdin.emit('close');

    const warningCount = warn.mock.calls.length;
    warn.mockRestore();
    expect(warningCount).toBe(1);
    expect(agent.isAlive).toBe(false);
    expect(onProcessExit).toHaveBeenCalledOnce();
    expect(onProcessExit).toHaveBeenCalledWith(null, 'active-pipe-turn');
    expect((agent as unknown as { activeMsgId: string | null }).activeMsgId).toBeNull();

    child.emit('exit', 1);
    child.emit('exit', 1);
    expect(onProcessExit).toHaveBeenCalledOnce();
    expect(onProcessTerminated).toHaveBeenCalledOnce();

    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(killChildMock).toHaveBeenCalledWith(child, false);
  });

  it('serializes concurrent shutdown after an unrequested root exit onto one exact proof', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    let resolveTreeProof!: () => void;
    killChildMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveTreeProof = resolve;
      })
    );
    const restore = vi.fn();
    const agent = new WCoreAgent(baseOptions());
    (
      agent as unknown as {
        projectConfigTransaction: { restore: () => void };
      }
    ).projectConfigTransaction = { restore };
    const started = agent.start().catch((error: unknown) => error);
    await flushUntilSpawned(child);

    child.emit('exit', 1);
    expect(await started).toMatchObject({ message: 'wcore exited with code 1 during init' });
    const firstShutdown = agent.kill();
    const concurrentShutdown = agent.kill();
    await vi.waitFor(() => expect(killChildMock).toHaveBeenCalledOnce());
    expect(restore).not.toHaveBeenCalled();

    resolveTreeProof();
    await expect(Promise.all([firstShutdown, concurrentShutdown])).resolves.toEqual([undefined, undefined]);
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(killChildMock).toHaveBeenCalledWith(child, false);
    expect(restore).toHaveBeenCalledOnce();
    expect(agent.isAlive).toBe(false);
  });

  it('ignores late and repeated root exit after exact shutdown proof already restored config', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const restore = vi.fn();
    const onProcessTerminated = vi.fn();
    const agent = new WCoreAgent({ ...baseOptions(), onProcessTerminated });
    (
      agent as unknown as {
        projectConfigTransaction: { restore: () => void };
      }
    ).projectConfigTransaction = { restore };
    const started = agent.start().catch((error: unknown) => error);
    await flushUntilSpawned(child);

    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenCalledOnce();
    expect(restore).toHaveBeenCalledOnce();
    expect(agent.isAlive).toBe(false);

    child.emit('exit', 0);
    child.emit('exit', 0);
    expect(await started).toMatchObject({ message: 'wcore exited with code 0 during init' });
    expect(onProcessTerminated).toHaveBeenCalledOnce();
    expect(restore).toHaveBeenCalledOnce();
    expect(agent.isAlive).toBe(false);
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

    child.emit('exit', 1);
    child.emit('exit', 1);
    expect(agent.isAlive).toBe(false);

    await expect(agent.kill()).resolves.toBeUndefined();
    expect(killChildMock).toHaveBeenNthCalledWith(1, child, false);
    expect(killChildMock).toHaveBeenNthCalledWith(2, child, false);
    expect(agent.isAlive).toBe(false);
  });

  // ── K-02: DIA-01/DIA-02 honest start-failure surfacing ─────────────

  it('DIA-01: a contract-rejection with engine stderr present surfaces the engine reason, not the abstraction', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    await flushUntilSpawned(child);
    child.stderr.write('Error: something the engine explained\n');
    await Promise.resolve();
    // Not JSON-parseable -> triggers failDesktopContract via the Desktop v1
    // consumer's malformed-JSON bail (desktopContractV1.ts fail('malformed_json', ...)).
    child.stdout.write('not json at all\n');

    const err = (await result) as Error;
    expect(err.message).toContain('something the engine explained');
    expect(err.message).not.toContain('Desktop contract rejected ready');
  });

  it('DIA-01: a contract-rejection with no engine stderr keeps the original fallback wording (no regression)', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    await flushUntilSpawned(child);
    // Nothing written to stderr this time.
    child.stdout.write('not json at all\n');

    const err = (await result) as Error;
    expect(err.message).toContain('wcore Desktop contract rejected ready');
    expect(err.message).toContain('Core emitted malformed JSON');
  });

  it('DIA-02: an exit-path bail naming Desktop\'s own reserved profile is hedged as a stripped-config inference', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    await flushUntilSpawned(child);
    child.stderr.write(`Error: Profile '${WCORE_DESKTOP_MCP_PROFILE}' not found in config\n`);
    await Promise.resolve();
    child.emit('exit', 1);

    const err = (await result) as Error;
    expect(err.message).toContain('not found in config');
    expect(err.message).toMatch(/likely|inferred|not confirmed/i);
  });

  it('DIA-02: an exit-path bail naming an ordinary profile stays unhedged', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    await flushUntilSpawned(child);
    child.stderr.write("Error: Profile 'some-other-profile' not found in config\n");
    await Promise.resolve();
    child.emit('exit', 1);

    const err = (await result) as Error;
    expect(err.message).toContain('not found in config');
    expect(err.message).not.toMatch(/likely|inferred|not confirmed/i);
  });

  it('DIA-01: secret redaction still holds through the new contract-rejection path', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const agent = new WCoreAgent(baseOptions());
    const result = agent.start().catch((e: unknown) => e);

    await flushUntilSpawned(child);
    child.stderr.write('auth failed with key sk-abcdef0123456789ABCDEF for provider openai\n');
    await Promise.resolve();
    child.stdout.write('not json at all\n');

    const err = (await result) as Error;
    // The human-readable reason survives; the token does not (describeContractRejection
    // receives an already-redacted stderrDetail - this is not a second redaction site).
    expect(err.message).toContain('auth failed');
    expect(err.message).toContain('[redacted]');
    expect(err.message).not.toContain('sk-abcdef0123456789ABCDEF');
  });
});
