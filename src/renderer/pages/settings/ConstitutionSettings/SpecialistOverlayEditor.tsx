/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { ChevronDown } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SaveState } from '@renderer/components/settings/shared/feedback/SavedIndicator';
import SavedIndicator from '@renderer/components/settings/shared/feedback/SavedIndicator';
import TipTapMarkdownEditor from '@renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor';

const SAVE_DEBOUNCE_MS = 500;
const SAVED_FLASH_MS = 1500;

type SpecialistOverlayEditorProps = {
  /** Assistant id whose overlay file is being edited. */
  id: string;
  /** Collapse / close the editor. */
  onClose: () => void;
};

/**
 * Inline editor for a single specialist overlay file. Loads the overlay
 * content on mount, then debounce-autosaves edits - the same pattern as the
 * core Constitution editor in `index.tsx`.
 */
const SpecialistOverlayEditor: React.FC<SpecialistOverlayEditorProps> = ({ id, onClose }) => {
  const { t } = useTranslation();

  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** While true, onChange events from the editor are ignored (initial hydrate). */
  const hydrating = useRef(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const api = window.electronAPI;
      if (!api?.readConstitutionSpecialist) {
        if (!cancelled) setLoading(false);
        return;
      }
      const text = await api.readConstitutionSpecialist(id);
      if (cancelled) return;
      setValue(text);
      setLoading(false);
      // Allow one tick for TipTap to settle before treating onChange as edits.
      window.setTimeout(() => {
        hydrating.current = false;
      }, 50);
    })();
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
    };
  }, [id]);

  const handleChange = useCallback(
    (md: string): void => {
      setValue(md);
      if (hydrating.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState('saving');
      saveTimer.current = setTimeout(async () => {
        const ok = (await window.electronAPI?.writeConstitutionSpecialist?.(id, md)) ?? false;
        setSaveState(ok ? 'saved' : 'error');
        if (ok) {
          if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
          savedFlashTimer.current = setTimeout(() => setSaveState('idle'), SAVED_FLASH_MS);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [id]
  );

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
          <Button
            type='secondary'
            size='small'
            icon={<ChevronDown size={14} />}
            onClick={onClose}
          >
            {t('settings.constitutionSpecialists.close', 'Close')}
          </Button>
        </div>
      </div>
      {loading ? (
        <div className='text-12px text-t-secondary py-8px'>
          {t('settings.constitutionPage.loading', 'Loading…')}
        </div>
      ) : (
        <TipTapMarkdownEditor value={value} onChange={handleChange} />
      )}
    </div>
  );
};

export default SpecialistOverlayEditor;
