/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { ConversationChannelCleanupCoordinator } from '@/process/channels/core/ConversationChannelCleanup';
import type { IConversationChannelCleanupIntent } from '@/process/services/database/types';

function durableStore() {
  let intent: IConversationChannelCleanupIntent | null = {
    conversationId: 'conv-crash-window',
    source: 'telegram',
    sessionIds: ['session-crash-window'],
    createdAt: 1000,
    attemptCount: 0,
    lastAttemptAt: null,
  };
  return {
    read: () => intent,
    db: {
      getConversationChannelCleanupIntent: vi.fn(() => ({ success: true, data: intent })),
      getConversationChannelCleanupIntents: vi.fn(() => ({ success: true, data: intent ? [intent] : [] })),
      recordConversationChannelCleanupAttempt: vi.fn(() => {
        if (!intent) return { success: true, data: false };
        intent = { ...intent, attemptCount: intent.attemptCount + 1, lastAttemptAt: Date.now() };
        return { success: true, data: true };
      }),
      retireConversationChannelCleanupIntent: vi.fn(() => {
        const existed = intent !== null;
        intent = null;
        return { success: true, data: existed };
      }),
    },
  };
}

describe('ConversationChannelCleanupCoordinator', () => {
  it('retains a thrown cleanup and eventually retires it through the scheduled retry', async () => {
    const store = durableStore();
    const scheduled: Array<() => void> = [];
    const clearContext = vi.fn().mockRejectedValueOnce(new Error('context backend unavailable')).mockResolvedValue();
    const clearSessionById = vi.fn(async () => true);
    const coordinator = new ConversationChannelCleanupCoordinator({
      getDatabase: async () => store.db,
      clearContext,
      clearSessionById,
      schedule: ((callback: () => void) => {
        scheduled.push(callback);
        return 1 as unknown as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout,
      cancel: vi.fn(),
    });

    await expect(coordinator.cleanupConversation('conv-crash-window')).rejects.toThrow('context backend unavailable');
    expect(store.read()).not.toBeNull();
    expect(scheduled).toHaveLength(1);

    scheduled.shift()?.();
    await vi.waitFor(() => expect(store.read()).toBeNull());
    expect(clearContext).toHaveBeenCalledTimes(2);
    expect(clearSessionById).toHaveBeenCalledOnce();
    expect(store.db.retireConversationChannelCleanupIntent).toHaveBeenCalledOnce();
  });

  it('replays the crash window after restart and repeats partial cleanup idempotently', async () => {
    const store = durableStore();
    const clearContext = vi.fn(async () => undefined);
    const firstSessionClear = vi.fn(async () => {
      throw new Error('crash after external clear');
    });
    const scheduled: Array<() => void> = [];
    const beforeCrash = new ConversationChannelCleanupCoordinator({
      getDatabase: async () => store.db,
      clearContext,
      clearSessionById: firstSessionClear,
      schedule: ((callback: () => void) => {
        scheduled.push(callback);
        return 1 as unknown as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout,
      cancel: vi.fn(),
    });

    await expect(beforeCrash.cleanupConversation('conv-crash-window')).rejects.toThrow('crash after external clear');
    expect(store.read()).not.toBeNull();
    beforeCrash.stop();

    const afterRestartSessionClear = vi.fn(async () => true);
    const afterRestart = new ConversationChannelCleanupCoordinator({
      getDatabase: async () => store.db,
      clearContext,
      clearSessionById: afterRestartSessionClear,
      schedule: ((callback: () => void) => {
        scheduled.push(callback);
        return 2 as unknown as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout,
      cancel: vi.fn(),
    });
    await afterRestart.start();

    expect(clearContext).toHaveBeenCalledTimes(2);
    expect(afterRestartSessionClear).toHaveBeenCalledWith('session-crash-window');
    expect(store.read()).toBeNull();
  });
});
