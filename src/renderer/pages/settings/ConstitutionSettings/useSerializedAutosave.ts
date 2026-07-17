/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { SaveState } from '@renderer/components/settings/shared/feedback/SavedIndicator';
import type { ConstitutionMutationResult } from '@renderer/services/ConstitutionService';

export type ConstitutionAutosaveTarget = { kind: 'constitution' } | { kind: 'specialist'; specialistId: string };

type PendingOperation = {
  kind: 'replace';
  target: ConstitutionAutosaveTarget;
  expectedRevision: string;
  value: string;
  contentDigest: `sha256:${string}`;
  requestId: string;
  requestFingerprint: `sha256:${string}`;
};
type PersistedDraftState = { latest: PendingOperation; uncertain?: PendingOperation };

type Options = {
  enabled: boolean;
  debounceMs: number;
  savedFlashMs: number;
  target: ConstitutionAutosaveTarget;
  getExpectedRevision: () => string | null;
  save: (
    value: string,
    expectedRevision: string,
    requestId: string,
    requestFingerprint: `sha256:${string}`
  ) => Promise<ConstitutionMutationResult>;
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
const SINGLE_SHOT_STORAGE_PREFIX = 'wayland:constitution-mutation:';
const DRAFT_RECORD_PREFIX = 'wayland-autosave-v3:';
const LEGACY_DRAFT_RECORD_PREFIX = 'wayland-autosave-v1:';
const inMemoryDrafts = new Map<string, PersistedDraftState>();
let persistentDirtyGuardInstalled = false;

export function createConstitutionMutationRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('Secure mutation identifiers are unavailable in this renderer.');
  }
  return globalThis.crypto.randomUUID();
}

type ConstitutionSingleShotMutationBase = Readonly<{
  target: string;
  expectedRevision: string;
  requestFingerprint: `sha256:${string}`;
}>;

export type ConstitutionSingleShotMutation = Readonly<
  | (ConstitutionSingleShotMutationBase & {
      action: 'reset' | 'delete';
      requestId: string;
    })
  | (ConstitutionSingleShotMutationBase & {
      action: 'create';
      contentDigest: `sha256:${string}`;
      requestId: string;
    })
  | (ConstitutionSingleShotMutationBase & {
      action: 'overwrite';
      contentDigest: `sha256:${string}`;
      draftKey: string;
      requestId: string;
    })
>;

export type ConstitutionSingleShotMutationFacts = Readonly<
  | Omit<Extract<ConstitutionSingleShotMutation, { action: 'reset' | 'delete' }>, 'requestId'>
  | Omit<Extract<ConstitutionSingleShotMutation, { action: 'create' }>, 'requestId'>
  | Omit<Extract<ConstitutionSingleShotMutation, { action: 'overwrite' }>, 'requestId'>
>;

const CONTENT_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function constitutionMutationContentDigest(content: string): `sha256:${string}` {
  return `sha256:${bytesToHex(sha256(new TextEncoder().encode(content)))}`;
}

function nativeMutationTarget(target: ConstitutionAutosaveTarget): Record<string, string> {
  return target.kind === 'constitution'
    ? { kind: 'constitution', sourceName: 'CONSTITUTION.md' }
    : {
        kind: 'specialist',
        specialistId: target.specialistId,
        sourceName: `${target.specialistId}.md`,
      };
}

export function constitutionMutationRequestFingerprint(
  target: ConstitutionAutosaveTarget,
  content: string | null,
  expectedRevision: string
): `sha256:${string}` {
  return constitutionMutationContentDigest(
    JSON.stringify({ target: nativeMutationTarget(target), content, expectedRevision })
  );
}

function exactOwnKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(record).toSorted();
  const sortedExpected = [...expected].toSorted();
  return actual.length === sortedExpected.length && actual.every((key, index) => key === sortedExpected[index]);
}

function sameSingleShotFacts(
  existing: ConstitutionSingleShotMutation,
  proposed: ConstitutionSingleShotMutationFacts
): boolean {
  if (
    existing.action !== proposed.action ||
    existing.target !== proposed.target ||
    existing.expectedRevision !== proposed.expectedRevision ||
    existing.requestFingerprint !== proposed.requestFingerprint
  ) {
    return false;
  }
  if (existing.action === 'create' && proposed.action === 'create') {
    return existing.contentDigest === proposed.contentDigest;
  }
  if (existing.action === 'overwrite' && proposed.action === 'overwrite') {
    return existing.contentDigest === proposed.contentDigest && existing.draftKey === proposed.draftKey;
  }
  return true;
}

export function resolveConstitutionSingleShotContent(
  operation: Extract<ConstitutionSingleShotMutation, { action: 'create' | 'overwrite' }>,
  fixedContent?: string
): string {
  const content = operation.action === 'overwrite' ? readSerializedAutosaveDraft(operation.draftKey) : fixedContent;
  if (content === null || content === undefined) {
    throw new Error('The pending Constitution operation has lost its durable draft.');
  }
  if (constitutionMutationContentDigest(content) !== operation.contentDigest) {
    throw new Error('The pending Constitution operation draft no longer matches its authenticated facts.');
  }
  return content;
}

export function constitutionSingleShotMutationKey(
  action: ConstitutionSingleShotMutation['action'],
  target: string,
  isDesktop: boolean,
  userId: string | null | undefined
): string | null {
  const principal = isDesktop ? 'desktop-local' : userId ? `user:${encodeURIComponent(userId)}` : null;
  return principal ? `${principal}:${action}:${encodeURIComponent(target)}` : null;
}

function validSingleShotMutation(value: unknown): value is ConstitutionSingleShotMutation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const baseValid =
    typeof record.target === 'string' &&
    typeof record.expectedRevision === 'string' &&
    typeof record.requestId === 'string' &&
    UUID_PATTERN.test(record.requestId) &&
    typeof record.requestFingerprint === 'string' &&
    CONTENT_DIGEST_PATTERN.test(record.requestFingerprint);
  if (!baseValid) return false;
  if (record.action === 'reset' || record.action === 'delete') {
    return exactOwnKeys(record, ['action', 'target', 'expectedRevision', 'requestFingerprint', 'requestId']);
  }
  if (record.action === 'create') {
    return (
      typeof record.contentDigest === 'string' &&
      CONTENT_DIGEST_PATTERN.test(record.contentDigest) &&
      exactOwnKeys(record, ['action', 'target', 'expectedRevision', 'requestFingerprint', 'contentDigest', 'requestId'])
    );
  }
  if (record.action === 'overwrite') {
    return (
      typeof record.contentDigest === 'string' &&
      CONTENT_DIGEST_PATTERN.test(record.contentDigest) &&
      typeof record.draftKey === 'string' &&
      record.draftKey.length > 0 &&
      exactOwnKeys(record, [
        'action',
        'target',
        'expectedRevision',
        'requestFingerprint',
        'contentDigest',
        'draftKey',
        'requestId',
      ])
    );
  }
  return false;
}

export function readConstitutionSingleShotMutation(key: string): ConstitutionSingleShotMutation | null {
  try {
    const raw = window.localStorage.getItem(`${SINGLE_SHOT_STORAGE_PREFIX}${key}`);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!validSingleShotMutation(parsed)) throw new Error('The pending Constitution operation record is invalid.');
    return parsed;
  } catch (error) {
    throw new Error('The pending Constitution operation cannot be authenticated for replay.', { cause: error });
  }
}

export function beginConstitutionSingleShotMutation(
  key: string,
  facts: ConstitutionSingleShotMutationFacts
): ConstitutionSingleShotMutation {
  const existing = readConstitutionSingleShotMutation(key);
  if (existing) {
    if (!sameSingleShotFacts(existing, facts)) {
      throw new Error('A different unresolved Constitution operation already owns this action.');
    }
    return existing;
  }
  const operation = { ...facts, requestId: createConstitutionMutationRequestId() };
  try {
    // This durable write intentionally precedes dispatch. Failure is terminal:
    // sending without a recoverable identity would make response loss unsafe.
    window.localStorage.setItem(`${SINGLE_SHOT_STORAGE_PREFIX}${key}`, JSON.stringify(operation));
  } catch (error) {
    throw new Error('The Constitution operation could not be made crash-safe before dispatch.', { cause: error });
  }
  return operation;
}

export function completeConstitutionSingleShotMutation(
  key: string,
  receipt: Extract<ConstitutionMutationResult, { ok: true }>
): void {
  const existing = readConstitutionSingleShotMutation(key);
  if (
    !existing ||
    existing.requestId !== receipt.requestId ||
    existing.requestFingerprint !== receipt.requestFingerprint
  ) {
    throw new Error('The Constitution operation receipt does not match the pending operation.');
  }
  window.localStorage.removeItem(`${SINGLE_SHOT_STORAGE_PREFIX}${key}`);
}

/** Clear only a definitively non-committed operation after an exact CAS conflict. */
export function abandonConstitutionSingleShotMutation(
  key: string,
  requestId: string,
  requestFingerprint: `sha256:${string}`
): void {
  const existing = readConstitutionSingleShotMutation(key);
  if (!existing || existing.requestId !== requestId || existing.requestFingerprint !== requestFingerprint) {
    throw new Error('The Constitution operation being abandoned does not match durable state.');
  }
  const storageLocation = `${SINGLE_SHOT_STORAGE_PREFIX}${key}`;
  window.localStorage.removeItem(storageLocation);
  if (window.localStorage.getItem(storageLocation) !== null) {
    throw new Error('The conflicted Constitution operation could not be cleared safely.');
  }
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
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (
    !exactOwnKeys(record, [
      'kind',
      'target',
      'expectedRevision',
      'value',
      'contentDigest',
      'requestId',
      'requestFingerprint',
    ]) ||
    record.kind !== 'replace' ||
    typeof record.expectedRevision !== 'string' ||
    typeof record.value !== 'string' ||
    typeof record.contentDigest !== 'string' ||
    !CONTENT_DIGEST_PATTERN.test(record.contentDigest) ||
    constitutionMutationContentDigest(record.value) !== record.contentDigest ||
    typeof record.requestId !== 'string' ||
    !UUID_PATTERN.test(record.requestId) ||
    typeof record.requestFingerprint !== 'string' ||
    !CONTENT_DIGEST_PATTERN.test(record.requestFingerprint)
  ) {
    return false;
  }
  const target = record.target;
  if (!target || typeof target !== 'object' || Array.isArray(target)) return false;
  const targetRecord = target as Record<string, unknown>;
  if (targetRecord.kind === 'constitution') {
    if (!exactOwnKeys(targetRecord, ['kind'])) return false;
  } else if (
    targetRecord.kind !== 'specialist' ||
    typeof targetRecord.specialistId !== 'string' ||
    !exactOwnKeys(targetRecord, ['kind', 'specialistId'])
  ) {
    return false;
  }
  return (
    constitutionMutationRequestFingerprint(
      target as ConstitutionAutosaveTarget,
      record.value,
      record.expectedRevision
    ) === record.requestFingerprint
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
      } else if (stored.startsWith(LEGACY_DRAFT_RECORD_PREFIX)) return null;
      else return null;
      inMemoryDrafts.set(draftKey, state);
      syncPersistentDirtyGuard();
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

function persistSerializedAutosaveDraft(draftKey: string, state: PersistedDraftState): boolean {
  // The module-level copy survives every SPA unmount even if browser storage is
  // disabled. localStorage adds renderer/app-restart recovery. Keys include the
  // authenticated principal, so a later login cannot inherit another user's
  // dirty Constitution prose.
  inMemoryDrafts.set(draftKey, state);
  syncPersistentDirtyGuard();
  try {
    const serialized = `${DRAFT_RECORD_PREFIX}${JSON.stringify(state)}`;
    window.localStorage.setItem(storageKey(draftKey), serialized);
    return window.localStorage.getItem(storageKey(draftKey)) === serialized;
  } catch {
    return false;
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
  const durabilityBlocked = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  enabled.current = options.enabled;
  save.current = options.save;
  onAuthorizationRequired.current = options.onAuthorizationRequired;
  onConflict.current = options.onConflict;
  onCommitted.current = options.onCommitted;

  const persistOutstanding = useCallback((): boolean => {
    if (!options.draftKey || !latestDirty.current) return false;
    return persistSerializedAutosaveDraft(options.draftKey, {
      latest: latestDirty.current,
      ...(uncertain.current ? { uncertain: uncertain.current } : {}),
    });
  }, [options.draftKey]);

  const drain = useCallback(async (): Promise<void> => {
    if (!mounted.current || !enabled.current || destructive.current || inFlight.current || durabilityBlocked.current)
      return;

    const replayingUncertain = uncertain.current !== null;
    const pendingOperation = uncertain.current ?? pending.current;
    if (!pendingOperation) return;
    const { value, expectedRevision, requestId, requestFingerprint } = pendingOperation;
    const operationGeneration = generation.current;
    // Persist the operation as outcome-unknown before crossing the process or
    // network boundary. A renderer crash/unmount can happen while the promise
    // is unresolved; recording uncertainty only after a rejected response is
    // too late to preserve the exact replay identity in that window.
    uncertain.current = pendingOperation;
    if (!persistOutstanding()) {
      durabilityBlocked.current = true;
      setIsDirty(true);
      setSaveState('error');
      return;
    }
    if (!replayingUncertain) pending.current = null;
    inFlight.current = true;
    setSaveState('saving');

    const operation = (async (): Promise<void> => {
      let result: ConstitutionMutationResult;
      try {
        result = await save.current(value, expectedRevision, requestId, requestFingerprint);
      } catch {
        result = { ok: false, reason: 'request_failed', status: 0 };
      }
      inFlight.current = false;
      if (!mounted.current || operationGeneration !== generation.current) return;

      if (result.ok === false) {
        // A transport failure may hide a committed write. Replay this exact
        // operation identity before allowing a newer coalesced buffer to advance.
        // Authorization and CAS failures are definitive non-commits.
        if (result.reason !== 'request_failed') {
          uncertain.current = null;
          if (pending.current === null) pending.current = pendingOperation;
        }
        persistOutstanding();
        setIsDirty(true);
        setSaveState('error');
        if (result.reason === 'authorization_required') onAuthorizationRequired.current?.();
        if (result.reason === 'conflict') onConflict.current?.();
        return;
      }

      if (result.requestId !== requestId || result.requestFingerprint !== requestFingerprint) {
        persistOutstanding();
        setIsDirty(true);
        setSaveState('error');
        return;
      }

      uncertain.current = null;
      onCommitted.current?.(result, value);

      if (pending.current !== null) {
        // A buffer queued while this request was in flight was necessarily
        // bound to the pre-commit revision. It has never crossed the authority
        // boundary, so rebase it onto the authenticated receipt and mint a new
        // identity before dispatch. Reusing its stale CAS would turn normal
        // typing during autosave into a guaranteed conflict.
        const queued = pending.current;
        if (queued.expectedRevision !== result.revision) {
          const rebased: PendingOperation = {
            ...queued,
            expectedRevision: result.revision,
            requestId: createConstitutionMutationRequestId(),
            requestFingerprint: constitutionMutationRequestFingerprint(queued.target, queued.value, result.revision),
          };
          pending.current = rebased;
          latestDirty.current = rebased;
        }
        if (!persistOutstanding()) {
          durabilityBlocked.current = true;
          setIsDirty(true);
          setSaveState('error');
          return;
        }
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
      const expectedRevision = options.getExpectedRevision();
      if (!options.draftKey || !expectedRevision) {
        setIsDirty(true);
        setSaveState('error');
        return;
      }
      const requestId = createConstitutionMutationRequestId();
      const operation: PendingOperation = {
        kind: 'replace',
        target: options.target,
        expectedRevision,
        value,
        contentDigest: constitutionMutationContentDigest(value),
        requestId,
        requestFingerprint: constitutionMutationRequestFingerprint(options.target, value, expectedRevision),
      };
      pending.current = operation;
      latestDirty.current = operation;
      setIsDirty(true);
      if (!persistOutstanding()) {
        durabilityBlocked.current = true;
        setSaveState('error');
        return;
      }
      setSaveState('saving');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => void drain(), options.debounceMs);
    },
    [drain, options.debounceMs, options.draftKey, options.getExpectedRevision, options.target, persistOutstanding]
  );

  const retry = useCallback((): void => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    durabilityBlocked.current = false;
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
