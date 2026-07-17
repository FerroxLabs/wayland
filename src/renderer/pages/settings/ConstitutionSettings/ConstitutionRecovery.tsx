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

function storageKey(principalScope: string, archiveId: string): string {
  return `wayland:constitution:archive-restore:${encodeURIComponent(principalScope)}:${archiveId}`;
}

function readPending(principalScope: string, archiveId: string): PendingRestore | null {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(principalScope, archiveId)) ?? 'null') as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const expected = [
      'archiveId',
      'contract',
      'createdAt',
      'expectedArchiveRevision',
      'expectedRevision',
      'operationId',
    ];
    if (Object.keys(record).toSorted().join('\n') !== expected.toSorted().join('\n')) return null;
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
      return null;
    }
    return record as PendingRestore;
  } catch {
    return null;
  }
}

function beginPending(
  principalScope: string,
  archive: ConstitutionArchiveRecoverySummary,
  expectedRevision: string
): PendingRestore {
  const existing = readPending(principalScope, archive.archiveId);
  if (existing) return existing;
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
}

function clearPending(principalScope: string, archiveId: string): void {
  localStorage.removeItem(storageKey(principalScope, archiveId));
}

function archiveLabel(archive: ConstitutionArchiveRecoverySummary): string {
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
        setLoadState('ready');
      } catch (error) {
        setLoadState('error');
        setMessage(error instanceof Error ? error.message : 'Archive metadata could not be loaded.');
      }
    },
    [isDesktop]
  );

  useEffect(() => {
    void loadArchives();
  }, [loadArchives]);

  const selectedPending = useMemo(
    () => (selected ? readPending(principalScope, selected.archiveId) : null),
    [principalScope, selected]
  );

  const restore = useCallback(async (): Promise<void> => {
    if (!selected || !password || busy) return;
    setBusy(true);
    setMessage(null);
    setErrorCode(null);
    try {
      const existing = readPending(principalScope, selected.archiveId);
      const targetRevision = existing
        ? existing.expectedRevision
        : await readLiveTargetRevision(selected, expectedRevision, isDesktop);
      const pending = existing ?? beginPending(principalScope, selected, targetRevision);
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
          clearPending(principalScope, selected.archiveId);
        }
        await loadArchives(false);
        return;
      }
      clearPending(principalScope, selected.archiveId);
      setSelected(null);
      setMessage(t('settings.constitutionRecovery.committed', 'Archive restored. The current editor will reload.'));
      onRestored();
      await loadArchives(false);
    } catch (error) {
      setPassword('');
      setMessage(error instanceof Error ? error.message : 'Archive restore did not complete.');
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
    principalScope,
    selected,
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

      {loadState === 'error' ? (
        <div role='alert' className='text-12px text-danger'>
          {message}
        </div>
      ) : loadState === 'ready' && archives.length === 0 ? (
        <div className='text-12px text-t-tertiary'>
          {t('settings.constitutionRecovery.empty', 'No recovery archives are available.')}
        </div>
      ) : (
        <div className='flex flex-col gap-6px'>
          {archives.map((archive) => {
            const active = selected?.archiveId === archive.archiveId;
            return (
              <button
                key={archive.archiveId}
                type='button'
                aria-pressed={active}
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
                  <span className='text-12px font-medium text-t-primary'>{archiveLabel(archive)}</span>
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

      {selected && (
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
