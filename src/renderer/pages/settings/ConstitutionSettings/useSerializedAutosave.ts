/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SaveState } from '@renderer/components/settings/shared/feedback/SavedIndicator';
import type { ConstitutionMutationResult } from '@renderer/services/ConstitutionService';

type Options = {
  enabled: boolean;
  debounceMs: number;
  savedFlashMs: number;
  save: (value: string) => Promise<ConstitutionMutationResult>;
  onAuthorizationRequired?: () => void;
  /** Stable, non-secret identifier used to recover a dirty buffer after route unmount/reload. */
  draftKey?: string;
};

type SerializedAutosave = {
  saveState: SaveState;
  isDirty: boolean;
  recoveredDraft: string | null;
  queueSave: (value: string) => void;
  retry: () => void;
  clear: () => void;
  runExclusiveDestructive: <T>(
    action: () => Promise<{ committed: boolean; value: T }>
  ) => Promise<{ committed: boolean; value: T }>;
};

const DRAFT_STORAGE_PREFIX = 'wayland:constitution-draft:';
const inMemoryDrafts = new Map<string, string>();
let persistentDirtyGuardInstalled = false;

function persistentDirtyGuard(event: BeforeUnloadEvent): void {
  if (inMemoryDrafts.size === 0) return;
  event.preventDefault();
  event.returnValue = '';
}

function syncPersistentDirtyGuard(): void {
  if (inMemoryDrafts.size > 0 && !persistentDirtyGuardInstalled) {
    window.addEventListener('beforeunload', persistentDirtyGuard);
    persistentDirtyGuardInstalled = true;
  } else if (inMemoryDrafts.size === 0 && persistentDirtyGuardInstalled) {
    window.removeEventListener('beforeunload', persistentDirtyGuard);
    persistentDirtyGuardInstalled = false;
  }
}

export function constitutionAutosaveDraftKey(
  target: 'main' | `specialist:${string}`,
  isDesktop: boolean,
  userId: string | null | undefined
): string | null {
  if (isDesktop) return `desktop-local:${target}`;
  return userId ? `user:${encodeURIComponent(userId)}:${target}` : null;
}

function storageKey(draftKey: string): string {
  return `${DRAFT_STORAGE_PREFIX}${draftKey}`;
}

export function readSerializedAutosaveDraft(draftKey: string): string | null {
  const memoryDraft = inMemoryDrafts.get(draftKey);
  if (memoryDraft !== undefined) return memoryDraft;
  try {
    const stored = window.localStorage.getItem(storageKey(draftKey));
    if (stored !== null) {
      inMemoryDrafts.set(draftKey, stored);
      syncPersistentDirtyGuard();
    }
    return stored;
  } catch {
    return null;
  }
}

function persistSerializedAutosaveDraft(draftKey: string, value: string): void {
  // The module-level copy survives every SPA unmount even if browser storage is
  // disabled. localStorage adds renderer/app-restart recovery. Keys include the
  // authenticated principal, so a later login cannot inherit another user's
  // dirty Constitution prose.
  inMemoryDrafts.set(draftKey, value);
  syncPersistentDirtyGuard();
  try {
    window.localStorage.setItem(storageKey(draftKey), value);
  } catch {
    // beforeunload remains armed while dirty, so a failed durable mirror cannot
    // turn a reload/window close into silent data loss.
  }
}

export function discardSerializedAutosaveDraft(draftKey: string): void {
  inMemoryDrafts.delete(draftKey);
  syncPersistentDirtyGuard();
  try {
    window.localStorage.removeItem(storageKey(draftKey));
  } catch {
    // The in-memory source was still removed; storage may be unavailable.
  }
}

/**
 * Serial/coalescing autosave. One request runs at a time, the latest queued
 * buffer wins, and an authorization/network failure leaves that buffer queued
 * for explicit unlock/retry instead of silently discarding it.
 */
export function useSerializedAutosave(options: Options): SerializedAutosave {
  const recoveredDraft = useRef(options.draftKey ? readSerializedAutosaveDraft(options.draftKey) : null).current;
  const [saveState, setSaveState] = useState<SaveState>(recoveredDraft === null ? 'idle' : 'error');
  const [isDirty, setIsDirty] = useState(recoveredDraft !== null);
  const mounted = useRef(true);
  const enabled = useRef(options.enabled);
  const save = useRef(options.save);
  const onAuthorizationRequired = useRef(options.onAuthorizationRequired);
  const pending = useRef<string | null>(recoveredDraft);
  const latestDirty = useRef<string | null>(recoveredDraft);
  const inFlight = useRef(false);
  const inFlightPromise = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const destructive = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  enabled.current = options.enabled;
  save.current = options.save;
  onAuthorizationRequired.current = options.onAuthorizationRequired;

  const drain = useCallback(async (): Promise<void> => {
    if (!mounted.current || !enabled.current || destructive.current || inFlight.current || pending.current === null)
      return;

    const value = pending.current;
    const operationGeneration = generation.current;
    pending.current = null;
    inFlight.current = true;
    setSaveState('saving');

    const operation = (async (): Promise<void> => {
      let result: ConstitutionMutationResult;
      try {
        result = await save.current(value);
      } catch {
        result = { ok: false, reason: 'request_failed', status: 0 };
      }
      inFlight.current = false;
      if (!mounted.current || operationGeneration !== generation.current) return;

      if (result.ok === false) {
        // Preserve a newer buffer if one arrived while this request was in flight;
        // otherwise retain the failed value for unlock/retry.
        if (pending.current === null) pending.current = value;
        setIsDirty(true);
        setSaveState('error');
        if (result.reason === 'authorization_required') onAuthorizationRequired.current?.();
        return;
      }

      if (pending.current !== null) {
        void drain();
        return;
      }

      if (options.draftKey) discardSerializedAutosaveDraft(options.draftKey);
      setIsDirty(false);
      latestDirty.current = null;
      setSaveState('saved');
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => {
        if (mounted.current && pending.current === null && !inFlight.current) setSaveState('idle');
      }, options.savedFlashMs);
    })();

    inFlightPromise.current = operation;
    await operation;
    if (inFlightPromise.current === operation) inFlightPromise.current = null;
  }, [options.draftKey, options.savedFlashMs]);

  const queueSave = useCallback(
    (value: string): void => {
      if (destructive.current) return;
      pending.current = value;
      latestDirty.current = value;
      if (options.draftKey) persistSerializedAutosaveDraft(options.draftKey, value);
      setIsDirty(true);
      setSaveState('saving');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => void drain(), options.debounceMs);
    },
    [drain, options.debounceMs, options.draftKey]
  );

  const retry = useCallback((): void => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    void drain();
  }, [drain]);

  const clear = useCallback((): void => {
    generation.current += 1;
    pending.current = null;
    latestDirty.current = null;
    if (options.draftKey) discardSerializedAutosaveDraft(options.draftKey);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setIsDirty(false);
    setSaveState('idle');
  }, [options.draftKey]);

  /**
   * Wait for an already-sent write before running reset/delete. Queued edits
   * are deliberately discarded only after the user confirms the destructive
   * action; generation invalidation prevents a stale completion updating UI.
   */
  const runExclusiveDestructive = useCallback(
    async <T>(action: () => Promise<{ committed: boolean; value: T }>): Promise<{ committed: boolean; value: T }> => {
      const preservedDirty = latestDirty.current;
      destructive.current = true;
      generation.current += 1;
      pending.current = null;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      const active = inFlightPromise.current;
      if (active) await active;

      let result: { committed: boolean; value: T };
      try {
        result = await action();
      } catch (error) {
        pending.current = preservedDirty;
        latestDirty.current = preservedDirty;
        destructive.current = false;
        if (mounted.current) {
          setIsDirty(preservedDirty !== null);
          setSaveState(preservedDirty === null ? 'idle' : 'error');
        }
        throw error;
      }

      destructive.current = false;
      if (result.committed) {
        pending.current = null;
        latestDirty.current = null;
        if (options.draftKey) discardSerializedAutosaveDraft(options.draftKey);
        if (mounted.current) {
          setIsDirty(false);
          setSaveState('idle');
        }
      } else {
        pending.current = preservedDirty;
        latestDirty.current = preservedDirty;
        if (mounted.current) {
          setIsDirty(preservedDirty !== null);
          setSaveState(preservedDirty === null ? 'idle' : 'error');
        }
      }
      return result;
    },
    [options.draftKey]
  );

  useEffect(() => {
    if (options.enabled && pending.current !== null) void drain();
  }, [drain, options.enabled]);

  useEffect(() => {
    if (!isDirty) return;
    const guard = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [isDirty]);

  useEffect(
    () => () => {
      mounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  return { saveState, isDirty, recoveredDraft, queueSave, retry, clear, runExclusiveDestructive };
}
