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
 *  - A child that exits cleanly with code 7 reports `process_exit / 7 / null` on
 *    some runs and `connection_close / null / null` on others (measured 5/12 vs
 *    7/12 here), because the SDK's abort listener races Node's 'exit' event. A
 *    SIGKILL races the same way. The child's exit detail becomes readable 0-1ms
 *    later - but reading it costs a wait, and a wait between the disconnect and
 *    the notification inverts the ordering the session depends on (see
 *    `recordAgentExit`). So the race is NOT closed here, deliberately: a fast
 *    crash may be reported as a transport drop, and `buildCrashMessage` hedges
 *    accordingly instead of asserting an exit it has no evidence for. What the
 *    tests below pin is that the report is never WRONG - never a fabricated code,
 *    never a fabricated signal, never a claimed exit that was not observed.
 */

import { describe, it, expect } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import type { AgentDisconnectReason, DisconnectInfo } from '@process/acp/infra/IAcpClient';
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

type RealExit = { code: number | null; signal: string | null };

/**
 * What the OS reports when the fixture hard-kills itself.
 *
 * Windows has no POSIX signals: `process.kill(pid, 'SIGKILL')` there is
 * `TerminateProcess`, which libuv issues with exit code 1 ("on Windows, killed
 * processes normally return 1", `uv__kill`), so the child's own 'exit' event carries
 * `{code: 1, signal: null}` and never a signal name. Executed on the win32 runner:
 * `{code: 1, signal: null}`. Executed on darwin with the same probe: `exit(null, SIGKILL)`.
 *
 * This is a control, not a product assertion - but demanding the POSIX shape on win32
 * made the control itself fail, so `assertHonest` below (the actual #1020 assertion)
 * was never reached on that platform at all.
 */
const HARD_KILL_EXIT: RealExit =
  process.platform === 'win32' ? { code: 1, signal: null } : { code: null, signal: 'SIGKILL' };

/**
 * A child that closes stdout while STAYING ALIVE is unobservable on Windows, so the
 * scenario the three tests below drive does not exist on that platform.
 *
 * Executed on the win32 box, with a known positive in the same run:
 *
 *   A  child does `process.stdout.end()`, stays alive -> parent sees []  (stillAlive=true)
 *   B  child does `fs.closeSync(1)`, stays alive      -> parent sees []  (stillAlive=true)
 *   C  KNOWN POSITIVE: the child really exits         -> parent sees
 *      [stdout:end, stdout:close, exit(3,null), child:close]
 *
 * The same probe on darwin reports `[stdout:end, stdout:close]` with the child still
 * alive for BOTH A and B, so this is a platform difference and not a fixture bug.
 *
 * Consequence: neither `pipe_close` (the child's stdout 'close') nor `connection_close`
 * (the SDK aborting on that readable's 'end') can fire for a LIVE child on win32. The
 * PRODUCT limitation that follows is recorded next to the detection code in
 * `ProcessAcpClient.attachLifecycleObservers` - read that before treating these skips as
 * a test-only problem. A genuinely CRASHED agent is still detected on Windows, because
 * process death closes the pipe (case C above); only the live-child-with-a-dead-transport
 * half is skipped, and the `DisconnectInfo` shape for `pipe_close`/`process_close` stays
 * covered on win32 by the drive-the-recorder test further down.
 */
const itLiveChildDrop = it.skipIf(process.platform === 'win32');

type Driven = {
  info: DisconnectInfo | null;
  client: ProcessAcpClient;
  aliveAfter: boolean;
  pid: number | null;
  /**
   * What the OS actually reported for the child, read straight off its own 'exit'
   * event and independent of anything `ProcessAcpClient` decided. This is the
   * known-positive control: it proves the fixture really did exit the way the test
   * asked, so a null in `DisconnectInfo` is a reporting choice rather than a
   * broken fixture.
   */
  realExit: RealExit | null;
};

async function drive(mode: string, stderrNoise = ''): Promise<Driven> {
  let child: ChildProcess | null = null;
  let realExit: RealExit | null = null;
  const client = new ProcessAcpClient(
    async () => {
      child = spawn(process.execPath, [FIXTURE], {
        stdio: 'pipe',
        env: { ...process.env, FAKE_ACP_MODE: mode, FAKE_ACP_STDERR: stderrNoise },
      });
      child.once('exit', (code, signal) => {
        realExit ??= { code: code ?? null, signal: signal ? String(signal) : null };
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
  // The child's own exit event can trail the disconnect report by a millisecond;
  // that is the whole point of these tests, so give it a moment before reading it.
  const exitDeadline = Date.now() + 1000;
  while (!realExit && Date.now() < exitDeadline) await new Promise((r) => setTimeout(r, 5));
  const pid = child?.pid ?? null;
  const aliveAfter = pid ? isProcessAlive(pid) : false;
  return { info, client, aliveAfter, pid, realExit };
}

/**
 * The invariant that replaced "always reports the code": whatever the race
 * outcome, the report must be self-consistent and must never assert an exit that
 * was not observed.
 */
function assertHonest(d: Driven, expected: RealExit, label: string): 'exit-observed' | 'transport-drop' {
  const info = d.info!;
  const msg = buildCrashMessage(info)!;
  if (info.exitCode !== null || info.signal !== null) {
    // The exit won the race: it must be the REAL exit, not an approximation.
    expect(info.exitCode, `${label} exitCode`).toBe(expected.code);
    expect(info.signal, `${label} signal`).toBe(expected.signal);
    expect(msg, label).toContain(CRASH_MARKER_PROCESS_EXIT);
    expect(msg, label).not.toContain(CRASH_MARKER_TRANSPORT_CLOSE);
    return 'exit-observed';
  }
  // The transport abort won: nothing about a process exit is known, so nothing
  // about a process exit may be claimed (#1020).
  expect(info.reason, label).toBe('connection_close');
  expect(msg, label).toContain(CRASH_MARKER_TRANSPORT_CLOSE);
  expect(msg, label).not.toContain(CRASH_MARKER_PROCESS_EXIT);
  expect(msg, label).toContain('we cannot tell whether the agent crashed or the connection dropped');
  // #1023: 6 of these 20 real children were genuinely dead at report time, so the
  // banner must not reassure the user that the child is probably alive.
  expect(msg, label).not.toContain('may still be running');
  expect(msg, label).not.toContain('code: unknown');
  expect(msg, label).not.toContain('signal: none');
  return 'transport-drop';
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
  it('a clean exit(7) is either reported as code 7 or hedged - never fabricated', async () => {
    const outcomes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = await drive('exit-code', 'startup noise\n');
      reap(d);
      // KNOWN POSITIVE: the harness really did drive a code-7 exit. Without this
      // control a null in DisconnectInfo could just mean the fixture never ran.
      expect(d.realExit, `run ${i} real exit`).toEqual({ code: 7, signal: null });
      expect(d.info, `run ${i}`).not.toBeNull();
      expect(d.info!.stderr, `run ${i}`).toContain('startup noise');
      outcomes.push(assertHonest(d, { code: 7, signal: null }, `run ${i}`));
    }
    console.log(`[#1020 exit(7) race] ${outcomes.join(', ')}`);
  }, 45000);

  it('a hard-killed child is either reported as the real kill shape or hedged - never fabricated', async () => {
    const outcomes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = await drive('signal');
      reap(d);
      // KNOWN POSITIVE: the OS really did tear the child down - as a SIGKILL on POSIX,
      // as a TerminateProcess exit on win32 (see HARD_KILL_EXIT).
      expect(d.realExit, `run ${i} real exit`).toEqual(HARD_KILL_EXIT);
      expect(d.info, `run ${i}`).not.toBeNull();
      outcomes.push(assertHonest(d, HARD_KILL_EXIT, `run ${i}`));
    }
    console.log(`[#1020 hard-kill race] ${outcomes.join(', ')}`);
  }, 45000);

  itLiveChildDrop(
    'a transport drop with a LIVE child reports no exit code and no signal',
    async () => {
      const d = await drive('pipe-close');
      expect(d.info).not.toBeNull();
      // The child is genuinely still running: nothing about a process exit is known.
      expect(d.aliveAfter).toBe(true);
      expect(d.info!.reason).toBe('connection_close');
      expect(d.info!.exitCode).toBeNull();
      expect(d.info!.signal).toBeNull();
      reap(d);
    },
    15000
  );

  itLiveChildDrop(
    'carries unexpectedDuringPrompt so the message path can see it',
    async () => {
      const d = await drive('pipe-close');
      reap(d);
      expect(d.info).not.toBeNull();
      expect(d.info!.unexpectedDuringPrompt).toBe(false);
    },
    15000
  );

  it('pipe_close and process_close carry the same null/null shape on a STARTED client', async () => {
    // Unreachable as first-writers through the OS (see the file header), so they
    // are driven straight at the recorder to pin their DisconnectInfo shape - but
    // against a client that has really start()ed, so `this.child` is a live
    // process and the stderr buffer is the real one. An earlier version of this
    // test constructed the client WITHOUT start(): `this.child` stayed null, so
    // the recorder ran over a hollow object and the live-child state the
    // disconnect path reads was never exercised at all.
    for (const reason of ['pipe_close', 'process_close'] as AgentDisconnectReason[]) {
      let child: ChildProcess | null = null;
      const client = new ProcessAcpClient(
        async () => {
          child = spawn(process.execPath, [FIXTURE], {
            stdio: 'pipe',
            env: { ...process.env, FAKE_ACP_MODE: 'stay', FAKE_ACP_STDERR: 'live child noise\n' },
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

      // The client really is started and the child really is alive, which is what
      // the un-started fixture could not claim.
      const pid = (child as unknown as ChildProcess).pid!;
      expect(client.lifecycleSnapshot.pid, reason).toBe(pid);
      expect(client.lifecycleSnapshot.running, reason).toBe(true);
      expect(isProcessAlive(pid), reason).toBe(true);

      (
        client as unknown as { recordAgentExit(r: AgentDisconnectReason, c: number | null, s: string | null): void }
      ).recordAgentExit(reason, null, null);

      // Asserted with NO await: the disconnect must be reported synchronously.
      // A deferral here is what disabled the whole #1020 fix at session level.
      expect(info, reason).not.toBeNull();
      expect(info!.reason).toBe(reason);
      expect(info!.exitCode).toBeNull();
      expect(info!.signal).toBeNull();
      expect(info!.stderr, reason).toContain('live child noise');
      // Still alive: null/null really did mean "no exit observed", not "exited".
      expect(isProcessAlive(pid), reason).toBe(true);
      process.kill(pid, 'SIGKILL');
    }
  }, 20000);

  /**
   * The ordering the session depends on, measured rather than reasoned about.
   *
   * `AcpSession.onDisconnect` must see the drop BEFORE `PromptExecutor` sees the
   * in-flight prompt reject. Otherwise `handlePromptError` runs while the status is
   * still 'prompting', takes its retryable branch, emits its own raw banner and
   * flushes the queued follow-up at the dead client (#774) - and every #1020
   * banner becomes unreachable.
   *
   * Measured with the customer's shape: the child answers initialize and
   * session/new, then ends stdout on session/prompt and STAYS ALIVE.
   */
  itLiveChildDrop(
    'reports the disconnect BEFORE the in-flight prompt rejects',
    async () => {
      let child: ChildProcess | null = null;
      const client = new ProcessAcpClient(
        async () => {
          child = spawn(process.execPath, [FIXTURE], {
            stdio: 'pipe',
            env: { ...process.env, FAKE_ACP_MODE: 'drop-on-prompt' },
          });
          return child;
        },
        { backend: 'probe', handlers }
      );

      const t0 = Date.now();
      const order: string[] = [];
      let tDisconnect = -1;
      let tReject = -1;
      let seen: DisconnectInfo | null = null;
      client.onDisconnect((i) => {
        if (tDisconnect >= 0) return;
        seen = i;
        tDisconnect = Date.now() - t0;
        order.push('disconnect');
      });

      await client.start();
      const session = await client.createSession({ cwd: process.cwd() });
      await client.prompt(session.sessionId, [{ type: 'text', text: 'hello' }]).then(
        () => {
          order.push('prompt-resolved');
        },
        () => {
          if (tReject >= 0) return;
          tReject = Date.now() - t0;
          order.push('prompt-rejected');
        }
      );

      console.log(
        `[#1020 ordering] disconnect t=${tDisconnect}ms -> prompt-rejected t=${tReject}ms ` +
          `(gap ${tReject - tDisconnect}ms) order=${order.join(' -> ')}`
      );

      expect(order).toEqual(['disconnect', 'prompt-rejected']);
      // Same tick: the two are separated only by a microtask, never by a timer.
      expect(tReject - tDisconnect).toBeLessThan(50);
      expect(seen).not.toBeNull();
      expect(seen!.exitCode).toBeNull();
      expect(seen!.signal).toBeNull();
      expect(seen!.unexpectedDuringPrompt).toBe(true);

      const pid = (child as unknown as ChildProcess).pid!;
      expect(isProcessAlive(pid)).toBe(true);
      process.kill(pid, 'SIGKILL');
    },
    20000
  );
});
