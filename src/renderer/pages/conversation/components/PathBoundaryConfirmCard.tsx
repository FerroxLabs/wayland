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
import React, { useEffect, useRef, useState } from 'react';
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
 * Whether a pointer release at (`x`,`y`) is still ON the control it pressed.
 *
 * Press-then-drag-away-then-release means "I changed my mind", and a consent
 * surface must keep that escape hatch. The card claims the pointer on press
 * (see `onPointerDown`), so the release is delivered here even when the pointer
 * has left the control — which is what makes this check load-bearing rather
 * than something the browser would have done for us.
 *
 * A zero-sized rect means the environment does not lay out at all (jsdom, and
 * any headless render). Treat that as a hit: swallowing the answer there would
 * make the control untestable, and there is no drag to cancel without layout.
 */
function releasedOnControl(element: Element, x: number, y: number): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

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
 * is never told which key works. That badge is shown on the FOCUSED row only —
 * it is the only row the key reaches, and on any other row it would be
 * advertising a key that denies. See `focusedValue`.
 *
 * POINTING. A press is answered on the pointer RELEASE over the same row, with
 * the pointer captured on press, not left to the browser's `click` — see
 * `onPointerDown`. Every path funnels through `answer`, so one press produces
 * exactly one answer.
 */
const PathBoundaryConfirmCard: React.FC<{
  confirmation: IConfirmation<any>;
  onConfirm: (option: IConfirmation<any>['options'][number]) => void;
}> = ({ confirmation, onConfirm }) => {
  const { t } = useTranslation();
  const root = pathBoundaryRootOf(confirmation);
  const target = confirmation.description;

  /**
   * FOCUS THE REFUSAL WHEN THE CARD APPEARS.
   *
   * Found by driving the real app: the card renders with `role='button'`,
   * `tabIndex={0}` and `aria-keyshortcuts='Space'`, and nothing ever focused
   * it - `document.activeElement` was `BODY`. So the Space these buttons
   * advertise did nothing at all until the user happened to Tab onto one. The
   * unit tests proved Space activates a FOCUSED option; no test asked whether
   * anything focuses the card, and only a live run could tell us.
   *
   * WHY THE REFUSAL AND NOT THE GRANT. The reason Enter and Y are left unbound
   * is that a stray keypress must not hand over a folder. Focusing the grant
   * would reintroduce exactly that through the one key we DO bind. With the
   * refusal focused the advertised shortcut works immediately, and a stray
   * Space DENIES - which costs a retry, where the other way costs authority.
   * The grant is one Tab away, which is the deliberate act it should be.
   */
  const refuseRef = useRef<HTMLDivElement | null>(null);

  /**
   * The option that HAS FOCUS, and therefore the ONE option the advertised key
   * would actually answer. `null` when focus is somewhere else entirely, which
   * is when the key answers nothing.
   *
   * Found by driving the real app: every row rendered the same `Space` badge,
   * while the handler that reads that key is per-row and only ever reaches the
   * FOCUSED row — the refusal, by design. So the badge on the grant row was a
   * false statement: a user who read "Space" beside "Allow this folder" and
   * pressed it got a DENIAL. Two rows advertising one key cannot both be
   * telling the truth, and the badge now follows the focus that decides it.
   */
  const [focusedValue, setFocusedValue] = useState<string | null>(null);

  /**
   * One answer per card. The press path below answers on the pointer RELEASE,
   * and the browser still dispatches its own `click` afterwards; without this
   * the card would answer twice for one deliberate press.
   */
  const answeredRef = useRef(false);

  /** The option a pointer press went down on, so the release can match it. */
  const pressedValueRef = useRef<string | null>(null);

  useEffect(() => {
    answeredRef.current = false;
    pressedValueRef.current = null;
    refuseRef.current?.focus();
    // Keyed on the call, not on mount: the card is reused for the next boundary
    // in the same conversation, and a second prompt that never takes focus is
    // the same bug wearing a different hat.
  }, [confirmation.callId]);

  /**
   * Answer the card, at most once.
   *
   * Every path — pointer release, `click`, Space — funnels through here, so the
   * three cannot disagree about WHICH option was chosen or answer twice.
   */
  const answer = (option: (typeof confirmation.options)[number]) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    onConfirm(option);
  };

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
          const value = String(option.value);
          const isFocused = focusedValue === value;
          return (
            <div
              key={String(option.value)}
              ref={isGrant ? undefined : refuseRef}
              role='button'
              tabIndex={0}
              aria-label={ariaLabel}
              aria-keyshortcuts={ACTIVATION_KEY_NAME}
              onFocus={() => setFocusedValue(value)}
              onBlur={() => setFocusedValue((current) => (current === value ? null : current))}
              onPointerDown={(event) => {
                pressedValueRef.current = value;
                // CLAIM THE POINTER. Found by driving the real app: pressing
                // this row moved focus to it and answered nothing. A `click` is
                // only dispatched to the control when the press AND the release
                // resolve to it, and this card re-renders on every engine frame
                // while the call is pending — so a row that moves under the
                // pointer sends `click` to an ancestor that has no handler, and
                // a deliberate press becomes silence. With the pointer captured
                // the release is delivered here whatever the layout does.
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                  // Pointer capture is not universal (older webviews, some test
                  // environments). The `click` path below still answers there.
                }
              }}
              onPointerUp={(event) => {
                if (pressedValueRef.current !== value) return;
                pressedValueRef.current = null;
                if (!releasedOnControl(event.currentTarget, event.clientX, event.clientY)) return;
                answer(option);
              }}
              onClick={() => answer(option)}
              onKeyDown={(event) => {
                // SPACE ONLY. Not Enter, not Y — see the note at the top of this
                // file. Anything else falls through untouched.
                if (event.key !== ACTIVATION_KEY) return;
                event.preventDefault(); // Space would otherwise scroll the page.
                answer(option);
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
              {/* The key badge belongs to the FOCUSED row and to no other: the
                  handler that reads it is per-row, so on every other row the
                  same badge would be advertising a key that denies instead.
                  The slot keeps its width either way, so moving focus does not
                  shift the rows under the user's pointer. */}
              <span
                aria-hidden='true'
                className={`inline-flex items-center justify-center px-4px min-w-38px h-18px rd-4px text-11px text-[var(--text-secondary)] font-mono shrink-0 mt-1px ${
                  isFocused ? 'bg-[var(--bg-2)]' : ''
                }`}
              >
                {isFocused ? ACTIVATION_KEY_NAME : ''}
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
