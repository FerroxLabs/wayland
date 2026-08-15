/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * The send-hold gate, asserted through the REAL WCoreSendBox.
 *
 * Same root defect as the activation card: `!ready && !loading` was treated as
 * "the engine is asleep", so a fully configured install whose registry read was
 * merely degraded had every typed message parked in main-process memory instead
 * of dispatched. The held body is replayed on the `ready` EDGE, which such an
 * install may never produce - so the message is not delayed, it is lost.
 *
 * Parking is correct for exactly one state: nothing is configured at all.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProviderReadiness } from '@renderer/hooks/useProviderReadiness';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

const holdSpy = vi.hoisted(() => vi.fn(async () => false));
const pendingSendArgs = vi.hoisted(() => ({ value: [] as { asleep: boolean; ready: boolean }[] }));
vi.mock('@/renderer/hooks/chat/usePendingSendOnWake', () => ({
  usePendingSendOnWake: (params: { asleep: boolean; ready: boolean }) => {
    pendingSendArgs.value.push({ asleep: params.asleep, ready: params.ready });
    return { holdIfAsleep: holdSpy };
  },
}));

const readinessMock = vi.hoisted(() => ({ value: { ready: true, loading: false } as ProviderReadiness }));
vi.mock('@/renderer/hooks/useProviderReadiness', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@renderer/hooks/useProviderReadiness')>();
  return { ...actual, useProviderReadiness: () => readinessMock.value };
});

// Everything below is scaffolding for the one hook argument under test.
vi.mock('@/renderer/components/chat/sendbox', () => ({ default: () => <div data-testid='send-box' /> }));
vi.mock('@/renderer/components/chat/ThoughtDisplay', () => ({ default: () => null }));
vi.mock('@/renderer/components/chat/CommandQueuePanel', () => ({ default: () => null }));
vi.mock('@/renderer/components/agent/AgentModeSelector', () => ({ default: () => null }));
vi.mock('@/renderer/components/agent/ContextUsageIndicator', () => ({ default: () => null }));
vi.mock('@/renderer/components/media/FileAttachButton', () => ({ default: () => null }));
vi.mock('@/renderer/components/media/FilePreview', () => ({ default: () => null }));
vi.mock('@/renderer/components/media/HorizontalFileList', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview', () => ({
  usePreviewContext: () => ({ setSendBoxHandler: vi.fn() }),
}));
vi.mock('@/renderer/pages/conversation/voice/voiceTurnBridge', () => ({
  useVoiceTurnSubmission: () => ({ onTurnSubmitted: () => {}, deferral: null }),
}));
vi.mock('./useWCoreMessage', () => ({ useWCoreMessage: () => ({}) }));
vi.mock('@/renderer/pages/conversation/platforms/wcore/useWCoreMessage', () => ({ useWCoreMessage: () => ({}) }));
vi.mock('@/renderer/hooks/chat/useAutoTitle', () => ({ useAutoTitle: () => ({ checkAndUpdateTitle: vi.fn() }) }));
vi.mock('@/renderer/hooks/chat/useSlashCommands', () => ({ useSlashCommands: () => ({ commands: [] }) }));
vi.mock('@/renderer/hooks/file/useOpenFileSelector', () => ({ useOpenFileSelector: () => vi.fn() }));
vi.mock('@/renderer/hooks/agent/useModelContextLimit', () => ({ useModelContextLimit: () => () => 128_000 }));
vi.mock('@/renderer/pages/conversation/platforms/useConversationCommandQueue', () => ({
  shouldEnqueueConversationCommand: () => false,
  useConversationCommandQueue: () => ({
    items: [],
    isPaused: false,
    isInteractionLocked: false,
    hasPendingCommands: false,
    enqueue: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    reorder: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    lockInteraction: vi.fn(),
    unlockInteraction: vi.fn(),
    resetActiveExecution: vi.fn(),
  }),
}));
vi.mock('@/renderer/pages/conversation/Messages/hooks', () => ({
  useAddOrUpdateMessage: () => vi.fn(),
  useRemoveMessageByMsgId: () => vi.fn(),
  useTruncateMessagesAfter: () => vi.fn(),
}));
vi.mock('@/renderer/utils/emitter', () => ({
  emitter: { emit: vi.fn(), on: vi.fn(() => () => {}) },
  useAddEventListener: () => {},
}));
// Every ipcBridge leaf resolves to null and every event channel unsubscribes.
// The gate under test takes no IPC input, so a permissive double keeps this
// file about the argument and not about the bridge surface.
vi.mock('@/common', () => {
  const leaf: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'invoke') return async () => null;
        if (prop === 'on') return () => () => {};
        if (prop === 'emit') return () => {};
        if (prop === 'then') return undefined;
        return leaf;
      },
    }
  );
  return { ipcBridge: leaf };
});

import WCoreSendBox from '@/renderer/pages/conversation/platforms/wcore/WCoreSendBox';

function renderSendBox(readiness: ProviderReadiness) {
  readinessMock.value = readiness;
  pendingSendArgs.value = [];
  render(
    <WCoreSendBox
      conversation_id='c1'
      workspace='/ws'
      modelSelection={{ currentModel: undefined, getDisplayModelName: (m: string) => m } as never}
    />
  );
  const last = pendingSendArgs.value.at(-1);
  expect(last, 'usePendingSendOnWake was never called - the render did not reach the gate').toBeDefined();
  return last!;
}

describe('WCoreSendBox send-hold gate', () => {
  beforeEach(() => {
    holdSpy.mockClear();
  });

  it('parks a send only when the registry genuinely holds no provider', () => {
    expect(renderSendBox({ ready: false, loading: false, reason: 'no-provider' }).asleep).toBe(true);
  });

  it('does not park a configured user whose providers are all blocked', () => {
    expect(renderSendBox({ ready: false, loading: false, reason: 'all-errored' }).asleep).toBe(false);
  });

  it('does not park a send because the registry read failed', () => {
    expect(renderSendBox({ ready: false, loading: false, reason: 'registry-error' }).asleep).toBe(false);
  });

  it('does not park a send while a provider is mid-probe', () => {
    expect(renderSendBox({ ready: false, loading: false, reason: 'checking' }).asleep).toBe(false);
  });

  it('does not park a send when a provider is ready', () => {
    const args = renderSendBox({ ready: true, loading: false });
    expect(args.asleep).toBe(false);
    expect(args.ready).toBe(true);
  });
});
