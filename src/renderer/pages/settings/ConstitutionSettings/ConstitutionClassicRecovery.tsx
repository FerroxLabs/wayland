/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from '@arco-design/web-react';
import { GitMerge, RefreshCw, ShieldCheck } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  parseConstitutionClassicRecoveryDecisionRequest,
  parseConstitutionClassicRecoveryResumeRequest,
  type ConstitutionClassicRecoveryAction,
  type ConstitutionClassicRecoveryDecision,
  type ConstitutionClassicRecoveryMetadataSuccess,
  type ConstitutionClassicRecoveryMutationResult,
} from '@/common/types/constitutionRecovery';
import { isElectronDesktop } from '@renderer/utils/platform';
import {
  decideConstitutionClassicRecoveryHttp,
  getConstitutionClassicRecoveryHttp,
  resumeConstitutionClassicRecoveryHttp,
  runDesktopConstitutionClassicRecoveryMetadata,
  runDesktopConstitutionClassicRecoveryMutation,
} from '@renderer/services/ConstitutionService';
import { withConstitutionRecoveryTransaction } from '@renderer/services/ConstitutionRecoveryOperationLock';
import { createConstitutionRecoveryOperationId } from '@renderer/services/ConstitutionRecoveryOperationId';

const PENDING_CONTRACT = 'wayland-constitution-classic-recovery-client-operation/2.0' as const;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const RFC3339_MILLIS_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const IDENTITY_INVALIDATING_FAILURE_CODES = new Set(['ROLLED_BACK']);
const PENDING_DISCARD_CONFIRMATION = 'RECONCILE PENDING DISCARD';
const MAX_PENDING_OBJECTS = 4096;
const MAX_PENDING_OBJECT_ID_SCALARS = 1024;

type PendingClassicOperation = Readonly<{
  contract: typeof PENDING_CONTRACT;
  operationId: string;
  action: ConstitutionClassicRecoveryAction;
  projectionReceiptSha256: `sha256:${string}`;
  expectedRecoveryRevision: string;
  confirmedObjectIds: readonly string[];
  promotionId: string | null;
  expectedJournalHeadSha256: `sha256:${string}` | null;
  createdAt: string;
}>;

type PendingReadResult =
  | Readonly<{ state: 'absent' }>
  | Readonly<{ state: 'valid'; value: PendingClassicOperation }>
  | Readonly<{ state: 'invalid'; reason: string }>;

class PendingOperationChangedError extends Error {
  constructor(readonly current: PendingReadResult) {
    super('Pending Classic recovery changed. Review and authorize the current operation again.');
    this.name = 'PendingOperationChangedError';
  }
}

type Props = Readonly<{
  principalScope: string;
  executeExclusive: <T>(
    action: () => Promise<{ committed: boolean; value: T }>
  ) => Promise<{ committed: boolean; value: T }>;
  onRestored: () => void;
}>;

function pendingStorageKey(principalScope: string): string {
  return `wayland:constitution:classic-recovery:${encodeURIComponent(principalScope)}`;
}

function canonicalObjectIds(value: unknown): value is readonly string[] {
  if (!Array.isArray(value) || value.length > MAX_PENDING_OBJECTS) return false;
  for (let index = 0; index < value.length; index += 1) {
    const objectId = value[index];
    if (
      typeof objectId !== 'string' ||
      objectId.length === 0 ||
      objectId !== objectId.normalize('NFC') ||
      [...objectId].length > MAX_PENDING_OBJECT_ID_SCALARS ||
      (index > 0 && value[index - 1] >= objectId)
    ) {
      return false;
    }
  }
  return true;
}

function readPending(principalScope: string): PendingReadResult {
  try {
    const raw = localStorage.getItem(pendingStorageKey(principalScope));
    if (raw === null) return { state: 'absent' };
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { state: 'invalid', reason: 'Pending Classic recovery evidence is not an object.' };
    }
    const record = value as Record<string, unknown>;
    const expected = [
      'action',
      'confirmedObjectIds',
      'contract',
      'createdAt',
      'expectedJournalHeadSha256',
      'expectedRecoveryRevision',
      'operationId',
      'projectionReceiptSha256',
      'promotionId',
    ];
    if (Object.keys(record).toSorted().join('\n') !== expected.toSorted().join('\n')) {
      return { state: 'invalid', reason: 'Pending Classic recovery evidence has an unsupported shape.' };
    }
    const requestFactsValid =
      record.action === 'resume'
        ? parseConstitutionClassicRecoveryResumeRequest({
            operationId: record.operationId,
            promotionId: record.promotionId,
            projectionReceiptSha256: record.projectionReceiptSha256,
            expectedRecoveryRevision: record.expectedRecoveryRevision,
            expectedJournalHeadSha256: record.expectedJournalHeadSha256,
            password: 'pending-evidence-validation',
          }) !== null
        : record.action === 'promote' || record.action === 'keep-v2' || record.action === 'discard'
          ? parseConstitutionClassicRecoveryDecisionRequest({
              operationId: record.operationId,
              projectionReceiptSha256: record.projectionReceiptSha256,
              expectedRecoveryRevision: record.expectedRecoveryRevision,
              password: 'pending-evidence-validation',
              decision:
                record.action === 'discard'
                  ? {
                      kind: 'discard',
                      confirmedObjectIds: record.confirmedObjectIds,
                      confirmationText: PENDING_DISCARD_CONFIRMATION,
                    }
                  : { kind: record.action },
            }) !== null
          : false;
    if (
      record.contract !== PENDING_CONTRACT ||
      !requestFactsValid ||
      typeof record.projectionReceiptSha256 !== 'string' ||
      !/^sha256:[a-f0-9]{64}$/.test(record.projectionReceiptSha256) ||
      typeof record.expectedRecoveryRevision !== 'string' ||
      record.expectedRecoveryRevision.length === 0 ||
      !canonicalObjectIds(record.confirmedObjectIds) ||
      (record.action === 'discard') !== record.confirmedObjectIds.length > 0 ||
      (record.promotionId !== null &&
        (typeof record.promotionId !== 'string' || !UUID_V4_PATTERN.test(record.promotionId))) ||
      (record.expectedJournalHeadSha256 !== null &&
        (typeof record.expectedJournalHeadSha256 !== 'string' ||
          !/^sha256:[a-f0-9]{64}$/.test(record.expectedJournalHeadSha256))) ||
      typeof record.createdAt !== 'string' ||
      !RFC3339_MILLIS_PATTERN.test(record.createdAt) ||
      Number.isNaN(Date.parse(record.createdAt))
    ) {
      return { state: 'invalid', reason: 'Pending Classic recovery evidence failed validation.' };
    }
    return { state: 'valid', value: record as PendingClassicOperation };
  } catch {
    return { state: 'invalid', reason: 'Pending Classic recovery evidence could not be read.' };
  }
}

function samePendingOperation(left: PendingClassicOperation, right: PendingClassicOperation): boolean {
  return (
    left.contract === right.contract &&
    left.operationId === right.operationId &&
    left.action === right.action &&
    left.projectionReceiptSha256 === right.projectionReceiptSha256 &&
    left.expectedRecoveryRevision === right.expectedRecoveryRevision &&
    left.confirmedObjectIds.length === right.confirmedObjectIds.length &&
    left.confirmedObjectIds.every((objectId, index) => objectId === right.confirmedObjectIds[index]) &&
    left.promotionId === right.promotionId &&
    left.expectedJournalHeadSha256 === right.expectedJournalHeadSha256 &&
    left.createdAt === right.createdAt
  );
}

async function beginPending(
  principalScope: string,
  metadata: ConstitutionClassicRecoveryMetadataSuccess['data'] | null,
  action: ConstitutionClassicRecoveryAction,
  expectedPending: PendingClassicOperation | null
): Promise<PendingClassicOperation> {
  return withConstitutionRecoveryTransaction(principalScope, () => {
    const existing = readPending(principalScope);
    // Mutable metadata cannot prove that an earlier dispatch did not commit.
    // Preserve its exact request binding until the producer proves a terminal outcome.
    if (expectedPending) {
      if (existing.state === 'valid' && samePendingOperation(existing.value, expectedPending)) return existing.value;
      throw new PendingOperationChangedError(existing);
    }
    if (existing.state !== 'absent') throw new PendingOperationChangedError(existing);
    if (!metadata) throw new Error('Classic recovery metadata is unavailable for a new operation.');
    const pending: PendingClassicOperation = {
      contract: PENDING_CONTRACT,
      operationId: createConstitutionRecoveryOperationId(),
      action,
      projectionReceiptSha256: metadata.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.recoveryRevision,
      confirmedObjectIds: action === 'discard' ? metadata.items.map(({ objectId }) => objectId).toSorted() : [],
      promotionId: metadata.promotionId,
      expectedJournalHeadSha256: metadata.journalHeadSha256,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(pendingStorageKey(principalScope), JSON.stringify(pending));
    return pending;
  });
}

async function clearPendingIfMatching(
  principalScope: string,
  completed: PendingClassicOperation
): Promise<PendingReadResult> {
  return withConstitutionRecoveryTransaction(principalScope, () => {
    const existing = readPending(principalScope);
    if (existing.state !== 'valid' || !samePendingOperation(existing.value, completed)) return existing;
    localStorage.removeItem(pendingStorageKey(principalScope));
    return readPending(principalScope);
  });
}

function stateLabel(state: ConstitutionClassicRecoveryMetadataSuccess['data']['state']): string {
  switch (state) {
    case 'awaiting-decision':
      return 'Classic work is ready to reconcile';
    case 'applying':
      return 'Applying Classic work';
    case 'partial':
      return 'Some Classic work still needs attention';
    case 'conflicted':
      return 'Classic work conflicts with current changes';
    case 'committed':
      return 'Classic work was applied';
    case 'rescued':
      return 'Current v2 was kept; Classic work is preserved';
    case 'discarded':
      return 'Classic changes were discarded';
    default:
      return 'No Classic changes were found';
  }
}

const ConstitutionClassicRecovery: React.FC<Props> = ({ principalScope, executeExclusive, onRestored }) => {
  const isDesktop = isElectronDesktop();
  const [metadata, setMetadata] = useState<ConstitutionClassicRecoveryMetadataSuccess['data'] | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'absent' | 'error'>('loading');
  const [selectedAction, setSelectedAction] = useState<ConstitutionClassicRecoveryAction | null>(null);
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingRead, setPendingRead] = useState<PendingReadResult>(() => readPending(principalScope));

  const load = useCallback(
    async (clearMessage = true): Promise<void> => {
      setLoadState('loading');
      if (clearMessage) setMessage(null);
      try {
        const result = isDesktop
          ? await runDesktopConstitutionClassicRecoveryMetadata(async () => {
              const api = window.electronAPI;
              if (!api?.getConstitutionClassicRecovery) throw new Error('Classic recovery is unavailable.');
              return api.getConstitutionClassicRecovery();
            })
          : await getConstitutionClassicRecoveryHttp();
        if (result.success === false) {
          if (result.error.code === 'OPERATION_NOT_FOUND') {
            setMetadata(null);
            setLoadState('absent');
            return;
          }
          throw new Error(result.error.message);
        }
        setMetadata(result.data);
        setLoadState(result.data.state === 'no-change' ? 'absent' : 'ready');
      } catch (error) {
        setLoadState('error');
        setMessage(error instanceof Error ? error.message : 'Classic recovery metadata could not be loaded.');
      }
    },
    [isDesktop]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPendingRead(readPending(principalScope));
  }, [principalScope]);

  useEffect(() => {
    const key = pendingStorageKey(principalScope);
    const synchronizeFromStorage = (event: StorageEvent): void => {
      if ((event.storageArea && event.storageArea !== localStorage) || event.key !== key) return;
      setPendingRead(readPending(principalScope));
      setSelectedAction(null);
      setPassword('');
      setConfirmationText('');
      setMessage('Pending Classic recovery changed in another window. Review and authorize it again.');
    };
    window.addEventListener('storage', synchronizeFromStorage);
    return () => window.removeEventListener('storage', synchronizeFromStorage);
  }, [principalScope]);

  const pending = pendingRead.state === 'valid' ? pendingRead.value : null;
  const pendingInvalid = pendingRead.state === 'invalid';
  const pendingInvalidMessage = pendingRead.state === 'invalid' ? pendingRead.reason : null;
  const action = pending?.action ?? selectedAction ?? null;

  const submit = useCallback(async (): Promise<void> => {
    if (!action || !password || busy || pendingInvalid || (!pending && !metadata)) return;
    setBusy(true);
    setMessage(null);
    try {
      const current = await beginPending(principalScope, metadata, action, pending);
      setPendingRead({ state: 'valid', value: current });
      const exclusive = await executeExclusive(async () => {
        let result: ConstitutionClassicRecoveryMutationResult;
        if (current.action === 'resume') {
          if (!current.promotionId || !current.expectedJournalHeadSha256) {
            throw new Error('Classic recovery resume facts changed. Refresh and try again.');
          }
          const request = {
            operationId: current.operationId,
            promotionId: current.promotionId,
            projectionReceiptSha256: current.projectionReceiptSha256,
            expectedRecoveryRevision: current.expectedRecoveryRevision,
            expectedJournalHeadSha256: current.expectedJournalHeadSha256,
            password,
          };
          result = isDesktop
            ? await runDesktopConstitutionClassicRecoveryMutation(async () => {
                const api = window.electronAPI;
                if (!api?.resumeConstitutionClassicRecovery) throw new Error('Classic recovery is unavailable.');
                return api.resumeConstitutionClassicRecovery(request);
              })
            : await resumeConstitutionClassicRecoveryHttp(request);
        } else {
          const decision: ConstitutionClassicRecoveryDecision =
            current.action === 'discard'
              ? {
                  kind: 'discard',
                  confirmedObjectIds: current.confirmedObjectIds,
                  confirmationText,
                }
              : { kind: current.action };
          const request = {
            operationId: current.operationId,
            projectionReceiptSha256: current.projectionReceiptSha256,
            expectedRecoveryRevision: current.expectedRecoveryRevision,
            password,
            decision,
          };
          result = isDesktop
            ? await runDesktopConstitutionClassicRecoveryMutation(async () => {
                const api = window.electronAPI;
                if (!api?.decideConstitutionClassicRecovery) throw new Error('Classic recovery is unavailable.');
                return api.decideConstitutionClassicRecovery(request);
              })
            : await decideConstitutionClassicRecoveryHttp(request);
        }
        return { committed: result.success, value: result };
      });
      const result = exclusive.value;
      setPassword('');
      setConfirmationText('');
      if (result.success === false) {
        setMessage(result.error.message);
        if (!result.error.retryable && IDENTITY_INVALIDATING_FAILURE_CODES.has(result.error.code)) {
          const nextPending = await clearPendingIfMatching(principalScope, current);
          setPendingRead(nextPending);
          if (nextPending.state !== 'absent') {
            setMessage(`${result.error.message} Another pending operation was preserved for review.`);
          }
        }
        await load(false);
        return;
      }
      const nextPending = await clearPendingIfMatching(principalScope, current);
      setPendingRead(nextPending);
      setSelectedAction(null);
      setMessage(
        nextPending.state === 'absent'
          ? 'Classic recovery completed with a durable receipt.'
          : 'Classic recovery completed with a durable receipt. Another pending operation was preserved for review.'
      );
      onRestored();
      await load(false);
    } catch (error) {
      // Network/response loss retains the exact operation identity for replay.
      setPassword('');
      setConfirmationText('');
      if (error instanceof PendingOperationChangedError) {
        setPendingRead(error.current);
        setSelectedAction(null);
      }
      setMessage(error instanceof Error ? error.message : 'Classic recovery did not complete.');
    } finally {
      setBusy(false);
    }
  }, [
    action,
    busy,
    confirmationText,
    executeExclusive,
    isDesktop,
    load,
    metadata,
    onRestored,
    password,
    pending,
    pendingInvalid,
    principalScope,
  ]);

  if (loadState === 'absent' && !pending && !pendingInvalid) return null;
  if (loadState === 'error' && !pending && !pendingInvalid) {
    return (
      <section role='alert' className='rd-12px border border-solid border-danger p-14px text-12px text-danger'>
        {message}
      </section>
    );
  }

  const visibleActions = pending ? [pending.action] : (metadata?.allowedActions ?? []);
  const discardConfirmation = pending ? PENDING_DISCARD_CONFIRMATION : metadata?.discardChallenge;
  const actionAvailable = action !== null && (pending !== null || metadata?.allowedActions.includes(action) === true);

  return (
    <section
      aria-labelledby='constitution-classic-recovery-heading'
      className='rd-12px border border-solid border-[var(--color-border-2)] bg-[var(--color-bg-2)] p-14px flex flex-col gap-12px'
    >
      <div className='flex items-start justify-between gap-12px'>
        <div className='flex flex-col gap-3px'>
          <div
            id='constitution-classic-recovery-heading'
            className='text-14px font-medium text-t-primary flex items-center gap-7px'
          >
            <GitMerge size={16} aria-hidden />
            Classic session recovery
          </div>
          <div className='text-12px text-t-secondary'>
            Reconcile work made in Classic with the current Constitution. Nothing is silently overwritten.
          </div>
        </div>
        <Button
          type='text'
          size='small'
          icon={<RefreshCw size={14} />}
          aria-label='Refresh Classic recovery'
          loading={loadState === 'loading'}
          onClick={() => void load()}
        />
      </div>

      {pendingInvalid && (
        <div role='alert' className='rd-8px border border-solid border-danger p-10px text-12px text-danger'>
          {pendingInvalidMessage} No recovery action will run or replace this operation. Preserve the local evidence and
          contact support for supervised recovery.
        </div>
      )}

      {metadata && (
        <>
          <div className='rd-8px bg-fill-1 p-10px flex flex-col gap-5px'>
            <div className='text-12px font-medium text-t-primary'>{stateLabel(metadata.state)}</div>
            {metadata.items.map((item) => (
              <div key={item.objectId} className='text-11px text-t-secondary flex justify-between gap-10px'>
                <span>{item.objectId}</span>
                <span>
                  {item.state === 'conflicted'
                    ? (item.conflictCode ?? 'conflict')
                    : `${item.operation} · ${item.state}`}
                </span>
              </div>
            ))}
          </div>

          {metadata.rescue && (
            <div className='text-11px text-t-secondary flex items-start gap-7px'>
              <ShieldCheck size={14} className='mt-1px shrink-0' aria-hidden />
              <span>
                An authenticated encrypted local rescue is retained ({metadata.rescue.bytes.toLocaleString()} bytes). It
                is not automatically deleted or exported.
              </span>
            </div>
          )}
        </>
      )}

      {!pendingInvalid && visibleActions.length > 0 && (
        <div className='flex flex-wrap gap-8px'>
          {visibleActions.map((candidate) => (
            <Button
              key={candidate}
              size='small'
              type={action === candidate ? 'primary' : 'secondary'}
              status={candidate === 'discard' ? 'danger' : undefined}
              disabled={busy}
              onClick={() => {
                setSelectedAction(candidate);
                setPassword('');
                setConfirmationText('');
                setMessage(null);
              }}
            >
              {candidate === 'promote'
                ? 'Apply Classic work'
                : candidate === 'keep-v2'
                  ? 'Keep current and preserve Classic'
                  : candidate === 'discard'
                    ? 'Discard Classic changes'
                    : 'Resume remaining work'}
            </Button>
          ))}
        </div>
      )}

      {!pendingInvalid && actionAvailable && (
        <div className='rd-8px bg-fill-1 p-10px flex flex-col gap-8px'>
          {action === 'discard' && (
            <>
              <div className='text-11px text-danger'>
                {pending
                  ? 'Re-authorize reconciliation of the already-confirmed discard. This does not start a new discard.'
                  : 'Type the exact confirmation below. Discard is available only before any item commits.'}
              </div>
              <code className='text-10px break-all select-all'>{discardConfirmation}</code>
              <Input
                value={confirmationText}
                onChange={setConfirmationText}
                placeholder='Exact discard confirmation'
                disabled={busy}
              />
            </>
          )}
          <Input.Password
            value={password}
            onChange={setPassword}
            placeholder='Current Wayland password'
            autoComplete='current-password'
            disabled={busy}
          />
          <div className='flex justify-end gap-8px'>
            {!pending && (
              <Button
                size='small'
                disabled={busy}
                onClick={() => {
                  setSelectedAction(null);
                  setPassword('');
                  setConfirmationText('');
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type='primary'
              status={action === 'discard' ? 'danger' : undefined}
              size='small'
              loading={busy}
              disabled={!password || (action === 'discard' && confirmationText !== discardConfirmation)}
              onClick={() => void submit()}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}

      {message && (
        <div role='status' className='text-12px text-t-secondary'>
          {message}
        </div>
      )}
    </section>
  );
};

export default ConstitutionClassicRecovery;
