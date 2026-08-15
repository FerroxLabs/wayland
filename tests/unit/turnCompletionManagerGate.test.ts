/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #838 - which turn endings are allowed to raise a completion notification.
 *
 * `turnEndOutcome.test.ts` pins what each transport reports. This pins the other
 * half: only a clean end of turn reaches ConversationTurnCompletionService.
 *
 * That gate is the whole reason the issue was not fixed the obvious way. A
 * notify built from a failed turn carries the default `state: 'ai_waiting_input'`,
 * and WorkflowSessionService reads that as a step that finished - so it marks a
 * FAILED step done and advances an AUTO run. Today those runs stall until the
 * 30-minute watchdog parks them, which is the safe outcome; Sean's call was to
 * keep that and emit nothing on error, abort and disconnect.
 *
 * Gemini is the one that carries its whole gate here rather than in a transport:
 * it runs in a fork worker that emits its own `start`, so the turn state is
 * tracked on the manager instead of being threaded through a socket.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNotify = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: {
    getInstance: () => ({ notifyPotentialCompletion: mockNotify }),
  },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      isPackaged: () => false,
      getAppPath: () => null,
      getDataDir: () => '/tmp',
      getHomeDir: () => '/tmp',
      getTempDir: () => '/tmp',
      needsCliSafeSymlinks: () => false,
    },
    worker: {
      fork: vi.fn(() => ({ on: vi.fn().mockReturnThis(), postMessage: vi.fn(), kill: vi.fn() })),
    },
  }),
}));

vi.mock('../../src/process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn(() => ({})),
}));

import NanoBotAgentManager from '../../src/process/task/NanoBotAgentManager';
import OpenClawAgentManager from '../../src/process/task/OpenClawAgentManager';
import RemoteAgentManager from '../../src/process/task/RemoteAgentManager';
import { GeminiAgentManager } from '../../src/process/task/GeminiAgentManager';

/** Minimal `this` for a manager method - these gates read very little state. */
function managerStub(extra: Record<string, unknown> = {}) {
  return {
    conversation_id: 'conv-1',
    workspace: '/tmp/ws',
    status: 'finished',
    getConfirmations: () => [],
    ...extra,
  };
}

type TurnEndHandler = (outcome: 'ok' | 'aborted' | 'error') => void;

const GATEWAY_MANAGERS = [
  { name: 'NanoBotAgentManager', proto: NanoBotAgentManager.prototype },
  { name: 'OpenClawAgentManager', proto: OpenClawAgentManager.prototype },
  { name: 'RemoteAgentManager', proto: RemoteAgentManager.prototype },
] as const;

describe.each(GATEWAY_MANAGERS)('$name only notifies on a clean turn (#838)', ({ proto }) => {
  const handleTurnEnd = (proto as unknown as { handleTurnEnd: TurnEndHandler }).handleTurnEnd;

  beforeEach(() => mockNotify.mockClear());

  it('notifies when the turn ended cleanly', () => {
    handleTurnEnd.call(managerStub(), 'ok');
    expect(mockNotify).toHaveBeenCalledTimes(1);
  });

  it('stays silent when the turn errored', () => {
    handleTurnEnd.call(managerStub(), 'error');
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('stays silent when the user aborted the turn', () => {
    handleTurnEnd.call(managerStub(), 'aborted');
    expect(mockNotify).not.toHaveBeenCalled();
  });
});

describe('GeminiAgentManager only notifies on a clean turn (#838)', () => {
  const notifyIfClean = (GeminiAgentManager.prototype as unknown as { notifyTurnCompletionIfClean: () => void })
    .notifyTurnCompletionIfClean;

  const geminiStub = (turnActive: boolean, turnFailed: boolean) =>
    managerStub({ turnActive, turnFailed, model: { useModel: 'gemini-2.5-pro' } });

  beforeEach(() => mockNotify.mockClear());

  it('notifies when a turn was in flight and did not fail', () => {
    notifyIfClean.call(geminiStub(true, false));
    expect(mockNotify).toHaveBeenCalledTimes(1);
  });

  it('stays silent when the turn errored', () => {
    notifyIfClean.call(geminiStub(true, true));
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('stays silent when no turn was in flight', () => {
    // A `finish` outside any turn - the worker-side analogue of a socket drop.
    notifyIfClean.call(geminiStub(false, false));
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('clears the turn so a repeated finish cannot notify twice', () => {
    const stub = geminiStub(true, false);
    notifyIfClean.call(stub);
    notifyIfClean.call(stub);
    expect(mockNotify).toHaveBeenCalledTimes(1);
  });

  it('marks the turn failed when the user presses Stop', async () => {
    const stub = managerStub({
      turnActive: true,
      turnFailed: false,
      postMessagePromise: vi.fn().mockResolvedValue(undefined),
      injectHistoryFromDatabase: vi.fn().mockResolvedValue(undefined),
    });

    await GeminiAgentManager.prototype.stop.call(stub as unknown as GeminiAgentManager);

    expect(stub.turnFailed).toBe(true);
    notifyIfClean.call(stub);
    expect(mockNotify).not.toHaveBeenCalled();
  });
});
