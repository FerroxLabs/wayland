/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SaveState } from '@renderer/components/settings/shared/feedback/SavedIndicator';
import type { ConstitutionMutationResult } from '@renderer/services/ConstitutionService';

type PendingOperation = { value: string; requestId: string };
type PersistedDraftState = { latest: PendingOperation; uncertain?: PendingOperation };

type Options = {
  enabled: boolean;
  debounceMs: number;
  savedFlashMs: number;
  save: (value: string, requestId: string) => Promise<ConstitutionMutationResult>;
  onAuthorizationRequired?: () => void;
  onConflict?: () => void;
  onCommitted?: (result: Extract<ConstitutionMutationResult, { ok: true }>, value: string) => void;
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
const DRAFT_RECORD_PREFIX = 'wayland-autosave-v2:';
const LEGACY_DRAFT_RECORD_PREFIX = 'wayland-autosave-v1:';
const inMemoryDrafts = new Map<string, PersistedDraftState>();
let persistentDirtyGuardInstalled = false;

export function createConstitutionMutationRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('Secure mutation identifiers are unavailable in this renderer.');
  }
  return globalThis.crypto.randomUUID();
}

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
  return readSerializedAutosaveState(draftKey)?.latest.value ?? null;
}

function validOperation(value: unknown): value is PendingOperation {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as { value?: unknown }).value === 'string' &&
    typeof (value as { requestId?: unknown }).requestId === 'string'
  );
}

function readSerializedAutosaveState(draftKey: string): PersistedDraftState | null {
  const memoryDraft = inMemoryDrafts.get(draftKey);
  if (memoryDraft !== undefined) return memoryDraft;
  try {
    const stored = window.localStorage.getItem(storageKey(draftKey));
    if (stored !== null) {
      let state: PersistedDraftState;
      if (stored.startsWith(DRAFT_RECORD_PREFIX)) {
        const parsed = JSON.parse(stored.slice(DRAFT_RECORD_PREFIX.length)) as {
          latest?: unknown;
          uncertain?: unknown;
        };
        if (!validOperation(parsed.latest) || (parsed.uncertain !== undefined && !validOperation(parsed.uncertain))) {
          return null;
        }
        state =
          parsed.uncertain === undefined
            ? { latest: parsed.latest }
            : { latest: parsed.latest, uncertain: parsed.uncertain as PendingOperation };
      } else if (stored.startsWith(LEGACY_DRAFT_RECORD_PREFIX)) {
        const parsed = JSON.parse(stored.slice(LEGACY_DRAFT_RECORD_PREFIX.length)) as unknown;
        if (!validOperation(parsed)) return null;
        state = { latest: parsed };
      } else {
        // Migrate the pre-idempotency draft format on its next persistence.
        state = { latest: { value: stored, requestId: createConstitutionMutationRequestId() } };
      }
      inMemoryDrafts.set(draftKey, state);
      syncPersistentDirtyGuard();
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

function persistSerializedAutosaveDraft(draftKey: string, state: PersistedDraftState): void {
  // The module-level copy survives every SPA unmount even if browser storage is
  // disabled. localStorage adds renderer/app-restart recovery. Keys include the
  // authenticated principal, so a later login cannot inherit another user's
  // dirty Constitution prose.
  inMemoryDrafts.set(draftKey, state);
  syncPersistentDirtyGuard();
  try {
    window.localStorage.setItem(storageKey(draftKey), `${DRAFT_RECORD_PREFIX}${JSON.stringify(state)}`);
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
  const recoveredState = useRef(options.draftKey ? readSerializedAutosaveState(options.draftKey) : null).current;
  const recoveredDraft = recoveredState?.latest.value ?? null;
  const [saveState, setSaveState] = useState<SaveState>(recoveredState === null ? 'idle' : 'error');
  const [isDirty, setIsDirty] = useState(recoveredState !== null);
  const mounted = useRef(true);
  const enabled = useRef(options.enabled);
  const save = useRef(options.save);
  const onAuthorizationRequired = useRef(options.onAuthorizationRequired);
  const onConflict = useRef(options.onConflict);
  const onCommitted = useRef(options.onCommitted);
  const recoveredUncertain = recoveredState?.uncertain ?? null;
  const pending = useRef<PendingOperation | null>(
    recoveredUncertain?.requestId === recoveredState?.latest.requestId ? null : (recoveredState?.latest ?? null)
  );
  const uncertain = useRef<PendingOperation | null>(recoveredUncertain);
  const latestDirty = useRef<PendingOperation | null>(recoveredState?.latest ?? null);
  const inFlight = useRef(false);
  const inFlightPromise = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const destructive = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  enabled.current = options.enabled;
  save.current = options.save;
  onAuthorizationRequired.current = options.onAuthorizationRequired;
  onConflict.current = options.onConflict;
  onCommitted.current = options.onCommitted;

  const persistOutstanding = useCallback((): void => {
    if (!options.draftKey || !latestDirty.current) return;
    persistSerializedAutosaveDraft(options.draftKey, {
      latest: latestDirty.current,
      ...(uncertain.current ? { uncertain: uncertain.current } : {}),
    });
  }, [options.draftKey]);

  const drain = useCallback(async (): Promise<void> => {
    if (!mounted.current || !enabled.current || destructive.current || inFlight.current) return;

    const replayingUncertain = uncertain.current !== null;
    const pendingOperation = uncertain.current ?? pending.current;
    if (!pendingOperation) return;
    const { value, requestId } = pendingOperation;
    const operationGeneration = generation.current;
    if (replayingUncertain) uncertain.current = null;
    else pending.current = null;
    inFlight.current = true;
    setSaveState('saving');

    const operation = (async (): Promise<void> => {
      let result: ConstitutionMutationResult;
      try {
        result = await save.current(value, requestId);
      } catch {
        result = { ok: false, reason: 'request_failed', status: 0 };
      }
      inFlight.current = false;
      if (!mounted.current || operationGeneration !== generation.current) return;

      if (result.ok === false) {
        // A transport failure may hide a committed write. Replay this exact
        // operation identity before allowing a newer coalesced buffer to advance.
        // Authorization and CAS failures are definitive non-commits.
        if (result.reason === 'request_failed') uncertain.current = pendingOperation;
        else if (pending.current === null) pending.current = pendingOperation;
        persistOutstanding();
        setIsDirty(true);
        setSaveState('error');
        if (result.reason === 'authorization_required') onAuthorizationRequired.current?.();
        if (result.reason === 'conflict') onConflict.current?.();
        return;
      }

      onCommitted.current?.(result, value);

      if (pending.current !== null || uncertain.current !== null) {
        persistOutstanding();
        void drain();
        return;
      }

      if (options.draftKey) discardSerializedAutosaveDraft(options.draftKey);
      setIsDirty(false);
      latestDirty.current = null;
      setSaveState('saved');
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => {
        if (mounted.current && pending.current === null && uncertain.current === null && !inFlight.current)
          setSaveState('idle');
      }, options.savedFlashMs);
    })();

    inFlightPromise.current = operation;
    await operation;
    if (inFlightPromise.current === operation) inFlightPromise.current = null;
  }, [options.draftKey, options.savedFlashMs, persistOutstanding]);

  const queueSave = useCallback(
    (value: string): void => {
      if (destructive.current) return;
      const operation = { value, requestId: createConstitutionMutationRequestId() };
      pending.current = operation;
      latestDirty.current = operation;
      persistOutstanding();
      setIsDirty(true);
      setSaveState('saving');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => void drain(), options.debounceMs);
    },
    [drain, options.debounceMs, persistOutstanding]
  );

  const retry = useCallback((): void => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    void drain();
  }, [drain]);

  const clear = useCallback((): void => {
    generation.current += 1;
    pending.current = null;
    uncertain.current = null;
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
      pending.current = null;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      const active = inFlightPromise.current;
      if (active) await active;
      if (uncertain.current) {
        destructive.current = false;
        pending.current = preservedDirty?.requestId === uncertain.current.requestId ? null : preservedDirty;
        persistOutstanding();
        if (mounted.current) {
          setIsDirty(true);
          setSaveState('error');
        }
        throw new Error('The previous save outcome is uncertain. Retry the save before a destructive action.');
      }
      // Let an already-sent successful write publish its returned revision
      // before the destructive CAS begins. Nothing new can drain while the
      // destructive flag is set; bumping the generation afterwards invalidates
      // any obsolete queued work without hiding the committed revision.
      generation.current += 1;

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
    [options.draftKey, persistOutstanding]
  );

  useEffect(() => {
    if (options.enabled && (pending.current !== null || uncertain.current !== null)) void drain();
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
