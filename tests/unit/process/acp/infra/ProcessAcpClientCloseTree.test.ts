/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Closing an ACP client must take the engine's whole process tree with it.
 *
 * Fuigo runs each MCP server as its own child. The idle reaper, a model switch
 * and conversation removal all end in `ProcessAcpClient.close()`, and a close
 * that signals only the engine leaves those servers running once it is gone.
 *
 * The fixture is a real tree (a shell holding two `sleep` children) wired in as
 * the client's child, so the assertion is on live pids, not on a mock.
 */
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import { isProcessAlive } from '@process/acp/infra/processUtils';
import type { ProtocolHandlers } from '@process/acp/types';

const describeIfPosix = process.platform === 'win32' ? describe.skip : describe;

function childPidsOf(pid: number): number[] {
  try {
    return execFileSync('pgrep', ['-P', String(pid)], { encoding: 'utf8' })
      .trim()
      .split('\n')
      .map((s) => Number.parseInt(s, 10))
      .filter((n) => !Number.isNaN(n));
  } catch {
    return [];
  }
}

describeIfPosix('ProcessAcpClient.close - process tree', () => {
  const leftovers: number[] = [];

  afterEach(() => {
    for (const pid of leftovers.splice(0)) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // already gone
      }
    }
  });

  it('kills the children the engine spawned, not only the engine', async () => {
    // Detached like spawnGenericBackend on POSIX; the shell ignores stdin EOF, as
    // a busy engine does, so close() has to escalate past the graceful step.
    const engine: ChildProcess = spawn('bash', ['-c', 'sleep 60 & sleep 60 & wait'], {
      detached: true,
      stdio: 'pipe',
    });
    engine.unref();
    const client = new ProcessAcpClient(async () => engine, {
      backend: 'fuigo',
      conversationId: 'conv-96b5c811',
      handlers: {} as ProtocolHandlers,
    });
    (client as unknown as { child: ChildProcess }).child = engine;
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    let servers: number[] = [];
    for (let i = 0; i < 50 && servers.length < 2; i++) {
      // oxlint-disable-next-line no-await-in-loop -- wait for the fixture to fork its children
      await new Promise((r) => setTimeout(r, 20));
      servers = childPidsOf(engine.pid!);
    }
    leftovers.push(engine.pid!, ...servers);
    expect(servers).toHaveLength(2);

    await client.close();

    expect(isProcessAlive(engine.pid!)).toBe(false);
    for (const pid of servers) {
      expect(isProcessAlive(pid), `MCP-like child ${pid} outlived close()`).toBe(false);
    }
    // The shutdown names the conversation and the children it took down.
    const line = log.mock.calls.map((c) => String(c[0])).find((l) => l.includes('stopped with its process tree'));
    expect(line).toContain(`conversation=conv-96b5c811 backend=fuigo pid=${engine.pid}`);
    expect(line).toMatch(/descendants killed=2 \[\d+,\d+\]$/);
    log.mockRestore();
  });
});
