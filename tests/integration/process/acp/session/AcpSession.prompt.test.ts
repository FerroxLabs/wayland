// tests/integration/process/acp/session/AcpSession.prompt.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RequestPermissionRequest, SessionNotification, WriteTextFileRequest } from '@agentclientprotocol/sdk';
import { AcpSession } from '@process/acp/session/AcpSession';
import { AcpError } from '@process/acp/errors/AcpError';
import type { AcpClient, ClientFactory } from '@process/acp/infra/IAcpClient';
import type { AgentConfig, ProtocolHandlers, SessionCallbacks } from '@process/acp/types';

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

  // ─── F2: a retryable turn error is retried, and the queue survives it ──────

  it('retries the failed turn, then delivers the queued message (F2, #774)', async () => {
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
    // The retry of 'first' succeeds, then 'second' is flushed.
    promptMock.mockImplementationOnce(() => Promise.resolve({ stopReason: 'end_turn' }));
    promptMock.mockImplementationOnce(() => Promise.resolve({ stopReason: 'end_turn' }));

    const firstSend = session.sendMessage('first');
    await vi.waitFor(() => expect(session.status).toBe('prompting'));

    // Queue a follow-up while the first turn is in-flight.
    void session.sendMessage('second');
    expect(promptMock).toHaveBeenCalledTimes(1);

    // Fail the first turn the way a live agent reports a provider blip (-32603).
    // Before #774 this DROPPED 'first' on the floor and went straight to
    // 'second'; now the turn is retried, and only then does the queue drain. The
    // send must not reject — the blip was recovered from.
    rejectFirstTurn(new AcpError('AGENT_INTERNAL_ERROR', 'Connection error', { retryable: true }));
    await expect(firstSend).resolves.toBeUndefined();

    // 'first' is replayed (not skipped)...
    const retryContent = promptMock.mock.calls[1][1] as Array<{ type: string; text: string }>;
    expect(retryContent[0].text).toBe('first');

    // ...and the queued 'second' still lands afterwards.
    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(3), { timeout: 5000 });
    const secondCallContent = promptMock.mock.calls[2][1] as Array<{ type: string; text: string }>;
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
  // ─── #774: the double-execution guard, wired end-to-end ────────────────────
  //
  // PromptExecutor only refuses to replay a turn if AcpSession actually TELLS it a
  // tool ran. These pin that wiring: unit-testing noteToolActivity() directly
  // proves nothing if no one calls it. Each case fails the turn with the one
  // replayable error (-32603) and asserts the side effect suppresses the replay —
  // and the control below proves the same turn WOULD have been replayed otherwise.

  /** Capture the handlers AcpSession hands to the client, so we can drive them. */
  function handlersOf(): ProtocolHandlers {
    return (clientFactory.create as ReturnType<typeof vi.fn>).mock.calls[0][1] as ProtocolHandlers;
  }

  function blip() {
    return new AcpError('AGENT_INTERNAL_ERROR', 'Connection error', { retryable: true });
  }

  it('CONTROL: a blip with no tool activity IS replayed', async () => {
    const session = await startSession();
    const promptMock = client.prompt as ReturnType<typeof vi.fn>;
    promptMock.mockRejectedValueOnce(blip()).mockResolvedValueOnce({ stopReason: 'end_turn' });

    await session.sendMessage('go');

    expect(promptMock).toHaveBeenCalledTimes(2);
  });

  it('a streamed tool_call stops the replay (#774)', async () => {
    const session = await startSession();
    const promptMock = client.prompt as ReturnType<typeof vi.fn>;
    promptMock.mockImplementationOnce(() => {
      handlersOf().onSessionUpdate({
        sessionId: 'sess-1',
        update: { sessionUpdate: 'tool_call', toolCallId: 't1', title: 'rm -rf', status: 'in_progress' },
      } as unknown as SessionNotification);
      return Promise.reject(blip());
    });

    await expect(session.sendMessage('go')).rejects.toBeInstanceOf(AcpError);

    // Replaying would re-ask the model to do the work — and re-run the tool.
    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it('a permission request stops the replay, even with no tool_call update (#774)', async () => {
    const session = await startSession();
    const promptMock = client.prompt as ReturnType<typeof vi.fn>;
    promptMock.mockImplementationOnce(() => {
      void handlersOf().onRequestPermission({
        sessionId: 'sess-1',
        toolCall: { toolCallId: 't1', title: 'run' },
        options: [{ optionId: 'allow', name: 'Allow', kind: 'allow_once' }],
      } as unknown as RequestPermissionRequest);
      return Promise.reject(blip());
    });

    await expect(session.sendMessage('go')).rejects.toBeInstanceOf(AcpError);
    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it('an agent-driven file write stops the replay — it never passes through handleMessage (#774)', async () => {
    const session = await startSession();
    const promptMock = client.prompt as ReturnType<typeof vi.fn>;
    const target = path.join(baseConfig.cwd, `wl-774-${Date.now()}.txt`); // MUST be inside cwd or assertPathAllowed throws
    promptMock.mockImplementationOnce(async () => {
      await handlersOf().onWriteTextFile({
        sessionId: 'sess-1',
        path: target,
        content: 'written once',
      } as unknown as WriteTextFileRequest);
      throw blip();
    });

    await expect(session.sendMessage('go')).rejects.toBeInstanceOf(AcpError);

    // A replay here would write the file a second time.
    expect(promptMock).toHaveBeenCalledTimes(1);
    fs.rmSync(target, { force: true });
  });

  /**
   * B1' (#774): on a mid-turn crash, onDisconnect → resumeFromDisconnect owns the
   * recovery — it respawns the agent AND re-flushes the pending queue itself.
   * handlePromptError must not race it. It used to: PROCESS_CRASHED is
   * `retryable: true`, so it took the retryable branch, and 'resuming' → 'active' is
   * a LEGAL transition — so it yanked the session out of its respawn and fired the
   * user's queued follow-up into a client that had not finished initialize(). The
   * prompt was then silently dropped: exactly the #774 headline, reintroduced by
   * its own fix.
   */
  it('a crash mid-turn does not fire the queued prompt into a half-initialized client (#774)', async () => {
    const events: string[] = [];
    const clients: AcpClient[] = [];
    let disconnect!: () => void;

    clientFactory = {
      create: vi.fn(() => {
        const c = createMockClient();
        const idx = clients.length;
        if (idx > 0) {
          // The respawn is SLOW (spawn + initialize). This is the window the bug
          // lived in: with a mock that resolves instantly it never opens, and the
          // race is unobservable.
          (c.start as ReturnType<typeof vi.fn>).mockImplementation(async () => {
            await new Promise((r) => setTimeout(r, 150));
            events.push(`start:${idx}`);
            return { protocolVersion: '0.1', capabilities: {} };
          });
        }
        (c.onDisconnect as ReturnType<typeof vi.fn>).mockImplementation((cb: () => void) => {
          disconnect = cb;
        });
        (c.loadSession as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          events.push(`loadSession:${idx}`);
          return { sessionId: 'sess-1' };
        });
        (c.prompt as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          events.push(`prompt:${idx}`);
          return { stopReason: 'end_turn' };
        });
        clients.push(c);
        return c;
      }),
    };

    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    // Turn in flight on client 0, with a follow-up queued behind it.
    let killTurn!: (e: unknown) => void;
    (clients[0].prompt as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((_r, reject) => {
          killTurn = reject;
        })
    );
    const firstSend = session.sendMessage('first').catch(() => {});
    await vi.waitFor(() => expect(session.status).toBe('prompting'));
    void session.sendMessage('queued-follow-up');

    // The agent process dies: the transport reports it, and the turn rejects.
    disconnect();
    killTurn(new AcpError('PROCESS_CRASHED', 'ACP connection closed', { retryable: true }));
    await firstSend;

    // The respawned client must have loaded the session BEFORE it is ever prompted.
    await vi.waitFor(() => expect(clients.length).toBe(2));
    await vi.waitFor(() => expect(events).toContain('prompt:1'), { timeout: 3000 });

    expect(events.indexOf('loadSession:1')).toBeGreaterThanOrEqual(0);
    expect(events.indexOf('loadSession:1')).toBeLessThan(events.indexOf('prompt:1'));
  });

  /**
   * The re-queue on a non-prompting exit must be gated on "nothing has happened yet".
   *
   * An unconditional unshift looked right and was a back door: it re-queued THE DEAD
   * TURN'S OWN PROMPT, and resumeFromDisconnect's flushPendingPrompt() then replayed
   * it — through flush() → execute(), which never consults turnRanTool. A turn that
   * had already run `rm -rf` got run again. These two tests pin the distinction that
   * makes it safe: the dead turn's prompt is dropped, a queued follow-up is not.
   */
  it('a crashed turn that already ran a tool is NOT replayed on the respawned session (#774)', async () => {
    const clients: AcpClient[] = [];
    let disconnect!: () => void;
    clientFactory = {
      create: vi.fn(() => {
        const c = createMockClient();
        (c.onDisconnect as ReturnType<typeof vi.fn>).mockImplementation((cb: () => void) => {
          disconnect = cb;
        });
        clients.push(c);
        return c;
      }),
    };

    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    let killTurn!: (e: unknown) => void;
    (clients[0].prompt as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      // The tool RAN. Whatever happens next, this turn must never be sent again.
      handlersOf().onSessionUpdate({
        sessionId: 'sess-1',
        update: { sessionUpdate: 'tool_call', toolCallId: 't1', title: 'rm -rf build', status: 'in_progress' },
      } as unknown as SessionNotification);
      return new Promise((_r, reject) => {
        killTurn = reject;
      });
    });

    const send = session.sendMessage('rm -rf build').catch(() => {});
    await vi.waitFor(() => expect(session.status).toBe('prompting'));

    disconnect();
    killTurn(new AcpError('PROCESS_CRASHED', 'ACP connection closed', { retryable: true }));
    await send;

    await vi.waitFor(() => expect(clients.length).toBe(2));
    await new Promise((r) => setTimeout(r, 250)); // let the respawn finish and flush

    expect(clients[1].prompt).not.toHaveBeenCalled();
  });

  it('but a QUEUED follow-up still survives the crash and is delivered after the respawn (#774)', async () => {
    const clients: AcpClient[] = [];
    let disconnect!: () => void;
    clientFactory = {
      create: vi.fn(() => {
        const c = createMockClient();
        (c.onDisconnect as ReturnType<typeof vi.fn>).mockImplementation((cb: () => void) => {
          disconnect = cb;
        });
        clients.push(c);
        return c;
      }),
    };

    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    let killTurn!: (e: unknown) => void;
    (clients[0].prompt as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((_r, reject) => {
          killTurn = reject;
        })
    );

    const send = session.sendMessage('first').catch(() => {});
    await vi.waitFor(() => expect(session.status).toBe('prompting'));
    void session.sendMessage('queued-follow-up'); // never sent — nothing ran for it

    disconnect();
    killTurn(new AcpError('PROCESS_CRASHED', 'ACP connection closed', { retryable: true }));
    await send;

    await vi.waitFor(() => expect(clients.length).toBe(2));
    await vi.waitFor(() => expect(clients[1].prompt).toHaveBeenCalled(), { timeout: 3000 });

    const sent = (clients[1].prompt as ReturnType<typeof vi.fn>).mock.calls[0][1] as Array<{ text: string }>;
    expect(sent[0].text).toBe('queued-follow-up');
  });
});
