import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AcpSession } from '@process/acp/session/AcpSession';
import type { AcpClient, ClientFactory, DisconnectInfo } from '@process/acp/infra/IAcpClient';
import type { AgentConfig, ProtocolHandlers, SessionCallbacks, SessionStatus } from '@process/acp/types';
import type { SessionOptions } from '@process/acp/session/AcpSession';

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

function createMockClient() {
  const client: AcpClient = {
    start: vi.fn().mockResolvedValue({
      protocolVersion: '0.1',
      capabilities: {},
    }),
    createSession: vi.fn().mockResolvedValue({
      sessionId: 'sess-123',
      models: {
        currentModelId: 'claude-3',
        availableModels: [],
      },
      modes: {
        currentModeId: 'code',
        availableModes: [],
      },
      configOptions: [],
    }),
    loadSession: vi.fn().mockResolvedValue({}),
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
  return client;
}

function createMockClientFactory(client: AcpClient, captureHandlers?: (handlers: ProtocolHandlers) => void): ClientFactory {
  return {
    create: vi.fn((_config: AgentConfig, handlers: ProtocolHandlers) => {
      captureHandlers?.(handlers);
      return client;
    }),
  };
}

function providerModelOption(currentValue: string) {
  return {
    id: 'model',
    name: 'Model',
    type: 'select' as const,
    category: 'model',
    description: 'Provider model selector',
    currentValue,
    options: [
      { value: 'gpt-5.6-sol', name: 'GPT-5.6 SOL', description: 'Exact provider model' },
      { value: 'gpt-5.5', name: 'GPT-5.5' },
    ],
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

describe('AcpSession lifecycle', () => {
  let callbacks: SessionCallbacks;
  let client: AcpClient;
  let clientFactory: ClientFactory;
  let protocolHandlers: ProtocolHandlers;

  beforeEach(() => {
    callbacks = createMockCallbacks();
    client = createMockClient();
    clientFactory = createMockClientFactory(client, (handlers) => {
      protocolHandlers = handlers;
    });
  });

  it('starts in idle state', () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    expect(session.status).toBe('idle');
  });

  it('start() transitions idle → starting → active (T1, T2)', async () => {
    const statusChanges: SessionStatus[] = [];
    callbacks.onStatusChange = vi.fn((s) => statusChanges.push(s));
    const session = new AcpSession(baseConfig, clientFactory, callbacks);

    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    expect(statusChanges).toContain('starting');
    expect(statusChanges).toContain('active');
  });

  it('start() calls start and createSession on client', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    expect(client.start).toHaveBeenCalledOnce();
    expect(client.createSession).toHaveBeenCalledOnce();
  });

  it('start() notifies sessionId via callback', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    expect(callbacks.onSessionId).toHaveBeenCalledWith('sess-123');
    expect(session.sessionId).toBe('sess-123');
  });

  it('confirms models.currentModelId returned by session/new', async () => {
    vi.mocked(client.createSession).mockResolvedValueOnce({
      sessionId: 'sess-123',
      models: {
        currentModelId: 'gpt-5.6-sol',
        availableModels: [
          { modelId: 'gpt-5.6-sol', name: 'GPT-5.6 SOL', description: 'Exact provider model' },
          { modelId: 'gpt-5.5', name: 'GPT-5.5' },
        ],
      },
    } as never);
    const session = new AcpSession(baseConfig, clientFactory, callbacks);

    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    expect(callbacks.onModelUpdate).toHaveBeenCalledWith({
      currentModelId: 'gpt-5.6-sol',
      availableModels: [
        { modelId: 'gpt-5.6-sol', name: 'GPT-5.6 SOL', description: 'Exact provider model' },
        { modelId: 'gpt-5.5', name: 'GPT-5.5', description: undefined },
      ],
      confirmationSource: 'session-models',
    });
  });

  it('preserves and confirms a model config currentValue returned by session/new', async () => {
    vi.mocked(client.createSession).mockResolvedValueOnce({
      sessionId: 'sess-123',
      configOptions: [providerModelOption('gpt-5.6-sol')],
    } as never);
    const session = new AcpSession(baseConfig, clientFactory, callbacks);

    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    expect(callbacks.onConfigUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        configOptions: [
          {
            id: 'model',
            name: 'Model',
            type: 'select',
            category: 'model',
            description: 'Provider model selector',
            currentValue: 'gpt-5.6-sol',
            options: [
              { id: 'gpt-5.6-sol', name: 'GPT-5.6 SOL', description: 'Exact provider model' },
              { id: 'gpt-5.5', name: 'GPT-5.5', description: undefined },
            ],
          },
        ],
      })
    );
    expect(callbacks.onModelUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        currentModelId: 'gpt-5.6-sol',
        confirmationSource: 'config-option-response',
      })
    );
  });

  it('applies models.currentModelId returned by session/load during resume', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    await session.suspend();
    vi.mocked(callbacks.onModelUpdate).mockClear();
    vi.mocked(client.loadSession).mockResolvedValueOnce({
      models: {
        currentModelId: 'gpt-5.6-sol',
        availableModels: [{ modelId: 'gpt-5.6-sol', name: 'GPT-5.6 SOL' }],
      },
    } as never);

    await session.sendMessage('resume');

    await vi.waitFor(() =>
      expect(callbacks.onModelUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          currentModelId: 'gpt-5.6-sol',
          confirmationSource: 'session-models',
        })
      )
    );
  });

  it('applies a model config currentValue returned by session/load during resume', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    await session.suspend();
    vi.mocked(callbacks.onModelUpdate).mockClear();
    vi.mocked(client.loadSession).mockResolvedValueOnce({
      configOptions: [providerModelOption('gpt-5.6-sol')],
    } as never);

    await session.sendMessage('resume');

    await vi.waitFor(() =>
      expect(callbacks.onModelUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          currentModelId: 'gpt-5.6-sol',
          confirmationSource: 'config-option-response',
        })
      )
    );
  });

  it('confirms a model config currentValue from config_option_update', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    vi.mocked(callbacks.onModelUpdate).mockClear();

    protocolHandlers.onSessionUpdate({
      sessionId: 'sess-123',
      update: {
        sessionUpdate: 'config_option_update',
        configOptions: [providerModelOption('gpt-5.6-sol')],
      },
    } as never);

    expect(callbacks.onModelUpdate).toHaveBeenCalledWith({
      currentModelId: 'gpt-5.6-sol',
      availableModels: [
        { modelId: 'gpt-5.6-sol', name: 'GPT-5.6 SOL', description: 'Exact provider model' },
        { modelId: 'gpt-5.5', name: 'GPT-5.5', description: undefined },
      ],
      confirmationSource: 'config-option-update',
    });
  });

  it('does not confirm selectedValue alone from config_option_update', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    vi.mocked(callbacks.onModelUpdate).mockClear();

    protocolHandlers.onSessionUpdate({
      sessionId: 'sess-123',
      update: {
        sessionUpdate: 'config_option_update',
        configOptions: [
          {
            ...providerModelOption('gpt-5.5'),
            currentValue: undefined,
            selectedValue: 'gpt-5.6-sol',
          },
        ],
      },
    } as never);

    expect(callbacks.onModelUpdate).not.toHaveBeenCalled();
    expect(session.configTracker.modelSnapshot().currentModelId).not.toBe('gpt-5.6-sol');
  });

  it('confirms a model currentValue returned by session/set_config_option', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    vi.mocked(callbacks.onModelUpdate).mockClear();
    vi.mocked(client.setConfigOption).mockResolvedValueOnce({
      configOptions: [providerModelOption('gpt-5.6-sol')],
    } as never);

    await session.setConfigOption('model', 'gpt-5.6-sol');
    await Promise.resolve();
    await Promise.resolve();

    expect(callbacks.onModelUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        currentModelId: 'gpt-5.6-sol',
        confirmationSource: 'config-option-response',
      })
    );
  });

  it('does not echo an empty set_model success as provider-confirmed current state', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    vi.mocked(callbacks.onModelUpdate).mockClear();

    await session.setModel('gpt-5.6-sol');
    await Promise.resolve();
    await Promise.resolve();

    expect(client.setModel).toHaveBeenCalledWith('sess-123', 'gpt-5.6-sol');
    expect(callbacks.onModelUpdate).not.toHaveBeenCalled();
    expect(session.configTracker.modelSnapshot().currentModelId).not.toBe('gpt-5.6-sol');
  });

  it('propagates a rejected set_model dispatch to the caller', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    vi.mocked(client.setModel).mockRejectedValueOnce(new Error('provider rejected model'));

    await expect(session.setModel('gpt-5.6-sol')).rejects.toThrow('provider rejected model');
  });

  it('stop() transitions any state → idle (T7, T15, T17, T22)', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    await session.stop();
    expect(session.status).toBe('idle');
  });

  it('suspend() transitions active → suspended when queue empty (T6, INV-S-05)', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    await session.suspend();
    expect(session.status).toBe('suspended');
  });

  it('start() from error state resets retry count (T21)', async () => {
    const session = new AcpSession(baseConfig, clientFactory, callbacks);

    (client.start as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('permanent'));
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('error'), { timeout: 10000 });

    (client.start as ReturnType<typeof vi.fn>).mockResolvedValue({ protocolVersion: '0.1', capabilities: {} });
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
  });

  it('only emits valid state transitions (INV-S-09)', async () => {
    const VALID_TRANSITIONS = new Set([
      'idle→starting',
      'starting→active',
      'starting→starting',
      'starting→error',
      'active→prompting',
      'active→suspended',
      'active→idle',
      'prompting→active',
      'prompting→prompting',
      'prompting→resuming',
      'prompting→error',
      'prompting→idle',
      'suspended→resuming',
      'suspended→idle',
      'resuming→active',
      'resuming→resuming',
      'resuming→error',
      'error→starting',
      'error→idle',
    ]);

    const transitions: string[] = [];
    let prevStatus: SessionStatus = 'idle';
    callbacks.onStatusChange = vi.fn((status: SessionStatus) => {
      transitions.push(`${prevStatus}→${status}`);
      prevStatus = status;
    });

    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));
    await session.stop();

    for (const t of transitions) {
      expect(VALID_TRANSITIONS.has(t), `Invalid transition: ${t}`).toBe(true);
    }
  });

  it('disconnect in active state does NOT emit crash signal (idle exit)', async () => {
    // Capture the disconnect handler registered by SessionLifecycle
    let disconnectHandler: ((info: DisconnectInfo) => void) | null = null;
    (client.onDisconnect as ReturnType<typeof vi.fn>).mockImplementation((handler: (info: DisconnectInfo) => void) => {
      disconnectHandler = handler;
    });

    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    // Simulate process exit while session is idle (active, no prompt in flight)
    disconnectHandler!({ reason: 'process_exit', exitCode: 1, signal: null, stderr: '' });

    expect(session.status).toBe('suspended');
    // onSignal should NOT have been called with an error crash message
    const signalCalls = (callbacks.onSignal as ReturnType<typeof vi.fn>).mock.calls;
    const crashSignals = signalCalls.filter(
      ([sig]: [{ type: string; message?: string }]) =>
        sig.type === 'error' && sig.message?.includes('process exited unexpectedly')
    );
    expect(crashSignals).toHaveLength(0);
  });

  it('disconnect in prompting state DOES emit crash signal', async () => {
    let disconnectHandler: ((info: DisconnectInfo) => void) | null = null;
    (client.onDisconnect as ReturnType<typeof vi.fn>).mockImplementation((handler: (info: DisconnectInfo) => void) => {
      disconnectHandler = handler;
    });

    // Make prompt() hang forever so we stay in 'prompting' state
    (client.prompt as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    // Make loadSession resolve so resume works
    (client.loadSession as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'));

    // Start a prompt (will hang, keeping status in 'prompting')
    void session.sendMessage('hello');
    await vi.waitFor(() => expect(session.status).toBe('prompting'));

    // Simulate process crash during prompting
    disconnectHandler!({ reason: 'process_exit', exitCode: 1, signal: null, stderr: '' });

    // onSignal SHOULD have been called with a crash error
    const signalCalls = (callbacks.onSignal as ReturnType<typeof vi.fn>).mock.calls;
    const crashSignals = signalCalls.filter(
      ([sig]: [{ type: string; message?: string }]) =>
        sig.type === 'error' && sig.message?.includes('process exited unexpectedly')
    );
    expect(crashSignals.length).toBeGreaterThan(0);
  });

  it('disconnect during starting state suppresses crash signal while retries remain (#676)', async () => {
    let disconnectHandler: ((info: DisconnectInfo) => void) | null = null;
    (client.onDisconnect as ReturnType<typeof vi.fn>).mockImplementation((handler: (info: DisconnectInfo) => void) => {
      disconnectHandler = handler;
    });
    // Keep client.start() hanging so status stays 'starting'.
    (client.start as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('starting'));

    // Simulate the child process dying mid-bootstrap. A retry is still available
    // (maxStartRetries defaults to 3, none consumed yet), so no banner should fire -
    // otherwise every retry attempt would storm the UI with its own crash signal.
    disconnectHandler!({ reason: 'process_exit', exitCode: 1, signal: null, stderr: '' });

    const signalCalls = (callbacks.onSignal as ReturnType<typeof vi.fn>).mock.calls;
    const crashSignals = signalCalls.filter(
      ([sig]: [{ type: string; message?: string }]) =>
        sig.type === 'error' && sig.message?.includes('process exited unexpectedly')
    );
    expect(crashSignals).toHaveLength(0);
  });

  it('enterError emits the error signal BEFORE flipping status to error (#483/#369)', async () => {
    // Hold the session in 'starting' so starting→error is a valid transition -
    // this mirrors the real start-failure path (handleStartError → enterError).
    // A hung client.start() keeps status at 'starting'.
    (client.start as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    const session = new AcpSession(baseConfig, clientFactory, callbacks);
    session.start();
    await vi.waitFor(() => expect(session.status).toBe('starting'));

    session.enterError('No API key configured for provider openai');

    const onSignal = callbacks.onSignal as ReturnType<typeof vi.fn>;
    const onStatus = callbacks.onStatusChange as ReturnType<typeof vi.fn>;
    const errorSignalIdx = onSignal.mock.calls.findIndex(([sig]) => sig.type === 'error');
    const errorStatusIdx = onStatus.mock.calls.findIndex(([status]) => status === 'error');
    expect(errorSignalIdx).toBeGreaterThanOrEqual(0);
    expect(errorStatusIdx).toBeGreaterThanOrEqual(0);

    // Ordering is load-bearing: AcpAgentV2 captures the error signal's message to
    // reject a pending start op, and that reject happens on the status change. If
    // the status flip preceded the signal, the reject would miss the real reason
    // and fall back to a generic "Session failed to start".
    expect(onSignal.mock.invocationCallOrder[errorSignalIdx]).toBeLessThan(
      onStatus.mock.invocationCallOrder[errorStatusIdx]
    );
    expect(onSignal.mock.calls[errorSignalIdx][0]).toEqual(
      expect.objectContaining({ type: 'error', message: expect.stringContaining('No API key configured') })
    );
  });
});
