import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import type { ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it, vi } from 'vitest';
import canonicalize from 'canonicalize';

// Every case here builds a real fixture on disk: mkdtemp under LOCALAPPDATA, mode-0700
// directories, a written executable, a KeyStore create and a BindingStore put, then a
// recursive rm in teardown. That costs ~0.6s on a warm macOS checkout and comfortably
// more than the 10s suite default on a windows-2022 runner with a scanner in the path.
const CASE_TIMEOUT_MS = 60_000;
const TEARDOWN_TIMEOUT_MS = 60_000;

const connectorMocks = vi.hoisted(() => ({ spawnGenericBackend: vi.fn() }));
const execFileAsync = promisify(execFile);
const electronMocks = vi.hoisted(() => ({
  userDataRoot: 'C:/test-user-data',
  encryptionAvailable: true,
  backend: 'gnome_libsecret' as 'basic_text' | 'gnome_libsecret' | 'kwallet' | 'kwallet5' | 'kwallet6' | 'unknown',
}));

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => (name === 'userData' ? electronMocks.userDataRoot : 'C:/test-user-data'),
    isPackaged: false,
  },
  safeStorage: {
    isEncryptionAvailable: () => electronMocks.encryptionAvailable,
    getSelectedStorageBackend: () => electronMocks.backend,
    encryptString: (value: string) => Buffer.from(value, 'utf8'),
    decryptString: (value: Buffer) => value.toString('utf8'),
  },
}));

vi.mock('@process/agent/acp/acpConnectors', () => ({
  connectClaude: vi.fn(),
  connectCodebuddy: vi.fn(),
  connectCodex: vi.fn(),
  spawnGenericBackend: connectorMocks.spawnGenericBackend,
  waylandNanoAuthenticatedArgs: () => ['acp-host'],
  waylandNanoAuthenticatedEnvironment: (environment: Record<string, string>) => ({ ...environment }),
  waylandNanoNonpersistentArgs: () => ['acp-host', '--nonpersistent'],
  waylandNanoNonpersistentEnvironment: (environment?: Record<string, string>) => environment,
}));

vi.mock('@process/bridge', () => ({ initAllBridges: vi.fn() }));

vi.mock('@process/services/constitution/constitutionFsBinary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/services/constitution/constitutionFsBinary')>();
  return {
    ...actual,
    verifyPackagedConstitutionFsBinary: () => {
      throw new actual.ConstitutionFsBinaryError(
        'CONSTITUTION_FS_UNSAFE_PLATFORM',
        'Packaged Constitution filesystem authority is outside this activation-owner test.'
      );
    },
  };
});

import '@/common/platform/register-node';
import { WaylandNanoActivationKeyStore } from '@process/agent/activation/waylandNanoActivationKeyStore';
import {
  WaylandNanoActivationOwner,
  type WaylandNanoActivationGrant,
  type WaylandNanoActivationOwnerOptions,
} from '@process/agent/activation/waylandNanoActivationOwner';
import type { WaylandNanoBinaryExpectation } from '@process/agent/activation/waylandNanoBinaryVerifier';
import { enforceOwnerOnlyPath, WaylandNanoBindingStore } from '@process/agent/activation/waylandNanoBindingStore';
import type { SignedWaylandNanoActivation, WaylandNanoBinding } from '@process/agent/activation/types';
import { AcpConnection, type WaylandNanoBindingOwner } from '@process/agent/acp/AcpConnection';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import type { ProtocolHandlers } from '@process/acp/types';
import {
  installProductionWaylandNanoActivationOwner,
  workerTaskManager,
} from '@process/task/workerTaskManagerSingleton';
import type { TChatConversation } from '@/common/config/storage';
import { disposeWaylandNanoActivationOwner, initializeWaylandNanoActivationOwner } from '@process/utils/initBridge';

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

// Teardown runs every step even if an earlier one throws. A case that times out mid-flight
// used to abort this hook at the dispose() call, which left the process owner installed and
// the temp roots on disk, so every later case in the file failed on state it never created.
afterEach(async () => {
  const failures: unknown[] = [];
  const attempt = async (step: () => Promise<unknown>) => {
    try {
      await step();
    } catch (error) {
      failures.push(error);
    }
  };

  await attempt(() => disposeWaylandNanoActivationOwner());
  electronMocks.encryptionAvailable = true;
  electronMocks.backend = 'gnome_libsecret';
  electronMocks.userDataRoot = 'C:/test-user-data';
  await Promise.all(roots.splice(0).map((root) => attempt(() => rm(root, { recursive: true, force: true }))));

  if (failures.length > 0) {
    throw new AggregateError(failures, 'teardown failed after restoring shared state');
  }
}, TEARDOWN_TIMEOUT_MS);

describe('Wayland Nano production activation owner', { timeout: CASE_TIMEOUT_MS }, () => {
  it('resolves only an enrolled opaque binding and releases retries only for correlated child receipt metadata', async () => {
    const fixture = await ownerFixture();
    const resolved = await fixture.owner.load(fixture.binding.productSubjectId);
    expect(resolved?.binding).toEqual(fixture.binding);
    expect(resolved?.activation.spawnEnv).toEqual({
      NANO_HOME: path.join(fixture.options.userDataRoot, 'wayland-nano', 'nano-home'),
    });

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
    expect(
      first.observeTerminalResponse?.({
        sessionId: 'session-1',
        _meta: {
          waylandNanoActivationReceipt: receipt(first.activation, fixture.expectation, { session_id: 'session-1' }),
          waylandNanoResumeFingerprint: RESUME_FINGERPRINT,
        },
      })
    ).toBe(false);
    expect((await resolved!.activation.buildAttempt({ operation: 'new', sessionId: null })).activation).toBe(
      next.activation
    );

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
  }, 30_000);

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
  }, 30_000);

  it('installs the real default-off startup seam from one canonical owner manifest and uninstalls on shutdown', async () => {
    const fixture = await ownerFixture();
    electronMocks.userDataRoot = fixture.options.userDataRoot;

    await initializeWaylandNanoActivationOwner();
    expect(productionManagerOwner()).toBeNull();
    await disposeWaylandNanoActivationOwner();

    await writeOwnerManifest(fixture, '{}');
    await initializeWaylandNanoActivationOwner();
    expect(productionManagerOwner()).toBeNull();
    await disposeWaylandNanoActivationOwner();

    await writeOwnerManifest(fixture, ownerManifest(fixture));
    await Promise.all([initializeWaylandNanoActivationOwner(), initializeWaylandNanoActivationOwner()]);
    const installed = productionManagerOwner();
    expect(installed).not.toBeNull();
    const legacyResolved = await installed!.load(fixture.binding.productSubjectId);
    expect(legacyResolved?.binding).toEqual(fixture.binding);
    const loadedExpectation = {
      ...fixture.expectation,
      stagingRoot: path.join(fixture.options.userDataRoot, 'wayland-nano', 'staging'),
    };
    const legacyTransport = terminalChild(loadedExpectation);
    connectorMocks.spawnGenericBackend.mockResolvedValue({ child: legacyTransport.child, isDetached: false });
    const legacy = new AcpConnection(legacyResolved!.activation);
    await legacy.connect('wnano', fixture.expectation.canonicalPath, fixture.binding.projectId);
    await legacy.initialize();
    await legacy.newSession(fixture.binding.projectId);

    const sdkResolved = await installed!.load(fixture.binding.productSubjectId);
    const sdkTransport = terminalChild(loadedExpectation);
    const sdk = new ProcessAcpClient(
      async () => {
        setTimeout(() => sdkTransport.child.emit('spawn'), 0);
        return sdkTransport.child;
      },
      { backend: 'wnano', handlers: protocolHandlers(), waylandNanoActivation: sdkResolved!.activation }
    );
    await sdk.start();
    await sdk.createSession({ cwd: fixture.binding.projectId, mcpServers: [] });
    expect(activationIds(legacyTransport.frames)).toHaveLength(1);
    expect(activationIds(sdkTransport.frames)).toHaveLength(1);

    Object.assign(legacyTransport.child, { exitCode: 0 });
    legacyTransport.child.emit('exit', 0, null);
    await legacy.disconnect();
    Object.assign(sdkTransport.child, { exitCode: 0 });
    sdkTransport.child.emit('exit', 0, null);
    await sdk.close();

    await disposeWaylandNanoActivationOwner();
    expect(productionManagerOwner()).toBeNull();
    expect(existsSync(legacyResolved!.activation.binary.canonicalPath)).toBe(false);
    expect(existsSync(sdkResolved!.activation.binary.canonicalPath)).toBe(false);
  }, 30_000);

  it('keeps real startup nonpersistent when OS custody or the binding store is not ready', async () => {
    const fixture = await ownerFixture();
    electronMocks.userDataRoot = fixture.options.userDataRoot;
    await writeOwnerManifest(fixture, ownerManifest(fixture));

    electronMocks.encryptionAvailable = false;
    await initializeWaylandNanoActivationOwner();
    expect(productionManagerOwner()).toBeNull();
    await expectBothStacksNonpersistent();
    await disposeWaylandNanoActivationOwner();

    electronMocks.encryptionAvailable = true;
    electronMocks.backend = 'basic_text';
    await initializeWaylandNanoActivationOwner();
    expect(productionManagerOwner()).toBeNull();
    await expectBothStacksNonpersistent();
    await disposeWaylandNanoActivationOwner();

    electronMocks.backend = 'gnome_libsecret';
    await writeOwnerBindingStore(fixture, '{}');
    await initializeWaylandNanoActivationOwner();
    expect(productionManagerOwner()).toBeNull();
    await expectBothStacksNonpersistent();
  });

  it('treats an absent binding document as valid-ready without inventing authority', async () => {
    const fixture = await ownerFixture();
    electronMocks.userDataRoot = fixture.options.userDataRoot;
    await writeOwnerManifest(fixture, ownerManifest(fixture));
    await rm(path.join(fixture.options.userDataRoot, 'wayland-nano', 'activation-bindings.json'), { force: true });

    await initializeWaylandNanoActivationOwner();
    const owner = productionManagerOwner();
    expect(owner).not.toBeNull();
    expect(await owner!.load(fixture.binding.productSubjectId)).toBeNull();
  });

  it('applies the KeyStore Linux custody policy without creating a key', async () => {
    const parent = process.platform === 'win32' && process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA : process.cwd();
    const userDataRoot = await mkdtemp(path.join(parent, 'wayland-nano-custody-'));
    roots.push(userDataRoot);
    expect(
      new WaylandNanoActivationKeyStore(userDataRoot, linuxSafeStorage('gnome_libsecret'), 'linux').preflightCustody()
    ).toBe(true);
    expect(
      new WaylandNanoActivationKeyStore(userDataRoot, linuxSafeStorage('basic_text'), 'linux').preflightCustody()
    ).toBe(false);
    expect(
      new WaylandNanoActivationKeyStore(userDataRoot, linuxSafeStorage('unknown'), 'linux').preflightCustody()
    ).toBe(false);
    expect(
      new WaylandNanoActivationKeyStore(
        userDataRoot,
        linuxSafeStorage('gnome_libsecret', false),
        'linux'
      ).preflightCustody()
    ).toBe(false);
    expect(existsSync(path.join(userDataRoot, 'wayland-nano'))).toBe(false);
  });

  it.runIf(process.platform === 'win32')(
    'keeps real startup nonpersistent for a broadly writable binding store',
    async () => {
      const fixture = await ownerFixture();
      electronMocks.userDataRoot = fixture.options.userDataRoot;
      await writeOwnerManifest(fixture, ownerManifest(fixture));
      const storePath = path.join(fixture.options.userDataRoot, 'wayland-nano', 'activation-bindings.json');
      await execFileAsync('icacls.exe', [storePath, '/grant', '*S-1-1-0:(M)']);

      await initializeWaylandNanoActivationOwner();
      expect(productionManagerOwner()).toBeNull();
      await expectBothStacksNonpersistent();
    }
  );
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

function linuxSafeStorage(backend: 'gnome_libsecret' | 'basic_text' | 'unknown', available = true) {
  return {
    isEncryptionAvailable: () => available,
    getSelectedStorageBackend: () => backend,
    encryptString: (value: string) => Buffer.from(value, 'utf8'),
    decryptString: (value: Buffer) => value.toString('utf8'),
  };
}

async function expectBothStacksNonpersistent(): Promise<void> {
  const legacy = new AcpConnection(null);
  expect((legacy as unknown as Readonly<{ waylandNanoMode: string }>).waylandNanoMode).toBe('nonpersistent');
  const sdk = new ProcessAcpClient(async () => Promise.reject(new Error('must not spawn')), {
    backend: 'wnano',
    handlers: protocolHandlers(),
  });
  await expect(
    sdk.loadSession({ sessionId: 'forbidden-persistent-session', cwd: 'project-a', mcpServers: [] })
  ).rejects.toThrow('Bounded nonpersistent');
}

function productionManagerOwner(): WaylandNanoBindingOwner | null {
  const factory = (
    workerTaskManager as unknown as {
      factory: { create(conversation: TChatConversation): unknown };
    }
  ).factory;
  const manager = factory.create({
    id: `production-owner-${Math.random()}`,
    type: 'acp',
    name: 'Wayland Nano',
    createdAt: 0,
    updatedAt: 0,
    extra: { backend: 'wnano', workspace: 'project-a', waylandNanoBindingRef: 'subject-a' },
  } as unknown as TChatConversation) as Readonly<{ waylandNanoBindingOwner: WaylandNanoBindingOwner | null }>;
  return manager.waylandNanoBindingOwner;
}

function ownerManifest(fixture: Readonly<{ options: WaylandNanoActivationOwnerOptions }>): string {
  const encoded = canonicalize({
    schema: 'wayland.nano.desktop-activation-owner/v1',
    artifact: {
      ...fixture.options.artifactExpectation,
      stagingRoot: path.join(fixture.options.userDataRoot, 'wayland-nano', 'staging'),
    },
    grant: fixture.options.grant,
  });
  if (typeof encoded !== 'string') throw new Error('Owner manifest fixture could not be canonicalized');
  return encoded;
}

async function writeOwnerManifest(
  fixture: Readonly<{ options: WaylandNanoActivationOwnerOptions }>,
  contents: string
): Promise<void> {
  const ownerRoot = path.join(fixture.options.userDataRoot, 'wayland-nano');
  const manifestPath = path.join(ownerRoot, 'activation-artifact.json');
  await writeFile(manifestPath, contents, { mode: 0o600 });
  await enforceOwnerOnlyPath(manifestPath, 'file', 'full');
}

async function writeOwnerBindingStore(
  fixture: Readonly<{ options: WaylandNanoActivationOwnerOptions }>,
  contents: string
): Promise<void> {
  const storePath = path.join(fixture.options.userDataRoot, 'wayland-nano', 'activation-bindings.json');
  await writeFile(storePath, contents, { mode: 0o600 });
  await enforceOwnerOnlyPath(storePath, 'file', 'full');
}
