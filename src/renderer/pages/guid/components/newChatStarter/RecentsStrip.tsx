/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRecentConversations, type RecentConversation } from '../../hooks/useRecentConversations';
import styles from './RecentsStrip.module.css';

export type RecentsStripProps = {
  /** Called when a recent card is clicked — caller routes to the conversation. */
  onSelect: (conversation: RecentConversation) => void;
  /**
   * Inject a recents list directly instead of consuming the
   * `useRecentConversations` hook. Useful for unit tests.
   */
  recents?: RecentConversation[];
};

const RecentsStrip: React.FC<RecentsStripProps> = ({ onSelect, recents: injected }) => {
  const { t } = useTranslation();
  const hookResult = useRecentConversations();
  const recents = injected ?? hookResult.recents;

  if (recents.length === 0) return null;

  return (
    <section
      className={styles.strip}
      data-testid='recents-strip'
      aria-label={t('guid.newChat.recents.label', { defaultValue: 'Recent conversations' })}
    >
      <h2 className={styles.title}>{t('guid.newChat.recents.heading', { defaultValue: 'Jump back in' })}</h2>
      <ul className={styles.cardList}>
        {recents.map((conv) => (
          <li key={conv.id} className={styles.cardItem}>
            <button
              type='button'
              className={styles.card}
              data-testid='recents-card'
              data-conversation-id={conv.id}
              onClick={() => onSelect(conv)}
            >
              <span className={styles.cardIcon} aria-hidden='true'>
                {conv.assistantIcon ?? <MessageSquare size={16} />}
              </span>
              <span className={styles.cardBody}>
                <span className={styles.cardName}>{conv.name}</span>
                {conv.assistantName ? <span className={styles.cardAssistant}>{conv.assistantName}</span> : null}
              </span>
              <ArrowRight size={15} className={styles.cardArrow} aria-hidden='true' />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RecentsStrip;
