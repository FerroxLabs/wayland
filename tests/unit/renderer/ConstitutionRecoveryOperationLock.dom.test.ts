/**
 * @vitest-environment jsdom
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withConstitutionRecoveryTransaction } from '@renderer/services/ConstitutionRecoveryOperationLock';

describe('ConstitutionRecoveryOperationLock', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('indexedDB', new IDBFactory());
    window.localStorage.clear();
  });

  it('serializes transitions opened through independent database connections', async () => {
    const trace: string[] = [];
    const first = withConstitutionRecoveryTransaction('hosted:user-1', () => {
      trace.push('first');
      const current = Number(window.localStorage.getItem('counter') ?? '0');
      window.localStorage.setItem('counter', String(current + 1));
      return current + 1;
    });
    const second = withConstitutionRecoveryTransaction('hosted:user-1', () => {
      trace.push('second');
      const current = Number(window.localStorage.getItem('counter') ?? '0');
      window.localStorage.setItem('counter', String(current + 1));
      return current + 1;
    });

    await expect(Promise.all([first, second])).resolves.toEqual([1, 2]);
    expect(trace).toEqual(['first', 'second']);
    expect(window.localStorage.getItem('counter')).toBe('2');
  });

  it('works when the hosted page is not a secure context', async () => {
    vi.stubGlobal('isSecureContext', false);
    await expect(withConstitutionRecoveryTransaction('hosted:remote-http', () => 'locked')).resolves.toBe('locked');
  });

  it('fails before running the transition when IndexedDB is unavailable', async () => {
    const action = vi.fn();
    vi.stubGlobal('indexedDB', undefined);
    await expect(withConstitutionRecoveryTransaction('hosted:user-1', action)).rejects.toThrow(
      'Cross-window recovery transaction authority is unavailable.'
    );
    expect(action).not.toHaveBeenCalled();
  });

  it('aborts thrown and asynchronous transitions', async () => {
    await expect(
      withConstitutionRecoveryTransaction('hosted:user-1', () => {
        throw new Error('stop');
      })
    ).rejects.toThrow('stop');
    await expect(withConstitutionRecoveryTransaction('hosted:user-1', () => Promise.resolve('unsafe'))).rejects.toThrow(
      'Recovery transaction callbacks must be synchronous.'
    );
  });

  it.each(['', 'e\u0301', 'x'.repeat(1025)])('rejects invalid principal scope %j', async (principalScope) => {
    const action = vi.fn();
    await expect(withConstitutionRecoveryTransaction(principalScope, action)).rejects.toThrow(
      'Recovery principal scope is invalid.'
    );
    expect(action).not.toHaveBeenCalled();
  });
});
