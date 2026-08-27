/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1061 - the "live child, dropped transport" banner could not fire on Windows.
 *
 * Three of ProcessAcpClient's four lifecycle signals are PIPE signals. Measured on
 * the real Windows box, with a known positive in the same run: a child that closes
 * stdout (`process.stdout.end()` AND the definitive `fs.closeSync(1)`) while
 * STAYING ALIVE produces no 'end' and no 'close' on the parent's read end, while a
 * child that really exits produces the full [stdout:end, stdout:close, exit, close]
 * set. So for a live agent whose transport went away, win32 has no pipe signal at
 * all and the in-flight prompt hung until the caller gave up.
 *
 * The fix is the one signal that does not come from the pipe's event stream: poll
 * how many bytes have actually been READ off the child's stdout while a prompt is
 * in flight. Bytes moving means the transport is alive, whatever the agent is
 * saying; bytes frozen for the whole silence window while the child lives means
 * the transport is gone.
 *
 * These tests drive the watchdog on ANY host by passing the platform explicitly -
 * the local box is not CI, and a darwin-only proof would prove nothing about the
 * platform this exists for. The fixture shape (answer initialize + session/new,
 * then go silent on session/prompt with stdout still OPEN) is reachable
 * everywhere, which is precisely why it is the right shape to pin: unlike
 * `drop-on-prompt`, no pipe event can rescue the assertion on POSIX.
 */

import { describe, it, expect } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import type { DisconnectInfo } from '@process/acp/infra/IAcpClient';
import { isProcessAlive } from '@process/acp/infra/processUtils';
import { buildCrashMessage } from '@process/acp/session/AcpSession';
import { CRASH_MARKER_PROCESS_EXIT, CRASH_MARKER_TRANSPORT_CLOSE } from '@process/acp/session/crashMarkers';

const FIXTURE = path.resolve(__dirname, '../fixtures/acp/fakeAcpAgent.cjs');

const handlers = {
  onSessionUpdate: async () => {},
  onRequestPermission: async () => ({ outcome: { outcome: 'cancelled' } }) as never,
  onReadTextFile: async () => ({ content: '' }),
  onWriteTextFile: async () => ({}),
} as never;

const SILENCE_MS = 400;

type Harness = {
  client: ProcessAcpClient;
  child: ChildProcess;
  info: () => DisconnectInfo | null;
  promptError: () => unknown;
};

const spawned: ChildProcess[] = [];

function reapAll(): void {
  for (const child of spawned.splice(0)) {
    if (child.pid && isProcessAlive(child.pid)) {
      try {
        process.kill(child.pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
}

async function startPrompting(mode: string, platform: NodeJS.Platform): Promise<Harness> {
  let child: ChildProcess | null = null;
  const client = new ProcessAcpClient(
    async () => {
      child = spawn(process.execPath, [FIXTURE], {
        stdio: 'pipe',
        env: { ...process.env, FAKE_ACP_MODE: mode },
      });
      spawned.push(child);
      return child;
    },
    { backend: 'probe', handlers, platform, transportSilenceMs: SILENCE_MS }
  );

  let info: DisconnectInfo | null = null;
  client.onDisconnect((i) => {
    info ??= i;
  });

  await client.start();
  const session = await client.createSession({ cwd: process.cwd(), mcpServers: [] });

  let promptError: unknown = null;
  void client.prompt(session.sessionId, [{ type: 'text', text: 'hello' }] as never).catch((err) => {
    promptError = err;
  });

  return { client, child: child as unknown as ChildProcess, info: () => info, promptError: () => promptError };
}

async function waitFor<T>(read: () => T | null, ms: number): Promise<T | null> {
  const deadline = Date.now() + ms;
  for (;;) {
    const value = read();
    if (value !== null) return value;
    if (Date.now() >= deadline) return null;
    await new Promise((r) => setTimeout(r, 10));
  }
}

describe('#1061 ACP transport-silence watchdog', () => {
  it('reports a live agent whose transport went silent on win32', async () => {
    const h = await startPrompting('silent-on-prompt', 'win32');
    try {
      const info = await waitFor(h.info, SILENCE_MS * 12);
      expect(info, 'no disconnect was reported for a silent live agent').not.toBeNull();

      // KNOWN POSITIVE / the whole point: the child is genuinely still running and
      // its stdout was never closed, so nothing about a process exit is known and
      // no pipe signal could have produced this report.
      expect(isProcessAlive(h.child.pid!)).toBe(true);
      expect(h.child.stdout!.readableEnded).toBe(false);

      expect(info!.reason).toBe('connection_close');
      expect(info!.exitCode).toBeNull();
      expect(info!.signal).toBeNull();
      expect(info!.unexpectedDuringPrompt).toBe(true);

      const msg = buildCrashMessage(info!)!;
      expect(msg).toContain(CRASH_MARKER_TRANSPORT_CLOSE);
      expect(msg).not.toContain(CRASH_MARKER_PROCESS_EXIT);

      // The in-flight prompt must stop hanging - that is the customer symptom.
      const err = await waitFor(h.promptError, 2000);
      expect(err, 'the in-flight prompt never rejected').not.toBeNull();
    } finally {
      reapAll();
    }
  }, 20000);

  it('does NOT fire while the agent keeps the transport moving', async () => {
    const h = await startPrompting('chatty-on-prompt', 'win32');
    try {
      // Long enough that a watchdog measuring "no ANSWER" rather than "no bytes"
      // would have fired several times over.
      const info = await waitFor(h.info, SILENCE_MS * 8);
      expect(info, 'a chatty but unanswering agent was wrongly reported as disconnected').toBeNull();
      expect(isProcessAlive(h.child.pid!)).toBe(true);
    } finally {
      reapAll();
    }
  }, 20000);

  it('stays disarmed on POSIX, where the pipe signals already work', async () => {
    // Same silent fixture, same window: on linux/darwin the existing pipe route
    // is exact, so adding a timeout there would only add false positives.
    const h = await startPrompting('silent-on-prompt', 'linux');
    try {
      const info = await waitFor(h.info, SILENCE_MS * 8);
      expect(info, 'the watchdog armed on a platform whose pipe signals are exact').toBeNull();
    } finally {
      reapAll();
    }
  }, 20000);

  it('does not arm outside a prompt', async () => {
    let child: ChildProcess | null = null;
    const client = new ProcessAcpClient(
      async () => {
        child = spawn(process.execPath, [FIXTURE], {
          stdio: 'pipe',
          env: { ...process.env, FAKE_ACP_MODE: 'stay' },
        });
        spawned.push(child);
        return child;
      },
      { backend: 'probe', handlers, platform: 'win32', transportSilenceMs: SILENCE_MS }
    );
    let info: DisconnectInfo | null = null;
    client.onDisconnect((i) => {
      info ??= i;
    });
    try {
      await client.start();
      await client.createSession({ cwd: process.cwd(), mcpServers: [] });
      // An idle, connected agent is silent by definition. It is not disconnected.
      await new Promise((r) => setTimeout(r, SILENCE_MS * 5));
      expect(info, 'an idle connected agent was reported as disconnected').toBeNull();
      expect(isProcessAlive((child as unknown as ChildProcess).pid!)).toBe(true);
    } finally {
      reapAll();
    }
  }, 20000);
});
