import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';

import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: () => 'C:/test-user-data' },
  safeStorage: {},
}));

import type { AcpResponse } from '@/common/types/acpTypes';
import type {
  SignedWaylandNanoActivation,
  SignedWaylandNanoControl,
  WaylandNanoBinding,
  WaylandNanoControl,
} from '@process/agent/activation/types';
import {
  verifyWaylandNanoBinary,
  type VerifiedWaylandNanoBinary,
} from '@process/agent/activation/waylandNanoBinaryVerifier';
import {
  AcpConnection,
  resolveWaylandNanoBindingRef,
  type ResolvedWaylandNanoActivationInput,
  type WaylandNanoActivationAttempt,
} from '@process/agent/acp/AcpConnection';
import { spawnGenericBackend } from '@process/agent/acp/acpConnectors';
import { registerPlatformServices } from '@/common/platform';
import { NodePlatformServices } from '@/common/platform/NodePlatformServices';

const binding: WaylandNanoBinding = Object.freeze({
  productSubjectId: 'subject-a',
  principalId: 'principal-a',
  projectId: 'project-a',
  issuerId: 'desktop',
  issuerKeyRef: 'wayland-nano-key:v1:key_a',
  backend: 'wayland-nano',
});

function activation(operation: 'new' | 'load', sessionId: string | null): SignedWaylandNanoActivation {
  return Object.freeze({
    schema: 'wayland.nano.activation/v1',
    issuer_id: 'desktop',
    key_id: 'desktop',
    alg: 'Ed25519',
    issued_at: '2026-08-30T10:00:00Z',
    not_before: '2026-08-30T10:00:00Z',
    not_after: '2026-08-30T10:05:00Z',
    nonce: `nonce-${operation}`,
    product_subject_id: 'subject-a',
    principal_id: 'principal-a',
    project_id: 'project-a',
    activation_id: `activation-${operation}`,
    idempotency_key: `idempotency-${operation}`,
    session_id: sessionId,
    continuity: {
      strategy: operation === 'load' ? 'session_resume' : 'fresh',
      fallback: 'none',
      resume_fingerprint: operation === 'load' ? 'resume-fingerprint' : null,
    },
    capabilities: ['filesystem.read'],
    budgets: {
      max_turns: 1,
      max_tool_calls: 1,
      max_input_tokens: 100,
      max_output_tokens: 100,
      max_cost_microcents: 0,
      wall_clock_ms: 60_000,
    },
    deadline: '2026-08-30T10:05:00Z',
    controls: ['cancel', 'pause'],
    signature: 'signed-activation',
  });
}

function control(kind: WaylandNanoControl, sessionId: string): SignedWaylandNanoControl {
  return Object.freeze({
    schema: 'wayland.nano.control/v1',
    issuer_id: 'desktop',
    key_id: 'desktop',
    alg: 'Ed25519',
    activation_id: 'activation-load',
    session_id: sessionId,
    principal_id: 'principal-a',
    project_id: 'project-a',
    control: kind,
    nonce: `control-${kind}`,
    issued_at: '2026-08-30T10:01:00Z',
    not_after: '2026-08-30T10:02:00Z',
    signature: `signed-${kind}`,
  });
}

function carrier(): ResolvedWaylandNanoActivationInput {
  return Object.freeze({
    binary: {} as VerifiedWaylandNanoBinary,
    buildAttempt: async ({ operation, sessionId }): Promise<WaylandNanoActivationAttempt> =>
      Object.freeze({
        activation: activation(operation, sessionId),
        buildControl: async (kind, activeSessionId) => control(kind, activeSessionId),
      }),
  });
}

type ConnectionInternals = {
  backend: 'wnano' | 'codex';
  child: { stdin: EventEmitter & { write(value: string): boolean } };
  initializeResult: { capabilities: { loadSession: boolean } };
  sessionId: string | null;
  handleMessage(message: AcpResponse): void;
};

function wireHarness(connection: AcpConnection, backend: 'wnano' | 'codex' = 'wnano') {
  const frames: string[] = [];
  const stdin = Object.assign(new EventEmitter(), {
    write(value: string): boolean {
      frames.push(value);
      return true;
    },
  });
  const internals = connection as unknown as ConnectionInternals;
  internals.backend = backend;
  internals.child = { stdin };
  internals.initializeResult = { capabilities: { loadSession: true } };
  return { frames, internals };
}

function parsed(frame: string): Record<string, unknown> {
  return JSON.parse(frame.trim()) as Record<string, unknown>;
}

describe('Wayland Nano legacy activation carrier', () => {
  it('resolves OldAcpAgentConfig authority only from the explicit binding reference', async () => {
    const load = vi.fn(async () => ({ binding, activation: carrier() }));
    const mutableConversationFields = {
      conversationId: 'subject-a',
      backend: 'wnano',
      customAgentId: 'subject-a',
      cwd: 'project-a',
      name: 'principal-a',
      projectId: 'project-a',
    };

    expect(await resolveWaylandNanoBindingRef(undefined, { load })).toBeNull();
    expect(mutableConversationFields).toBeDefined();
    expect(load).not.toHaveBeenCalled();
    expect(await resolveWaylandNanoBindingRef('subject-a', { load })).not.toBeNull();
    expect(load).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledWith('subject-a');
  });

  it('keeps a mismatched owner-store binding nonpersistent', async () => {
    const mismatched = Object.freeze({ ...binding, productSubjectId: 'subject-b' });
    const owner = { load: vi.fn(async () => ({ binding: mismatched, activation: carrier() })) };

    expect(await resolveWaylandNanoBindingRef('subject-a', owner)).toBeNull();
  });

  it('writes exact signed activation metadata on final new and load stdin frames', async () => {
    const connection = new AcpConnection(carrier());
    const { frames, internals } = wireHarness(connection);

    const create = connection.newSession('C:/workspace');
    await new Promise((resolve) => setImmediate(resolve));
    const createFrame = parsed(frames[0]);
    expect(createFrame.method).toBe('session/new');
    expect((createFrame.params as { _meta: { waylandNanoActivation: unknown } })._meta.waylandNanoActivation).toEqual(
      activation('new', null)
    );
    internals.handleMessage({ jsonrpc: '2.0', id: createFrame.id as number, result: { sessionId: 'session-a' } });
    await create;

    const load = connection.loadSession('session-a', 'C:/workspace');
    await new Promise((resolve) => setImmediate(resolve));
    const loadFrame = parsed(frames[1]);
    expect(loadFrame.method).toBe('session/load');
    expect((loadFrame.params as { _meta: { waylandNanoActivation: unknown } })._meta.waylandNanoActivation).toEqual(
      activation('load', 'session-a')
    );
    internals.handleMessage({ jsonrpc: '2.0', id: loadFrame.id as number, result: {} });
    await load;
  });

  it('writes exact signed cancel and pause metadata on final stdin frames', async () => {
    const connection = new AcpConnection(carrier());
    const { frames, internals } = wireHarness(connection);
    const load = connection.loadSession('session-a', 'C:/workspace');
    await new Promise((resolve) => setImmediate(resolve));
    const loadFrame = parsed(frames[0]);
    internals.handleMessage({ jsonrpc: '2.0', id: loadFrame.id as number, result: {} });
    await load;

    connection.cancelPrompt();
    connection.pausePrompt();
    await new Promise((resolve) => setImmediate(resolve));

    const cancelFrame = parsed(frames[1]);
    const pauseFrame = parsed(frames[2]);
    expect((cancelFrame.params as { _meta: { waylandNanoControl: unknown } })._meta.waylandNanoControl).toEqual(
      control('cancel', 'session-a')
    );
    expect((pauseFrame.params as { _meta: { waylandNanoControl: unknown } })._meta.waylandNanoControl).toEqual(
      control('pause', 'session-a')
    );
  });

  it('treats Nano load refusal as terminal without a fresh fallback frame', async () => {
    const connection = new AcpConnection(carrier());
    const { frames, internals } = wireHarness(connection);
    const resume = connection.resumeSession('session-a', 'C:/workspace');
    await new Promise((resolve) => setImmediate(resolve));
    const loadFrame = parsed(frames[0]);
    internals.handleMessage({
      jsonrpc: '2.0',
      id: loadFrame.id as number,
      error: { code: -32000, message: 'activation_revoked' },
    });

    await expect(resume).rejects.toThrow('activation_revoked');
    expect(frames).toHaveLength(1);
    expect(loadFrame.method).toBe('session/load');
  });

  it('leaves non-Nano request bytes unchanged', async () => {
    const connection = new AcpConnection();
    const { frames, internals } = wireHarness(connection, 'codex');
    const create = connection.newSession('C:/workspace');
    await new Promise((resolve) => setImmediate(resolve));
    const frame = parsed(frames[0]);

    expect((frame.params as Record<string, unknown>)._meta).toBeUndefined();
    internals.handleMessage({ jsonrpc: '2.0', id: frame.id as number, result: { sessionId: 'codex-session' } });
    await create;
  });

  it('creates zero Nano child when the owner-resolved carrier is missing', async () => {
    const connection = new AcpConnection();

    await expect(
      connection.connect('wnano', process.execPath, process.cwd(), ['-e', 'process.exit(23)'])
    ).rejects.toThrow('requires a resolved binding and verified executable');
  });

  it('consumes the held executable identity at the actual shell-false spawn', async () => {
    registerPlatformServices(new NodePlatformServices());
    const canonicalPath = await realpath(process.execPath);
    const bytes = await readFile(canonicalPath);
    const metadata = await stat(canonicalPath);
    const token = await verifyWaylandNanoBinary({
      canonicalPath,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      size: metadata.size,
      sourceCommitSha: 'a'.repeat(40),
      cargoLockSha256: 'b'.repeat(64),
    });

    const result = await spawnGenericBackend(
      'wnano',
      canonicalPath,
      process.cwd(),
      ['-e', 'process.exit(0)'],
      {},
      token
    );
    await new Promise<void>((resolve) => result.child.once('exit', () => resolve()));

    await expect(
      spawnGenericBackend('wnano', canonicalPath, process.cwd(), ['-e', 'process.exit(0)'], {}, token)
    ).rejects.toThrow('stale');
  });
});
