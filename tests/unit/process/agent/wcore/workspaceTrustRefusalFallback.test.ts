/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * A REFUSED WORKSPACE-TRUST GRANT MUST NOT KILL THE CHAT.
 *
 * `--trust-workspace` (60212ffaf) is what opens loopback and egress for a skill
 * script running in the per-chat workspace Desktop mints. Core grants the trust
 * fingerprint at the top of `main`, before config resolution and before any
 * session exists, so a REFUSED grant is `anyhow::bail`: the engine exits,
 * `ready` never arrives, and every turn in that chat is then refused. Before
 * the flag existed the same chat merely ran untrusted. Live-verified on a
 * packaged build with a greenfield profile, where a 52MB vendored connector
 * inside an enabled skill crossed Core's fingerprint limits:
 *
 *   [error] [WCoreAgent] Desktop contract failed closed
 *   [warn]  [wcore] Error: executable repository surface exceeds the fingerprint limits
 *   Agent failed to start: wcore Desktop contract rejected ready: …
 *
 * BOTH DIRECTIONS ARE THE POINT OF THIS FILE. The recovery is a respawn without
 * the flag, and it is deliberately narrow - a blanket "retry on contract
 * failure" would mask real protocol bugs. So every case below pairs the retry
 * with a non-trust failure that must still fail closed with no second spawn.
 *
 * Harness follows `tests/unit/wcoreStderrSurfacing.test.ts`: the real
 * `WCoreAgent.start()` drives a fake child, and argv is read off the real
 * `spawn` call.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
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
  WCORE_DESKTOP_MCP_PROFILE: '__wayland_desktop_session',
  WCORE_DESKTOP_HOST_ASSISTANT: 'wayland-desktop',
  resolveOutputDir: (workspace: string) => `${workspace}/artifacts`,
  buildOutputDirective: (dir: string) => `deliverables go in ${dir}`,
}));
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
const killChildMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('@process/agent/acp/utils', () => ({ killChild: killChildMock }));
vi.mock('@process/onboarding/codexAuthFile', () => ({ readCodexAuthFile: vi.fn().mockResolvedValue(null) }));

import { WCoreAgent } from '@process/agent/wcore';
import type { WCoreAgentOptions } from '@process/agent/wcore';

const TRUST_FLAG = '--trust-workspace';

/** Core's own refusal, byte-exact from the packaged-build log. */
const TRUST_REFUSAL = 'Error: executable repository surface exceeds the fingerprint limits';

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

const realSetTimeout = globalThis.setTimeout;
const SPAWN_POLL_ATTEMPTS = 1_000;

/** Wait until start() has spawned child N and attached its production listeners. */
async function flushUntilSpawned(child: FakeChild, expectedSpawnCount = 1): Promise<void> {
  for (let i = 0; i < SPAWN_POLL_ATTEMPTS; i++) {
    if (spawnMock.mock.calls.length >= expectedSpawnCount && child.listenerCount('exit') >= 2) return;
    // oxlint-disable-next-line no-await-in-loop -- each bounded probe must observe listener attachment
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(0);
    // oxlint-disable-next-line no-await-in-loop -- each bounded probe must observe listener attachment
    await new Promise((resolve) => realSetTimeout(resolve, 1));
  }
  throw new Error(`WCore child ${expectedSpawnCount} did not finish attaching its production listeners`);
}

/** The managed work root Desktop mints into, and the `wcore-temp-*` workspace in it. */
let workRoot = '';
let mintedWorkspace = '';

function baseOptions(): WCoreAgentOptions {
  return {
    workspace: mintedWorkspace,
    // The gate that puts `--trust-workspace` in argv at all. Without a work
    // root the flag is never passed and every case here would pass vacuously,
    // which is why each one asserts the flag was on the FIRST spawn.
    managedWorkRoot: workRoot,
    model: { name: 'test', useModel: 'test-model', platform: 'openai', baseUrl: '' } as WCoreAgentOptions['model'],
    onStreamEvent: vi.fn(),
  };
}

function argvOf(call: number): string[] {
  return spawnMock.mock.calls[call][1] as string[];
}

describe('a refused --trust-workspace grant retries ONCE untrusted instead of killing the chat', () => {
  beforeEach(() => {
    workRoot = mkdtempSync(path.join(tmpdir(), 'wl-trust-workroot-'));
    mintedWorkspace = path.join(workRoot, 'wcore-temp-1787307089126');
    mkdirSync(mintedWorkspace, { recursive: true });
    spawnMock.mockReset();
    killChildMock.mockClear();
    killChildMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    rmSync(workRoot, { recursive: true, force: true });
  });

  it('respawns without the flag and the session then starts', async () => {
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);

    const agent = new WCoreAgent(baseOptions());
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    expect(argvOf(0)).toContain(TRUST_FLAG);

    // The measured production ordering: the engine bails, its stderr reaches the
    // reader, and the process exits before `ready`.
    // `end` as well as `write`: a bailing engine closes its stderr, and that
    // close is what lets the retry decision read the tail without waiting out
    // its settle bound.
    first.stderr.end(`${TRUST_REFUSAL}\n`);
    await vi.advanceTimersByTimeAsync(0);
    first.emit('exit', 1);

    // The retry must be the SAME launch, minus the flag.
    await flushUntilSpawned(second, 2);
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(argvOf(1)).not.toContain(TRUST_FLAG);
    expect(killChildMock).toHaveBeenCalledWith(first, false);

    // And it reaches ready: the chat lives, untrusted.
    second.stdout.write(`${JSON.stringify({ type: 'ready', data: {}, msg_id: '' })}\n`);
    await vi.advanceTimersByTimeAsync(0);
    await expect(started).resolves.toBeUndefined();
  });

  it('reads the refusal even when the engine writes it AFTER ready has already failed', async () => {
    // The regression as actually measured: Desktop logged its contract failure
    // 5ms BEFORE `[wcore] Error: executable repository surface exceeds …`
    // reached the stderr reader. A tail read taken at the failure site finds
    // nothing, so without the settle wait the retry silently never fires.
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);

    const agent = new WCoreAgent(baseOptions());
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    expect(argvOf(0)).toContain(TRUST_FLAG);

    // A non-`ready` first frame: the Desktop contract fails closed on the spot.
    first.stdout.write(`${JSON.stringify({ type: 'stream_end', data: {}, msg_id: 'x' })}\n`);
    await vi.advanceTimersByTimeAsync(0);
    // Only now does the engine's own reason arrive.
    first.stderr.end(`${TRUST_REFUSAL}\n`);
    await vi.advanceTimersByTimeAsync(0);

    await flushUntilSpawned(second, 2);
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(argvOf(1)).not.toContain(TRUST_FLAG);

    second.stdout.write(`${JSON.stringify({ type: 'ready', data: {}, msg_id: '' })}\n`);
    await vi.advanceTimersByTimeAsync(0);
    await expect(started).resolves.toBeUndefined();
  });

  it('a NON-trust ready failure on the same trusted spawn still fails closed, with no retry', async () => {
    // The narrowness assertion. A blanket "retry on contract failure" would
    // mask real protocol bugs and hide a keyless engine behind a second spawn.
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);

    const agent = new WCoreAgent(baseOptions());
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    expect(argvOf(0)).toContain(TRUST_FLAG);

    first.stderr.end('error: no API key configured for provider "openai"\n');
    await vi.advanceTimersByTimeAsync(0);
    first.emit('exit', 1);

    // Drain past the settle bound so a late retry could not still be pending.
    await vi.advanceTimersByTimeAsync(1_000);

    const err = (await started) as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('wcore exited with code 1 during init');
    expect(err.message).toContain('no API key configured');
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it('retries at most once: a second trust refusal fails closed', async () => {
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    const third = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second).mockReturnValueOnce(third);

    const agent = new WCoreAgent(baseOptions());
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    first.stderr.end(`${TRUST_REFUSAL}\n`);
    await vi.advanceTimersByTimeAsync(0);
    first.emit('exit', 1);

    await flushUntilSpawned(second, 2);
    expect(argvOf(1)).not.toContain(TRUST_FLAG);

    // Whatever the untrusted attempt dies of, there is no third spawn.
    second.stderr.end(`${TRUST_REFUSAL}\n`);
    await vi.advanceTimersByTimeAsync(0);
    second.emit('exit', 1);
    await vi.advanceTimersByTimeAsync(1_000);

    const err = (await started) as Error;
    expect(err.message).toContain('wcore exited with code 1 during init');
    expect(spawnMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry when the spawn never asked for trust, even on the same refusal text', async () => {
    // Provenance decides whether the flag is passed at all (a user-picked folder
    // is never trusted). With no flag in argv the refusal cannot be ours, so the
    // failure must surface unchanged.
    vi.useFakeTimers();
    const first = makeChild();
    const second = makeChild();
    spawnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);

    const agent = new WCoreAgent({ ...baseOptions(), customWorkspace: true });
    const started = agent.start().catch((error: unknown) => error);

    await flushUntilSpawned(first);
    expect(argvOf(0)).not.toContain(TRUST_FLAG);

    first.stderr.end(`${TRUST_REFUSAL}\n`);
    await vi.advanceTimersByTimeAsync(0);
    first.emit('exit', 1);
    await vi.advanceTimersByTimeAsync(1_000);

    const err = (await started) as Error;
    expect(err.message).toContain('executable repository surface exceeds the fingerprint limits');
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });
});
