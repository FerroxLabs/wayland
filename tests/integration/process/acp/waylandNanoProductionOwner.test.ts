import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import type { ChildProcess } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';

const connectorMocks = vi.hoisted(() => ({ spawnGenericBackend: vi.fn() }));

vi.mock('electron', () => ({
  app: { getPath: () => 'C:/test-user-data' },
  safeStorage: {},
}));

vi.mock('@process/agent/acp/acpConnectors', () => ({
  connectClaude: vi.fn(),
  connectCodebuddy: vi.fn(),
  connectCodex: vi.fn(),
  spawnGenericBackend: connectorMocks.spawnGenericBackend,
  waylandNanoNonpersistentArgs: () => ['acp-host', '--nonpersistent'],
}));

import '@/common/platform/register-node';
import { WaylandNanoActivationKeyStore } from '@process/agent/activation/waylandNanoActivationKeyStore';
import {
  WaylandNanoActivationOwner,
  type WaylandNanoActivationGrant,
  type WaylandNanoActivationOwnerOptions,
} from '@process/agent/activation/waylandNanoActivationOwner';
import type { WaylandNanoBinaryExpectation } from '@process/agent/activation/waylandNanoBinaryVerifier';
import { WaylandNanoBindingStore } from '@process/agent/activation/waylandNanoBindingStore';
import type { SignedWaylandNanoActivation, WaylandNanoBinding } from '@process/agent/activation/types';
import { AcpConnection, type WaylandNanoBindingOwner } from '@process/agent/acp/AcpConnection';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import type { ProtocolHandlers } from '@process/acp/types';
import {
  installProductionWaylandNanoActivationOwner,
  workerTaskManager,
} from '@process/task/workerTaskManagerSingleton';
import type { TChatConversation } from '@/common/config/storage';

const roots: string[] = [];
const SOURCE_SHA = '1'.repeat(40);
const LOCK_SHA = '2'.repeat(64);
const RESUME_FINGERPRINT = '3'.repeat(64);
const GRANT: WaylandNanoActivationGrant = Object.freeze({
  capabilities: Object.freeze(['filesystem.read']),
  budgets: Object.freeze({
    max_turns: 4,
    max_tool_calls: 8,
    max_input_tokens: 4096,
    max_output_tokens: 2048,
    max_cost_microcents: 1_000,
    wall_clock_ms: 60_000,
  }),
  controls: Object.freeze(['cancel', 'pause']),
  validityMs: 300_000,
});

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Wayland Nano production activation owner', () => {
  it('resolves only an enrolled opaque binding and releases retries only for correlated child receipt metadata', async () => {
    const fixture = await ownerFixture();
    const resolved = await fixture.owner.load(fixture.binding.productSubjectId);
    expect(resolved?.binding).toEqual(fixture.binding);

    const first = await resolved!.activation.buildAttempt({ operation: 'new', sessionId: null });
    const retry = await resolved!.activation.buildAttempt({ operation: 'new', sessionId: null });
    expect(retry.activation).toBe(first.activation);

    expect(
      first.observeTerminalResponse?.({
        _meta: {
          waylandNanoActivationReceipt: receipt(first.activation, fixture.expectation, { activation_id: 'spoofed' }),
        },
      })
    ).toBe(false);
    expect(first.observeTerminalResponse?.(new Error('generic transport failure'))).toBe(false);
    expect((await resolved!.activation.buildAttempt({ operation: 'new', sessionId: null })).activation).toBe(
      first.activation
    );

    expect(
      first.observeTerminalResponse?.({
        sessionId: 'session-1',
        _meta: {
          waylandNanoActivationReceipt: receipt(first.activation, fixture.expectation, { session_id: 'session-1' }),
          waylandNanoResumeFingerprint: RESUME_FINGERPRINT,
        },
      })
    ).toBe(true);
    const next = await resolved!.activation.buildAttempt({ operation: 'new', sessionId: null });
    expect(next.activation.activation_id).not.toBe(first.activation.activation_id);

    const resumed = await resolved!.activation.buildAttempt({ operation: 'load', sessionId: 'session-1' });
    expect(resumed.activation.continuity).toEqual({
      strategy: 'session_resume',
      fallback: 'none',
      resume_fingerprint: RESUME_FINGERPRINT,
    });
    await fixture.owner.dispose();
  });

  it('keeps absent binding, unavailable OS custody, and artifact mismatch nonpersistent', async () => {
    const fixture = await ownerFixture();
    expect(await fixture.owner.load('unknown-subject')).toBeNull();
    await fixture.owner.dispose();

    const noCustody = await ownerFixture(false);
    expect(await noCustody.owner.load(noCustody.binding.productSubjectId)).toBeNull();
    await noCustody.owner.dispose();

    const mismatched = await ownerFixture(true, { sha256: 'f'.repeat(64) });
    expect(await mismatched.owner.load(mismatched.binding.productSubjectId)).toBeNull();
    await mismatched.owner.dispose();
  });

  it('disposes staged executable identity and rejects use after shutdown', async () => {
    const fixture = await ownerFixture();
    const resolved = await fixture.owner.load(fixture.binding.productSubjectId);
    const stagedPath = resolved!.activation.binary.canonicalPath;
    expect(existsSync(stagedPath)).toBe(true);
    await fixture.owner.dispose();
    expect(existsSync(stagedPath)).toBe(false);
    await expect(resolved!.activation.buildAttempt({ operation: 'new', sessionId: null })).rejects.toThrow('disposed');
  });

  it('installs one process owner, rejects a concurrent replacement, and supports idempotent shutdown', async () => {
    const first = await ownerFixture();
    const second = await ownerFixture();
    const uninstall = await installProductionWaylandNanoActivationOwner(first.options);
    const factory = (
      workerTaskManager as unknown as {
        factory: { create(conversation: TChatConversation): unknown };
      }
    ).factory;
    const productionManager = factory.create({
      id: 'production-owner-probe',
      type: 'acp',
      name: 'Wayland Nano',
      createdAt: 0,
      updatedAt: 0,
      extra: {
        backend: 'wnano',
        workspace: first.binding.projectId,
        waylandNanoBindingRef: first.binding.productSubjectId,
      },
    } as unknown as TChatConversation) as Readonly<{ waylandNanoBindingOwner: WaylandNanoBindingOwner | null }>;
    expect(await productionManager.waylandNanoBindingOwner?.load(first.binding.productSubjectId)).not.toBeNull();
    await expect(installProductionWaylandNanoActivationOwner(second.options)).rejects.toThrow('already installed');
    await uninstall();
    await uninstall();
    const reinstall = await installProductionWaylandNanoActivationOwner(second.options);
    await reinstall();
    await expect(installProductionWaylandNanoActivationOwner(null)).resolves.toBeTypeOf('function');
  });

  it('never infers authority from a malformed or remapped caller reference', async () => {
    const fixture = await ownerFixture();
    expect(await fixture.owner.load('../subject-a')).toBeNull();
    expect(await fixture.owner.load(fixture.binding.principalId)).toBeNull();
    expect(await fixture.owner.load(fixture.binding.projectId)).toBeNull();
    await fixture.owner.dispose();
  });

  it('releases retries from terminal metadata received by both private spawned-Nano transports only', async () => {
    const fixture = await ownerFixture();
    const legacyResolved = await fixture.owner.load(fixture.binding.productSubjectId);
    const legacyTransport = terminalChild(fixture.expectation);
    connectorMocks.spawnGenericBackend.mockResolvedValue({ child: legacyTransport.child, isDetached: false });
    const legacy = new AcpConnection(legacyResolved!.activation);
    await legacy.connect('wnano', fixture.expectation.canonicalPath, fixture.binding.projectId);
    await legacy.initialize();
    await legacy.newSession(fixture.binding.projectId);
    await legacy.newSession(fixture.binding.projectId);

    const sdkResolved = await fixture.owner.load(fixture.binding.productSubjectId);
    const sdkTransport = terminalChild(fixture.expectation);
    const sdk = new ProcessAcpClient(
      async () => {
        setTimeout(() => sdkTransport.child.emit('spawn'), 0);
        return sdkTransport.child;
      },
      { backend: 'wnano', handlers: protocolHandlers(), waylandNanoActivation: sdkResolved!.activation }
    );
    await sdk.start();
    await sdk.createSession({
      cwd: fixture.binding.projectId,
      mcpServers: [],
      metadata: { waylandNanoActivationReceipt: { activation_id: 'caller-spoof' } },
    });
    await sdk.createSession({ cwd: fixture.binding.projectId, mcpServers: [] });

    expect(activationIds(legacyTransport.frames)).toHaveLength(2);
    expect(new Set(activationIds(legacyTransport.frames)).size).toBe(2);
    expect(activationIds(sdkTransport.frames)).toHaveLength(2);
    expect(new Set(activationIds(sdkTransport.frames)).size).toBe(2);
    Object.assign(legacyTransport.child, { exitCode: 0 });
    legacyTransport.child.emit('exit', 0, null);
    await legacy.disconnect();
    Object.assign(sdkTransport.child, { exitCode: 0 });
    sdkTransport.child.emit('exit', 0, null);
    await sdk.close();
    await fixture.owner.dispose();
  });
});

async function ownerFixture(
  custody = true,
  expectationOverride: Partial<WaylandNanoBinaryExpectation> = {}
): Promise<
  Readonly<{
    owner: WaylandNanoActivationOwner;
    options: WaylandNanoActivationOwnerOptions;
    binding: WaylandNanoBinding;
    expectation: WaylandNanoBinaryExpectation;
  }>
> {
  const parent = process.platform === 'win32' && process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA : process.cwd();
  const fixtureRoot = await mkdtemp(path.join(parent, 'wayland-nano-owner-'));
  roots.push(fixtureRoot);
  const userDataRoot = path.join(fixtureRoot, 'user-data');
  const stagingRoot = path.join(fixtureRoot, 'staging');
  await Promise.all([mkdir(userDataRoot, { mode: 0o700 }), mkdir(stagingRoot, { mode: 0o700 })]);
  const executable = path.join(fixtureRoot, process.platform === 'win32' ? 'nano.exe' : 'nano');
  const bytes = Buffer.from('phase-2-owner-fixture');
  await writeFile(executable, bytes, { mode: 0o700 });
  const availableSafeStorage = {
    isEncryptionAvailable: () => true,
    getSelectedStorageBackend: () => 'gnome_libsecret' as const,
    encryptString: (value: string) => Buffer.from(value, 'utf8'),
    decryptString: (value: Buffer) => value.toString('utf8'),
  };
  const keyStore = new WaylandNanoActivationKeyStore(userDataRoot, availableSafeStorage);
  const key = await keyStore.create('desktop');
  const binding = Object.freeze({
    productSubjectId: 'subject-a',
    principalId: 'principal-a',
    projectId: 'project-a',
    issuerId: 'desktop',
    issuerKeyRef: key.keyRef,
    backend: 'wayland-nano' as const,
  });
  await new WaylandNanoBindingStore(userDataRoot).put(binding);
  const safeStorage = { ...availableSafeStorage, isEncryptionAvailable: () => custody };
  const expectation = Object.freeze({
    canonicalPath: executable,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    size: bytes.byteLength,
    sourceCommitSha: SOURCE_SHA,
    cargoLockSha256: LOCK_SHA,
    stagingRoot,
    ...expectationOverride,
  });
  const options: WaylandNanoActivationOwnerOptions = Object.freeze({
    userDataRoot,
    safeStorage,
    artifactExpectation: expectation,
    grant: GRANT,
    now: () => new Date('2026-08-30T10:00:00.000Z'),
  });
  return Object.freeze({ owner: new WaylandNanoActivationOwner(options), options, binding, expectation });
}

function receipt(
  activation: SignedWaylandNanoActivation,
  expectation: WaylandNanoBinaryExpectation,
  overrides: Readonly<Record<string, unknown>> = {}
): Record<string, unknown> {
  return {
    schema: 'wayland.nano.activation-receipt/v1',
    receipt_id: `receipt-${activation.activation_id}`,
    signature: 'opaque-nano-signature',
    activation_id: activation.activation_id,
    product_subject_id: activation.product_subject_id,
    principal_id: activation.principal_id,
    project_id: activation.project_id,
    session_id: activation.session_id,
    source_commit_sha: expectation.sourceCommitSha,
    cargo_lock_sha256: expectation.cargoLockSha256,
    executable_sha256: expectation.sha256,
    ...overrides,
  };
}

type JsonRpcFrame = Readonly<{
  id?: number;
  method: string;
  params?: Readonly<Record<string, unknown>>;
}>;

function terminalChild(expectation: WaylandNanoBinaryExpectation): Readonly<{ child: ChildProcess; frames: string[] }> {
  const child = new EventEmitter() as ChildProcess;
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const frames: string[] = [];
  let buffered = '';
  stdin.on('data', (chunk: Buffer) => {
    buffered += chunk.toString('utf8');
    for (;;) {
      const newline = buffered.indexOf('\n');
      if (newline < 0) break;
      const raw = buffered.slice(0, newline + 1);
      buffered = buffered.slice(newline + 1);
      frames.push(raw);
      const frame = JSON.parse(raw) as JsonRpcFrame;
      if (frame.id === undefined) continue;
      const activation = activationFrom(frame);
      const result =
        frame.method === 'initialize'
          ? { protocolVersion: '0.1', capabilities: { loadSession: true } }
          : activation
            ? {
                sessionId: 'session-owner',
                _meta: {
                  waylandNanoActivationReceipt: receipt(activation, expectation, { session_id: 'session-owner' }),
                  waylandNanoResumeFingerprint: RESUME_FINGERPRINT,
                },
              }
            : {};
      stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: frame.id, result })}\n`);
    }
  });
  Object.assign(child, {
    stdin,
    stdout,
    stderr,
    pid: 4242,
    exitCode: null,
    signalCode: null,
    killed: false,
    kill: vi.fn(() => {
      setTimeout(() => child.emit('exit', 0, null), 0);
      return true;
    }),
    unref: vi.fn(),
  });
  return Object.freeze({ child, frames });
}

function activationFrom(frame: JsonRpcFrame): SignedWaylandNanoActivation | null {
  const metadata = frame.params?._meta;
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) return null;
  const activation = (metadata as Readonly<Record<string, unknown>>).waylandNanoActivation;
  return typeof activation === 'object' && activation !== null ? (activation as SignedWaylandNanoActivation) : null;
}

function activationIds(frames: readonly string[]): string[] {
  return frames
    .map((raw) => activationFrom(JSON.parse(raw) as JsonRpcFrame)?.activation_id)
    .filter((value): value is string => typeof value === 'string');
}

function protocolHandlers(): ProtocolHandlers {
  return {
    onSessionUpdate: vi.fn(),
    onRequestPermission: vi.fn(),
    onReadTextFile: vi.fn(),
    onWriteTextFile: vi.fn(),
  };
}
