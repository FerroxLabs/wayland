import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  constitutionAutosaveDraftKey,
  discardSerializedAutosaveDraft,
  readSerializedAutosaveDraft,
  useSerializedAutosave,
} from '@renderer/pages/settings/ConstitutionSettings/useSerializedAutosave';
import type { ConstitutionMutationResult } from '@renderer/services/ConstitutionService';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('useSerializedAutosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs one save at a time and coalesces overlapping edits to the latest buffer', async () => {
    const first = deferred<ConstitutionMutationResult>();
    const second = deferred<ConstitutionMutationResult>();
    const save = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() =>
      useSerializedAutosave({ enabled: true, debounceMs: 50, savedFlashMs: 100, save })
    );

    act(() => result.current.queueSave('first'));
    await act(async () => vi.advanceTimersByTime(50));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenLastCalledWith('first');

    act(() => {
      result.current.queueSave('second');
      result.current.queueSave('latest');
    });
    await act(async () => vi.advanceTimersByTime(50));
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => first.resolve({ ok: true }));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith('latest');
    await act(async () => second.resolve({ ok: true }));
    expect(result.current.saveState).toBe('saved');
  });

  it('retains a failed buffer across grant expiry and retries it after reauthorization', async () => {
    const onAuthorizationRequired = vi.fn();
    const save = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, reason: 'authorization_required', status: 401 })
      .mockResolvedValueOnce({ ok: true });
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useSerializedAutosave({
          enabled,
          debounceMs: 50,
          savedFlashMs: 100,
          save,
          onAuthorizationRequired,
        }),
      { initialProps: { enabled: true } }
    );

    act(() => result.current.queueSave('dirty-unsaved'));
    await act(async () => vi.advanceTimersByTime(50));
    expect(onAuthorizationRequired).toHaveBeenCalledTimes(1);
    expect(result.current.saveState).toBe('error');

    rerender({ enabled: false });
    expect(save).toHaveBeenCalledTimes(1);
    rerender({ enabled: true });
    await act(async () => Promise.resolve());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith('dirty-unsaved');
    expect(result.current.saveState).toBe('saved');
  });

  it('waits for an in-flight write before a confirmed destructive action', async () => {
    const write = deferred<ConstitutionMutationResult>();
    const save = vi.fn().mockReturnValue(write.promise);
    const destructive = vi.fn(async () => ({ committed: true, value: '# reset' }));
    const { result } = renderHook(() =>
      useSerializedAutosave({ enabled: true, debounceMs: 50, savedFlashMs: 100, save })
    );

    act(() => result.current.queueSave('# old pending'));
    await act(async () => vi.advanceTimersByTime(50));
    expect(save).toHaveBeenCalledTimes(1);

    let destructivePromise!: Promise<{ committed: boolean; value: string }>;
    act(() => {
      destructivePromise = result.current.runExclusiveDestructive(destructive);
    });
    expect(destructive).not.toHaveBeenCalled();

    await act(async () => write.resolve({ ok: true }));
    expect(destructive).toHaveBeenCalledTimes(1);
    await act(async () => destructivePromise);
    expect(result.current.isDirty).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('restores the dirty buffer when a destructive action fails and exposes retry', async () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useSerializedAutosave({ enabled: true, debounceMs: 50, savedFlashMs: 100, save })
    );

    act(() => result.current.queueSave('# preserve me'));
    await act(async () => {
      await result.current.runExclusiveDestructive(async () => ({ committed: false, value: undefined }));
    });
    expect(result.current.isDirty).toBe(true);
    expect(result.current.saveState).toBe('error');

    await act(async () => result.current.retry());
    expect(save).toHaveBeenCalledWith('# preserve me');
    expect(result.current.isDirty).toBe(false);
  });

  it('recovers a dirty buffer after route unmount and drains it after reauthorization', async () => {
    const draftKey = 'test-route-recovery';
    discardSerializedAutosaveDraft(draftKey);
    const save = vi.fn().mockResolvedValue({ ok: true });
    const first = renderHook(() =>
      useSerializedAutosave({ enabled: false, debounceMs: 50, savedFlashMs: 100, save, draftKey })
    );

    act(() => first.result.current.queueSave('# survive navigation'));
    first.unmount();
    expect(readSerializedAutosaveDraft(draftKey)).toBe('# survive navigation');
    const closeAfterNavigation = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(closeAfterNavigation);
    expect(closeAfterNavigation.defaultPrevented).toBe(true);

    const second = renderHook(
      ({ enabled }) => useSerializedAutosave({ enabled, debounceMs: 50, savedFlashMs: 100, save, draftKey }),
      { initialProps: { enabled: false } }
    );
    expect(second.result.current.recoveredDraft).toBe('# survive navigation');
    expect(second.result.current.isDirty).toBe(true);
    expect(second.result.current.saveState).toBe('error');

    second.rerender({ enabled: true });
    await act(async () => Promise.resolve());
    expect(save).toHaveBeenCalledWith('# survive navigation');
    expect(second.result.current.isDirty).toBe(false);
    expect(readSerializedAutosaveDraft(draftKey)).toBeNull();
    discardSerializedAutosaveDraft(draftKey);
    const closeAfterSave = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(closeAfterSave);
    expect(closeAfterSave.defaultPrevented).toBe(false);
  });

  it('isolates recovered drafts between authenticated hosted users', () => {
    const firstUserKey = constitutionAutosaveDraftKey('main', false, 'user-1');
    const secondUserKey = constitutionAutosaveDraftKey('main', false, 'user-2');
    expect(firstUserKey).not.toBeNull();
    expect(secondUserKey).not.toBeNull();
    expect(firstUserKey).not.toBe(secondUserKey);
    if (!firstUserKey || !secondUserKey) throw new Error('hosted user draft keys must exist');
    discardSerializedAutosaveDraft(firstUserKey);
    discardSerializedAutosaveDraft(secondUserKey);

    const first = renderHook(() =>
      useSerializedAutosave({
        enabled: false,
        debounceMs: 50,
        savedFlashMs: 100,
        save: vi.fn(),
        draftKey: firstUserKey,
      })
    );
    act(() => first.result.current.queueSave('# user one only'));
    first.unmount();

    const second = renderHook(() =>
      useSerializedAutosave({
        enabled: false,
        debounceMs: 50,
        savedFlashMs: 100,
        save: vi.fn(),
        draftKey: secondUserKey,
      })
    );
    expect(second.result.current.recoveredDraft).toBeNull();
    expect(second.result.current.isDirty).toBe(false);
    discardSerializedAutosaveDraft(firstUserKey);
    discardSerializedAutosaveDraft(secondUserKey);
  });
});
