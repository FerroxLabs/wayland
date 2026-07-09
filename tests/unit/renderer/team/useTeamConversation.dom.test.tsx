/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Regression for issue #736 — during Team execution the header model selector
 * and the send box showed DIFFERENT active models (header: `z-ai/glm-5.2`,
 * composer: "Send message to gemini-3.5-flash") until an unrelated SWR
 * revalidation happened by.
 *
 * Both surfaces hydrate separate model-selection instances from the shared
 * `['team-conversation', id]` SWR record. Picking a model persists via
 * `ipcBridge.conversation.update`, whose provider emits
 * `conversation.listChanged('updated')` — but nothing on the team page
 * subscribed, so the cache (and with it the send box placeholder) stayed on
 * the stale model.
 *
 * useTeamConversation subscribes and revalidates, so every consumer of the
 * record converges on the persisted model immediately.
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IConversationListChangedEvent } from '@/common/adapter/ipcBridge';

// Mutable conversation record the mocked IPC returns; tests swap the model to
// simulate the process persisting a new pick.
let conversationRecord: { id: string; model?: { id: string; useModel: string } } | null = null;

const getInvoke = vi.hoisted(() => vi.fn());

// Capture the renderer's `conversation.listChanged` subscriber so the test can
// fire the event the same way the conversation.update bridge provider does.
let listChangedHandler: ((event: IConversationListChangedEvent) => void) | null = null;
const listChangedOn = vi.hoisted(() => vi.fn());

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      get: { invoke: getInvoke },
      listChanged: { on: listChangedOn },
    },
  },
}));

import { useTeamConversation } from '@/renderer/pages/team/hooks/useTeamConversation';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
);

describe('useTeamConversation (#736)', () => {
  beforeEach(() => {
    getInvoke.mockReset();
    getInvoke.mockImplementation(async () => conversationRecord);
    listChangedHandler = null;
    listChangedOn.mockReset();
    listChangedOn.mockImplementation((cb: (event: IConversationListChangedEvent) => void) => {
      listChangedHandler = cb;
      return () => {
        listChangedHandler = null;
      };
    });
  });

  it('fetches the conversation record for the given id', async () => {
    conversationRecord = { id: 'conv-1', model: { id: 'openrouter', useModel: 'z-ai/glm-5.2' } };

    const { result } = renderHook(() => useTeamConversation('conv-1'), { wrapper });

    await waitFor(() => expect(result.current.data?.id).toBe('conv-1'));
    expect(getInvoke).toHaveBeenCalledWith({ id: 'conv-1' });
  });

  it('revalidates when the process reports the conversation was updated (stale model converges)', async () => {
    // The agent conversation spawned on the default model — the send box
    // placeholder reads this stale record.
    conversationRecord = { id: 'conv-1', model: { id: 'gemini', useModel: 'gemini-3.5-flash' } };

    const { result } = renderHook(() => useTeamConversation('conv-1'), { wrapper });
    await waitFor(() => expect(result.current.data?.model?.useModel).toBe('gemini-3.5-flash'));

    // The user picks GLM in the header selector: conversation.update persists
    // the model and its bridge provider emits listChanged('updated').
    conversationRecord = { id: 'conv-1', model: { id: 'openrouter', useModel: 'z-ai/glm-5.2' } };
    expect(listChangedHandler).toBeTypeOf('function');
    listChangedHandler!({ conversationId: 'conv-1', action: 'updated' });

    // The shared record re-reads, so the send box now shows the active model.
    await waitFor(() => expect(result.current.data?.model?.useModel).toBe('z-ai/glm-5.2'));
  });

  it('ignores updates for other conversations and non-update actions', async () => {
    conversationRecord = { id: 'conv-1', model: { id: 'gemini', useModel: 'gemini-3.5-flash' } };

    const { result } = renderHook(() => useTeamConversation('conv-1'), { wrapper });
    await waitFor(() => expect(result.current.data?.model?.useModel).toBe('gemini-3.5-flash'));
    const fetchCount = getInvoke.mock.calls.length;

    listChangedHandler!({ conversationId: 'conv-OTHER', action: 'updated' });
    listChangedHandler!({ conversationId: 'conv-1', action: 'created' });
    listChangedHandler!({ conversationId: 'conv-1', action: 'deleted' });

    // Give any (wrong) revalidation a chance to run, then assert none did.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getInvoke.mock.calls.length).toBe(fetchCount);
  });

  it('does not fetch or subscribe without a conversation id, and unsubscribes on unmount', async () => {
    const { unmount: unmountNull } = renderHook(() => useTeamConversation(undefined), { wrapper });
    expect(getInvoke).not.toHaveBeenCalled();
    expect(listChangedOn).not.toHaveBeenCalled();
    unmountNull();

    conversationRecord = { id: 'conv-1', model: { id: 'gemini', useModel: 'gemini-3.5-flash' } };
    const { unmount } = renderHook(() => useTeamConversation('conv-1'), { wrapper });
    await waitFor(() => expect(listChangedHandler).toBeTypeOf('function'));
    unmount();
    expect(listChangedHandler).toBeNull();
  });
});
