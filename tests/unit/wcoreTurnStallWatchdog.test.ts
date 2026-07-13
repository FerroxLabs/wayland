/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #746 - the wcore agent had NO turn watchdog. Only *startup* timeouts existed, so if
 * the engine stopped emitting frames mid-turn (no `stream_end`, no `error`) the desktop
 * span "working" forever - the report is a 24h+ silent spin on a read-only task, with the
 * agent idling after a completed tool step and never self-detecting the stall.
 *
 * The watchdog bounds IDLE time only: every turn frame resets it, and it is PAUSED for a
 * tool's whole request->result window so a legitimately long build (or a human taking
 * their time over an approval) is never falsely cancelled. On expiry the turn is halted
 * honestly - the engine is told to stop and a terminal `error` frame is emitted, which the
 * renderer treats as end-of-turn (clearing every running contributor) so the chat is
 * usable again instead of stuck on a dead spinner.
 *
 * Also covers #774's state half: an `error` frame must terminalize the agent-side turn
 * (it previously left `activeMsgId` dangling), so a failed turn can't later be
 * "stall-halted" by a timer that outlived it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({ spawn: vi.fn() }));
vi.mock('@process/agent/wcore/binaryResolver', () => ({ resolveWCoreBinary: () => '/fake/wcore' }));
vi.mock('@process/agent/wcore/envBuilder', () => ({
  buildEngineSpawnEnv: () => ({}),
  buildSpawnConfig: () => ({ args: [], env: {}, projectConfig: undefined, resolvedMaxTokens: undefined }),
  planVaultPassphraseDelivery: () => ({ mode: 'env', env: {}, stdio: ['pipe', 'pipe', 'pipe'] }),
}));
vi.mock('@process/secrets', () => ({
  VAULT_PASSPHRASE_CHILD_FD: 3,
  resolveSpawnVaultPassphrase: () => Promise.resolve(null),
}));
vi.mock('@process/agent/wcore/profilePaths', () => ({
  resolveActiveConfigDir: () => Promise.resolve('/fake/home'),
}));
vi.mock('@process/agent/wcore/toolKeyStore', () => ({
  getToolKeyStore: () => Promise.resolve({ collectForwardedEnv: () => ({}) }),
}));
vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({
  hydrateModelForSpawn: (m: unknown) => Promise.resolve(m),
  resolveModelSecretsForSpawn: () => Promise.resolve(null),
}));
vi.mock('@process/agent/acp/utils', () => ({ killChild: vi.fn().mockResolvedValue(undefined) }));

import { WCoreAgent, resolveTurnStallTimeoutMs } from '@process/agent/wcore';
import type { WCoreAgentOptions } from '@process/agent/wcore';
import type { WCoreEvent } from '@process/agent/wcore/protocol';

type StreamEvent = { type: string; data: unknown; msg_id: string };

const TIMEOUT_MS = 600_000; // production default: 10 min of zero agent progress
const MSG = 'msg-1';

function makeAgent(onStreamEvent: (event: StreamEvent) => void): WCoreAgent {
  const options: WCoreAgentOptions = {
    workspace: '/ws',
    model: { name: 'test', useModel: 'test-model', platform: 'openai', baseUrl: '' } as WCoreAgentOptions['model'],
    onStreamEvent,
  };
  return new WCoreAgent(options);
}

/** Drive the private event dispatcher directly (no engine process needed). */
function dispatch(agent: WCoreAgent, event: WCoreEvent | Record<string, unknown>): void {
  (agent as unknown as { handleEvent: (event: WCoreEvent) => void }).handleEvent(event as WCoreEvent);
}

/** Resolve the agent's readyPromise so send() can proceed, then start a turn. */
async function startTurn(agent: WCoreAgent): Promise<void> {
  dispatch(agent, { type: 'ready', session_id: 's1', capabilities: {} });
  await agent.send('trace the auth flow', MSG);
}

const stallErrors = (spy: ReturnType<typeof vi.fn>): StreamEvent[] =>
  spy.mock.calls.map((c) => c[0] as StreamEvent).filter((e) => e.type === 'error');

describe('WCoreAgent turn stall watchdog (#746)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('halts a turn that makes no progress, instead of spinning forever', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);
    const stopSpy = vi.spyOn(agent, 'stop');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startTurn(agent);
    // Engine goes silent: no frames at all (the 24h-spin scenario).
    vi.advanceTimersByTime(TIMEOUT_MS + 1);

    const errors = stallErrors(onStreamEvent);
    expect(errors).toHaveLength(1);
    expect(String(errors[0].data)).toContain('stopped making progress');
    expect(errors[0].msg_id).toBe(MSG);
    // The engine-side turn is halted too, so it stops burning.
    expect(stopSpy).toHaveBeenCalled();
  });

  it('does NOT fire while the agent is actively producing (progress resets the deadline)', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);

    await startTurn(agent);
    // Stream tokens steadily for 5x the idle budget — an active turn must never be cut.
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(TIMEOUT_MS / 2);
      dispatch(agent, { type: 'text_delta', text: 'chunk', msg_id: MSG });
    }

    expect(stallErrors(onStreamEvent)).toHaveLength(0);
  });

  it('is PAUSED across a tool window, so a long build / slow human approval is not cancelled', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startTurn(agent);
    dispatch(agent, {
      type: 'tool_request',
      msg_id: MSG,
      call_id: 'c1',
      tool: { name: 'bash', description: 'Execute: make build' },
    });

    // A 100-minute build (or a human pondering the approve/deny card): silent, but NOT
    // agent inactivity. The watchdog must stay paused.
    vi.advanceTimersByTime(TIMEOUT_MS * 10);
    expect(stallErrors(onStreamEvent)).toHaveLength(0);

    // Tool finishes → the agent owes us progress again. Now idling IS a stall.
    dispatch(agent, {
      type: 'tool_result',
      msg_id: MSG,
      call_id: 'c1',
      tool_name: 'bash',
      status: 'success',
      output: 'ok',
      output_type: 'text',
    });
    vi.advanceTimersByTime(TIMEOUT_MS + 1);
    expect(stallErrors(onStreamEvent)).toHaveLength(1);
  });

  it('cannot be kept alive by engine heartbeats (pong carries no msg_id)', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startTurn(agent);
    // The engine keeps ponging while the TURN is dead. A naive "reset on any frame"
    // watchdog would never fire — this is why the reset is gated on msg_id.
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(TIMEOUT_MS / 2);
      dispatch(agent, { type: 'pong' });
    }

    expect(stallErrors(onStreamEvent)).toHaveLength(1);
  });

  // The HITL escalation path does NOT go through tool_request/tool_result: WCoreManager
  // (#264) raises `approval_required` when the engine's own --auto-approve self-resolve
  // fails, and waits for the user to answer the Confirming card. These frames carry no
  // msg_id, so without an explicit pause the watchdog would keep ticking and kill the
  // turn while the human was still deciding — a false cancel of live work.
  it('is PAUSED across an approval_required HITL wait (human deliberating is not a stall)', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startTurn(agent);
    dispatch(agent, {
      type: 'approval_required',
      call_id: 'c1',
      resume_token: 'rt-1',
      reason: 'needs approval',
      context: 'rm -rf',
    });

    // The user stares at the approve/deny card for an hour. Must NOT be cancelled.
    vi.advanceTimersByTime(TIMEOUT_MS * 6);
    expect(stallErrors(onStreamEvent)).toHaveLength(0);

    // They answer → the agent owes us progress again → idling now IS a stall.
    dispatch(agent, { type: 'approval_resume', resume_token: 'rt-1', approved: true });
    vi.advanceTimersByTime(TIMEOUT_MS + 1);
    expect(stallErrors(onStreamEvent)).toHaveLength(1);
  });

  // In INTERACTIVE mode the engine emits a token-LESS `approval_required` as a parallel
  // signal on every ordinary exec/mcp approval (WCoreManager #390: "a normal exec/mcp
  // approval legitimately carries no resume token"). That wait is already covered by the
  // call's tool_request/tool_result pause, and the user's answer returns via
  // approveTool()/tool_approve — NOT approval_resume. So pausing on it would add a reason
  // nothing can ever resume, wedging the watchdog paused for the rest of the turn and
  // silently restoring the #746 hang. The watchdog must still fire after the tool finishes.
  it('is NOT wedged by a token-less approval_required (the ordinary interactive approval)', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startTurn(agent);
    dispatch(agent, {
      type: 'tool_request',
      msg_id: MSG,
      call_id: 'c1',
      tool: { name: 'bash', description: 'Execute: rm -rf build' },
    });
    // The engine's parallel signal for a normal approval — no resume_token.
    dispatch(agent, { type: 'approval_required', call_id: 'c1', reason: 'destructive_operation', context: '' });

    // User approves via the Confirming card → tool runs → result. No approval_resume ever
    // arrives, so an `approval:undefined` reason would never be cleared.
    dispatch(agent, {
      type: 'tool_result',
      msg_id: MSG,
      call_id: 'c1',
      tool_name: 'bash',
      status: 'success',
      output: 'ok',
      output_type: 'text',
    });

    // The agent now owes us progress. If the watchdog were wedged paused, this would
    // never fire and the 24h hang would be back.
    vi.advanceTimersByTime(TIMEOUT_MS + 1);
    expect(stallErrors(onStreamEvent)).toHaveLength(1);
  });

  it('is PAUSED across a suspend/resume window (out-of-band engine wait)', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startTurn(agent);
    dispatch(agent, { type: 'suspend', reason: 'awaiting external', resume_token: 'rt-2' });

    vi.advanceTimersByTime(TIMEOUT_MS * 6);
    expect(stallErrors(onStreamEvent)).toHaveLength(0);

    dispatch(agent, { type: 'approval_resume', resume_token: 'rt-2', approved: true });
    vi.advanceTimersByTime(TIMEOUT_MS + 1);
    expect(stallErrors(onStreamEvent)).toHaveLength(1);
  });

  it('is disarmed by stream_end (a completed turn is never stall-halted)', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);

    await startTurn(agent);
    dispatch(agent, { type: 'stream_end', msg_id: MSG });
    vi.advanceTimersByTime(TIMEOUT_MS * 3);

    expect(stallErrors(onStreamEvent)).toHaveLength(0);
  });

  it('is disarmed by an error frame, which also terminalizes the turn (#774)', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);

    await startTurn(agent);
    dispatch(agent, { type: 'error', msg_id: MSG, error: { message: 'Connection error' } });
    expect(stallErrors(onStreamEvent)).toHaveLength(1); // the engine's own error

    // A failed turn must NOT later be "stall-halted" by a timer that outlived it.
    vi.advanceTimersByTime(TIMEOUT_MS * 3);
    expect(stallErrors(onStreamEvent)).toHaveLength(1);
  });

  it('is disarmed by kill() (no bogus stall error against a dead agent)', async () => {
    const onStreamEvent = vi.fn<(e: StreamEvent) => void>();
    const agent = makeAgent(onStreamEvent);

    await startTurn(agent);
    await agent.kill();
    vi.advanceTimersByTime(TIMEOUT_MS * 3);

    expect(stallErrors(onStreamEvent)).toHaveLength(0);
  });
});

describe('resolveTurnStallTimeoutMs (#746)', () => {
  it('defaults to 10 minutes of zero progress', () => {
    expect(resolveTurnStallTimeoutMs({})).toBe(600_000);
  });

  it('honours an explicit override', () => {
    expect(resolveTurnStallTimeoutMs({ WAYLAND_WCORE_TURN_STALL_TIMEOUT_MS: '900000' })).toBe(900_000);
  });

  it('floors a uselessly-low value rather than trusting it', () => {
    expect(resolveTurnStallTimeoutMs({ WAYLAND_WCORE_TURN_STALL_TIMEOUT_MS: '5' })).toBe(60_000);
  });

  it('clamps past the 32-bit setTimeout ceiling (a larger value would fire immediately)', () => {
    expect(resolveTurnStallTimeoutMs({ WAYLAND_WCORE_TURN_STALL_TIMEOUT_MS: '99999999999' })).toBe(2_147_483_647);
  });

  it('ignores garbage and falls back to the default', () => {
    expect(resolveTurnStallTimeoutMs({ WAYLAND_WCORE_TURN_STALL_TIMEOUT_MS: 'soon' })).toBe(600_000);
    expect(resolveTurnStallTimeoutMs({ WAYLAND_WCORE_TURN_STALL_TIMEOUT_MS: '-1' })).toBe(600_000);
  });
});
