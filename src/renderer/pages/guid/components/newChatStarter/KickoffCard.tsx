/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Button } from '@arco-design/web-react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './KickoffCard.module.css';

export type KickoffCardProps = {
  /** Card body text. Multi-line; newlines preserved via white-space: pre-line. */
  text: string;
  /** Yes-bias primary CTA. Should drop the prefill into the input + focus it. */
  onAccept: () => void;
  /** "Something else" peer-weighted secondary. Rotates to next alternate. */
  onRedirect: () => void;
  /** × top-right close button. Per-session dismiss (no Settings ceremony). */
  onDismiss: () => void;
};

/**
 * Yes-bias engagement card for the new-chat empty state. One confident
 * offer per assistant from the SuggestionEngine cascade. Renders BELOW
 * the input (mounted by GuidPage) so the primary `[Yes, let's start]`
 * button never steals the first keystroke when the user just wants to
 * type.
 *
 * Anti-patterns we explicitly avoid (per Sutherland + Krug + Sean's
 * locked decisions in the v0.4.7 handoff):
 *   - No emoji, no exclamation marks, no adverbs in copy
 *   - No confirm dialog on × dismiss
 *   - Primary button filled; "Something else" peer-weighted text link
 *   - No drill-down menu; no chip ribbon; one offer, two outs
 */
const KickoffCard: React.FC<KickoffCardProps> = ({ text, onAccept, onRedirect, onDismiss }) => {
  const { t } = useTranslation();

  // v0.4.7.1 (D-M-4) - Document-level Escape listener for keyboard dismissal.
  // Scoped to the card lifetime so the listener detaches on unmount and
  // doesn't leak across new-chat → conversation route transitions.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <div
      className={styles.card}
      data-testid='new-chat-kickoff-card'
      // v0.4.7.1 (D-M-4) - region role + polite live region so screen readers
      // announce the suggestion without stealing focus from the input. The
      // aria-label is added in the i18n bundle under guid.newChat.kickoff.
      role='region'
      aria-live='polite'
      aria-label={t('guid.newChat.kickoff.regionAria', { defaultValue: 'Suggested first message' })}
    >
      {/* v0.4.7.1 (D-L-1) - Raw <button> retained intentionally so the dismiss
          × stays peer-weighted with the body content. Arco Button would force
          a filled/outlined visual that competes with the primary Accept CTA.
          Same precedent set by IntentSuggestionPanel. */}
      {/* eslint-disable-next-line wayland/no-raw-button */}
      <button
        type='button'
        onClick={onDismiss}
        aria-label={t('guid.newChat.kickoff.dismissAria', { defaultValue: 'Dismiss suggestion' })}
        className={styles.dismissBtn}
        data-testid='new-chat-kickoff-dismiss'
      >
        <X size={16} />
      </button>
      <div className={styles.body} data-testid='new-chat-kickoff-body'>
        {text}
      </div>
      <div className={styles.actions}>
        <Button type='primary' onClick={onAccept} data-testid='new-chat-kickoff-accept'>
          {t('guid.newChat.kickoff.accept', { defaultValue: "Yes, let's start" })}
        </Button>
        {/* v0.4.7.1 (D-L-1) - Same rationale as the dismiss button: the
            "Something else" affordance is a peer-weighted text link, not a
            filled CTA. Arco Button would over-emphasize it. */}
        {/* eslint-disable-next-line wayland/no-raw-button */}
        <button
          type='button'
          onClick={onRedirect}
          className={styles.redirectBtn}
          data-testid='new-chat-kickoff-redirect'
        >
          {t('guid.newChat.kickoff.redirect', { defaultValue: 'Something else' })}
        </button>
      </div>
    </div>
  );
};

export default KickoffCard;
