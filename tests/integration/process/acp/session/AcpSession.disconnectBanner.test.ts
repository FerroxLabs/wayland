/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1020 END TO END: a mid-prompt transport drop, driven by a real child process
 * through a real ProcessAcpClient into a real AcpSession, asserting the banner the
 * SESSION emits.
 *
 * This is the test whose absence let the first cut of the fix through review. Every
 * other test in this area asserts `DisconnectInfo`, which is one layer too low: the
 * client can hand the session a perfect payload and the user can still be shown a
 * completely different string, because `PromptExecutor.handlePromptError` also emits
 * an error banner and whichever of the two runs first wins the screen.
 *
 * The fixture is the customer's shape (#1020, and #60 before it): it answers
 * `initialize` and `session/new`, then ends stdout on `session/prompt` and STAYS
 * ALIVE. So there is genuinely no exit code and no signal, and the banner must not
 * invent one.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import { AcpSession } from '@process/acp/session/AcpSession';
import { CRASH_MARKER_PROCESS_EXIT, CRASH_MARKER_TRANSPORT_CLOSE } from '@process/acp/session/crashMarkers';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import { isProcessAlive } from '@process/acp/infra/processUtils';
import type { ClientFactory } from '@process/acp/infra/IAcpClient';
import type { AgentConfig, SessionCallbacks } from '@process/acp/types';

const FIXTURE = path.resolve(__dirname, '../../../../fixtures/acp/fakeAcpAgent.cjs');

/** A real credential shape, so the scrubber is exercised on the real path. */
const LEAKED_SECRET = 'sk-abcdefghijklmnopqrstuvwx';
const STDERR_NOISE = `bridge failed: Cannot find module zod/v4 (token ${LEAKED_SECRET})\n`;

function createCallbacks(): SessionCallbacks {
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

const baseConfig: AgentConfig = {
  agentBackend: 'probe',
  agentSource: 'builtin',
  agentId: 'builtin:probe',
  cwd: process.cwd(),
  command: process.execPath,
  args: [FIXTURE],
};

const spawned: ChildProcess[] = [];

/**
 * `SessionLifecycle.clearClient()` drops a live child on a transport drop without
 * killing it (pre-existing, tracked separately), so the test reaps by hand.
 */
afterEach(() => {
  for (const child of spawned.splice(0)) {
    if (child.pid && isProcessAlive(child.pid)) {
      try {
        process.kill(child.pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
});

function realClientFactory(mode: string): ClientFactory {
  return {
    create: (config, handlers) =>
      new ProcessAcpClient(
        async () => {
          const child = spawn(process.execPath, [FIXTURE], {
            stdio: 'pipe',
            env: { ...process.env, FAKE_ACP_MODE: mode, FAKE_ACP_STDERR: STDERR_NOISE },
          });
          spawned.push(child);
          return child;
        },
        { backend: config.agentBackend, handlers }
      ),
  };
}

function errorMessages(callbacks: SessionCallbacks): string[] {
  return (callbacks.onSignal as ReturnType<typeof vi.fn>).mock.calls
    .map(([sig]: [{ type: string; message?: string }]) => (sig.type === 'error' ? (sig.message ?? '') : null))
    .filter((m): m is string => m !== null);
}

describe('#1020 end-to-end mid-prompt transport drop (real child, real client, real session)', () => {
  it('the banner the SESSION emits describes a transport drop, not an invented exit', async () => {
    const callbacks = createCallbacks();
    const session = new AcpSession(baseConfig, realClientFactory('drop-on-prompt'), callbacks);

    session.start();
    await vi.waitFor(() => expect(session.status).toBe('active'), { timeout: 15000 });

    // The turn rejects with AgentDisconnectedError once the pipe goes.
    await expect(session.sendMessage('please approve this')).rejects.toBeTruthy();

    const errors = await vi.waitFor(
      () => {
        const msgs = errorMessages(callbacks);
        expect(msgs.length).toBeGreaterThan(0);
        return msgs;
      },
      { timeout: 15000 }
    );

    // FIRST, not merely present: whichever error banner lands first is the one the
    // user reads. If `handlePromptError` beats `onDisconnect`, this is instead the
    // raw "Agent disconnected (connection_close, code: null)" and the whole #1020
    // payload below never reaches a screen.
    const banner = errors[0];

    expect(banner).toContain(CRASH_MARKER_TRANSPORT_CLOSE);
    expect(banner).toContain('[reason: connection_close]');
    expect(banner).toContain('we cannot tell whether the agent crashed or the connection dropped');
    expect(banner).not.toContain('may still be running');

    // The old message asserted exactly the two facts that were NOT known.
    expect(banner).not.toContain(CRASH_MARKER_PROCESS_EXIT);
    expect(banner).not.toContain('code: unknown');
    expect(banner).not.toContain('signal: none');

    // A turn was in flight and is not replayed, so the user has to be told - and
    // told to CHECK before resending, because the turn may already have run a tool
    // whose notification died with the pipe (#1023).
    expect(banner).toContain('lost before it could complete');
    expect(banner).toContain('was not resent automatically');
    expect(banner).toContain('The agent may already have carried out part of this message');
    expect(banner).toContain('check the result before sending it again');

    // The stderr that names the real cause rides along - scrubbed.
    expect(banner).toContain('Agent stderr:');
    expect(banner).toContain('Cannot find module zod/v4');
    expect(banner).toContain('[redacted]');
    expect(banner).not.toContain(LEAKED_SECRET);

    // This child really IS still running - but the banner does not say so, because
    // for a fast crash the same null/null report arrives while the child is dead
    // (measured 6 of 20, #1023) and nothing synchronous can tell the two apart.
    const first = spawned[0];
    expect(first.pid).toBeTruthy();
    expect(isProcessAlive(first.pid!)).toBe(true);

    await session.stop();
  }, 40000);
});
