/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

const setProcessing = vi.hoisted(() => vi.fn());
const addMessage = vi.hoisted(() => vi.fn());
vi.mock('@process/services/cron/CronBusyGuard', () => ({ cronBusyGuard: { setProcessing } }));
vi.mock('@process/services/cost/BudgetController', () => ({ getBudgetController: () => undefined }));
vi.mock('@process/utils/message', () => ({ addMessage, addOrUpdateMessage: vi.fn() }));

import { WCoreManager } from '@/process/task/WCoreManager';
import type { WCoreTurnRecoveryView } from '@/process/agent/wcore/protocol';

function managerWith(recovery: WCoreTurnRecoveryView) {
  const agent = {
    isAlive: true,
    getTurnRecovery: vi.fn().mockResolvedValue(recovery),
    abandonInterruptedTurn: vi.fn().mockResolvedValue(recovery),
  };
  const manager = Object.create(WCoreManager.prototype) as WCoreManager;
  Object.assign(manager as unknown as Record<string, unknown>, {
    agent,
    startError: null,
    recoveryQueue: Promise.resolve(),
    ensureBootstrap: vi.fn().mockResolvedValue(undefined),
    conversation_id: 'conversation-1',
    confirmations: [{ id: 'stale' }],
    pendingApprovalTokens: new Map([['call-1', 'token-1']]),
    gatedToolCallIds: new Set(['call-1']),
    currentMsgId: 'old-message',
    currentMsgContent: 'old content',
    status: 'running',
  });
  return { manager, agent };
}

describe('WCoreManager interrupted-turn admission', () => {
  it('restarts a dead engine only after its tree and profile lease are released', async () => {
    const { manager, agent: replacement } = managerWith({ state: 'healthy', canAbandon: false });
    const events: string[] = [];
    const stale = {
      isAlive: false,
      kill: vi.fn(async () => {
        events.push('tree-stopped');
      }),
    };
    const state = manager as unknown as Record<string, unknown>;
    state.agent = stale;
    state.releaseProfileLease = vi.fn(async () => {
      events.push('lease-released');
    });
    state.ensureBootstrap = vi.fn(async () => {
      if (!state.agent && state.startError) {
        events.push('restart');
        state.agent = replacement;
        state.startError = null;
      }
    });

    await expect(manager.getTurnRecovery()).resolves.toEqual({ state: 'healthy', canAbandon: false });
    expect(events).toEqual(['tree-stopped', 'lease-released', 'restart']);
    expect(replacement.getTurnRecovery).toHaveBeenCalledOnce();
  });

  it('does not respawn or release the profile when dead-engine tree shutdown fails', async () => {
    const { manager } = managerWith({ state: 'healthy', canAbandon: false });
    const state = manager as unknown as Record<string, unknown>;
    const stale = { isAlive: false, kill: vi.fn().mockRejectedValue(new Error('tree shutdown unproved')) };
    const release = vi.fn();
    state.agent = stale;
    state.releaseProfileLease = release;

    await expect(manager.getTurnRecovery()).rejects.toThrow('tree shutdown unproved');
    expect(release).not.toHaveBeenCalled();
    expect(state.agent).toBe(stale);
  });

  it('blocks an ordinary send while a recoverable interrupted turn exists', async () => {
    const { manager } = managerWith({
      state: 'interrupted',
      lifecycle: 'awaiting_approval',
      reason: 'approval_expired',
      canAbandon: true,
    });

    await expect(
      (manager as unknown as { assertNoInterruptedTurn: () => Promise<void> }).assertNoInterruptedTurn()
    ).rejects.toThrow('End it before sending');
  });

  it('checks recovery before persisting a new user message', async () => {
    const { manager } = managerWith({
      state: 'interrupted',
      lifecycle: 'awaiting_approval',
      reason: 'approval_expired',
      canAbandon: true,
    });

    await expect(manager.sendMessage({ content: 'new turn', msg_id: 'new-message' })).rejects.toThrow(
      'End it before sending'
    );
    expect(addMessage).not.toHaveBeenCalled();
  });

  it('also blocks when Core cannot prove a trustworthy recovery view', async () => {
    const { manager } = managerWith({ state: 'unavailable', reason: 'journal_corrupt', canAbandon: false });

    await expect(
      (manager as unknown as { assertNoInterruptedTurn: () => Promise<void> }).assertNoInterruptedTurn()
    ).rejects.toThrow('could not verify');
  });

  it('leaves unsupported legacy producers on their existing send path', async () => {
    const { manager } = managerWith({ state: 'unsupported', canAbandon: false });
    await expect(
      (manager as unknown as { assertNoInterruptedTurn: () => Promise<void> }).assertNoInterruptedTurn()
    ).resolves.toBeUndefined();
  });

  it('clears stale manager activity only after Core returns a verified healthy state', async () => {
    const { manager, agent } = managerWith({ state: 'healthy', lifecycle: 'ready', canAbandon: false });

    await expect(manager.abandonInterruptedTurn()).resolves.toEqual({
      state: 'healthy',
      lifecycle: 'ready',
      canAbandon: false,
    });
    expect(agent.abandonInterruptedTurn).toHaveBeenCalledOnce();
    expect((manager as unknown as { currentMsgId: string | null }).currentMsgId).toBeNull();
    expect((manager as unknown as { confirmations: unknown[] }).confirmations).toEqual([]);
    expect((manager as unknown as { pendingApprovalTokens: Map<string, string> }).pendingApprovalTokens.size).toBe(0);
    expect(setProcessing).toHaveBeenCalledWith('conversation-1', false);
  });
});
