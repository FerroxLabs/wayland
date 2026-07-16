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
import { writeConstitutionSpecialistHttp } from '@renderer/services/ConstitutionService';
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
};

/**
 * Inline editor for a single specialist overlay file. Loads the overlay
 * content on mount, then debounce-autosaves edits - the same pattern as the
 * core Constitution editor in `index.tsx`.
 */
const SpecialistOverlayEditor: React.FC<SpecialistOverlayEditorProps> = ({ id, onClose, onDirtyChange }) => {
  const { t } = useTranslation();
  const isDesktop = isElectronDesktop();
  const { user } = useAuth();

  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editGrant, setEditGrant] = useState<ConstitutionEditGrant | null>(null);

  /** While true, onChange events from the editor are ignored (initial hydrate). */
  const hydrating = useRef(true);
  const draftKey = constitutionAutosaveDraftKey(`specialist:${id}`, isDesktop, user?.id);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const api = window.electronAPI;
      if (!isDesktop || !api?.readConstitutionSpecialist) {
        if (!cancelled) {
          setValue((draftKey ? readSerializedAutosaveDraft(draftKey) : null) ?? '');
          setLoading(false);
          window.setTimeout(() => {
            hydrating.current = false;
          }, 50);
        }
        return;
      }
      const text = await api.readConstitutionSpecialist(id);
      if (cancelled) return;
      setValue((draftKey ? readSerializedAutosaveDraft(draftKey) : null) ?? text);
      setLoading(false);
      // Allow one tick for TipTap to settle before treating onChange as edits.
      window.setTimeout(() => {
        hydrating.current = false;
      }, 50);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftKey, id, isDesktop]);

  const saveOverlay = useCallback(
    async (md: string): Promise<ConstitutionMutationResult> => {
      if (isDesktop) {
        const ok = (await window.electronAPI?.writeConstitutionSpecialist?.(id, md)) ?? false;
        return ok ? { ok: true } : { ok: false, reason: 'request_failed', status: 0 };
      }
      if (!editGrant) return { ok: false, reason: 'authorization_required', status: 401 };
      return writeConstitutionSpecialistHttp(id, md, editGrant.token);
    },
    [editGrant, id, isDesktop]
  );

  const { saveState, isDirty, queueSave, retry } = useSerializedAutosave({
    enabled: isDesktop || editGrant !== null,
    debounceMs: SAVE_DEBOUNCE_MS,
    savedFlashMs: SAVED_FLASH_MS,
    save: saveOverlay,
    onAuthorizationRequired: () => setEditGrant(null),
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
      {loading ? (
        <div className='text-12px text-t-secondary py-8px'>{t('settings.constitutionPage.loading', 'Loading…')}</div>
      ) : (
        <TipTapMarkdownEditor value={value} onChange={handleChange} readOnly={!isDesktop && !editGrant} />
      )}
    </div>
  );
};

export default SpecialistOverlayEditor;
