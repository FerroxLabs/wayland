/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from '@arco-design/web-react';
import { GitMerge, RefreshCw, ShieldCheck } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ConstitutionClassicRecoveryAction,
  ConstitutionClassicRecoveryDecision,
  ConstitutionClassicRecoveryMetadataSuccess,
  ConstitutionClassicRecoveryMutationResult,
} from '@/common/types/constitutionRecovery';
import { isElectronDesktop } from '@renderer/utils/platform';
import {
  decideConstitutionClassicRecoveryHttp,
  getConstitutionClassicRecoveryHttp,
  resumeConstitutionClassicRecoveryHttp,
  runDesktopConstitutionClassicRecoveryMetadata,
  runDesktopConstitutionClassicRecoveryMutation,
} from '@renderer/services/ConstitutionService';

const PENDING_CONTRACT = 'wayland-constitution-classic-recovery-client-operation/1.0' as const;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const IDENTITY_INVALIDATING_FAILURE_CODES = new Set(['ROLLED_BACK']);

type PendingClassicOperation = Readonly<{
  contract: typeof PENDING_CONTRACT;
  operationId: string;
  action: ConstitutionClassicRecoveryAction;
  projectionReceiptSha256: `sha256:${string}`;
  expectedRecoveryRevision: string;
  promotionId: string | null;
  expectedJournalHeadSha256: `sha256:${string}` | null;
  createdAt: string;
}>;

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

function readPending(principalScope: string): PendingClassicOperation | null {
  try {
    const value = JSON.parse(localStorage.getItem(pendingStorageKey(principalScope)) ?? 'null') as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const expected = [
      'action',
      'contract',
      'createdAt',
      'expectedJournalHeadSha256',
      'expectedRecoveryRevision',
      'operationId',
      'projectionReceiptSha256',
      'promotionId',
    ];
    if (Object.keys(record).toSorted().join('\n') !== expected.toSorted().join('\n')) return null;
    if (
      record.contract !== PENDING_CONTRACT ||
      typeof record.operationId !== 'string' ||
      !UUID_V4_PATTERN.test(record.operationId) ||
      !['promote', 'keep-v2', 'discard', 'resume'].includes(String(record.action)) ||
      typeof record.projectionReceiptSha256 !== 'string' ||
      !/^sha256:[a-f0-9]{64}$/.test(record.projectionReceiptSha256) ||
      typeof record.expectedRecoveryRevision !== 'string' ||
      record.expectedRecoveryRevision.length === 0 ||
      (record.promotionId !== null &&
        (typeof record.promotionId !== 'string' || !UUID_V4_PATTERN.test(record.promotionId))) ||
      (record.expectedJournalHeadSha256 !== null &&
        (typeof record.expectedJournalHeadSha256 !== 'string' ||
          !/^sha256:[a-f0-9]{64}$/.test(record.expectedJournalHeadSha256))) ||
      typeof record.createdAt !== 'string' ||
      Number.isNaN(Date.parse(record.createdAt))
    ) {
      return null;
    }
    return record as PendingClassicOperation;
  } catch {
    return null;
  }
}

function beginPending(
  principalScope: string,
  metadata: ConstitutionClassicRecoveryMetadataSuccess['data'],
  action: ConstitutionClassicRecoveryAction
): PendingClassicOperation {
  const existing = readPending(principalScope);
  // Mutable metadata cannot prove that an earlier dispatch did not commit.
  // Preserve its exact request binding until the producer proves a terminal outcome.
  if (existing) return existing;
  const pending: PendingClassicOperation = {
    contract: PENDING_CONTRACT,
    operationId: crypto.randomUUID(),
    action,
    projectionReceiptSha256: metadata.projectionReceiptSha256,
    expectedRecoveryRevision: metadata.recoveryRevision,
    promotionId: metadata.promotionId,
    expectedJournalHeadSha256: metadata.journalHeadSha256,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(pendingStorageKey(principalScope), JSON.stringify(pending));
  return pending;
}

function clearPending(principalScope: string): void {
  localStorage.removeItem(pendingStorageKey(principalScope));
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

  const pending = useMemo(() => readPending(principalScope), [principalScope, metadata]);
  const action = pending?.action ?? selectedAction ?? null;

  const submit = useCallback(async (): Promise<void> => {
    if (!metadata || !action || !password || busy) return;
    const current = beginPending(principalScope, metadata, action);
    setBusy(true);
    setMessage(null);
    try {
      const exclusive = await executeExclusive(async () => {
        let result: ConstitutionClassicRecoveryMutationResult;
        if (action === 'resume') {
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
            action === 'discard'
              ? {
                  kind: 'discard',
                  confirmedObjectIds: metadata.items.map(({ objectId }) => objectId),
                  confirmationText,
                }
              : { kind: action };
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
          clearPending(principalScope);
        }
        await load(false);
        return;
      }
      clearPending(principalScope);
      setSelectedAction(null);
      setMessage('Classic recovery completed with a durable receipt.');
      onRestored();
      await load(false);
    } catch (error) {
      // Network/response loss retains the exact operation identity for replay.
      setPassword('');
      setConfirmationText('');
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
    principalScope,
  ]);

  if (loadState === 'absent') return null;
  if (loadState === 'error') {
    return (
      <section role='alert' className='rd-12px border border-solid border-danger p-14px text-12px text-danger'>
        {message}
      </section>
    );
  }

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

          {metadata.allowedActions.length > 0 && (
            <div className='flex flex-wrap gap-8px'>
              {metadata.allowedActions.map((candidate) => (
                <Button
                  key={candidate}
                  size='small'
                  type={action === candidate ? 'primary' : 'secondary'}
                  status={candidate === 'discard' ? 'danger' : undefined}
                  disabled={busy || (pending !== null && candidate !== pending.action)}
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

          {action && metadata.allowedActions.includes(action) && (
            <div className='rd-8px bg-fill-1 p-10px flex flex-col gap-8px'>
              {action === 'discard' && (
                <>
                  <div className='text-11px text-danger'>
                    Type the exact confirmation below. Discard is available only before any item commits.
                  </div>
                  <code className='text-10px break-all select-all'>{metadata.discardChallenge}</code>
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
                <Button
                  type='primary'
                  status={action === 'discard' ? 'danger' : undefined}
                  size='small'
                  loading={busy}
                  disabled={!password || (action === 'discard' && confirmationText !== metadata.discardChallenge)}
                  onClick={() => void submit()}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </>
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
