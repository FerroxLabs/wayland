// tests/integration/process/acp/session/AcpSession.prompt.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AcpSession } from '@process/acp/session/AcpSession';
import { AcpError } from '@process/acp/errors/AcpError';
import type { AcpClient, ClientFactory } from '@process/acp/infra/IAcpClient';
import type { AgentConfig, SessionCallbacks } from '@process/acp/types';

function createMockCallbacks(): SessionCallbacks {
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

function createMockClient(): AcpClient {
  return {
    start: vi.fn().mockResolvedValue({ protocolVersion: '0.1', capabilities: {} }),
    createSession: vi.fn().mockResolvedValue({
      sessionId: 'sess-1',
      currentModelId: 'claude-3',
      availableModels: [],
      currentModeId: 'code',
      availableModes: [],
      configOptions: [],
    }),
    loadSession: vi.fn().mockResolvedValue({ sessionId: 'sess-1' }),
    prompt: vi.fn().mockResolvedValue({ stopReason: 'end_turn' }),
    cancel: vi.fn().mockResolvedValue(undefined),
    setModel: vi.fn().mockResolvedValue(undefined),
    setMode: vi.fn().mockResolvedValue(undefined),
    setConfigOption: vi.fn().mockResolvedValue(undefined),
    closeSession: vi.fn().mockResolvedValue(undefined),
    extMethod: vi.fn().mockResolvedValue({}),
    authenticate: vi.fn().mockResolvedValue({}),
    lifecycleSnapshot: { pid: null, running: false, lastExit: null },
    onDisconnect: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

const baseConfig: AgentConfig = {
  agentBackend: 'test',
  agentSource: 'builtin',
  agentId: 'builtin:test',
  cwd: '/tmp',
  command: '/usr/bin/test-agent',
  args: ['--stdio'],
};

describe('AcpSession prompt flow', () => {
  let callbacks: SessionCallbacks;
  let client: AcpClient;
  let clientFactory: ClientFactory;

  beforeEach(() => {
    callbacks = createMockCallbacks();
    client = createMockClient();
    clientFactory = { create: vi.fn(() => client) };
  });

  async function startSession() {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    return session;
  }

  it('sendMessage triggers prompt directly (INV-S-02)', async () => {
    const session = await startSession();
    session.sendMessage('hello');
    await vi.waitFor(() => expect(client.prompt).toHaveBeenCalledOnce());
    expect(session.status).toBe('active');
  });

  it('sendMessage throws in idle state', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    await expect(session.sendMessage('hello')).rejects.toThrow(/Cannot send in idle state/);
  });

  it('sendMessage from suspended triggers resume (T16)', async () => {
    const session = await startSession();
    await session.suspend();
    expect(session.status).toBe('suspended');
    session.sendMessage('after suspend');
    await vi.waitFor(() => expect(['resuming', 'active', 'prompting'].includes(session.status)).toBe(true));
  });

  it('sendMessage during prompting queues the follow-up and flushes it after the turn', async () => {
    const session = await startSession();

    // Hold the first turn open so the session stays in 'prompting'.
    let releaseFirstTurn!: (value: { stopReason: string }) => void;
    (client.prompt as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseFirstTurn = resolve;
        })
    );

    session.sendMessage('first');
    await vi.waitFor(() => expect(session.status).toBe('prompting'));

    // A second message arriving mid-turn must NOT throw "Cannot send in prompting state".
    await expect(session.sendMessage('second')).resolves.toBeUndefined();
    expect(client.prompt).toHaveBeenCalledTimes(1); // queued, not sent yet

    // Finishing the first turn flushes the queued follow-up automatically.
    releaseFirstTurn({ stopReason: 'end_turn' });
    await vi.waitFor(() => expect(client.prompt).toHaveBeenCalledTimes(2));
  });

  // ─── F1: FIFO queue — two mid-turn messages delivered in order ───

  it('TWO mid-turn sendMessage calls are both delivered in order (F1)', async () => {
    const session = await startSession();

    let releaseFirstTurn!: (value: { stopReason: string }) => void;
    let releaseSecondTurn!: (value: { stopReason: string }) => void;

    const promptMock = client.prompt as ReturnType<typeof vi.fn>;

    // First call blocks; subsequent calls resolve immediately.
    promptMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseFirstTurn = resolve;
        })
    );
    promptMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseSecondTurn = resolve;
        })
    );

    void session.sendMessage('first');
    await vi.waitFor(() => expect(session.status).toBe('prompting'));

    // Enqueue two messages while the first turn is in-flight.
    void session.sendMessage('second');
    void session.sendMessage('third');
    expect(promptMock).toHaveBeenCalledTimes(1); // only first turn in-flight

    // Finish first turn → second message is flushed.
    releaseFirstTurn({ stopReason: 'end_turn' });
    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(2));

    // Verify second call carried 'second' (first queued message).
    // prompt is called as client.prompt(sessionId, contentArray)
    const secondCallContent = promptMock.mock.calls[1][1] as Array<{ type: string; text: string }>;
    expect(secondCallContent[0].text).toBe('second');

    // Finish second turn → third message is flushed.
    releaseSecondTurn({ stopReason: 'end_turn' });
    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(3));

    const thirdCallContent = promptMock.mock.calls[2][1] as Array<{ type: string; text: string }>;
    expect(thirdCallContent[0].text).toBe('third');
  });

  // ─── F2: queued message survives a retryable turn error ──────────

  it('queued message is delivered after a retryable turn error (F2)', async () => {
    const session = await startSession();

    const promptMock = client.prompt as ReturnType<typeof vi.fn>;

    let rejectFirstTurn!: (err: unknown) => void;

    // First prompt rejects with a retryable AcpError.
    promptMock.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirstTurn = reject;
        })
    );
    // Second prompt succeeds.
    promptMock.mockImplementationOnce(() => Promise.resolve({ stopReason: 'end_turn' }));

    // sendMessage('first') will reject (handlePromptError re-throws) — suppress the unhandled rejection.
    const firstSend = session.sendMessage('first').catch(() => {});
    await vi.waitFor(() => expect(session.status).toBe('prompting'));

    // Queue a follow-up while the first turn is in-flight.
    void session.sendMessage('second');
    expect(promptMock).toHaveBeenCalledTimes(1);

    // Reject the first turn with a retryable AcpError.
    rejectFirstTurn(new AcpError('CONNECTION_FAILED', 'transient', { retryable: true }));
    await firstSend;

    // The queued 'second' message should still be delivered after the retryable error.
    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(2), { timeout: 2000 });
    const secondCallContent = promptMock.mock.calls[1][1] as Array<{ type: string; text: string }>;
    expect(secondCallContent[0].text).toBe('second');
  });

  // ─── F2: stop() while mid-turn queue is non-empty → observable discard ──

  it('stop() with a queued message logs a discard warning (F2)', async () => {
    const session = await startSession();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const promptMock = client.prompt as ReturnType<typeof vi.fn>;
    promptMock.mockImplementationOnce(() => new Promise(() => {})); // never resolves

    void session.sendMessage('first');
    await vi.waitFor(() => expect(session.status).toBe('prompting'));

    // Queue a message that will be discarded by stop().
    void session.sendMessage('to-be-discarded');
    expect(promptMock).toHaveBeenCalledTimes(1);

    await session.stop();

    // clearPending() must have logged about the discarded message.
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('discarding'));

    warnSpy.mockRestore();
  });

  // ─── F5: sendMessage during 'starting' queues instead of throwing ──

  it('sendMessage during starting state queues the message (F5)', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);

    // Start but don't await — the session will be in 'starting' briefly.
    session.start();

    // Immediately try to send while the session is still initialising.
    // With F5 this must not throw.
    await expect(session.sendMessage('early')).resolves.toBeUndefined();

    // Wait for the session to reach active and confirm the message was delivered.
    await vi.waitFor(() => expect(session.status).toBe('active'));
    await vi.waitFor(() => expect(client.prompt).toHaveBeenCalledTimes(1));

    const callContent = (client.prompt as ReturnType<typeof vi.fn>).mock.calls[0][1] as Array<{
      type: string;
      text: string;
    }>;
    expect(callContent[0].text).toBe('early');
  });

  // ─── F3: concurrent flush triggers result in single delivery ─────

  it('concurrent flush triggers do not double-send a queued message (F3)', async () => {
    const session = await startSession();

    let releaseFirstTurn!: (value: { stopReason: string }) => void;
    const promptMock = client.prompt as ReturnType<typeof vi.fn>;
    promptMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseFirstTurn = resolve;
        })
    );

    void session.sendMessage('first');
    await vi.waitFor(() => expect(session.status).toBe('prompting'));

    void session.sendMessage('queued');
    expect(promptMock).toHaveBeenCalledTimes(1);

    releaseFirstTurn({ stopReason: 'end_turn' });
    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(2));

    // Wait a tick to ensure no additional flush fires.
    await new Promise((r) => setTimeout(r, 50));
    expect(promptMock).toHaveBeenCalledTimes(2);
  });
});
