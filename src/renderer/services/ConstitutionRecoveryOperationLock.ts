/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

const DATABASE_NAME = 'wayland-constitution-recovery-locks';
const DATABASE_VERSION = 1;
const STORE_NAME = 'principal-locks';
const MAX_PRINCIPAL_SCALARS = 1024;
const WEB_LOCK_PREFIX = 'wayland:constitution:classic-recovery-lock:';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener(
      'error',
      () => reject(request.error ?? new Error('Recovery transaction request failed.')),
      {
        once: true,
      }
    );
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true });
    transaction.addEventListener(
      'abort',
      () => reject(transaction.error ?? new Error('Recovery transaction was aborted.')),
      { once: true }
    );
    transaction.addEventListener(
      'error',
      () => reject(transaction.error ?? new Error('Recovery transaction failed.')),
      { once: true }
    );
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error('Cross-window recovery transaction authority is unavailable.'));
  }
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.addEventListener(
      'upgradeneeded',
      () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
      },
      { once: true }
    );
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener(
      'blocked',
      () => reject(new Error('Cross-window recovery transaction upgrade is blocked by another window.')),
      { once: true }
    );
    request.addEventListener(
      'error',
      () => reject(request.error ?? new Error('Cross-window recovery transaction authority could not open.')),
      { once: true }
    );
  });
}

function principalLockKey(principalScope: string): string {
  if (
    principalScope.length === 0 ||
    principalScope !== principalScope.normalize('NFC') ||
    [...principalScope].length > MAX_PRINCIPAL_SCALARS
  ) {
    throw new Error('Recovery principal scope is invalid.');
  }
  return `wayland:constitution:recovery:${encodeURIComponent(principalScope)}`;
}

function isThenable(value: unknown): boolean {
  return (
    (typeof value === 'object' && value !== null && 'then' in value) || (typeof value === 'function' && 'then' in value)
  );
}

/**
 * Execute a synchronous durable-evidence transition while a cross-context
 * IndexedDB read/write transaction owns the recovery store. IndexedDB
 * read/write transactions are serialized across tabs, windows, workers, and
 * Electron renderer contexts for the same origin. Keeping the callback
 * synchronous ensures the transaction cannot auto-commit before localStorage
 * read/compare/write/remove completes.
 */
export async function withConstitutionRecoveryTransaction<T>(principalScope: string, action: () => T): Promise<T> {
  const lockKey = principalLockKey(principalScope);
  const webLocks = globalThis.navigator?.locks;
  if (webLocks) {
    return webLocks.request(
      `${WEB_LOCK_PREFIX}${encodeURIComponent(principalScope)}`,
      { mode: 'exclusive' },
      async () => {
        const result = action();
        if (isThenable(result)) throw new Error('Recovery transaction callbacks must be synchronous.');
        return result;
      }
    );
  }
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const completion = transactionDone(transaction);
    const store = transaction.objectStore(STORE_NAME);
    await requestResult(store.get(lockKey));

    let result: T;
    try {
      result = action();
      if (isThenable(result)) throw new Error('Recovery transaction callbacks must be synchronous.');
      store.put(lockKey, lockKey);
    } catch (error) {
      transaction.abort();
      await completion.catch((): undefined => undefined);
      throw error;
    }

    await completion;
    return result;
  } finally {
    database.close();
  }
}
