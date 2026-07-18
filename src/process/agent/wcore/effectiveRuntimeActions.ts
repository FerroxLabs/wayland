/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IWcoreEffectiveRuntime, IWcoreRuntimeFolderTarget } from '@/common/adapter/ipcBridge';
import { MAX_FIXED_BUDGET, MIN_FIXED_BUDGET, type OutputBudget } from '@/common/config/outputBudget';

export type PreferenceStore<T> = {
  get: () => Promise<T | undefined>;
  set: (value: T) => Promise<unknown>;
  remove: () => Promise<unknown>;
};

/**
 * Persist a preference without leaving a failed optimistic write in a backing
 * store's in-memory cache. Atomic stores need no repair after a rejected write;
 * legacy/alternate optimistic stores are compare-and-restored to the previous
 * value (or absence).
 */
export async function setPreferenceTransactional<T>(
  value: T,
  store: PreferenceStore<T>
): Promise<{ ok: boolean; error?: string }> {
  let previous: T | undefined;
  let previousRead = false;
  try {
    previous = await store.get();
    previousRead = true;
    await store.set(value);
    return { ok: true };
  } catch (error) {
    if (previousRead) {
      try {
        // Compare-and-restore: a writer outside this transaction may have
        // replaced the key while persistence was pending. Only roll back when
        // the cache still contains the exact value this transaction installed.
        const current = await store.get();
        if (Object.is(current, value)) {
          if (previous === undefined) await store.remove();
          else await store.set(previous);
        }
      } catch {
        // An optimistic store may already have restored its cache before its
        // rollback persistence attempt failed. Either way, preserve the
        // actionable original error instead of replacing it with cleanup noise.
      }
    }
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Raw-mode specialization retained for a narrow, readable IPC authority. */
export function setRawEngineModeTransactional(
  enabled: boolean,
  store: PreferenceStore<boolean>
): Promise<{ ok: boolean; error?: string }> {
  return setPreferenceTransactional(enabled, store);
}

/**
 * Serialize cache-mutating preference transactions. Without this queue, an
 * older failed write can roll its cached value back after a newer write has
 * succeeded, producing a false-green UI and a poisoned process cache.
 */
export type KeyedPreferenceStore = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
  remove: (key: string) => Promise<unknown>;
};

export type SerializedPreferenceStore = {
  set: <T>(key: string, value: T) => Promise<{ ok: boolean; error?: string }>;
};

let preferenceAuthorityQueue: Promise<void> = Promise.resolve();

function withPreferenceAuthority<T>(operation: () => Promise<T>): Promise<T> {
  const transaction = preferenceAuthorityQueue.then(operation);
  preferenceAuthorityQueue = transaction.then((): void => {}).catch((): void => {});
  return transaction;
}

/**
 * One mutation queue for the whole backing store, not one queue per key. A
 * failed raw-mode write and its rollback therefore finish before an output-
 * budget write can snapshot/persist the sibling key (and vice versa).
 */
export function createSerializedPreferenceStore(store: KeyedPreferenceStore): SerializedPreferenceStore {
  return {
    set<T>(key: string, value: T) {
      return withPreferenceAuthority(() =>
        setPreferenceTransactional(value, {
          get: () => store.get(key) as Promise<T | undefined>,
          set: (next) => store.set(key, next),
          remove: () => store.remove(key),
        })
      );
    },
  };
}

/**
 * Read a locally-owned preference and remove malformed persisted data before
 * returning the safe default. Reads and repair share the same queue as writes,
 * so recovery cannot delete a valid successor written between get and remove.
 * Storage read/remove failures still reject: an unproved authority is never
 * silently treated as a default.
 */
export function readRawEngineModePreference(store: KeyedPreferenceStore): Promise<boolean> {
  return withPreferenceAuthority(async () => {
    const value = await store.get('wcore.rawEngineMode');
    if (value === undefined) return false;
    if (typeof value === 'boolean') return value;
    await store.remove('wcore.rawEngineMode');
    return false;
  });
}

/** See {@link readRawEngineModePreference}. Invalid budgets recover to Auto. */
export function readOutputBudgetPreference(store: KeyedPreferenceStore): Promise<OutputBudget | undefined> {
  return withPreferenceAuthority(async () => {
    const value = await store.get('wcore.outputBudget');
    if (value === undefined) return undefined;
    if (isValidOutputBudgetPreference(value)) return value;
    await store.remove('wcore.outputBudget');
    return undefined;
  });
}

/** Validate untrusted IPC or persisted JSON before it becomes launch input. */
export function isValidOutputBudgetPreference(value: unknown): value is OutputBudget {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    const keys = Object.keys(value).toSorted();
    const mode = Object.getOwnPropertyDescriptor(value, 'mode');
    if (!mode || mode.get || mode.set) return false;
    if (mode.value === 'auto') return keys.length === 1 && keys[0] === 'mode';
    if (keys.length !== 2 || keys[0] !== 'mode' || keys[1] !== 'value') return false;
    const fixed = Object.getOwnPropertyDescriptor(value, 'value');
    return (
      mode.value === 'fixed' &&
      !!fixed &&
      !fixed.get &&
      !fixed.set &&
      typeof fixed.value === 'number' &&
      Number.isInteger(fixed.value) &&
      fixed.value >= MIN_FIXED_BUDGET &&
      fixed.value <= MAX_FIXED_BUDGET
    );
  } catch {
    return false;
  }
}

export type EffectiveRuntimeFolderDeps = {
  resolveRuntime: () => Promise<IWcoreEffectiveRuntime>;
  ensureDirectory: (path: string) => Promise<unknown>;
  openPath: (path: string) => Promise<string>;
};

/**
 * Recompute and open one authoritative runtime directory. The renderer selects
 * only an enum; it can never supply or widen a filesystem path.
 */
export async function openEffectiveRuntimeFolder(
  target: IWcoreRuntimeFolderTarget,
  deps: EffectiveRuntimeFolderDeps
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (target !== 'core-config' && target !== 'desktop-config') {
      return { ok: false, error: 'unknown runtime folder target' };
    }
    const runtime = await deps.resolveRuntime();
    const dir = target === 'core-config' ? runtime.engineConfigDir : runtime.desktopConfigDir;
    await deps.ensureDirectory(dir);
    const error = await deps.openPath(dir);
    return error ? { ok: false, error } : { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
