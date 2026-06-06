/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SaveState } from '@renderer/components/settings/shared/feedback/SavedIndicator';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import TipTapMarkdownEditor from '@renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor';
import SpecialistOverlays from './SpecialistOverlays';

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

  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  /** Bumped on Reset to force the TipTap editor to remount with new content. */
  const [editorKey, setEditorKey] = useState(0);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** While true, onChange events from the editor are ignored (initial hydrate / reset). */
  const hydrating = useRef(true);
  const editorRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const api = window.electronAPI;
      if (!api?.readConstitution || !api?.resetConstitution) {
        // Non-Electron / preload not ready - leave the editor empty with a
        // neutral state. The Reset action below is also gated.
        if (!cancelled) setLoading(false);
        return;
      }
      let text = await api.readConstitution();
      if (!text) {
        // First-install seed: materialize the default Constitution to disk
        // so the editor isn't blank on a brand-new install.
        text = await api.resetConstitution();
      }
      if (cancelled) return;
      setValue(text);
      setLoading(false);
      // Allow one tick for TipTap to settle its mount before we start
      // treating onChange events as user edits.
      window.setTimeout(() => {
        hydrating.current = false;
      }, 50);
    })();
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
    };
  }, []);

  const handleChange = useCallback((md: string): void => {
    setValue(md);
    if (hydrating.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      const ok = (await window.electronAPI?.writeConstitution?.(md)) ?? false;
      setSaveState(ok ? 'saved' : 'error');
      if (ok) {
        if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
        savedFlashTimer.current = setTimeout(() => setSaveState('idle'), SAVED_FLASH_MS);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const handleReset = useCallback(async (): Promise<void> => {
    const next = await window.electronAPI?.resetConstitution?.();
    if (typeof next !== 'string') return;
    hydrating.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setValue(next);
    setEditorKey((k) => k + 1);
    setShowResetConfirm(false);
    setSaveState('saved');
    if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
    savedFlashTimer.current = setTimeout(() => {
      hydrating.current = false;
      setSaveState('idle');
    }, SAVED_FLASH_MS);
  }, []);

  const toc = useMemo(() => parseToc(value), [value]);

  // Token estimate uses the same heuristic as composePrompt so the
  // user-visible number matches what the backend composer estimates.
  const approxTokens = Math.ceil(value.length / 4);
  const tokenLevel: 'ok' | 'warning' | 'error' =
    approxTokens >= 3000 ? 'error' : approxTokens >= 2000 ? 'warning' : 'ok';
  const tokenCountClass =
    tokenLevel === 'error'
      ? 'text-danger'
      : tokenLevel === 'warning'
        ? 'text-warning'
        : 'text-t-tertiary';

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
    <Button
      type='secondary'
      size='small'
      icon={<RotateCcw size={14} />}
      onClick={() => setShowResetConfirm(true)}
      title={t('settings.constitutionPage.resetTooltip', 'Reset to the default Constitution')}
    >
      {t('settings.constitutionPage.reset', 'Reset')}
    </Button>
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
          <div className='flex gap-8px justify-end'>
            <Button size='small' onClick={() => setShowResetConfirm(false)}>
              {t('settings.constitutionPage.resetCancel', 'Cancel')}
            </Button>
            <Button size='small' type='primary' status='danger' onClick={handleReset}>
              {t('settings.constitutionPage.reset', 'Reset')}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className='text-t-secondary p-16px'>
          {t('settings.constitutionPage.loading', 'Loading…')}
        </div>
      ) : (
        <div className='flex gap-16px items-start'>
          <div className='flex-1 min-w-0 flex flex-col gap-8px'>
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
              <TipTapMarkdownEditor key={editorKey} value={value} onChange={handleChange} />
            </div>
          </div>
          <aside className='w-200px shrink-0 sticky top-16px max-h-[calc(100vh-180px)] overflow-y-auto'>
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
