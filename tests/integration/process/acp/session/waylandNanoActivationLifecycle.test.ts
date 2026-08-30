import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { ChildProcess } from 'node:child_process';
import { describe, expect, it, vi } from 'vitest';
import { RequestError } from '@agentclientprotocol/sdk';

const connectorMocks = vi.hoisted(() => ({
  spawnGenericBackend: vi.fn(),
}));

vi.mock('electron', () => ({
  app: { getPath: () => 'C:/test-user-data' },
  safeStorage: {},
}));

vi.mock('@process/agent/acp/acpConnectors', () => ({
  connectClaude: vi.fn(),
  connectCodebuddy: vi.fn(),
  connectCodex: vi.fn(),
  spawnGenericBackend: connectorMocks.spawnGenericBackend,
}));

import '@/common/platform/register-node';
import type {
  ResolvedWaylandNanoActivationInput,
  WaylandNanoActivationAttempt,
} from '@process/agent/acp/AcpConnection';
import type { SignedWaylandNanoActivation, SignedWaylandNanoControl } from '@process/agent/activation/types';
import type { VerifiedWaylandNanoBinary } from '@process/agent/activation/waylandNanoBinaryVerifier';
import { toAgentConfig, type OldAcpAgentConfig } from '@process/acp/compat/typeBridge';
import { LegacyConnectorFactory } from '@process/acp/compat/LegacyConnectorFactory';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import { AcpSession } from '@process/acp/session/AcpSession';
import type { AcpClient, ClientFactory } from '@process/acp/infra/IAcpClient';
import type { AgentConfig, ProtocolHandlers, SessionCallbacks } from '@process/acp/types';

type JsonRpcFrame = Readonly<{
  jsonrpc: '2.0';
  id?: number;
  method: string;
  params?: Record<string, unknown>;
}>;

const activation = Object.freeze({
  schema: 'wayland.nano.activation/v1',
  issuer_id: 'desktop',
  key_id: 'desktop-key-1',
  alg: 'Ed25519',
  issued_at: '2026-08-30T10:00:00Z',
  not_before: '2026-08-30T09:59:59Z',
  not_after: '2026-08-30T10:05:00Z',
  nonce: 'nonce-new-stack',
  product_subject_id: 'subject-a',
  principal_id: 'main',
  project_id: 'project-a',
  activation_id: 'activation-new-stack',
  idempotency_key: 'idempotency-new-stack',
  session_id: null,
  continuity: Object.freeze({ strategy: 'fresh', fallback: 'none', resume_fingerprint: null }),
  capabilities: Object.freeze(['filesystem.read']),
  budgets: Object.freeze({
    max_turns: 4,
    max_tool_calls: 8,
    max_input_tokens: 4096,
    max_output_tokens: 2048,
    max_cost_microcents: 1000,
    wall_clock_ms: 60_000,
  }),
  deadline: '2026-08-30T10:05:00Z',
  controls: Object.freeze(['cancel', 'pause']),
  signature: 'signature-new-stack',
}) satisfies SignedWaylandNanoActivation;

function signedControl(control: 'cancel' | 'pause', sessionId: string): SignedWaylandNanoControl {
  return Object.freeze({
    schema: 'wayland.nano.control/v1',
    issuer_id: 'desktop',
    key_id: 'desktop-key-1',
    alg: 'Ed25519',
    activation_id: activation.activation_id,
    session_id: sessionId,
    principal_id: activation.principal_id,
    project_id: activation.project_id,
    control,
    nonce: `nonce-${control}`,
    issued_at: activation.issued_at,
    not_after: activation.not_after,
    signature: `signature-${control}`,
  });
}

function resolvedActivation(binary: VerifiedWaylandNanoBinary = Object.create(null) as VerifiedWaylandNanoBinary): {
  input: ResolvedWaylandNanoActivationInput;
  buildAttempt: ReturnType<typeof vi.fn>;
  buildControl: ReturnType<typeof vi.fn>;
} {
  const buildControl = vi.fn((control: 'cancel' | 'pause', sessionId: string) =>
    Promise.resolve(signedControl(control, sessionId))
  );
  const attempt: WaylandNanoActivationAttempt = Object.freeze({ activation, buildControl });
  const buildAttempt = vi.fn(() => Promise.resolve(attempt));
  return {
    input: Object.freeze({
      binary,
      buildAttempt,
    }),
    buildAttempt,
    buildControl,
  };
}

function oldConfig(activationInput?: ResolvedWaylandNanoActivationInput): OldAcpAgentConfig {
  return {
    id: 'conversation-must-not-authorize',
    backend: 'wnano',
    cliPath: 'C:/mutable/path/nano.exe',
    workingDir: 'D:/mutable/project',
    waylandNanoActivation: activationInput,
    extra: {
      backend: 'wnano',
      agentName: 'mutable assistant',
      workspace: 'D:/mutable/project',
    },
    onStreamEvent: vi.fn(),
  };
}

function handlers(): ProtocolHandlers {
  return {
    onSessionUpdate: vi.fn(),
    onRequestPermission: vi.fn(),
    onReadTextFile: vi.fn(),
    onWriteTextFile: vi.fn(),
  };
}

function callbacks(): SessionCallbacks {
  return {
    onMessage: vi.fn(),
    onSessionId: vi.fn(),
    onStatusChange: vi.fn(),
    onConfigUpdate: vi.fn(),
    onModelUpdate: vi.fn(),
    onModeUpdate: vi.fn(),
    onContextUsage: vi.fn(),
    onPermissionRequest: vi.fn(),
    onSignal: vi.fn(),
  };
}

function fakeChild(
  reply: (frame: JsonRpcFrame) => Readonly<{ result?: unknown; error?: unknown }> = (frame) => ({
    result:
      frame.method === 'initialize'
        ? { protocolVersion: '0.1', capabilities: { loadSession: true } }
        : frame.method === 'session/new'
          ? { sessionId: 'session-new-stack' }
          : {},
  })
): { child: ChildProcess; frames: string[] } {
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
      const response = reply(frame);
      stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: frame.id, ...response })}\n`);
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
    kill: vi.fn(() => true),
    unref: vi.fn(),
  });
  return { child, frames };
}

describe('Wayland Nano new-stack activation lifecycle', () => {
  it('binding projection carries only the owner-resolved activation input', () => {
    const resolved = resolvedActivation();
    const projected = toAgentConfig(oldConfig(resolved.input));
    expect(projected.waylandNanoActivation).toBe(resolved.input);

    const unbound = toAgentConfig(oldConfig());
    expect(unbound.waylandNanoActivation).toBeUndefined();
    expect(unbound.agentId).toBe('conversation-must-not-authorize');
  });

  it('creates zero child when Nano binding is missing or the verified launcher token is stale', async () => {
    connectorMocks.spawnGenericBackend.mockReset();
    const factory = new LegacyConnectorFactory();
    const missing = factory.create(toAgentConfig(oldConfig()), handlers());
    await expect(missing.start()).rejects.toThrow('owner-resolved activation authority');
    expect(connectorMocks.spawnGenericBackend).not.toHaveBeenCalled();

    let childCount = 0;
    const staleBinary = {
      canonicalPath: 'C:/verified/nano.exe',
      consume: vi.fn(() => Promise.reject(new Error('Wayland Nano binary identity token is stale'))),
    } as unknown as VerifiedWaylandNanoBinary;
    connectorMocks.spawnGenericBackend.mockImplementation(
      async (
        _backend: string,
        _cliPath: string,
        _cwd: string,
        _args: string[] | undefined,
        _env: Record<string, string> | undefined,
        binary: VerifiedWaylandNanoBinary
      ) => ({
        child: await binary.consume(() => {
          childCount += 1;
          return fakeChild().child;
        }),
        isDetached: false,
      })
    );
    const stale = factory.create(toAgentConfig(oldConfig(resolvedActivation(staleBinary).input)), handlers());
    await expect(stale.start()).rejects.toThrow('identity token is stale');
    expect(childCount).toBe(0);
  });

  it('preserves exact create/load activation metadata through final SDK child stdin bytes', async () => {
    const resolved = resolvedActivation();
    const transport = fakeChild();
    const client = new ProcessAcpClient(
      async () => {
        setTimeout(() => transport.child.emit('spawn'), 0);
        return transport.child;
      },
      { backend: 'wnano', handlers: handlers(), waylandNanoActivation: resolved.input }
    );
    await client.start();
    await client.createSession({ cwd: 'D:/project', mcpServers: [], _meta: { unrelated: { preserved: true } } });
    await client.loadSession({
      sessionId: 'session-new-stack',
      cwd: 'D:/project',
      mcpServers: [],
      _meta: { unrelated: { preserved: true } },
    });

    const frames = transport.frames.map((raw) => JSON.parse(raw) as JsonRpcFrame);
    const create = frames.find((frame) => frame.method === 'session/new');
    const load = frames.find((frame) => frame.method === 'session/load');
    const expectedMeta = { unrelated: { preserved: true }, waylandNanoActivation: activation };
    expect(create?.params?._meta).toEqual(expectedMeta);
    expect(load?.params?._meta).toEqual(expectedMeta);
    const activationBytes = `"waylandNanoActivation":${JSON.stringify(activation)}`;
    expect(transport.frames.find((raw) => raw.includes('session/new'))).toContain(activationBytes);
    expect(transport.frames.find((raw) => raw.includes('session/load'))).toContain(activationBytes);
    expect(resolved.buildAttempt).toHaveBeenNthCalledWith(1, { operation: 'new', sessionId: null });
    expect(resolved.buildAttempt).toHaveBeenNthCalledWith(2, {
      operation: 'load',
      sessionId: 'session-new-stack',
    });
  });

  it('writes signed cancel and pause controls after SDK serialization without using the local timer pause', async () => {
    const resolved = resolvedActivation();
    const transport = fakeChild();
    const client = new ProcessAcpClient(
      async () => {
        setTimeout(() => transport.child.emit('spawn'), 0);
        return transport.child;
      },
      { backend: 'wnano', handlers: handlers(), waylandNanoActivation: resolved.input }
    );
    await client.start();
    await client.createSession({ cwd: 'D:/project', mcpServers: [] });
    await client.cancel('session-new-stack');
    await client.pause('session-new-stack');

    const frames = transport.frames.map((raw) => JSON.parse(raw) as JsonRpcFrame);
    const cancel = frames.find((frame) => frame.method === 'session/cancel');
    const pause = frames.find((frame) => frame.method === 'session/pause');
    expect(cancel?.params?._meta).toEqual({ waylandNanoControl: signedControl('cancel', 'session-new-stack') });
    expect(pause?.params?._meta).toEqual({ waylandNanoControl: signedControl('pause', 'session-new-stack') });
  });

  it('treats a Nano load refusal as terminal and never creates a fresh session', async () => {
    const resolved = resolvedActivation();
    const createSession = vi.fn();
    const loadSession = vi.fn().mockRejectedValue(
      new RequestError(-32602, 'Activation refused', {
        nanoError: { kind: 'revoked_issuer', retryable: false },
      })
    );
    const mockClient: AcpClient = {
      start: vi.fn().mockResolvedValue({ protocolVersion: '0.1', capabilities: {} }),
      createSession,
      loadSession,
      forkSession: vi.fn(),
      prompt: vi.fn(),
      cancel: vi.fn(),
      closeSession: vi.fn(),
      setModel: vi.fn(),
      setMode: vi.fn(),
      setConfigOption: vi.fn(),
      extMethod: vi.fn(),
      authenticate: vi.fn(),
      lifecycleSnapshot: { pid: null, running: false, lastExit: null },
      onDisconnect: vi.fn(),
      close: vi.fn(),
    };
    const factory: ClientFactory = { create: () => mockClient };
    const config: AgentConfig = {
      ...toAgentConfig(oldConfig(resolved.input)),
      resumeSessionId: 'session-old',
    };
    const session = new AcpSession(config, factory, callbacks(), { maxStartRetries: 3 });
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('error'));
    expect(loadSession).toHaveBeenCalledOnce();
    expect(createSession).not.toHaveBeenCalled();
    expect(mockClient.start).toHaveBeenCalledOnce();
  });

  it('keeps non-Nano load-to-fresh compatibility unchanged', async () => {
    const createSession = vi.fn().mockResolvedValue({ sessionId: 'fresh-session' });
    const mockClient: AcpClient = {
      start: vi.fn().mockResolvedValue({ protocolVersion: '0.1', capabilities: {} }),
      createSession,
      loadSession: vi.fn().mockRejectedValue(new Error('stale non-Nano session')),
      forkSession: vi.fn(),
      prompt: vi.fn(),
      cancel: vi.fn(),
      closeSession: vi.fn(),
      setModel: vi.fn(),
      setMode: vi.fn(),
      setConfigOption: vi.fn(),
      extMethod: vi.fn(),
      authenticate: vi.fn(),
      lifecycleSnapshot: { pid: null, running: false, lastExit: null },
      onDisconnect: vi.fn(),
      close: vi.fn(),
    };
    const config: AgentConfig = {
      agentBackend: 'codex',
      agentSource: 'builtin',
      agentId: 'conversation-only',
      cwd: 'D:/project',
      resumeSessionId: 'stale-session',
    };
    const session = new AcpSession(config, { create: () => mockClient }, callbacks());
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    expect(createSession).toHaveBeenCalledOnce();
  });
});
