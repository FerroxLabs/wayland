/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #412 - composer draft persistence. The send-box draft store kept typed-but-
 * unsent text only in a module-level in-memory Map, so a renderer reload / app
 * restart / crash dropped it ("the system jumps and all my words are lost").
 * These tests pin the durable-storage behavior: drafts are mirrored to
 * localStorage, rehydrated on a cold read, and cleared once emptied.
 *
 * Each test uses a unique conversation id so the in-memory Map has no entry for
 * it - that forces getDraft down the persisted (localStorage) path, which is
 * what a post-restart session exercises.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { __clearInMemoryDraftsForTests, getSendBoxDraftHook } from '@/renderer/hooks/chat/useSendBoxDraft';

const STORAGE_PREFIX = 'wayland:sendbox-draft:';
const emptyWcoreDraft = { _type: 'wcore' as const, content: '', atPath: [], uploadFile: [] };
const useWcoreDraft = getSendBoxDraftHook('wcore', emptyWcoreDraft);

beforeEach(() => {
  localStorage.clear();
  __clearInMemoryDraftsForTests();
});

describe('send-box draft persistence (#412)', () => {
  it('mirrors typed content to localStorage on mutate (write-through)', async () => {
    const id = 'conv-write-through';
    const { result } = renderHook(() => useWcoreDraft(id));

    act(() => {
      result.current.mutate((prev) => ({ ...prev, content: 'half-written message' }));
    });

    const raw = localStorage.getItem(`${STORAGE_PREFIX}wcore:${id}`);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).content).toBe('half-written message');
  });

  it('rehydrates a persisted draft on a cold read (simulates restart)', async () => {
    const id = 'conv-rehydrate';
    // Seed storage as if a prior session had saved a draft; the in-memory Map
    // has no entry for this id (fresh session), so getDraft must read storage.
    localStorage.setItem(
      `${STORAGE_PREFIX}wcore:${id}`,
      JSON.stringify({ _type: 'wcore', content: 'survived the restart', atPath: [], uploadFile: [] })
    );

    const { result } = renderHook(() => useWcoreDraft(id));

    await waitFor(() => expect(result.current.data?.content).toBe('survived the restart'));
  });

  it('clears the persisted draft once the content is emptied (e.g. after send)', async () => {
    const id = 'conv-clear';
    const { result } = renderHook(() => useWcoreDraft(id));

    act(() => {
      result.current.mutate((prev) => ({ ...prev, content: 'about to send' }));
    });
    expect(localStorage.getItem(`${STORAGE_PREFIX}wcore:${id}`)).toBeTruthy();

    act(() => {
      result.current.mutate((prev) => ({ ...prev, content: '' }));
    });
    expect(localStorage.getItem(`${STORAGE_PREFIX}wcore:${id}`)).toBeNull();
  });

  it('survives a full reload: typed via the hook, unmounted, in-memory wiped, then restored on remount', () => {
    const id = 'conv-reload-roundtrip';

    // Session 1: type through the real hook (write-through to localStorage + in-memory).
    const session1 = renderHook(() => useWcoreDraft(id));
    act(() => {
      session1.result.current.mutate((prev) => ({ ...prev, content: 'a half-finished thought' }));
    });
    session1.unmount();

    // Simulate a renderer reload: the in-memory store is gone, localStorage remains.
    __clearInMemoryDraftsForTests();
    expect(localStorage.getItem(`${STORAGE_PREFIX}wcore:${id}`)).toBeTruthy();

    // Session 2 (cold in-memory): remounting the same conversation restores the text.
    const session2 = renderHook(() => useWcoreDraft(id));
    expect(session2.result.current.data?.content).toBe('a half-finished thought');
  });

  it('exposes the persisted draft synchronously so a mount-time partial update cannot clobber it', () => {
    const id = 'conv-race';
    localStorage.setItem(
      `${STORAGE_PREFIX}wcore:${id}`,
      JSON.stringify({ _type: 'wcore', content: 'precious unsent text', atPath: [], uploadFile: [] })
    );

    const { result } = renderHook(() => useWcoreDraft(id));
    // fallbackData makes the saved draft present on the FIRST render - there is
    // no undefined window where a partial update would rebuild from empty.
    expect(result.current.data?.content).toBe('precious unsent text');

    // A partial update (the kind a mount effect fires, e.g. setAtPath) must
    // preserve the typed content rather than wipe it.
    act(() => {
      result.current.mutate((prev) => ({ ...prev, atPath: ['/some/file'] }));
    });
    expect(JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}wcore:${id}`) as string).content).toBe(
      'precious unsent text'
    );
  });

  it('ignores a persisted entry whose _type does not match (schema drift guard)', async () => {
    const id = 'conv-drift';
    localStorage.setItem(`${STORAGE_PREFIX}wcore:${id}`, JSON.stringify({ _type: 'gemini', content: 'wrong type' }));

    const { result } = renderHook(() => useWcoreDraft(id));
    // Give SWR a tick; the mismatched entry must NOT surface as wcore data.
    await waitFor(() => expect(result.current.data).toBeUndefined());
  });
});
