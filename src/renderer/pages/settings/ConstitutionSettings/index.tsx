/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from '@arco-design/web-react';
import { RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { useAuth } from '@/renderer/hooks/context/AuthContext';
import { isElectronDesktop } from '@renderer/utils/platform';
import {
  readConstitutionHttp,
  resetConstitutionHttp,
  writeConstitutionHttp,
  type ConstitutionEditGrant,
  type ConstitutionMutationResult,
  type ConstitutionReadResult,
} from '@renderer/services/ConstitutionService';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import TipTapMarkdownEditor from '@renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor';
import HostedEditAuthorization from './HostedEditAuthorization';
import SpecialistOverlays from './SpecialistOverlays';
import {
  constitutionAutosaveDraftKey,
  readSerializedAutosaveDraft,
  useSerializedAutosave,
} from './useSerializedAutosave';

type TocEntry = { id: string; text: string; level: number };
type ConflictSnapshot = {
  baseContent: string | null;
  localDraft: string;
  remote: ConstitutionReadResult;
};
type ResetOutcome = {
  content?: string;
  revision: string;
  reloadError?: string;
};

const SAVE_DEBOUNCE_MS = 500;
const SAVED_FLASH_MS = 1500;
const FALLBACK_SUBTITLE =
  "Wayland's rules. Loaded fresh on every turn - edits apply immediately, no restart. See §11 for how overrides work.";

const HEADING_REGEX = /^(#{1,3})\s+(.+?)\s*$/;
const FENCE_PREFIX = '```';

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Parse the Constitution markdown into a flat heading TOC. We walk lines
 * rather than introspecting TipTap's doc because the editor swallows external
 * `value` changes after mount; the canonical source of truth is the markdown
 * string we round-trip through writeConstitution.
 */
const parseToc = (markdown: string): TocEntry[] => {
  const entries: TocEntry[] = [];
  let inFence = false;
  for (const rawLine of markdown.split('\n')) {
    const trimmed = rawLine.trimStart();
    if (trimmed.startsWith(FENCE_PREFIX)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = rawLine.match(HEADING_REGEX);
    if (!match) continue;
    const text = match[2];
    entries.push({ id: slugify(text), text, level: match[1].length });
  }
  return entries;
};

const ConstitutionSettings: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useLayoutContext()?.isMobile ?? false;
  const isDesktop = isElectronDesktop();
  const { user } = useAuth();
  const draftKey = constitutionAutosaveDraftKey('main', isDesktop, user?.id);

  const [value, setValue] = useState<string>('');
  const [loadState, setLoadState] = useState<'loading' | 'present' | 'absent' | 'error'>('loading');
  const [readError, setReadError] = useState<string | null>(null);
  const revision = useRef<string | null>(null);
  const baseContent = useRef<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [conflict, setConflict] = useState(false);
  const [conflictSnapshot, setConflictSnapshot] = useState<ConflictSnapshot | null>(null);
  const [conflictBusy, setConflictBusy] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [editGrant, setEditGrant] = useState<ConstitutionEditGrant | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  /** Bumped on Reset to force the TipTap editor to remount with new content. */
  const [editorKey, setEditorKey] = useState(0);

  /** While true, onChange events from the editor are ignored (initial hydrate / reset). */
  const hydrating = useRef(true);
  const editorRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadState('loading');
      setReadError(null);
      hydrating.current = true;
      try {
        const api = window.electronAPI;
        let read: ConstitutionReadResult;
        if (isDesktop && api?.readConstitution && api?.resetConstitution) {
          let text = await api.readConstitution();
          if (!text) {
            // The existing desktop IPC is string-only. The native filesystem
            // cutover replaces this compatibility seed with typed read truth.
            text = await api.resetConstitution();
          }
          read = { state: 'present', content: text, revision: 'desktop-compatibility' };
        } else {
          read = await readConstitutionHttp();
        }
        if (cancelled) return;
        if (read.state === 'absent') {
          setValue('');
          revision.current = read.revision;
          baseContent.current = null;
          setConflict(false);
          setConflictSnapshot(null);
          setLoadState('absent');
          return;
        }
        revision.current = read.revision;
        baseContent.current = read.content;
        setConflict(false);
        setConflictSnapshot(null);
        setValue((draftKey ? readSerializedAutosaveDraft(draftKey) : null) ?? read.content);
        setLoadState('present');
        // Allow one tick for TipTap to settle its mount before we start
        // treating onChange events as user edits.
        window.setTimeout(() => {
          hydrating.current = false;
        }, 50);
      } catch (error) {
        if (cancelled) return;
        setReadError(error instanceof Error ? error.message : 'The Constitution could not be loaded.');
        setLoadState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftKey, isDesktop, reloadToken]);

  const saveConstitution = useCallback(
    async (md: string): Promise<ConstitutionMutationResult> => {
      if (isDesktop) {
        const ok = (await window.electronAPI?.writeConstitution?.(md)) ?? false;
        return ok
          ? { ok: true, revision: revision.current ?? 'desktop-compatibility', receiptId: 'desktop-compatibility' }
          : { ok: false, reason: 'request_failed', status: 0 };
      }
      if (!editGrant) return { ok: false, reason: 'authorization_required', status: 401 };
      if (!revision.current) return { ok: false, reason: 'conflict', status: 409 };
      return writeConstitutionHttp(md, revision.current, editGrant.token);
    },
    [editGrant, isDesktop]
  );

  const { saveState, isDirty, queueSave, retry, clear, runExclusiveDestructive } = useSerializedAutosave({
    enabled: isDesktop || editGrant !== null,
    debounceMs: SAVE_DEBOUNCE_MS,
    savedFlashMs: SAVED_FLASH_MS,
    save: saveConstitution,
    onAuthorizationRequired: () => setEditGrant(null),
    onConflict: () => setConflict(true),
    onCommitted: (result, savedValue) => {
      revision.current = result.revision;
      baseContent.current = savedValue;
      setConflict(false);
      setConflictSnapshot(null);
    },
    draftKey: draftKey ?? undefined,
  });

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
      const remote = await readConstitutionHttp();
      setConflictSnapshot({ baseContent: baseContent.current, localDraft: value, remote });
    } catch (error) {
      setConflictError(error instanceof Error ? error.message : 'The server copy could not be loaded.');
    } finally {
      setConflictBusy(false);
    }
  }, [value]);

  const useServerCopy = useCallback((): void => {
    if (!conflictSnapshot) return;
    hydrating.current = true;
    clear();
    revision.current = conflictSnapshot.remote.revision;
    if (conflictSnapshot.remote.state === 'present') {
      baseContent.current = conflictSnapshot.remote.content;
      setValue(conflictSnapshot.remote.content);
      setLoadState('present');
    } else {
      baseContent.current = null;
      setValue('');
      setLoadState('absent');
    }
    setConflict(false);
    setConflictSnapshot(null);
    setConflictError(null);
    setEditorKey((key) => key + 1);
    window.setTimeout(() => {
      hydrating.current = false;
    }, 50);
  }, [clear, conflictSnapshot]);

  const overwriteServerCopy = useCallback(async (): Promise<void> => {
    if (!conflictSnapshot || !editGrant) return;
    setConflictBusy(true);
    setConflictError(null);
    try {
      const result = await runExclusiveDestructive(async () => {
        const mutation = await writeConstitutionHttp(
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
      setConflict(false);
      setConflictSnapshot(null);
      setConflictError(null);
      setLoadState('present');
    } catch (error) {
      setConflictError(error instanceof Error ? error.message : 'The overwrite could not be completed.');
    } finally {
      setConflictBusy(false);
    }
  }, [conflictSnapshot, editGrant, runExclusiveDestructive]);

  const handleReset = useCallback(async (): Promise<void> => {
    hydrating.current = true;
    setResetting(true);
    let reset: { committed: boolean; value: ResetOutcome | undefined };
    try {
      reset = await runExclusiveDestructive<ResetOutcome | undefined>(async () => {
        let next: string | undefined;
        if (isDesktop) {
          next = await window.electronAPI?.resetConstitution?.();
          return {
            committed: typeof next === 'string',
            value:
              typeof next === 'string'
                ? { content: next, revision: revision.current ?? 'desktop-compatibility' }
                : undefined,
          };
        } else {
          if (!revision.current) return { committed: false, value: undefined };
          const result = await resetConstitutionHttp(resetPassword, revision.current);
          if (result.ok === false) {
            if (result.reason === 'conflict') setConflict(true);
            return { committed: false, value: undefined };
          }
          // The receipt proves the reset committed. A failed follow-up read must
          // never resurrect the pre-reset dirty draft and overwrite that commit.
          try {
            const reread = await readConstitutionHttp();
            if (reread.state === 'present') {
              return { committed: true, value: { content: reread.content, revision: reread.revision } };
            }
            return {
              committed: true,
              value: {
                revision: reread.revision,
                reloadError: 'Reset committed, but the restored content is not available yet. Retry load.',
              },
            };
          } catch (error) {
            return {
              committed: true,
              value: {
                revision: result.revision,
                reloadError:
                  error instanceof Error
                    ? `Reset committed, but content reload failed: ${error.message}`
                    : 'Reset committed, but content reload failed. Retry load.',
              },
            };
          }
        }
      });
    } catch (error) {
      setReadError(error instanceof Error ? error.message : 'The restored Constitution could not be read.');
      setLoadState('error');
      reset = { committed: false, value: undefined };
    } finally {
      setResetting(false);
    }
    const outcome = reset.value;
    if (!reset.committed || !outcome) {
      hydrating.current = false;
      return;
    }
    revision.current = outcome.revision;
    baseContent.current = outcome.content ?? null;
    setValue(outcome.content ?? '');
    setLoadState(outcome.reloadError ? 'error' : 'present');
    setReadError(outcome.reloadError ?? null);
    if (!outcome.reloadError) setEditorKey((k) => k + 1);
    setShowResetConfirm(false);
    setResetPassword('');
    window.setTimeout(() => {
      hydrating.current = false;
    }, SAVED_FLASH_MS);
  }, [isDesktop, resetPassword, runExclusiveDestructive]);

  const toc = useMemo(() => parseToc(value), [value]);

  // Token estimate uses the same heuristic as composePrompt so the
  // user-visible number matches what the backend composer estimates.
  const approxTokens = Math.ceil(value.length / 4);
  const tokenLevel: 'ok' | 'warning' | 'error' =
    approxTokens >= 3000 ? 'error' : approxTokens >= 2000 ? 'warning' : 'ok';
  const tokenCountClass =
    tokenLevel === 'error' ? 'text-danger' : tokenLevel === 'warning' ? 'text-warning' : 'text-t-tertiary';

  const scrollToHeading = useCallback((id: string, text: string): void => {
    const root = editorRoot.current;
    if (!root) return;
    const headings = root.querySelectorAll('h1, h2, h3');
    for (const h of Array.from(headings)) {
      if (slugify(h.textContent || '') === id) {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    // Fallback: first-word prefix match in case TipTap's rendered DOM
    // normalised whitespace differently than our markdown parser did.
    const firstWord = text.split(/\s+/)[0];
    for (const h of Array.from(headings)) {
      if ((h.textContent || '').startsWith(firstWord)) {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }, []);

  const resetAction = (
    <div className='flex items-center gap-8px'>
      {!isDesktop && !editGrant && (
        <HostedEditAuthorization scopes={['constitution.write']} onGranted={setEditGrant} compact />
      )}
      {saveState === 'error' && (
        <Button type='secondary' size='small' onClick={retry}>
          {t('settings.constitutionPage.retrySave', 'Retry save')}
        </Button>
      )}
      <Button
        type='secondary'
        size='small'
        icon={<RotateCcw size={14} />}
        onClick={() => setShowResetConfirm(true)}
        title={t('settings.constitutionPage.resetTooltip', 'Reset to the default Constitution')}
      >
        {t('settings.constitutionPage.reset', 'Reset')}
      </Button>
    </div>
  );

  return (
    <SettingsPageShell
      title={t('settings.sider.constitution', 'Constitution')}
      subtitle={t('settings.constitutionPage.subtitle', FALLBACK_SUBTITLE)}
      actions={loadState === 'present' ? resetAction : null}
      savedIndicator={saveState}
    >
      {showResetConfirm && loadState !== 'loading' && loadState !== 'error' && (
        <div className='border border-solid border-[var(--color-border-2)] rd-12px p-12px flex flex-col gap-8px bg-[var(--color-bg-2)]'>
          <div className='text-14px text-t-primary font-medium'>
            {t('settings.constitutionPage.resetConfirmTitle', 'Reset Constitution?')}
          </div>
          <div className='text-12px text-t-secondary'>
            {t(
              'settings.constitutionPage.resetConfirmBody',
              'Your current edits will be lost. The default Constitution will be restored.'
            )}
          </div>
          {!isDesktop && (
            <Input.Password
              value={resetPassword}
              onChange={setResetPassword}
              placeholder={t('settings.constitutionPage.passwordPlaceholder', 'WebUI password')}
              autoComplete='current-password'
            />
          )}
          <div className='flex gap-8px justify-end'>
            <Button size='small' onClick={() => setShowResetConfirm(false)}>
              {t('settings.constitutionPage.resetCancel', 'Cancel')}
            </Button>
            <Button
              size='small'
              type='primary'
              status='danger'
              disabled={resetting || (!isDesktop && !resetPassword)}
              loading={resetting}
              onClick={handleReset}
            >
              {t('settings.constitutionPage.reset', 'Reset')}
            </Button>
          </div>
        </div>
      )}

      {loadState === 'loading' ? (
        <div className='text-t-secondary p-16px'>{t('settings.constitutionPage.loading', 'Loading…')}</div>
      ) : loadState === 'error' ? (
        <div className='rd-10px border border-solid border-[var(--color-danger-light-4)] bg-[var(--color-danger-light-1)] p-16px flex flex-col items-start gap-10px'>
          <div className='text-14px font-medium text-t-primary'>
            {t('settings.constitutionPage.readErrorTitle', 'Constitution unavailable')}
          </div>
          <div className='text-12px text-t-secondary'>
            {readError ?? t('settings.constitutionPage.readErrorBody', 'The existing file was not changed.')}
          </div>
          <Button type='secondary' size='small' onClick={() => setReloadToken((value) => value + 1)}>
            {t('settings.constitutionPage.retryRead', 'Retry load')}
          </Button>
        </div>
      ) : loadState === 'absent' ? (
        <div className='rd-10px border border-solid border-[var(--color-border-2)] bg-fill-1 p-16px flex flex-col items-start gap-10px'>
          <div className='text-14px font-medium text-t-primary'>
            {t('settings.constitutionPage.absentTitle', 'No Constitution exists yet')}
          </div>
          <div className='text-12px text-t-secondary'>
            {t(
              'settings.constitutionPage.absentBody',
              'Nothing was created automatically. Initialize the default only when you are ready.'
            )}
          </div>
          <Button type='primary' size='small' onClick={() => setShowResetConfirm(true)}>
            {t('settings.constitutionPage.initializeDefault', 'Initialize default')}
          </Button>
        </div>
      ) : (
        <div className={isMobile ? 'flex flex-col gap-16px items-stretch' : 'flex gap-16px items-start'}>
          <div className='flex-1 min-w-0 flex flex-col gap-8px'>
            {!isDesktop && !editGrant && (
              <div className='flex items-center justify-between gap-12px rd-8px bg-fill-2 px-12px py-10px'>
                <span className='text-12px text-t-secondary'>
                  {t(
                    'settings.constitutionPage.authorizationRequired',
                    'Editing is locked. Unlock once to enable short-lived, scoped autosave.'
                  )}
                </span>
                <HostedEditAuthorization scopes={['constitution.write']} onGranted={setEditGrant} compact />
              </div>
            )}
            {conflict && (
              <div className='flex flex-col gap-10px rd-8px bg-[var(--color-warning-light-1)] px-12px py-10px'>
                <div className='flex items-center justify-between gap-12px'>
                  <span className='text-12px text-t-secondary'>
                    {t(
                      'settings.constitutionPage.conflict',
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
                  <div className='flex flex-col gap-10px'>
                    <div className={isMobile ? 'grid grid-cols-1 gap-8px' : 'grid grid-cols-3 gap-8px'}>
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
                          <pre className='m-0 max-h-160px overflow-auto whitespace-pre-wrap break-words text-11px text-t-secondary font-mono'>
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
                  </div>
                )}
              </div>
            )}
            <div className='flex flex-col gap-2px'>
              <span className={`text-12px font-medium ${tokenCountClass}`}>
                {t('settings.constitutionPage.tokenCount', '{{value}} tokens', {
                  value: approxTokens.toLocaleString(),
                })}
              </span>
              {tokenLevel === 'warning' && (
                <span className='text-11px text-warning'>
                  {t(
                    'settings.constitutionPage.tokenWarning',
                    'Approaching adherence ceiling (~2,000 tokens). Consider splitting into specialist overlays.'
                  )}
                </span>
              )}
              {tokenLevel === 'error' && (
                <span className='text-11px text-danger'>
                  {t(
                    'settings.constitutionPage.tokenError',
                    'Past the adherence ceiling. Move sections into specialist overlays at ~/.wayland/specialists/<id>.md.'
                  )}
                </span>
              )}
            </div>
            <div ref={editorRoot}>
              <TipTapMarkdownEditor
                key={editorKey}
                value={value}
                onChange={handleChange}
                readOnly={conflict || resetting || (!isDesktop && !editGrant) || (showResetConfirm && isDirty)}
              />
            </div>
          </div>
          <aside
            className={
              isMobile
                ? 'w-full max-h-none overflow-visible'
                : 'w-200px shrink-0 sticky top-16px max-h-[calc(100vh-180px)] overflow-y-auto'
            }
          >
            <div className='text-11px font-medium text-t-tertiary uppercase tracking-wider mb-8px px-8px'>
              {t('settings.constitutionPage.tocTitle', 'Sections')}
            </div>
            <nav className='flex flex-col gap-2px'>
              {toc.length === 0 ? (
                <div className='text-12px text-t-tertiary px-8px py-4px'>
                  {t('settings.constitutionPage.tocEmpty', 'No sections yet')}
                </div>
              ) : (
                toc.map((entry, i) => (
                  <div
                    key={`${entry.id}-${i}`}
                    role='button'
                    tabIndex={0}
                    onClick={() => scrollToHeading(entry.id, entry.text)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        scrollToHeading(entry.id, entry.text);
                      }
                    }}
                    title={entry.text}
                    className='text-left text-12px py-4px rd-6px hover:bg-fill-1 text-t-secondary cursor-pointer truncate'
                    style={{ paddingLeft: `${8 + (entry.level - 1) * 12}px`, paddingRight: 8 }}
                  >
                    {entry.text}
                  </div>
                ))
              )}
            </nav>
          </aside>
        </div>
      )}

      {loadState !== 'loading' && <SpecialistOverlays />}
    </SettingsPageShell>
  );
};

export default ConstitutionSettings;
