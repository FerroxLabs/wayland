/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1023 REGRESSION LOCK: the transport-drop banner must still classify as a crash
 * at `AcpAgentV2`'s error handler.
 *
 * The gap this closes: deleting the `CRASH_MARKER_TRANSPORT_CLOSE` arm of `isCrash`
 * survived the whole 204-test suite. The transport banner matches NONE of the other
 * three substrings, so without that arm `isCrash` is false, no `finish` frame with
 * `agentCrash: true` is synthesized, and per `crashMarkers.ts` the renderer's
 * loading state never clears - a permanently stuck spinner on the exact #1020
 * customer path.
 *
 * The banner text is taken from the REAL `buildCrashMessage`, never a hand-written
 * literal. A hand-written literal is what let this through: the sibling suite's
 * `const CRASH = 'process exited unexpectedly (code: 1, signal: none)'` cannot
 * notice a reword of the production string, and #1023 rewords it twice.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AcpAgentV2 } from '@process/acp/compat/AcpAgentV2';
import { buildCrashMessage } from '@process/acp/session/AcpSession';
import type { DisconnectInfo } from '@process/acp/infra/IAcpClient';
import type { SessionCallbacks } from '@process/acp/types';
import type { OldAcpAgentConfig } from '@process/acp/compat/typeBridge';

let capturedCallbacks: SessionCallbacks;
let mockStart: ReturnType<typeof vi.fn>;

// Spread the real module so `buildCrashMessage` stays REAL; only the class is stubbed.
vi.mock('@process/acp/session/AcpSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/acp/session/AcpSession')>();
  return {
    ...actual,
    AcpSession: class MockAcpSession {
      constructor(_config: unknown, _factory: unknown, callbacks: SessionCallbacks) {
        capturedCallbacks = callbacks;
      }
      start = (...args: unknown[]) => mockStart(...args);
      stop = vi.fn().mockResolvedValue(undefined);
      get status() {
        return 'idle';
      }
      get sessionId() {
        return null;
      }
    },
  };
});

vi.mock('@process/acp/compat/LegacyConnectorFactory', () => ({
  LegacyConnectorFactory: class {
    constructor() {}
  },
}));

vi.mock('@process/acp/compat/typeBridge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/acp/compat/typeBridge')>();
  return { ...actual, loadAuthCredentials: vi.fn().mockResolvedValue(undefined) };
});

vi.mock('@process/services/mcpServices/runtimeMcpServers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/services/mcpServices/runtimeMcpServers')>();
  return { ...actual, loadRuntimeMcpServers: vi.fn(async () => []) };
});

vi.mock('@process/services/mcpServices/McpService', () => ({
  mcpService: { attachOAuthTokens: vi.fn(async (servers: unknown) => servers) },
}));

/** The #1020 shape: the pipe went, so there is no code and no signal. */
const TRANSPORT_DROP: DisconnectInfo = {
  reason: 'connection_close',
  exitCode: null,
  signal: null,
  stderr: '',
  unexpectedDuringPrompt: true,
};

/** An observed exit, for the control that proves the assertion can distinguish. */
const OBSERVED_EXIT: DisconnectInfo = { ...TRANSPORT_DROP, reason: 'process_exit', exitCode: 7 };

async function startedAgent(): Promise<{ agent: AcpAgentV2; onSignalEvent: ReturnType<typeof vi.fn> }> {
  const onSignalEvent = vi.fn();
  const config: OldAcpAgentConfig = {
    id: 'test-conv-1',
    backend: 'claude',
    workingDir: '/workspace/test',
    onStreamEvent: vi.fn(),
    onSignalEvent,
  };
  const agent = new AcpAgentV2(config);
  mockStart.mockImplementation(() => {
    setTimeout(() => capturedCallbacks.onStatusChange('active'), 0);
  });
  await agent.start();
  mockStart.mockReset();
  onSignalEvent.mockClear();
  return { agent, onSignalEvent };
}

/** The synthesized turn-terminating frames, which are what clear the spinner. */
function crashFinishFrames(spy: ReturnType<typeof vi.fn>): Array<{ error?: string; agentCrash?: boolean }> {
  return spy.mock.calls
    .map((c) => c[0])
    .filter((m) => m?.type === 'finish')
    .map((m) => (m.data ?? {}) as { error?: string; agentCrash?: boolean })
    .filter((d) => d.agentCrash === true);
}

describe('#1023 AcpAgentV2 classifies the real disconnect banners as crashes', () => {
  beforeEach(() => {
    mockStart = vi.fn();
  });

  it('a REAL transport-drop banner (null code, null signal) synthesizes the agentCrash finish frame', async () => {
    const { onSignalEvent } = await startedAgent();
    const banner = buildCrashMessage(TRANSPORT_DROP)!;

    // Guard the guard: if the banner ever starts matching one of the legacy
    // substrings, this test would pass for the wrong reason.
    expect(banner).not.toContain('PROCESS_CRASHED');
    expect(banner).not.toContain('Process disconnected');
    expect(banner).not.toContain('process exited unexpectedly');

    capturedCallbacks.onSignal({ type: 'error', message: banner, recoverable: true });

    const frames = crashFinishFrames(onSignalEvent);
    expect(frames).toHaveLength(1);
    expect(frames[0].error).toBe(banner);
  });

  it('a REAL observed-exit banner also synthesizes the agentCrash finish frame', async () => {
    const { onSignalEvent } = await startedAgent();
    const banner = buildCrashMessage(OBSERVED_EXIT)!;

    capturedCallbacks.onSignal({ type: 'error', message: banner, recoverable: true });

    expect(crashFinishFrames(onSignalEvent)).toHaveLength(1);
  });

  it('an unrelated error is NOT a crash, so the assertions above are not vacuous', async () => {
    const { onSignalEvent } = await startedAgent();

    capturedCallbacks.onSignal({ type: 'error', message: 'Rate limited (429)', recoverable: true });

    expect(crashFinishFrames(onSignalEvent)).toHaveLength(0);
  });
});
