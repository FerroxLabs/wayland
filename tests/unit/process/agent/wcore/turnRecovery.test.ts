/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { WCoreAgent, type WCoreAgentOptions } from '@/process/agent/wcore';
import type { WCoreCommand, WCoreEvent, WCoreRecoverySnapshot } from '@/process/agent/wcore/protocol';

const SESSION = '11161116111611161116111611161117';

function snapshot(requestId: string, pending = true): WCoreRecoverySnapshot {
  return {
    type: 'session_recovery_snapshot',
    recovery_version: 1,
    request_id: requestId,
    session_id: SESSION,
    cursor: { journal_sequence: 17, journal_digest: '0'.repeat(64) },
    state_digest: '1'.repeat(64),
    lifecycle: pending ? 'awaiting_approval' : 'ready',
    ...(pending
      ? {
          pending_turn: {
            turn_id: 'turn-1',
            msg_id: 'message-1',
            lifecycle: 'awaiting_approval' as const,
            pending_call_id: 'call-1',
            reconcile_reason: 'approval_expired' as const,
          },
        }
      : {}),
    budget: { tokens_used: 1, cost_used_usd: 0 },
  };
}

function harness() {
  const commands: WCoreCommand[] = [];
  const emitted: Array<{ type: string; data?: unknown; msg_id?: string }> = [];
  const agent = new WCoreAgent({
    workspace: '/tmp/wcore-recovery-test',
    model: {} as never,
    onStreamEvent: (event) => emitted.push(event),
  } as WCoreAgentOptions);
  const internal = agent as unknown as {
    readyPromise: Promise<void>;
    ready: boolean;
    recoverySupported: boolean;
    sessionId: string;
    transportAlive: boolean;
    writeCommand: (command: WCoreCommand) => boolean;
    handleEvent: (event: WCoreEvent) => void;
  };
  internal.readyPromise = Promise.resolve();
  internal.ready = true;
  internal.recoverySupported = true;
  internal.sessionId = SESSION;
  internal.transportAlive = true;
  internal.writeCommand = (command) => {
    commands.push(command);
    return true;
  };
  return { agent, commands, emitted, feed: internal.handleEvent.bind(internal) };
}

describe('WCoreAgent interrupted-turn recovery', () => {
  it('correlates a head snapshot and never exposes its authority fields to the renderer view', async () => {
    const h = harness();
    const pending = h.agent.getTurnRecovery();
    await vi.waitFor(() => expect(h.commands).toHaveLength(1));
    const command = h.commands[0] as Extract<WCoreCommand, { type: 'session_resync' }>;
    expect(command).toMatchObject({ type: 'session_resync', recovery_version: 1, session_id: SESSION });
    expect(command).not.toHaveProperty('after');

    h.feed(snapshot(command.request_id));
    await expect(pending).resolves.toEqual({
      state: 'interrupted',
      lifecycle: 'awaiting_approval',
      reason: 'approval_expired',
      canAbandon: true,
    });
  });

  it('withholds the abandon action when an external outcome is unknown', async () => {
    const h = harness();
    const pending = h.agent.getTurnRecovery();
    await vi.waitFor(() => expect(h.commands).toHaveLength(1));
    const command = h.commands[0] as Extract<WCoreCommand, { type: 'session_resync' }>;
    const unknown = snapshot(command.request_id);
    unknown.lifecycle = 'suspended';
    unknown.pending_turn!.lifecycle = 'suspended';
    unknown.pending_turn!.reconcile_reason = 'provider_outcome_unknown';
    h.feed(unknown);

    await expect(pending).resolves.toMatchObject({ state: 'interrupted', canAbandon: false });
  });

  it('requires a fresh no-pending snapshot after abandon before reporting healthy', async () => {
    const h = harness();
    const action = h.agent.abandonInterruptedTurn();
    await vi.waitFor(() => expect(h.commands).toHaveLength(1));
    const inspect = h.commands[0] as Extract<WCoreCommand, { type: 'session_resync' }>;
    h.feed(snapshot(inspect.request_id));

    await vi.waitFor(() => expect(h.commands).toHaveLength(2));
    const abandon = h.commands[1] as Extract<WCoreCommand, { type: 'resume_turn' }>;
    expect(abandon).toMatchObject({
      type: 'resume_turn',
      recovery_version: 1,
      session_id: SESSION,
      turn_id: 'turn-1',
      action: 'abandon',
    });
    h.feed({ type: 'stream_end', msg_id: abandon.request_id, finish_reason: 'stop' });

    await vi.waitFor(() => expect(h.commands).toHaveLength(3));
    const verify = h.commands[2] as Extract<WCoreCommand, { type: 'session_resync' }>;
    h.feed(snapshot(verify.request_id, false));

    await expect(action).resolves.toEqual({ state: 'healthy', lifecycle: 'ready', canAbandon: false });
    expect(h.emitted).toContainEqual(
      expect.objectContaining({
        type: 'tool_group',
        msg_id: 'message-1',
        data: [expect.objectContaining({ callId: 'call-1', status: 'Canceled' })],
      })
    );
  });

  it('does not trust a cancelled lifecycle acknowledgment when the fresh snapshot is still pending', async () => {
    const h = harness();
    const action = h.agent.abandonInterruptedTurn();
    await vi.waitFor(() => expect(h.commands).toHaveLength(1));
    const inspect = h.commands[0] as Extract<WCoreCommand, { type: 'session_resync' }>;
    h.feed(snapshot(inspect.request_id));
    await vi.waitFor(() => expect(h.commands).toHaveLength(2));
    const abandon = h.commands[1] as Extract<WCoreCommand, { type: 'resume_turn' }>;
    h.feed({
      type: 'turn_recovery_lifecycle',
      recovery_version: 1,
      session_id: SESSION,
      turn_id: 'turn-1',
      cursor: { journal_sequence: 20, journal_digest: '2'.repeat(64) },
      lifecycle: 'cancelled',
    });
    h.feed({ type: 'stream_end', msg_id: abandon.request_id, finish_reason: 'stop' });
    await vi.waitFor(() => expect(h.commands).toHaveLength(3));
    const verify = h.commands[2] as Extract<WCoreCommand, { type: 'session_resync' }>;
    h.feed(snapshot(verify.request_id));

    await expect(action).resolves.toEqual({ state: 'unavailable', reason: 'verification_failed', canAbandon: false });
  });

  it('does not send recovery commands to a producer without the negotiated capabilities', async () => {
    const h = harness();
    (h.agent as unknown as { recoverySupported: boolean }).recoverySupported = false;
    await expect(h.agent.getTurnRecovery()).resolves.toEqual({ state: 'unsupported', canAbandon: false });
    expect(h.commands).toEqual([]);
  });
});
