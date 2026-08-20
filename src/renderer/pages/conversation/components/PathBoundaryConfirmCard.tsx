/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IConfirmation } from '@/common/chat/chatLib';
import { PATH_BOUNDARY_GRANT_FOLDER, pathBoundaryRootOf } from '@/common/chat/pathBoundaryConsent';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The folder-grant card for a Wayland Core `PathBoundary` escalation (#1099).
 *
 * Deliberately NOT the generic approval prompt. The generic prompt asks "allow
 * this tool call?" and answers with `once` / `always`; neither is a truthful
 * answer here. The engine has classified, BEFORE running the call, that it is
 * about to leave the workspace — so the real question is about a FOLDER, and
 * the only answer Core can act on is a standing read grant on that folder.
 *
 * Two things this card shows that the generic one structurally cannot:
 *  - the target and the granted ROOT as separate lines. They are different
 *    paths (the root is the containing directory), and a card that showed only
 *    one of them would either hide what was asked for or misstate what is
 *    handed over.
 *  - the scope in words: read-only, this session. There is no "allow once"
 *    button because Core cannot run the call under a one-shot grant.
 *
 * No keyboard shortcut is offered on any option here, and none is bound — see
 * the guard in ConversationChatConfirm's key handler. A grant of authority
 * outside the workspace is click-only.
 */
const PathBoundaryConfirmCard: React.FC<{
  confirmation: IConfirmation<any>;
  onConfirm: (option: IConfirmation<any>['options'][number]) => void;
}> = ({ confirmation, onConfirm }) => {
  const { t } = useTranslation();
  const root = pathBoundaryRootOf(confirmation);
  const target = confirmation.description;

  return (
    <div
      data-testid='path-boundary-card'
      className='relative p-16px bg-dialog-fill-0 flex flex-col overflow-hidden m-b-20px rd-20px max-w-800px max-h-[calc(100vh-200px)] w-full mx-auto box-border'
      style={{ boxShadow: '0px 2px 20px 0px rgba(74, 88, 250, 0.1)' }}
    >
      <div className='flex-1 overflow-y-auto min-h-0'>
        <div className='text-16px font-bold color-[var(--text-primary)]'>
          {t('messages.confirmation.pathBoundaryTitle')}
        </div>

        {target && (
          <div className='mt-12px'>
            <div className='text-12px color-[var(--text-secondary)]'>
              {t('messages.confirmation.pathBoundaryTargetLabel')}
            </div>
            <div data-testid='path-boundary-target' className='text-13px font-mono color-[var(--text-primary)] break-all'>
              {target}
            </div>
          </div>
        )}

        {root && (
          <div className='mt-10px'>
            <div className='text-12px color-[var(--text-secondary)]'>
              {t('messages.confirmation.pathBoundaryRootLabel')}
            </div>
            <div data-testid='path-boundary-root' className='text-13px font-mono color-[var(--text-primary)] break-all'>
              {root}
            </div>
          </div>
        )}
      </div>

      <div className='shrink-0'>
        {confirmation.options.map((option, index) => (
          <div
            key={String(option.value)}
            onClick={() => onConfirm(option)}
            data-testid={
              option.value === PATH_BOUNDARY_GRANT_FOLDER ? 'path-boundary-grant' : 'path-boundary-deny'
            }
            className={`b-1px b-solid min-h-30px rd-8px px-12px py-6px leading-snug cursor-pointer mt-10px flex flex-col color-[var(--text-primary)] ${
              index === 0
                ? 'b-[rgba(22,93,255,1)] hover:bg-[var(--bg-hover)]'
                : 'b-[var(--border-base)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <span>{t(option.label, option.params)}</span>
            {option.description && (
              <span className='text-12px color-[var(--text-secondary)] mt-2px'>{t(option.description)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PathBoundaryConfirmCard;
