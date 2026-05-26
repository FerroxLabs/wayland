/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CronProposeCard — inline confirmation card for natural-language
 * scheduling (v0.6.2.6). Rendered by MessageList when a `cron_propose`
 * message is detected; mirrors the AskCard pattern used by the workflow
 * surface.
 *
 * The agent emits a [CRON_PROPOSE] block in chat. MessageMiddleware
 * detects + validates the schedule via croner and stores a `cron_propose`
 * message with status='pending'. This card renders three variants:
 *   - pending  → Yes / Edit / Cancel buttons (Yes disabled on parseError)
 *   - accepted → "✓ Scheduled" with link to the created task
 *   - cancelled → muted dismiss state
 *
 * All field content is rendered as plain text via React's default JSX
 * escaping — no raw HTML insertion paths, so prompt-injection in agent
 * output cannot escape the card boundary.
 */

import { Button, Tag } from '@arco-design/web-react';
import { Calendar, Check, Edit, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';

import { ipcBridge } from '@/common';
import type { IMessageCronPropose } from '@/common/chat/chatLib';

import styles from './CronProposeCard.module.css';

export type CronProposeCardProps = {
  message: IMessageCronPropose;
};

const CronProposeCard: React.FC<CronProposeCardProps> = ({ message }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { name, scheduleDescription, prompt, parseError, status, cronJobId } = message.content;

  if (status === 'accepted') {
    return (
      <div className={classNames(styles.shell, styles.accepted)}>
        <div className={styles.header}>
          <Check size={16} /> {t('cron.propose.accepted', { name })}
        </div>
        {cronJobId && (
          <Button type='text' size='mini' onClick={() => navigate(`/scheduled/${cronJobId}`)}>
            {t('cron.propose.viewTask')}
          </Button>
        )}
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className={classNames(styles.shell, styles.cancelled)}>
        <X size={14} /> {t('cron.propose.cancelled')}
      </div>
    );
  }

  // pending — render review fields + action buttons
  const sendAction = (action: 'accept' | 'edit' | 'cancel') => {
    void ipcBridge.cron.confirmProposal
      .invoke({
        conversationId: message.conversation_id,
        msgId: message.msg_id ?? message.id,
        action,
      })
      .catch((err) => {
        console.warn('[CronProposeCard] confirmProposal failed:', err);
      });
  };

  return (
    <div className={classNames(styles.shell, styles.pending)}>
      <div className={styles.header}>
        <Calendar size={16} /> {t('cron.propose.title')}
      </div>
      <dl className={styles.body}>
        <dt>{t('cron.propose.name')}</dt>
        <dd>{name}</dd>
        <dt>{t('cron.propose.schedule')}</dt>
        <dd>
          {scheduleDescription}
          {parseError && (
            <Tag color='red' size='small' className={styles.errorTag}>
              {t('cron.propose.parseError')}
            </Tag>
          )}
        </dd>
        <dt>{t('cron.propose.prompt')}</dt>
        <dd className={styles.prompt}>{prompt}</dd>
      </dl>
      <div className={styles.actions}>
        <Button type='primary' size='mini' disabled={parseError} onClick={() => sendAction('accept')}>
          <Check size={14} /> {t('cron.propose.yes')}
        </Button>
        <Button size='mini' onClick={() => sendAction('edit')}>
          <Edit size={14} /> {t('cron.propose.edit')}
        </Button>
        <Button type='text' size='mini' onClick={() => sendAction('cancel')}>
          <X size={14} /> {t('cron.propose.cancel')}
        </Button>
      </div>
    </div>
  );
};

export default CronProposeCard;
