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
  const [loading, setLoading] = useState(true);
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
      const api = window.electronAPI;
      let text: string;
      if (isDesktop && api?.readConstitution && api?.resetConstitution) {
        text = await api.readConstitution();
        if (!text) {
          // First-install seed: materialize the default Constitution to disk
          // so the editor isn't blank on a brand-new install.
          text = await api.resetConstitution();
        }
      } else {
        // Headless WebUI: never infer absence from an empty/error-shaped read
        // and never auto-reset. Explicit present/absent/error rendering is
        // completed when the anchored non-creating filesystem read lands.
        text = await readConstitutionHttp();
      }
      if (cancelled) return;
      setValue((draftKey ? readSerializedAutosaveDraft(draftKey) : null) ?? text);
      setLoading(false);
      // Allow one tick for TipTap to settle its mount before we start
      // treating onChange events as user edits.
      window.setTimeout(() => {
        hydrating.current = false;
      }, 50);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftKey, isDesktop]);

  const saveConstitution = useCallback(
    async (md: string): Promise<ConstitutionMutationResult> => {
      if (isDesktop) {
        const ok = (await window.electronAPI?.writeConstitution?.(md)) ?? false;
        return ok ? { ok: true } : { ok: false, reason: 'request_failed', status: 0 };
      }
      if (!editGrant) return { ok: false, reason: 'authorization_required', status: 401 };
      return writeConstitutionHttp(md, editGrant.token);
    },
    [editGrant, isDesktop]
  );

  const { saveState, isDirty, queueSave, retry, runExclusiveDestructive } = useSerializedAutosave({
    enabled: isDesktop || editGrant !== null,
    debounceMs: SAVE_DEBOUNCE_MS,
    savedFlashMs: SAVED_FLASH_MS,
    save: saveConstitution,
    onAuthorizationRequired: () => setEditGrant(null),
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

  const handleReset = useCallback(async (): Promise<void> => {
    hydrating.current = true;
    setResetting(true);
    let reset: { committed: boolean; value: string | undefined };
    try {
      reset = await runExclusiveDestructive(async () => {
        let next: string | undefined;
        if (isDesktop) {
          next = await window.electronAPI?.resetConstitution?.();
        } else {
          const result = await resetConstitutionHttp(resetPassword);
          if (!result.ok) return { committed: false, value: undefined };
          // Reset returns status only; re-read the restored prose over the GET.
          next = await readConstitutionHttp();
        }
        return { committed: typeof next === 'string', value: next };
      });
    } finally {
      setResetting(false);
    }
    const next = reset.value;
    if (!reset.committed || typeof next !== 'string') {
      hydrating.current = false;
      return;
    }
    setValue(next);
    setEditorKey((k) => k + 1);
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
      actions={resetAction}
      savedIndicator={saveState}
    >
      {showResetConfirm && (
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

      {loading ? (
        <div className='text-t-secondary p-16px'>{t('settings.constitutionPage.loading', 'Loading…')}</div>
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
                readOnly={resetting || (!isDesktop && !editGrant) || (showResetConfirm && isDirty)}
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

      {!loading && <SpecialistOverlays />}
    </SettingsPageShell>
  );
};

export default ConstitutionSettings;
