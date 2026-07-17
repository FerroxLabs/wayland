/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from '@arco-design/web-react';
import { ArchiveRestore, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ConstitutionArchiveRecoverySummary,
  ConstitutionArchiveRestoreRequest,
  ConstitutionArchiveRestoreResult,
} from '@/common/types/constitutionRecovery';
import { isElectronDesktop } from '@renderer/utils/platform';
import {
  listConstitutionArchivesHttp,
  readConstitutionSpecialistHttp,
  restoreConstitutionArchiveHttp,
  runDesktopConstitutionArchiveInventory,
  runDesktopConstitutionArchiveRestore,
  runDesktopConstitutionRead,
} from '@renderer/services/ConstitutionService';
import { withConstitutionRecoveryTransaction } from '@renderer/services/ConstitutionRecoveryOperationLock';

const PENDING_CONTRACT = 'wayland-constitution-archive-restore-client-operation/1.0' as const;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const AMBIGUOUS_FAILURE_CODES = new Set(['INTEGRITY_FAILURE', 'NATIVE_FAILURE']);

type PendingRestore = Readonly<{
  contract: typeof PENDING_CONTRACT;
  operationId: string;
  archiveId: string;
  expectedArchiveRevision: string;
  expectedRevision: string;
  createdAt: string;
}>;

type PendingRestoreRead =
  | Readonly<{ state: 'absent' }>
  | Readonly<{ state: 'valid'; value: PendingRestore }>
  | Readonly<{ state: 'invalid'; reason: string }>;

type PendingRestoreInventory =
  | Readonly<{ state: 'valid'; values: readonly PendingRestore[] }>
  | Readonly<{ state: 'invalid'; reason: string }>;

class PendingRestoreChangedError extends Error {
  constructor(readonly current: PendingRestoreRead) {
    super('Pending archive restore changed. Review and authorize the current operation again.');
    this.name = 'PendingRestoreChangedError';
  }
}

function storageKey(principalScope: string, archiveId: string): string {
  return `wayland:constitution:archive-restore:${encodeURIComponent(principalScope)}:${archiveId}`;
}

function storagePrefix(principalScope: string): string {
  return `wayland:constitution:archive-restore:${encodeURIComponent(principalScope)}:`;
}

function readPending(principalScope: string, archiveId: string): PendingRestoreRead {
  try {
    const raw = localStorage.getItem(storageKey(principalScope, archiveId));
    if (raw === null) return { state: 'absent' };
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { state: 'invalid', reason: 'Pending archive restore evidence is not an object.' };
    }
    const record = value as Record<string, unknown>;
    const expected = [
      'archiveId',
      'contract',
      'createdAt',
      'expectedArchiveRevision',
      'expectedRevision',
      'operationId',
    ];
    if (Object.keys(record).toSorted().join('\n') !== expected.toSorted().join('\n')) {
      return { state: 'invalid', reason: 'Pending archive restore evidence has an unsupported shape.' };
    }
    if (
      record.contract !== PENDING_CONTRACT ||
      record.archiveId !== archiveId ||
      typeof record.operationId !== 'string' ||
      !UUID_V4_PATTERN.test(record.operationId) ||
      typeof record.expectedArchiveRevision !== 'string' ||
      record.expectedArchiveRevision.length === 0 ||
      typeof record.expectedRevision !== 'string' ||
      record.expectedRevision.length === 0 ||
      typeof record.createdAt !== 'string' ||
      Number.isNaN(Date.parse(record.createdAt))
    ) {
      return { state: 'invalid', reason: 'Pending archive restore evidence failed validation.' };
    }
    return { state: 'valid', value: record as PendingRestore };
  } catch {
    return { state: 'invalid', reason: 'Pending archive restore evidence could not be read.' };
  }
}

function readPendingInventory(principalScope: string): PendingRestoreInventory {
  const prefix = storagePrefix(principalScope);
  const values: PendingRestore[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;
    const archiveId = key.slice(prefix.length);
    const pending = readPending(principalScope, archiveId);
    if (pending.state !== 'valid') {
      return {
        state: 'invalid',
        reason:
          pending.state === 'invalid'
            ? pending.reason
            : 'Pending archive restore evidence disappeared during inventory.',
      };
    }
    values.push(pending.value);
    if (values.length > 1) {
      return {
        state: 'invalid',
        reason: 'Multiple pending archive restores are ambiguous and require supervised recovery.',
      };
    }
  }
  return { state: 'valid', values: values.toSorted((left, right) => left.archiveId.localeCompare(right.archiveId)) };
}

function samePendingRestore(left: PendingRestore, right: PendingRestore): boolean {
  return (
    left.contract === right.contract &&
    left.operationId === right.operationId &&
    left.archiveId === right.archiveId &&
    left.expectedArchiveRevision === right.expectedArchiveRevision &&
    left.expectedRevision === right.expectedRevision &&
    left.createdAt === right.createdAt
  );
}

async function beginPending(
  principalScope: string,
  archive: ConstitutionArchiveRecoverySummary,
  expectedRevision: string,
  expectedPending: PendingRestore | null
): Promise<PendingRestore> {
  return withConstitutionRecoveryTransaction(principalScope, () => {
    const inventory = readPendingInventory(principalScope);
    if (inventory.state === 'invalid') throw new Error(inventory.reason);
    const existing = readPending(principalScope, archive.archiveId);
    if (expectedPending) {
      if (existing.state === 'valid' && samePendingRestore(existing.value, expectedPending)) return existing.value;
      throw new PendingRestoreChangedError(existing);
    }
    if (existing.state === 'valid') return existing.value;
    if (existing.state === 'invalid') throw new PendingRestoreChangedError(existing);
    if (inventory.values.length > 0) {
      throw new Error('Another pending archive restore must be reconciled before starting a new one.');
    }
    const pending: PendingRestore = {
      contract: PENDING_CONTRACT,
      operationId: crypto.randomUUID(),
      archiveId: archive.archiveId,
      expectedArchiveRevision: archive.targetRevision,
      expectedRevision,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey(principalScope, archive.archiveId), JSON.stringify(pending));
    return pending;
  });
}

async function clearPendingIfMatching(principalScope: string, completed: PendingRestore): Promise<PendingRestoreRead> {
  return withConstitutionRecoveryTransaction(principalScope, () => {
    const existing = readPending(principalScope, completed.archiveId);
    if (existing.state !== 'valid' || !samePendingRestore(existing.value, completed)) return existing;
    localStorage.removeItem(storageKey(principalScope, completed.archiveId));
    return readPending(principalScope, completed.archiveId);
  });
}

function pendingArchiveSummary(pending: PendingRestore): ConstitutionArchiveRecoverySummary {
  return {
    archiveId: pending.archiveId,
    archivedAt: pending.createdAt,
    targetKind: 'constitution',
    specialistId: null,
    sourceName: 'Pending response-loss replay',
    bytes: 0,
    targetRevision: pending.expectedArchiveRevision,
  };
}

function archiveLabel(archive: ConstitutionArchiveRecoverySummary, pendingOnly = false): string {
  if (pendingOnly) return `Pending archive replay: ${archive.archiveId}`;
  return archive.targetKind === 'constitution' ? 'Main Constitution' : `Specialist: ${archive.specialistId}`;
}

async function readLiveTargetRevision(
  archive: ConstitutionArchiveRecoverySummary,
  mainExpectedRevision: string,
  isDesktop: boolean
): Promise<string> {
  if (archive.targetKind === 'constitution') return mainExpectedRevision;
  if (!archive.specialistId) throw new Error('Archive specialist target is invalid.');
  const current = isDesktop
    ? await runDesktopConstitutionRead(async () => {
        const api = window.electronAPI;
        if (!api?.readConstitutionSpecialist) throw new Error('Specialist reading is unavailable.');
        return api.readConstitutionSpecialist(archive.specialistId!);
      })
    : await readConstitutionSpecialistHttp(archive.specialistId);
  return current.revision;
}

type Props = Readonly<{
  expectedRevision: string;
  principalScope: string;
  executeExclusive: <T>(
    action: () => Promise<{ committed: boolean; value: T }>
  ) => Promise<{ committed: boolean; value: T }>;
  onRestored: () => void;
}>;

const ConstitutionRecovery: React.FC<Props> = ({ expectedRevision, principalScope, executeExclusive, onRestored }) => {
  const { t } = useTranslation();
  const isDesktop = isElectronDesktop();
  const [archives, setArchives] = useState<readonly ConstitutionArchiveRecoverySummary[]>([]);
  const [pendingInventory, setPendingInventory] = useState<PendingRestoreInventory>({ state: 'valid', values: [] });
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selected, setSelected] = useState<ConstitutionArchiveRecoverySummary | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const loadArchives = useCallback(
    async (clearMessage = true): Promise<void> => {
      setLoadState('loading');
      if (clearMessage) setMessage(null);
      try {
        const result = isDesktop
          ? await runDesktopConstitutionArchiveInventory(async () => {
              const api = window.electronAPI;
              if (!api?.listConstitutionArchives) throw new Error('Archive recovery is unavailable.');
              return api.listConstitutionArchives();
            })
          : await listConstitutionArchivesHttp();
        if (result.success === false) throw new Error(result.error.message);
        setArchives(result.data.archives);
        const pending = await withConstitutionRecoveryTransaction(principalScope, () =>
          readPendingInventory(principalScope)
        );
        setPendingInventory(pending);
        setLoadState('ready');
      } catch (error) {
        setLoadState('error');
        setMessage(error instanceof Error ? error.message : 'Archive metadata could not be loaded.');
      }
    },
    [isDesktop, principalScope]
  );

  useEffect(() => {
    void loadArchives();
  }, [loadArchives]);

  useEffect(() => {
    const prefix = storagePrefix(principalScope);
    const synchronizeFromStorage = (event: StorageEvent): void => {
      if ((event.storageArea && event.storageArea !== localStorage) || !event.key?.startsWith(prefix)) return;
      setSelected(null);
      setPassword('');
      setMessage('Pending archive restore changed in another window. Review and authorize it again.');
      void loadArchives(false);
    };
    window.addEventListener('storage', synchronizeFromStorage);
    return () => window.removeEventListener('storage', synchronizeFromStorage);
  }, [loadArchives, principalScope]);

  const activeArchiveIds = useMemo(() => new Set(archives.map(({ archiveId }) => archiveId)), [archives]);
  const orphanedPending = useMemo(
    () =>
      pendingInventory.state === 'valid'
        ? pendingInventory.values.filter(({ archiveId }) => !activeArchiveIds.has(archiveId))
        : [],
    [activeArchiveIds, pendingInventory]
  );
  const displayArchives = useMemo(
    () => [...archives, ...orphanedPending.map(pendingArchiveSummary)],
    [archives, orphanedPending]
  );
  const selectedPending = useMemo(
    () =>
      selected && pendingInventory.state === 'valid'
        ? (pendingInventory.values.find(({ archiveId }) => archiveId === selected.archiveId) ?? null)
        : null,
    [pendingInventory, selected]
  );
  const pendingInvalid = pendingInventory.state === 'invalid';

  const restore = useCallback(async (): Promise<void> => {
    if (!selected || !password || busy || pendingInvalid) return;
    setBusy(true);
    setMessage(null);
    setErrorCode(null);
    try {
      const targetRevision = selectedPending
        ? selectedPending.expectedRevision
        : await readLiveTargetRevision(selected, expectedRevision, isDesktop);
      const pending = await beginPending(principalScope, selected, targetRevision, selectedPending);
      setPendingInventory(
        await withConstitutionRecoveryTransaction(principalScope, () => readPendingInventory(principalScope))
      );
      const request: ConstitutionArchiveRestoreRequest = {
        operationId: pending.operationId,
        archiveId: pending.archiveId,
        expectedArchiveRevision: pending.expectedArchiveRevision,
        password,
        expectedRevision: pending.expectedRevision,
      };
      const exclusive = await executeExclusive(async () => {
        const result: ConstitutionArchiveRestoreResult = isDesktop
          ? await runDesktopConstitutionArchiveRestore(async () => {
              const api = window.electronAPI;
              if (!api?.restoreConstitutionArchive) throw new Error('Archive recovery is unavailable.');
              return api.restoreConstitutionArchive(request);
            })
          : await restoreConstitutionArchiveHttp(request);
        return { committed: result.success, value: result };
      });
      const result = exclusive.value;
      setPassword('');
      if (result.success === false) {
        setErrorCode(result.error.code);
        setMessage(result.error.message);
        if (!result.error.retryable && !AMBIGUOUS_FAILURE_CODES.has(result.error.code)) {
          const nextPending = await clearPendingIfMatching(principalScope, pending);
          if (nextPending.state !== 'absent') {
            setMessage(`${result.error.message} Another pending operation was preserved for review.`);
          }
        }
        await loadArchives(false);
        return;
      }
      const nextPending = await clearPendingIfMatching(principalScope, pending);
      setSelected(null);
      setMessage(
        nextPending.state === 'absent'
          ? t('settings.constitutionRecovery.committed', 'Archive restored. The current editor will reload.')
          : 'Archive restored with a durable receipt. Another pending operation was preserved for review.'
      );
      onRestored();
      await loadArchives(false);
    } catch (error) {
      setPassword('');
      if (error instanceof PendingRestoreChangedError) setSelected(null);
      setMessage(error instanceof Error ? error.message : 'Archive restore did not complete.');
      await loadArchives(false);
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    executeExclusive,
    expectedRevision,
    isDesktop,
    loadArchives,
    onRestored,
    password,
    pendingInvalid,
    principalScope,
    selected,
    selectedPending,
    t,
  ]);

  return (
    <section
      aria-labelledby='constitution-recovery-heading'
      className='rd-12px border border-solid border-[var(--color-border-2)] bg-[var(--color-bg-2)] p-14px flex flex-col gap-12px'
    >
      <div className='flex items-start justify-between gap-12px'>
        <div className='flex flex-col gap-3px'>
          <div
            id='constitution-recovery-heading'
            className='text-14px font-medium text-t-primary flex items-center gap-7px'
          >
            <ArchiveRestore size={16} aria-hidden />
            {t('settings.constitutionRecovery.title', 'Recovery archives')}
          </div>
          <div className='text-12px text-t-secondary'>
            {t(
              'settings.constitutionRecovery.subtitle',
              'Restore an authenticated local archive. Your current version is archived before replacement.'
            )}
          </div>
        </div>
        <Button
          type='text'
          size='small'
          icon={<RefreshCw size={14} />}
          aria-label={t('settings.constitutionRecovery.refresh', 'Refresh recovery archives')}
          loading={loadState === 'loading'}
          onClick={() => void loadArchives()}
        />
      </div>

      {pendingInventory.state === 'invalid' && (
        <div role='alert' className='rd-8px border border-solid border-danger p-10px text-12px text-danger'>
          {pendingInventory.reason} No archive restore will run or replace this operation. Preserve the local evidence
          and contact support for supervised recovery.
        </div>
      )}

      {loadState === 'error' ? (
        <div role='alert' className='text-12px text-danger'>
          {message}
        </div>
      ) : loadState === 'ready' && displayArchives.length === 0 ? (
        <div className='text-12px text-t-tertiary'>
          {t('settings.constitutionRecovery.empty', 'No recovery archives are available.')}
        </div>
      ) : (
        <div className='flex flex-col gap-6px'>
          {displayArchives.map((archive) => {
            const active = selected?.archiveId === archive.archiveId;
            const pendingOnly = !activeArchiveIds.has(archive.archiveId);
            return (
              <button
                key={archive.archiveId}
                type='button'
                aria-pressed={active}
                disabled={pendingInvalid}
                className={`w-full text-left rd-8px border border-solid px-10px py-9px cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-6)] ${
                  active
                    ? 'border-[var(--color-primary-6)] bg-[var(--color-primary-light-1)]'
                    : 'border-[var(--color-border-2)] bg-transparent hover:bg-fill-1'
                }`}
                onClick={() => {
                  setSelected(active ? null : archive);
                  setPassword('');
                  setMessage(null);
                  setErrorCode(null);
                }}
              >
                <span className='flex items-center justify-between gap-12px'>
                  <span className='text-12px font-medium text-t-primary'>{archiveLabel(archive, pendingOnly)}</span>
                  <span className='text-11px text-t-tertiary'>{new Date(archive.archivedAt).toLocaleString()}</span>
                </span>
                <span className='mt-3px block text-11px text-t-secondary'>
                  {archive.sourceName} - {archive.bytes.toLocaleString()} bytes
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && !pendingInvalid && (
        <div className='rd-8px bg-fill-1 p-10px flex flex-col gap-8px'>
          <div className='text-12px text-t-secondary'>
            {selectedPending
              ? t('settings.constitutionRecovery.resume', 'A previous restore attempt is ready to resume safely.')
              : t(
                  'settings.constitutionRecovery.warning',
                  'This replaces the current target after preserving it as a new archive.'
                )}
          </div>
          <Input.Password
            value={password}
            onChange={setPassword}
            placeholder={t('settings.constitutionRecovery.password', 'Current Wayland password')}
            autoComplete='current-password'
            disabled={busy}
          />
          <div className='flex justify-end gap-8px'>
            <Button
              size='small'
              disabled={busy}
              onClick={() => {
                setSelected(null);
                setPassword('');
              }}
            >
              {t('settings.constitutionRecovery.cancel', 'Cancel')}
            </Button>
            <Button type='primary' status='danger' size='small' loading={busy} disabled={!password} onClick={restore}>
              {t('settings.constitutionRecovery.restore', 'Restore archive')}
            </Button>
          </div>
        </div>
      )}

      {message && loadState !== 'error' && (
        <div
          role={errorCode ? 'alert' : 'status'}
          className={`text-12px ${errorCode ? 'text-danger' : 'text-t-secondary'}`}
        >
          {message}
        </div>
      )}
    </section>
  );
};

export default ConstitutionRecovery;
