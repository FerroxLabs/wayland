/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { ChevronDown } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/renderer/hooks/context/AuthContext';
import { isElectronDesktop } from '@renderer/utils/platform';
import {
  readConstitutionSpecialistHttp,
  writeConstitutionSpecialistHttp,
} from '@renderer/services/ConstitutionService';
import type { ConstitutionEditGrant, ConstitutionMutationResult } from '@renderer/services/ConstitutionService';
import SavedIndicator from '@renderer/components/settings/shared/feedback/SavedIndicator';
import TipTapMarkdownEditor from '@renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor';
import HostedEditAuthorization from './HostedEditAuthorization';
import {
  constitutionAutosaveDraftKey,
  readSerializedAutosaveDraft,
  useSerializedAutosave,
} from './useSerializedAutosave';

const SAVE_DEBOUNCE_MS = 500;
const SAVED_FLASH_MS = 1500;

type SpecialistOverlayEditorProps = {
  /** Assistant id whose overlay file is being edited. */
  id: string;
  /** Collapse / close the editor. */
  onClose: () => void;
  /** Lets the parent prevent alternate controls from unmounting a dirty editor. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Publishes the authoritative revision before parent delete controls re-enable. */
  onCommitted?: (result: { revision: string; bytes: number }) => void;
};

type ConflictSnapshot = {
  baseContent: string | null;
  localDraft: string;
  remote: Awaited<ReturnType<typeof readConstitutionSpecialistHttp>>;
};

/**
 * Inline editor for a single specialist overlay file. Loads the overlay
 * content on mount, then debounce-autosaves edits - the same pattern as the
 * core Constitution editor in `index.tsx`.
 */
const SpecialistOverlayEditor: React.FC<SpecialistOverlayEditorProps> = ({
  id,
  onClose,
  onDirtyChange,
  onCommitted,
}) => {
  const { t } = useTranslation();
  const isDesktop = isElectronDesktop();
  const { user } = useAuth();

  const [value, setValue] = useState<string>('');
  const [loadState, setLoadState] = useState<'loading' | 'present' | 'absent' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const revision = useRef<string | null>(null);
  const baseContent = useRef<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [conflictSnapshot, setConflictSnapshot] = useState<ConflictSnapshot | null>(null);
  const [conflictBusy, setConflictBusy] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [editGrant, setEditGrant] = useState<ConstitutionEditGrant | null>(null);

  /** While true, onChange events from the editor are ignored (initial hydrate). */
  const hydrating = useRef(true);
  const draftKey = constitutionAutosaveDraftKey(`specialist:${id}`, isDesktop, user?.id);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadState('loading');
      setLoadError(null);
      hydrating.current = true;
      try {
        let text: string;
        if (isDesktop) {
          const api = window.electronAPI;
          if (!api?.readConstitutionSpecialist) throw new Error('Specialist reading is unavailable.');
          text = await api.readConstitutionSpecialist(id);
          if (cancelled) return;
          revision.current = 'desktop-compatibility';
        } else {
          const read = await readConstitutionSpecialistHttp(id);
          if (read.state === 'absent') {
            if (!cancelled) {
              revision.current = read.revision;
              baseContent.current = null;
              setLoadState('absent');
            }
            return;
          }
          text = read.content;
          if (cancelled) return;
          revision.current = read.revision;
          baseContent.current = read.content;
        }
        setValue((draftKey ? readSerializedAutosaveDraft(draftKey) : null) ?? text);
        setLoadState('present');
        setConflict(false);
        setConflictSnapshot(null);
        // Allow one tick for TipTap to settle before treating onChange as edits.
        window.setTimeout(() => {
          hydrating.current = false;
        }, 50);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'The specialist overlay could not be loaded.');
        setLoadState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftKey, id, isDesktop, reloadToken]);

  const saveOverlay = useCallback(
    async (md: string): Promise<ConstitutionMutationResult> => {
      if (isDesktop) {
        const ok = (await window.electronAPI?.writeConstitutionSpecialist?.(id, md)) ?? false;
        return ok
          ? { ok: true, revision: revision.current ?? 'desktop-compatibility', receiptId: 'desktop-compatibility' }
          : { ok: false, reason: 'request_failed', status: 0 };
      }
      if (!editGrant) return { ok: false, reason: 'authorization_required', status: 401 };
      if (!revision.current) return { ok: false, reason: 'conflict', status: 409 };
      return writeConstitutionSpecialistHttp(id, md, revision.current, editGrant.token);
    },
    [editGrant, id, isDesktop]
  );

  const { saveState, isDirty, queueSave, retry, clear, runExclusiveDestructive } = useSerializedAutosave({
    enabled: isDesktop || editGrant !== null,
    debounceMs: SAVE_DEBOUNCE_MS,
    savedFlashMs: SAVED_FLASH_MS,
    save: saveOverlay,
    onAuthorizationRequired: () => setEditGrant(null),
    onConflict: () => setConflict(true),
    onCommitted: (result, savedValue) => {
      revision.current = result.revision;
      baseContent.current = savedValue;
      onCommitted?.({ revision: result.revision, bytes: new TextEncoder().encode(savedValue).byteLength });
      setConflict(false);
      setConflictSnapshot(null);
    },
    draftKey: draftKey ?? undefined,
  });

  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);

  const handleChange = useCallback(
    (md: string): void => {
      setValue(md);
      if (hydrating.current) return;
      queueSave(md);
    },
    [queueSave]
  );

  const loadConflictComparison = useCallback(async (): Promise<void> => {
    setConflictBusy(true);
    setConflictError(null);
    try {
      const remote = await readConstitutionSpecialistHttp(id);
      setConflictSnapshot({ baseContent: baseContent.current, localDraft: value, remote });
    } catch (error) {
      setConflictError(error instanceof Error ? error.message : 'The server copy could not be loaded.');
    } finally {
      setConflictBusy(false);
    }
  }, [id, value]);

  const useServerCopy = useCallback((): void => {
    if (!conflictSnapshot) return;
    hydrating.current = true;
    clear();
    revision.current = conflictSnapshot.remote.revision;
    if (conflictSnapshot.remote.state === 'present') {
      baseContent.current = conflictSnapshot.remote.content;
      setValue(conflictSnapshot.remote.content);
      setLoadState('present');
      onCommitted?.({
        revision: conflictSnapshot.remote.revision,
        bytes: new TextEncoder().encode(conflictSnapshot.remote.content).byteLength,
      });
    } else {
      baseContent.current = null;
      setValue('');
      setLoadState('absent');
    }
    setConflict(false);
    setConflictSnapshot(null);
    setConflictError(null);
    window.setTimeout(() => {
      hydrating.current = false;
    }, 50);
  }, [clear, conflictSnapshot, onCommitted]);

  const overwriteServerCopy = useCallback(async (): Promise<void> => {
    if (!conflictSnapshot || !editGrant) return;
    setConflictBusy(true);
    setConflictError(null);
    try {
      const result = await runExclusiveDestructive(async () => {
        const mutation = await writeConstitutionSpecialistHttp(
          id,
          conflictSnapshot.localDraft,
          conflictSnapshot.remote.revision,
          editGrant.token
        );
        return { committed: mutation.ok, value: mutation };
      });
      if (result.value.ok === false) {
        if (result.value.reason === 'authorization_required') setEditGrant(null);
        if (result.value.reason === 'conflict') setConflictSnapshot(null);
        setConflictError(
          result.value.reason === 'conflict'
            ? 'The server changed again. Load a fresh comparison before choosing an overwrite.'
            : 'The overwrite was not committed. Your draft is still preserved.'
        );
        return;
      }
      revision.current = result.value.revision;
      baseContent.current = conflictSnapshot.localDraft;
      setValue(conflictSnapshot.localDraft);
      onCommitted?.({
        revision: result.value.revision,
        bytes: new TextEncoder().encode(conflictSnapshot.localDraft).byteLength,
      });
      setConflict(false);
      setConflictSnapshot(null);
      setConflictError(null);
    } catch (error) {
      setConflictError(error instanceof Error ? error.message : 'The overwrite could not be completed.');
    } finally {
      setConflictBusy(false);
    }
  }, [conflictSnapshot, editGrant, id, onCommitted, runExclusiveDestructive]);

  const approxTokens = Math.ceil(value.length / 4);

  return (
    <div className='b-1 b-color-border-2 rd-8px p-12px flex flex-col gap-8px bg-fill-1'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-8px'>
          <span className='text-13px font-medium text-t-primary'>{id}</span>
          <span className='text-11px text-t-tertiary'>
            {t('settings.constitutionSpecialists.tokenCount', '{{value}} tokens', {
              value: approxTokens.toLocaleString(),
            })}
          </span>
        </div>
        <div className='flex items-center gap-8px'>
          <SavedIndicator state={saveState} />
          {saveState === 'error' && (
            <Button type='secondary' size='small' onClick={retry}>
              {t('settings.constitutionPage.retrySave', 'Retry save')}
            </Button>
          )}
          {!isDesktop && !editGrant && (
            <HostedEditAuthorization scopes={[`specialist.write:${id}`]} onGranted={setEditGrant} compact />
          )}
          <Button
            type='secondary'
            size='small'
            icon={<ChevronDown size={14} />}
            disabled={isDirty}
            title={
              isDirty
                ? t('settings.constitutionSpecialists.closeDirty', 'Save or discard changes before closing')
                : undefined
            }
            onClick={onClose}
          >
            {t('settings.constitutionSpecialists.close', 'Close')}
          </Button>
        </div>
      </div>
      {loadState === 'loading' ? (
        <div className='text-12px text-t-secondary py-8px'>{t('settings.constitutionPage.loading', 'Loading…')}</div>
      ) : loadState === 'error' ? (
        <div className='rd-8px bg-[var(--color-danger-light-1)] p-10px flex items-center justify-between gap-12px'>
          <span className='text-12px text-t-secondary'>{loadError}</span>
          <Button type='secondary' size='small' onClick={() => setReloadToken((value) => value + 1)}>
            {t('settings.constitutionPage.retryRead', 'Retry load')}
          </Button>
        </div>
      ) : loadState === 'absent' ? (
        <div className='text-12px text-t-secondary py-8px'>
          {t('settings.constitutionSpecialists.absent', 'This overlay no longer exists. Refresh the inventory.')}
        </div>
      ) : (
        <>
          {conflict && (
            <div className='rd-8px bg-[var(--color-warning-light-1)] p-10px flex flex-col gap-10px'>
              <div className='flex items-center justify-between gap-12px'>
                <span className='text-12px text-t-secondary'>
                  {t(
                    'settings.constitutionSpecialists.conflict',
                    'The server copy changed. Your draft is preserved until you explicitly choose which copy wins.'
                  )}
                </span>
                {!conflictSnapshot && (
                  <Button
                    type='secondary'
                    size='small'
                    loading={conflictBusy}
                    onClick={() => void loadConflictComparison()}
                  >
                    {t('settings.constitutionPage.reloadForConflict', 'Load comparison')}
                  </Button>
                )}
              </div>
              {conflictError && <div className='text-11px text-danger'>{conflictError}</div>}
              {conflictSnapshot && (
                <>
                  <div className='grid grid-cols-3 gap-8px'>
                    {[
                      ['Previous base', conflictSnapshot.baseContent ?? '(no file)'],
                      ['Your draft', conflictSnapshot.localDraft],
                      [
                        'Current server',
                        conflictSnapshot.remote.state === 'present' ? conflictSnapshot.remote.content : '(no file)',
                      ],
                    ].map(([label, content]) => (
                      <div key={label} className='rd-8px bg-[var(--color-bg-2)] p-8px min-w-0'>
                        <div className='text-11px font-medium text-t-primary mb-4px'>{label}</div>
                        <pre className='m-0 max-h-120px overflow-auto whitespace-pre-wrap break-words text-11px text-t-secondary font-mono'>
                          {content}
                        </pre>
                      </div>
                    ))}
                  </div>
                  <div className='flex justify-end gap-8px'>
                    <Button type='secondary' size='small' disabled={conflictBusy} onClick={useServerCopy}>
                      {t('settings.constitutionPage.useServerCopy', 'Use server copy')}
                    </Button>
                    <Button
                      type='primary'
                      size='small'
                      disabled={conflictBusy || !editGrant}
                      loading={conflictBusy}
                      onClick={() => void overwriteServerCopy()}
                    >
                      {t('settings.constitutionPage.overwriteServerCopy', 'Overwrite with my draft')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          <TipTapMarkdownEditor
            value={value}
            onChange={handleChange}
            readOnly={conflict || (!isDesktop && !editGrant)}
          />
        </>
      )}
    </div>
  );
};

export default SpecialistOverlayEditor;
