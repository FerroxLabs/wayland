/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IConfirmation } from '@/common/chat/chatLib';
import {
  PATH_BOUNDARY_GRANT_FOLDER,
  PATH_BOUNDARY_REMEMBER_FOLDER,
  isPathBoundaryGrantValue,
  pathBoundaryRootOf,
} from '@/common/chat/pathBoundaryConsent';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The ONLY key this card activates on. `KeyboardEvent.key` for the space bar is
 * a single space character; `'Space'` is the physical `code`, which nothing here
 * reads.
 */
const ACTIVATION_KEY = ' ';

/** How that key is named to the user — in the badge and in `aria-keyshortcuts`. */
const ACTIVATION_KEY_NAME = 'Space';

/**
 * Accessible names for the two grant options. Each carries the root and the
 * live key, and each states its OWN duration - a screen-reader user hears the
 * difference between the two buttons only here, because the visible labels
 * differ by a few words and the hint text below them is not part of the name.
 */
const GRANT_ARIA_KEY: Readonly<Record<string, string>> = {
  [PATH_BOUNDARY_GRANT_FOLDER]: 'messages.confirmation.pathBoundaryGrantAria',
  [PATH_BOUNDARY_REMEMBER_FOLDER]: 'messages.confirmation.pathBoundaryRememberAria',
};

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
 *  - the scope in words: read-only, and how long it lasts. There is no "allow
 *    once" button because Core cannot run the call under a one-shot grant.
 *
 * TWO GRANTS, ONE FOLDER. The second grant option adds a durable record on the
 * workspace's folder-grant list; it opens exactly the same root, read from the
 * same `pathBoundaryRootOf` accessor, and differs only in how long it lasts.
 * Each button's hint and accessible name state its own duration, because the
 * only thing separating them is that duration and a card that let a user
 * mistake one for the other would be worse than a card with one button.
 *
 * KEYBOARD. Enter and Y are NOT bound here, and must never be: Enter fires
 * `options[0]` by INDEX in ConversationChatConfirm's key handler and
 * `BaseAgentManager.addConfirmation` auto-confirms `options[0]` by index under
 * yolo — on this card `options[0]` IS a grant, so either binding is a
 * keystroke away from handing over filesystem authority. That guard stays, and
 * `options[0]` is deliberately the NARROWER of the two grants.
 *
 * But click-only made the decision unreachable for a keyboard-only or
 * screen-reader user, which is a worse defect than the one the guard prevents.
 * So each option is a real control (`role='button'`, `tabIndex={0}`) activated
 * by SPACE ALONE — the one key no auto-confirm path, no shortcut handler and no
 * global listener in this app binds to any confirmation. Space is announced in
 * the accessible name and shown as a badge, because a focusable control whose
 * obvious key (Enter) deliberately does nothing is still unusable if the user
 * is never told which key works.
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
            <div
              data-testid='path-boundary-target'
              className='text-13px font-mono color-[var(--text-primary)] break-all'
            >
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
        {confirmation.options.map((option, index) => {
          const isGrant = isPathBoundaryGrantValue(option.value);
          const label = t(option.label, option.params);
          // The accessible name names the FOLDER the grant opens, read from the
          // same `pathBoundaryRootOf` accessor that the root line above renders
          // and that WCoreManager grants — so what a screen reader announces
          // cannot drift from what is handed over. It opens with the visible
          // label so the name is a superset of it (WCAG 2.5.3, Label in Name).
          const ariaKey = GRANT_ARIA_KEY[String(option.value)];
          const ariaLabel = isGrant && root && ariaKey ? t(ariaKey, { label, folder: root }) : undefined;
          return (
            <div
              key={String(option.value)}
              role='button'
              tabIndex={0}
              aria-label={ariaLabel}
              aria-keyshortcuts={ACTIVATION_KEY_NAME}
              onClick={() => onConfirm(option)}
              onKeyDown={(event) => {
                // SPACE ONLY. Not Enter, not Y — see the note at the top of this
                // file. Anything else falls through untouched.
                if (event.key !== ACTIVATION_KEY) return;
                event.preventDefault(); // Space would otherwise scroll the page.
                onConfirm(option);
              }}
              data-testid={
                option.value === PATH_BOUNDARY_REMEMBER_FOLDER
                  ? 'path-boundary-remember'
                  : isGrant
                    ? 'path-boundary-grant'
                    : 'path-boundary-deny'
              }
              className={`b-1px b-solid min-h-30px rd-8px px-12px py-6px leading-snug cursor-pointer mt-10px flex items-start gap-8px color-[var(--text-primary)] ${
                index === 0
                  ? 'b-[rgba(22,93,255,1)] hover:bg-[var(--bg-hover)]'
                  : 'b-[var(--border-base)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <span
                aria-hidden='true'
                className='inline-flex items-center justify-center px-4px h-18px rd-4px bg-[var(--bg-2)] text-11px text-[var(--text-secondary)] font-mono shrink-0 mt-1px'
              >
                {ACTIVATION_KEY_NAME}
              </span>
              <span className='min-w-0'>
                <span data-testid='path-boundary-option-label'>{label}</span>
                {option.description && (
                  <span className='block text-12px color-[var(--text-secondary)] mt-2px'>{t(option.description)}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PathBoundaryConfirmCard;
