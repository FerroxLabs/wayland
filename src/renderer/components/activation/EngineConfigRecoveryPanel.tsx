/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spin } from '@arco-design/web-react';
import { FileSearch, FolderOpen, RotateCcw, Wrench } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { engineConfigRecovery } from '@/common/adapter/ipcBridge';
import type { EngineConfigInspection, EngineConfigRecoveryResult } from '@process/agent/wcore/engineConfigRecovery';
import { ConfirmDialog } from '@renderer/components/settings/shared';
import cardStyles from './AcpAuthFailureCard.module.css';

/**
 * #1024 - the in-app way out of an invalid engine `config.toml`.
 *
 * Rendered in BOTH places the user actually hits this wall: the in-thread
 * launch-failure card (`WCoreEngineConfigCard`) and the Doctor's "Engine config
 * integrity" row. Same component, same three actions, so the two surfaces cannot
 * drift.
 *
 * Actions are ordered by descending preference and by risk:
 *   1. Fix the specific malformed line - offered ONLY when the main process found
 *      an unambiguous single-line-break fix, and it takes a verified backup first.
 *   2. Reveal the file - the no-risk escape hatch, ALWAYS available, so a user who
 *      wants nothing automated is still spared hunting a path inside Library.
 *   3. Start over with defaults - destructive, so it sits behind a confirmation
 *      that NAMES what is lost (providers, keys, memory/skills settings) and still
 *      runs the verified backup first.
 *
 * SECURITY: this renders the PATH and the LINE/COLUMN numbers only. It never
 * receives or displays `config.toml` content - the inspection payload carries
 * none (see `engineConfigRecovery.ts`), which is the same posture
 * `desktopProfileSplice.ts` documents: the echoed source line can be an
 * `api_key`.
 */
const EngineConfigRecoveryPanel: React.FC<{
  /** Re-run the surrounding surface's own check after a successful repair. */
  onRecovered?: () => void;
}> = ({ onRecovered }) => {
  const { t } = useTranslation();
  const [inspection, setInspection] = useState<EngineConfigInspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  /** Last outcome, rendered verbatim under the actions. Never file content. */
  const [outcome, setOutcome] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const inspect = useCallback(async () => {
    try {
      setInspection(await engineConfigRecovery.inspect.invoke());
    } catch (error) {
      setInspection({
        status: 'unreadable',
        path: '',
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  useEffect(() => {
    void inspect();
  }, [inspect]);

  /** Map a main-process result onto the one line the user reads. */
  const describe = useCallback(
    (result: EngineConfigRecoveryResult, successKey: 'repaired' | 'regenerated') => {
      if (result.ok) {
        const backupPath = result.backupPath ?? '';
        const name = backupPath.split(/[\\/]/).pop() ?? backupPath;
        return { tone: 'ok' as const, text: t(`conversation.engineConfigInvalid.result.${successKey}`, { name }) };
      }
      if (result.reason === 'backup-failed') {
        return {
          tone: 'error' as const,
          text: t('conversation.engineConfigInvalid.result.backupFailed', { reason: result.detail ?? '' }),
        };
      }
      return {
        tone: 'error' as const,
        text: t('conversation.engineConfigInvalid.result.writeFailed', { reason: result.detail ?? '' }),
      };
    },
    [t]
  );

  const runRepair = useCallback(async () => {
    setBusy(true);
    try {
      const result = await engineConfigRecovery.repair.invoke();
      setOutcome(describe(result, 'repaired'));
      await inspect();
      if (result.ok) onRecovered?.();
    } finally {
      setBusy(false);
    }
  }, [describe, inspect, onRecovered]);

  const runRegenerate = useCallback(async () => {
    setBusy(true);
    try {
      // `confirmed` is set ONLY here, on the ConfirmDialog's own callback. There
      // is no code path that reaches this call without the user having read the
      // dialog that names what is lost.
      const result = await engineConfigRecovery.regenerate.invoke({ confirmed: true });
      setOutcome(describe(result, 'regenerated'));
      await inspect();
      if (result.ok) onRecovered?.();
    } finally {
      setBusy(false);
    }
  }, [describe, inspect, onRecovered]);

  const runReveal = useCallback(async () => {
    const result = await engineConfigRecovery.reveal.invoke();
    if (!result.ok) {
      setOutcome({
        tone: 'error',
        text: t('conversation.engineConfigInvalid.result.revealFailed', { reason: result.error ?? '' }),
      });
    }
  }, [t]);

  if (!inspection) {
    return (
      <div className='flex items-center gap-8px text-12px text-t-secondary'>
        <Spin size={14} />
        {t('conversation.engineConfigInvalid.checking')}
      </div>
    );
  }

  const invalid = inspection.status === 'invalid' ? inspection : null;

  return (
    <div className='flex flex-col gap-12px'>
      {invalid ? (
        <div className='flex flex-col gap-4px'>
          <div className='text-13px text-t-primary'>
            {t('conversation.engineConfigInvalid.location', {
              line: invalid.problem.line,
              column: invalid.problem.column,
            })}
          </div>
          {/* The PATH is safe to show and is half the point of the fix - the
              reporter could not find this file. The file's CONTENT is not. */}
          <code className='text-11px text-t-secondary break-all select-all'>{invalid.path}</code>
        </div>
      ) : inspection.status === 'unreadable' ? (
        <div className='text-13px text-t-primary'>
          {t('conversation.engineConfigInvalid.unreadable', { reason: inspection.reason })}
        </div>
      ) : (
        <div className='text-13px text-t-primary'>{t('conversation.engineConfigInvalid.noProblem')}</div>
      )}

      <ul className='flex flex-col gap-8px' role='list'>
        {invalid?.repair && (
          <li
            role='listitem'
            data-testid='engine-config-repair'
            className={`${cardStyles.row} ${cardStyles.rowPrimary} flex items-center gap-12px rd-12px p-12px`}
          >
            <span className={`${cardStyles.icon} ${cardStyles.iconPrimary} flex items-center text-20px`}>
              <Wrench size={18} />
            </span>
            <div className='flex flex-1 flex-col gap-2px min-w-0'>
              <span className='text-13px text-t-primary font-500'>
                {t('conversation.engineConfigInvalid.repair.label', { line: invalid.problem.line })}
              </span>
              <span className='text-12px text-t-secondary'>
                {t('conversation.engineConfigInvalid.repair.sublabel')}
              </span>
            </div>
            <Button type='primary' size='small' loading={busy} onClick={() => void runRepair()}>
              {t('conversation.engineConfigInvalid.repair.action')}
            </Button>
          </li>
        )}

        {invalid && !invalid.repair && (
          <li role='listitem' className={`${cardStyles.row} flex items-center gap-12px rd-12px p-12px`}>
            <span className={`${cardStyles.icon} flex items-center text-20px`}>
              <FileSearch size={18} />
            </span>
            <span className='text-12px text-t-secondary flex-1'>
              {t('conversation.engineConfigInvalid.repair.unavailable', { line: invalid.problem.line })}
            </span>
          </li>
        )}

        {/* Always present, whatever the inspection says: the no-risk escape hatch
            must never be conditional on the app having understood the failure. */}
        <li
          role='listitem'
          data-testid='engine-config-reveal'
          className={`${cardStyles.row} flex items-center gap-12px rd-12px p-12px`}
        >
          <span className={`${cardStyles.icon} flex items-center text-20px`}>
            <FolderOpen size={18} />
          </span>
          <div className='flex flex-1 flex-col gap-2px min-w-0'>
            <span className='text-13px text-t-primary font-500'>
              {t('conversation.engineConfigInvalid.reveal.label')}
            </span>
            <span className='text-12px text-t-secondary'>{t('conversation.engineConfigInvalid.reveal.sublabel')}</span>
          </div>
          <Button size='small' onClick={() => void runReveal()}>
            {t('conversation.engineConfigInvalid.reveal.action')}
          </Button>
        </li>

        {invalid && (
          <li
            role='listitem'
            data-testid='engine-config-regenerate'
            className={`${cardStyles.row} flex items-center gap-12px rd-12px p-12px`}
          >
            <span className={`${cardStyles.icon} flex items-center text-20px`}>
              <RotateCcw size={18} />
            </span>
            <div className='flex flex-1 flex-col gap-2px min-w-0'>
              <span className='text-13px text-t-primary font-500'>
                {t('conversation.engineConfigInvalid.regenerate.label')}
              </span>
              <span className='text-12px text-t-secondary'>
                {t('conversation.engineConfigInvalid.regenerate.sublabel')}
              </span>
            </div>
            <Button status='danger' size='small' disabled={busy} onClick={() => setConfirmOpen(true)}>
              {t('conversation.engineConfigInvalid.regenerate.action')}
            </Button>
          </li>
        )}
      </ul>

      {outcome && (
        <div
          data-testid='engine-config-outcome'
          className='text-12px'
          style={{ color: outcome.tone === 'ok' ? 'var(--success)' : 'var(--danger)' }}
        >
          {outcome.text}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void runRegenerate()}
        title={t('conversation.engineConfigInvalid.regenerate.confirmTitle')}
        body={t('conversation.engineConfigInvalid.regenerate.confirmBody')}
        confirmLabel={t('conversation.engineConfigInvalid.regenerate.confirmAction')}
        destructive
      />
    </div>
  );
};

export default EngineConfigRecoveryPanel;
