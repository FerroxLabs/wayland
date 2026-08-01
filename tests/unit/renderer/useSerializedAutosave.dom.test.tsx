import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONSTITUTION } from '@/common/constitutionDefault';
import {
  abandonConstitutionSingleShotMutation,
  beginConstitutionSingleShotMutation,
  completeConstitutionSingleShotMutation,
  constitutionAutosaveDraftKey,
  constitutionMutationContentDigest,
  constitutionMutationRequestFingerprint,
  constitutionSingleShotMutationKey,
  discardSerializedAutosaveDraft,
  readConstitutionSingleShotMutation,
  readSerializedAutosaveDraft,
  useSerializedAutosave as useSerializedAutosaveImplementation,
} from '@renderer/pages/settings/ConstitutionSettings/useSerializedAutosave';
import type { ConstitutionMutationResult } from '@renderer/services/ConstitutionService';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const TEST_EXPECTED_REVISION = 'rev:main:00000001';
const TEST_DEFAULT_DRAFT_KEY = 'test-default-autosave';
const useSerializedAutosave = (
  options: Omit<Parameters<typeof useSerializedAutosaveImplementation>[0], 'target' | 'getExpectedRevision'>
) =>
  useSerializedAutosaveImplementation({
    ...options,
    draftKey: options.draftKey ?? TEST_DEFAULT_DRAFT_KEY,
    target: { kind: 'constitution' },
    getExpectedRevision: () => TEST_EXPECTED_REVISION,
  });

const committed = (
  requestId: string,
  requestFingerprint: `sha256:${string}`,
  revision = 'rev:main:00000002'
): ConstitutionMutationResult => ({
  ok: true,
  revision,
  receiptId: 'receipt:main:00000001',
  requestId,
  requestFingerprint,
});

function committedForCall(save: ReturnType<typeof vi.fn>, call: number, revision?: string): ConstitutionMutationResult {
  return committed(save.mock.calls[call][2], save.mock.calls[call][3], revision);
}

describe('useSerializedAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    discardSerializedAutosaveDraft(TEST_DEFAULT_DRAFT_KEY);
  });
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
    expect(save).toHaveBeenLastCalledWith(
      'first',
      TEST_EXPECTED_REVISION,
      expect.any(String),
      expect.stringMatching(/^sha256:/)
    );
    const firstRequestId = save.mock.calls[0][2];

    act(() => {
      result.current.queueSave('second');
      result.current.queueSave('latest');
    });
    await act(async () => vi.advanceTimersByTime(50));
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => first.resolve(committedForCall(save, 0)));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(
      'latest',
      'rev:main:00000002',
      expect.any(String),
      constitutionMutationRequestFingerprint({ kind: 'constitution' }, 'latest', 'rev:main:00000002')
    );
    expect(save.mock.calls[1][2]).not.toBe(firstRequestId);
    await act(async () => second.resolve(committedForCall(save, 1, 'rev:main:00000003')));
    expect(result.current.saveState).toBe('saved');
  });

  it('replays an uncertain committed operation before a newer queued buffer, including after remount', async () => {
    const draftKey = 'test-response-loss-ordering';
    discardSerializedAutosaveDraft(draftKey);
    const lostResponse = deferred<ConstitutionMutationResult>();
    const replayResponse = deferred<ConstitutionMutationResult>();
    const latestResponse = deferred<ConstitutionMutationResult>();
    const save = vi
      .fn()
      .mockReturnValueOnce(lostResponse.promise)
      .mockReturnValueOnce(replayResponse.promise)
      .mockReturnValueOnce(latestResponse.promise);

    const first = renderHook(() =>
      useSerializedAutosave({ enabled: true, debounceMs: 50, savedFlashMs: 100, save, draftKey })
    );
    act(() => first.result.current.queueSave('# operation A'));
    await act(async () => vi.advanceTimersByTime(50));
    const operationARequestId = save.mock.calls[0][2];
    const operationAFingerprint = save.mock.calls[0][3];
    act(() => first.result.current.queueSave('# operation B'));
    await act(async () => lostResponse.resolve({ ok: false, reason: 'request_failed', status: 0 }));
    first.unmount();

    const committedOrder: string[] = [];
    const second = renderHook(
      ({ enabled }) =>
        useSerializedAutosave({
          enabled,
          debounceMs: 50,
          savedFlashMs: 100,
          save,
          draftKey,
          onCommitted: (_result, value) => committedOrder.push(value),
        }),
      { initialProps: { enabled: false } }
    );
    expect(second.result.current.recoveredDraft).toBe('# operation B');
    second.rerender({ enabled: true });
    await act(async () => Promise.resolve());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(
      '# operation A',
      TEST_EXPECTED_REVISION,
      operationARequestId,
      operationAFingerprint
    );

    await act(async () => replayResponse.resolve(committedForCall(save, 1, 'rev:main:00000002')));
    expect(save).toHaveBeenCalledTimes(3);
    expect(save).toHaveBeenLastCalledWith(
      '# operation B',
      'rev:main:00000002',
      expect.any(String),
      constitutionMutationRequestFingerprint({ kind: 'constitution' }, '# operation B', 'rev:main:00000002')
    );
    expect(save.mock.calls[2][2]).not.toBe(operationARequestId);
    await act(async () => latestResponse.resolve(committedForCall(save, 2, 'rev:main:00000003')));
    expect(committedOrder).toEqual(['# operation A', '# operation B']);
    expect(second.result.current.isDirty).toBe(false);
    expect(readSerializedAutosaveDraft(draftKey)).toBeNull();
  });

  it('persists the exact operation identity before dispatch and replays it after an unresolved unmount', async () => {
    const draftKey = 'test-crash-before-response';
    discardSerializedAutosaveDraft(draftKey);
    const neverReturned = deferred<ConstitutionMutationResult>();
    const replayReturned = deferred<ConstitutionMutationResult>();
    const save = vi.fn().mockReturnValueOnce(neverReturned.promise).mockReturnValueOnce(replayReturned.promise);

    const first = renderHook(() =>
      useSerializedAutosave({ enabled: true, debounceMs: 50, savedFlashMs: 100, save, draftKey })
    );
    act(() => first.result.current.queueSave('# dispatched before crash'));
    await act(async () => vi.advanceTimersByTime(50));
    expect(save).toHaveBeenCalledTimes(1);
    const originalRequestId = save.mock.calls[0][2];
    const originalFingerprint = save.mock.calls[0][3];
    expect(readSerializedAutosaveDraft(draftKey)).toBe('# dispatched before crash');
    first.unmount();

    const second = renderHook(
      ({ enabled }) => useSerializedAutosave({ enabled, debounceMs: 50, savedFlashMs: 100, save, draftKey }),
      { initialProps: { enabled: false } }
    );
    expect(second.result.current.recoveredDraft).toBe('# dispatched before crash');
    second.rerender({ enabled: true });
    await act(async () => Promise.resolve());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(
      '# dispatched before crash',
      TEST_EXPECTED_REVISION,
      originalRequestId,
      originalFingerprint
    );

    await act(async () => replayReturned.resolve(committedForCall(save, 1)));
    expect(second.result.current.isDirty).toBe(false);
    expect(readSerializedAutosaveDraft(draftKey)).toBeNull();
  });

  it('binds a queued save to its original target and revision even when live revision state changes', async () => {
    let liveRevision = 'rev:main:00000001';
    const save = vi.fn((_value, _revision, requestId, requestFingerprint) =>
      Promise.resolve(committed(requestId, requestFingerprint))
    );
    const { result } = renderHook(() =>
      useSerializedAutosaveImplementation({
        enabled: true,
        debounceMs: 50,
        savedFlashMs: 100,
        target: { kind: 'constitution' },
        getExpectedRevision: () => liveRevision,
        save,
        draftKey: 'test-immutable-facts',
      })
    );

    act(() => result.current.queueSave('# bound facts'));
    liveRevision = 'rev:main:changed-before-dispatch';
    await act(async () => vi.advanceTimersByTime(50));
    expect(save).toHaveBeenCalledWith(
      '# bound facts',
      'rev:main:00000001',
      expect.any(String),
      expect.stringMatching(/^sha256:/)
    );
  });

  it('fails closed before dispatch when the durable draft write is unavailable', async () => {
    const save = vi.fn();
    const storage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: storage.getItem.bind(storage),
        removeItem: storage.removeItem.bind(storage),
        clear: storage.clear.bind(storage),
        setItem: () => {
          throw new Error('quota denied');
        },
      } as Storage,
    });
    try {
      const { result } = renderHook(() =>
        useSerializedAutosave({ enabled: true, debounceMs: 50, savedFlashMs: 100, save })
      );

      act(() => result.current.queueSave('# must not dispatch'));
      await act(async () => vi.advanceTimersByTime(50));
      expect(save).not.toHaveBeenCalled();
      expect(result.current.isDirty).toBe(true);
      expect(result.current.saveState).toBe('error');
    } finally {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
    }
  });

  it('does not clear an uncertain draft on a mismatched request fingerprint receipt', async () => {
    const save = vi.fn((_value, _revision, requestId) =>
      Promise.resolve(committed(requestId, `sha256:${'f'.repeat(64)}` as `sha256:${string}`))
    );
    const { result } = renderHook(() =>
      useSerializedAutosave({ enabled: true, debounceMs: 50, savedFlashMs: 100, save })
    );

    act(() => result.current.queueSave('# receipt mismatch'));
    await act(async () => vi.advanceTimersByTime(50));
    expect(result.current.isDirty).toBe(true);
    expect(result.current.saveState).toBe('error');
    expect(readSerializedAutosaveDraft(TEST_DEFAULT_DRAFT_KEY)).toBe('# receipt mismatch');
  });

  it('retains a failed buffer across grant expiry and retries it after reauthorization', async () => {
    const onAuthorizationRequired = vi.fn();
    const save = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, reason: 'authorization_required', status: 401 })
      .mockImplementationOnce((_value, _revision, requestId, requestFingerprint) =>
        Promise.resolve(committed(requestId, requestFingerprint))
      );
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
    const failedRequestId = save.mock.calls[0][2];
    const failedFingerprint = save.mock.calls[0][3];
    expect(onAuthorizationRequired).toHaveBeenCalledTimes(1);
    expect(result.current.saveState).toBe('error');

    rerender({ enabled: false });
    expect(save).toHaveBeenCalledTimes(1);
    rerender({ enabled: true });
    await act(async () => Promise.resolve());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith('dirty-unsaved', TEST_EXPECTED_REVISION, failedRequestId, failedFingerprint);
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

    await act(async () => write.resolve(committedForCall(save, 0)));
    expect(destructive).toHaveBeenCalledTimes(1);
    await act(async () => destructivePromise);
    expect(result.current.isDirty).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('restores the dirty buffer when a destructive action fails and exposes retry', async () => {
    const save = vi.fn((_value, _revision, requestId, requestFingerprint) =>
      Promise.resolve(committed(requestId, requestFingerprint))
    );
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
    expect(save).toHaveBeenCalledWith(
      '# preserve me',
      TEST_EXPECTED_REVISION,
      expect.any(String),
      expect.stringMatching(/^sha256:/)
    );
    expect(result.current.isDirty).toBe(false);
  });

  it('recovers a dirty buffer after route unmount and drains it after reauthorization', async () => {
    const draftKey = 'test-route-recovery';
    discardSerializedAutosaveDraft(draftKey);
    const save = vi.fn((_value, _revision, requestId, requestFingerprint) =>
      Promise.resolve(committed(requestId, requestFingerprint))
    );
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
    expect(save).toHaveBeenCalledWith(
      '# survive navigation',
      TEST_EXPECTED_REVISION,
      expect.any(String),
      expect.stringMatching(/^sha256:/)
    );
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

  it.each([
    ['reset', 'constitution', undefined, undefined],
    ['create', 'specialist:research', constitutionMutationContentDigest(''), undefined],
    ['delete', 'specialist:copy', undefined, undefined],
    [
      'overwrite',
      'constitution',
      constitutionMutationContentDigest('# local draft that must not enter the journal'),
      'user:user-1:main',
    ],
  ] as const)(
    'durably replays %s with the exact UUID and facts until its receipt matches',
    (action, target, contentDigest, draftKey) => {
      const key = constitutionSingleShotMutationKey(action, target, false, 'user-1');
      expect(key).not.toBeNull();
      if (!key) throw new Error('authenticated mutation key must exist');
      const facts = {
        action,
        target,
        expectedRevision: `rev:${target}:before`,
        requestFingerprint: constitutionMutationRequestFingerprint(
          target === 'constitution'
            ? { kind: 'constitution' }
            : { kind: 'specialist', specialistId: target.slice('specialist:'.length) },
          action === 'create'
            ? ''
            : action === 'overwrite'
              ? '# local draft that must not enter the journal'
              : action === 'reset'
                ? DEFAULT_CONSTITUTION
                : null,
          `rev:${target}:before`
        ),
        ...(contentDigest === undefined ? {} : { contentDigest }),
        ...(draftKey === undefined ? {} : { draftKey }),
      };
      const first = beginConstitutionSingleShotMutation(key, facts);
      const afterRendererRestart = readConstitutionSingleShotMutation(key);
      const retried = beginConstitutionSingleShotMutation(key, facts);

      expect(afterRendererRestart).toEqual(first);
      expect(retried).toEqual(first);
      expect(() =>
        beginConstitutionSingleShotMutation(key, {
          ...facts,
          expectedRevision: `rev:${target}:changed-after-possible-commit`,
        })
      ).toThrow('A different unresolved Constitution operation already owns this action.');
      expect(Object.values(window.localStorage).join('\n')).not.toContain(
        '# local draft that must not enter the journal'
      );
      expect(() =>
        completeConstitutionSingleShotMutation(
          key,
          committed('ffffffff-ffff-4fff-8fff-ffffffffffff', first.requestFingerprint)
        )
      ).toThrow('does not match');
      expect(readConstitutionSingleShotMutation(key)).toEqual(first);
      expect(() =>
        completeConstitutionSingleShotMutation(
          key,
          committed(first.requestId, `sha256:${'f'.repeat(64)}` as `sha256:${string}`)
        )
      ).toThrow('does not match');
      expect(readConstitutionSingleShotMutation(key)).toEqual(first);
      completeConstitutionSingleShotMutation(key, committed(first.requestId, first.requestFingerprint));
      expect(readConstitutionSingleShotMutation(key)).toBeNull();
    }
  );

  it('clears an exact definitive conflict so the action can rebase with a fresh identity', () => {
    const key = constitutionSingleShotMutationKey('delete', 'specialist:research', false, 'user-1')!;
    const target = { kind: 'specialist', specialistId: 'research' } as const;
    const first = beginConstitutionSingleShotMutation(key, {
      action: 'delete',
      target: 'specialist:research',
      expectedRevision: 'rev:specialist:before',
      requestFingerprint: constitutionMutationRequestFingerprint(target, null, 'rev:specialist:before'),
    });

    expect(() =>
      abandonConstitutionSingleShotMutation(key, 'ffffffff-ffff-4fff-8fff-ffffffffffff', first.requestFingerprint)
    ).toThrow('does not match');
    expect(readConstitutionSingleShotMutation(key)).toEqual(first);
    abandonConstitutionSingleShotMutation(key, first.requestId, first.requestFingerprint);

    const rebased = beginConstitutionSingleShotMutation(key, {
      action: 'delete',
      target: 'specialist:research',
      expectedRevision: 'rev:specialist:after-conflict',
      requestFingerprint: constitutionMutationRequestFingerprint(target, null, 'rev:specialist:after-conflict'),
    });
    expect(rebased.requestId).not.toBe(first.requestId);
    expect(rebased.expectedRevision).toBe('rev:specialist:after-conflict');
  });
});
