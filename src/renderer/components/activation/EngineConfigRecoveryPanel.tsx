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
/** One-line text for a rejected bridge call. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

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
        reason: messageOf(error),
      });
    }
  }, []);

  useEffect(() => {
    void inspect();
  }, [inspect]);

  /** Map a main-process result onto the one line the user reads. */
  const describe = useCallback(
    (result: EngineConfigRecoveryResult, successKey: 'repaired' | 'regenerated') => {
      const backupPath = result.backupPath ?? '';
      const name = backupPath.split(/[\\/]/).pop() ?? backupPath;

      if (result.ok) {
        return { tone: 'ok' as const, text: t(`conversation.engineConfigInvalid.result.${successKey}`, { name }) };
      }
      // `&& !backupPath` is load-bearing: a `backup-failed` that NAMES a backup is
      // the F3b state below, where `config.toml` is gone, so "nothing was changed"
      // would be false. Ordering alone is not enough - this branch is tested first.
      if (result.reason === 'backup-failed' && !backupPath) {
        return {
          tone: 'error' as const,
          text: t('conversation.engineConfigInvalid.result.backupFailed', { reason: result.detail ?? '' }),
        };
      }
      if (result.reason === 'not-a-regular-file') {
        return { tone: 'error' as const, text: t('conversation.engineConfigInvalid.result.notARegularFile') };
      }
      // F3. There are THREE reported states in which `config.toml` may not hold the
      // user's original bytes: a failed rollback after a failed repair write, a
      // restore-conflict, and a backup whose move succeeded but could not be undone
      // (F3b - the readback or the byte check failed, then the restoring rename
      // failed too). Main sets `backupPath` on all three and only on those, so the
      // rule here is the whole rule: whenever main names a backup, render it, and
      // never mind which `reason` came with it. The generic writeFailed line names
      // no path, so this used to be the one place the user could not find out where
      // their config went, which is the opposite of what this module's header
      // promises. Executed before the F3 fix, on both halves: mentionsBackup=false;
      // before the F3b fix, main dropped the path a step earlier, so this branch
      // could not have rendered it at all.
      if (backupPath) {
        return {
          tone: 'error' as const,
          text: t('conversation.engineConfigInvalid.result.writeFailedWithBackup', {
            reason: result.detail ?? '',
            name,
          }),
        };
      }
      return {
        tone: 'error' as const,
        text: t('conversation.engineConfigInvalid.result.writeFailed', { reason: result.detail ?? '' }),
      };
    },
    [t]
  );

  /**
   * F6: every bridge call needs a `catch`, not just a `finally`.
   *
   * On the REMOTE (paired-device WebUI) transport all four of these channels are
   * remote-denied - correctly - so `invoke()` REJECTS with a `BridgeUnavailableError`.
   * The card itself still renders there, because the conversation stream that
   * triggers it is remote-allowed. Without a catch the click became an unhandled
   * rejection instead of the `revealFailed` / `writeFailed` line the user needs.
   */
  const runRepair = useCallback(async () => {
    setBusy(true);
    try {
      const result = await engineConfigRecovery.repair.invoke();
      setOutcome(describe(result, 'repaired'));
      await inspect();
      if (result.ok) onRecovered?.();
    } catch (error) {
      setOutcome({
        tone: 'error',
        text: t('conversation.engineConfigInvalid.result.writeFailed', { reason: messageOf(error) }),
      });
    } finally {
      setBusy(false);
    }
  }, [describe, inspect, onRecovered, t]);

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
    } catch (error) {
      setOutcome({
        tone: 'error',
        text: t('conversation.engineConfigInvalid.result.writeFailed', { reason: messageOf(error) }),
      });
    } finally {
      setBusy(false);
    }
  }, [describe, inspect, onRecovered, t]);

  const runReveal = useCallback(async () => {
    try {
      const result = await engineConfigRecovery.reveal.invoke();
      if (!result.ok) {
        setOutcome({
          tone: 'error',
          text: t('conversation.engineConfigInvalid.result.revealFailed', { reason: result.error ?? '' }),
        });
      }
    } catch (error) {
      setOutcome({
        tone: 'error',
        text: t('conversation.engineConfigInvalid.result.revealFailed', { reason: messageOf(error) }),
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
  const problem = invalid?.problem;

  return (
    <div className='flex flex-col gap-12px'>
      <div className='flex flex-col gap-4px'>
        {invalid ? (
          <div className='text-13px text-t-primary'>
            {problem
              ? t('conversation.engineConfigInvalid.location', {
                  line: problem.line,
                  column: problem.column,
                })
              : t('conversation.engineConfigInvalid.notText')}
          </div>
        ) : inspection.status === 'unreadable' ? (
          <div className='text-13px text-t-primary'>
            {t('conversation.engineConfigInvalid.unreadable', { reason: inspection.reason })}
          </div>
        ) : (
          <div className='text-13px text-t-primary'>{t('conversation.engineConfigInvalid.noProblem')}</div>
        )}
        {/* F5: the PATH is rendered in EVERY branch, not just `invalid`.
            The Doctor's own check currently resolves the NATIVE config while this
            resolves the ACTIVE PROFILE's, so with a named profile active the row
            can fail while this panel reports no problem. Showing which file was
            actually inspected makes that visible instead of silently confusing.
            The path is safe to show and is half the point of the fix - the #1024
            reporter could not find this file. The file's CONTENT is not. */}
        {inspection.path && <code className='text-11px text-t-secondary break-all select-all'>{inspection.path}</code>}
      </div>

      <ul className='flex flex-col gap-8px' role='list'>
        {invalid?.repair && problem && (
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
                {t('conversation.engineConfigInvalid.repair.label', { line: problem.line })}
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
              {problem
                ? t('conversation.engineConfigInvalid.repair.unavailable', { line: problem.line })
                : t('conversation.engineConfigInvalid.repair.notTextUnavailable')}
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
