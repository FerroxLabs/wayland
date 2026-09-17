/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The masterclass TIDE brief on 0.13.0: TVControl `batch_run` over 56 symbols
 * ran >300 s with no streamed session/update. The prompt timer was an IDLE timer
 * reset only by streamed updates, so it cancelled the turn at exactly +300 s -
 * nothing in the Desktop log, no notice the reopened chat could show, the brief
 * never written. Fuigo sends `tool_call` pending before an MCP call and ONE
 * terminal update after it, with nothing in between.
 *
 * Now a tool call in flight is progress (the idle timer stands down), a much
 * longer per-tool ceiling is the hang protection, and a stop is logged and said.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PromptExecutor, type PromptHost } from '@process/acp/session/PromptExecutor';
import type { PromptContent } from '@process/acp/types';

const CONTENT = [{ type: 'text', text: 'run the brief' }] as unknown as PromptContent;
const IDLE_MS = 300_000;
const TOOL_MS = 30 * 60_000;
const TOOL = 'sess-1:tc-batch';

function createHost() {
  let settle: (value: { stopReason: string }) => void = () => {};
  const prompt = vi.fn(
    () =>
      new Promise<{ stopReason: string }>((resolve) => {
        settle = resolve;
      })
  );
  // The engine answers session/cancel by ending the prompt with stopReason cancelled.
  const cancel = vi.fn(async () => settle({ stopReason: 'cancelled' }));
  const client = { prompt, cancel };

  const host = {
    status: 'active',
    lifecycle: {
      client,
      sessionId: 'sess-1',
      reassertConfig: vi.fn().mockResolvedValue(undefined),
      setAuthPendingForPrompt: vi.fn(),
      teardown: vi.fn().mockResolvedValue(undefined),
    },
    messageTranslator: { onTurnStart: vi.fn(), onTurnEnd: vi.fn() },
    authNegotiator: { buildAuthRequiredData: vi.fn().mockReturnValue({}) },
    callbacks: { onSignal: vi.fn(), onContextUsage: vi.fn() },
    metrics: { recordError: vi.fn() },
    agentConfig: { agentBackend: 'fuigo', agentId: 'conv-96b5c811' },
    setStatus: vi.fn((s: string) => {
      host.status = s;
    }),
    enterError: vi.fn(),
  } as unknown as PromptHost & { status: string };

  return { host, client, finishPrompt: () => settle({ stopReason: 'end_turn' }) };
}

function signals(host: PromptHost) {
  return (host.callbacks.onSignal as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
}

describe('PromptExecutor - long tool calls vs the prompt timeout', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Wrapped in an object: an async function returning the promise itself would adopt it and wait for the turn. */
  async function startTurn(executor: PromptExecutor): Promise<{ turn: Promise<void> }> {
    const turn = executor.execute(CONTENT);
    // Past `await reassertConfig()`, so the prompt is in flight and the idle timer armed.
    await vi.advanceTimersByTimeAsync(0);
    return { turn };
  }

  it('does not cancel a tool call that runs 330 s with no updates', async () => {
    const { host, client, finishPrompt } = createHost();
    const executor = new PromptExecutor(host, IDLE_MS);
    const { turn } = await startTurn(executor);

    executor.trackToolCall(TOOL, 'batch_run', 'pending');
    await vi.advanceTimersByTimeAsync(330_000);

    expect(client.cancel).not.toHaveBeenCalled();
    expect(signals(host).some((s) => s.type === 'turn_stopped')).toBe(false);

    executor.trackToolCall(TOOL, undefined, 'completed');
    finishPrompt();
    await turn;
    expect(signals(host)).toContainEqual({ type: 'turn_finished' });
  });

  it('still stops a silent turn with no tool running, visibly and in the log', async () => {
    const { host, client } = createHost();
    const executor = new PromptExecutor(host, IDLE_MS);
    const { turn } = await startTurn(executor);

    await vi.advanceTimersByTimeAsync(IDLE_MS - 1);
    expect(client.cancel).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(client.cancel).toHaveBeenCalledWith('sess-1');
    expect(signals(host)).toContainEqual({ type: 'turn_stopped', message: 'Stopped: no response for 5 minutes' });
    const line = String(warn.mock.calls.find((c) => String(c[0]).includes('Stopped:'))?.[0]);
    expect(line).toContain('conversation=conv-96b5c811');
    expect(line).toMatch(/turn=[0-9a-f-]{36}/);
    expect(line).toContain('timer=idle');
    expect(line).toContain('elapsed=300s');
    expect(line).toContain('tool=none');
    await turn;
  });

  it('starts a fresh idle window when the last tool returns', async () => {
    const { host, client } = createHost();
    const executor = new PromptExecutor(host, IDLE_MS);
    const { turn } = await startTurn(executor);

    executor.trackToolCall(TOOL, 'batch_run', 'pending');
    await vi.advanceTimersByTimeAsync(400_000);
    executor.trackToolCall(TOOL, undefined, 'completed');

    await vi.advanceTimersByTimeAsync(IDLE_MS - 1);
    expect(client.cancel).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(signals(host)).toContainEqual({ type: 'turn_stopped', message: 'Stopped: no response for 5 minutes' });
    await turn;
  });

  it('keeps the idle timer down while ANY tool is in flight, and through a permission card', async () => {
    const { host, client } = createHost();
    const executor = new PromptExecutor(host, IDLE_MS);
    const { turn } = await startTurn(executor);

    executor.trackToolCall('sess-1:a', 'quote_batch', 'in_progress');
    executor.trackToolCall('child-1:b', 'batch_run', 'pending');
    executor.pauseTimer();
    executor.resumeTimer(); // approved: the tool is still running
    executor.trackToolCall('sess-1:a', undefined, 'completed');
    await vi.advanceTimersByTimeAsync(330_000);

    expect(client.cancel).not.toHaveBeenCalled();
    executor.trackToolCall('child-1:b', undefined, 'failed');
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(client.cancel).toHaveBeenCalledOnce();
    await turn;
  });

  it('stops a tool past its ceiling with a message naming it, and logs which timer fired', async () => {
    const { host, client } = createHost();
    const executor = new PromptExecutor(host, IDLE_MS);
    const { turn } = await startTurn(executor);

    executor.trackToolCall(TOOL, 'batch_run', 'pending');
    await vi.advanceTimersByTimeAsync(TOOL_MS - 1);
    expect(client.cancel).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(client.cancel).toHaveBeenCalledWith('sess-1');
    expect(signals(host)).toContainEqual({
      type: 'turn_stopped',
      message: 'Stopped: batch_run ran longer than 30 minutes',
    });
    const line = String(warn.mock.calls.find((c) => String(c[0]).includes('Stopped:'))?.[0]);
    expect(line).toContain('timer=tool-call');
    expect(line).toContain('limit=1800s');
    expect(line).toContain('elapsed=1800s');
    expect(line).toContain('tool=batch_run');
    await turn;
  });

  it('honours a configured ceiling', async () => {
    const { host } = createHost();
    const executor = new PromptExecutor(host, 10_000, {}, 60_000);
    const { turn } = await startTurn(executor);

    executor.trackToolCall(TOOL, 'sleep_tool', 'pending');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(signals(host)).toContainEqual({
      type: 'turn_stopped',
      message: 'Stopped: sleep_tool ran longer than 1 minute',
    });
    await turn;
  });

  it('ends a timed-out turn through session/cancel, once, as a stop - not an error', async () => {
    const { host, client } = createHost();
    const executor = new PromptExecutor(host, IDLE_MS);
    const { turn } = await startTurn(executor);

    executor.trackToolCall('sess-1:a', 'batch_run', 'pending');
    executor.trackToolCall('sess-1:b', 'quote_batch', 'pending');
    await vi.advanceTimersByTimeAsync(TOOL_MS);
    await turn;

    expect(client.cancel).toHaveBeenCalledOnce();
    expect(host.status).toBe('active');
    expect(host.enterError).not.toHaveBeenCalled();
    expect(signals(host).filter((s) => s.type === 'error')).toEqual([]);
    expect(signals(host).filter((s) => s.type === 'turn_stopped')).toHaveLength(1);
    expect(signals(host)).toContainEqual({ type: 'turn_finished' });

    // The other tool's ceiling and the idle timer died with the turn.
    await vi.advanceTimersByTimeAsync(2 * TOOL_MS);
    expect(client.cancel).toHaveBeenCalledOnce();
    expect(signals(host).filter((s) => s.type === 'turn_stopped')).toHaveLength(1);
  });

  it('ignores tool frames that arrive after the turn is over', async () => {
    const { host, client, finishPrompt } = createHost();
    const executor = new PromptExecutor(host, IDLE_MS);
    const { turn } = await startTurn(executor);
    finishPrompt();
    await turn;

    executor.trackToolCall(TOOL, 'late', 'pending');
    await vi.advanceTimersByTimeAsync(2 * TOOL_MS);
    expect(client.cancel).not.toHaveBeenCalled();
  });
});
