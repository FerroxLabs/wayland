/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1020 - drive ProcessAcpClient's disconnect signals from REAL OS process
 * behaviour and assert what `DisconnectInfo` actually carries.
 *
 * Executed findings that motivated the fix (macOS arm64, node 22):
 *
 *  - `process_exit` and `connection_close` are the only two reasons that ever win
 *    the first-write-wins race. `process_close` cannot (Node emits 'exit' before
 *    'close') and `pipe_close` cannot (the SDK aborts the connection on the
 *    readable's 'end', which precedes the stdout stream's 'close'). Those two are
 *    driven directly below instead of through the OS.
 *  - Before the fix, a child that exited cleanly with code 7 reported
 *    `connection_close / exitCode: null / signal: null` on roughly 3 runs in 5,
 *    because the SDK's abort listener beat Node's 'exit' event. A SIGKILL lost its
 *    signal the same way, every time. The exit detail was populated 0-1ms later.
 */

import { describe, it, expect } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import type { AgentDisconnectReason, DisconnectInfo } from '@process/acp/infra/IAcpClient';
import { isProcessAlive } from '@process/acp/infra/processUtils';

const FIXTURE = path.resolve(__dirname, '../fixtures/acp/fakeAcpAgent.cjs');

const handlers = {
  onSessionUpdate: async () => {},
  onRequestPermission: async () => ({ outcome: { outcome: 'cancelled' } }) as never,
  onReadTextFile: async () => ({ content: '' }),
  onWriteTextFile: async () => ({}),
} as never;

type Driven = {
  info: DisconnectInfo | null;
  client: ProcessAcpClient;
  aliveAfter: boolean;
  pid: number | null;
};

async function drive(mode: string, stderrNoise = ''): Promise<Driven> {
  let child: ChildProcess | null = null;
  const client = new ProcessAcpClient(
    async () => {
      child = spawn(process.execPath, [FIXTURE], {
        stdio: 'pipe',
        env: { ...process.env, FAKE_ACP_MODE: mode, FAKE_ACP_STDERR: stderrNoise },
      });
      return child;
    },
    { backend: 'probe', handlers }
  );
  let info: DisconnectInfo | null = null;
  client.onDisconnect((i) => {
    info ??= i;
  });
  await client.start();
  const deadline = Date.now() + 6000;
  while (!info && Date.now() < deadline) await new Promise((r) => setTimeout(r, 10));
  const pid = child?.pid ?? null;
  const aliveAfter = pid ? isProcessAlive(pid) : false;
  return { info, client, aliveAfter, pid };
}

function reap(d: Driven): void {
  if (d.pid && isProcessAlive(d.pid)) {
    try {
      process.kill(d.pid, 'SIGKILL');
    } catch {
      /* already gone */
    }
  }
}

describe('#1020 ProcessAcpClient disconnect diagnostics (executed)', () => {
  it('KNOWN POSITIVE: a clean exit(7) reports code 7 every time', async () => {
    // Repeated because this was a ~60% coin flip before the fix.
    for (let i = 0; i < 4; i++) {
      const d = await drive('exit-code', 'startup noise\n');
      reap(d);
      expect(d.info, `run ${i}`).not.toBeNull();
      expect(d.info!.exitCode, `run ${i} reason=${d.info!.reason}`).toBe(7);
      expect(d.info!.signal).toBeNull();
      expect(d.info!.stderr).toContain('startup noise');
    }
  }, 30000);

  it('a SIGKILLed child reports its signal, not "none"', async () => {
    const d = await drive('signal');
    reap(d);
    expect(d.info).not.toBeNull();
    expect(d.info!.signal).toBe('SIGKILL');
  }, 15000);

  it('a transport drop with a LIVE child reports no exit code and no signal', async () => {
    const d = await drive('pipe-close');
    expect(d.info).not.toBeNull();
    // The child is genuinely still running: nothing about a process exit is known.
    expect(d.aliveAfter).toBe(true);
    expect(d.info!.reason).toBe('connection_close');
    expect(d.info!.exitCode).toBeNull();
    expect(d.info!.signal).toBeNull();
    reap(d);
  }, 15000);

  it('carries unexpectedDuringPrompt so the message path can see it', async () => {
    const d = await drive('pipe-close');
    reap(d);
    expect(d.info).not.toBeNull();
    expect(d.info!.unexpectedDuringPrompt).toBe(false);
  }, 15000);

  it('pipe_close and process_close carry the same null/null shape', async () => {
    // Unreachable as first-writers through the OS (see the file header), so they
    // are driven straight at the recorder to pin their DisconnectInfo shape.
    for (const reason of ['pipe_close', 'process_close'] as AgentDisconnectReason[]) {
      const client = new ProcessAcpClient(async () => ({}) as ChildProcess, { backend: 'probe', handlers });
      let info: DisconnectInfo | null = null;
      client.onDisconnect((i) => {
        info ??= i;
      });
      (
        client as unknown as { recordAgentExit(r: AgentDisconnectReason, c: number | null, s: string | null): void }
      ).recordAgentExit(reason, null, null);
      await new Promise((r) => setTimeout(r, 50));
      expect(info, reason).not.toBeNull();
      expect(info!.reason).toBe(reason);
      expect(info!.exitCode).toBeNull();
      expect(info!.signal).toBeNull();
    }
  }, 15000);
});
