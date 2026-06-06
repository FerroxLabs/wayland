/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CronProposeCard - inline confirmation card for natural-language
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
 * escaping - no raw HTML insertion paths, so prompt-injection in agent
 * output cannot escape the card boundary.
 */

import { Button, Message, Tag } from '@arco-design/web-react';
import { Calendar, Check, Edit, X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';

import { ipcBridge } from '@/common';
import type { IMessageCronPropose } from '@/common/chat/chatLib';
import { emitter } from '@/renderer/utils/emitter';

import styles from './CronProposeCard.module.css';

export type CronProposeCardProps = {
  message: IMessageCronPropose;
};

const CronProposeCard: React.FC<CronProposeCardProps> = ({ message }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // v0.6.2.6.1 - `resolving` flag closes the rapid-double-click race
  // (Codex C-R-01 / Gemini G-R-01). All three actions share the gate;
  // re-enabled if the IPC returns !ok so the user can retry. On success
  // the card itself transitions away from `pending` via responseStream
  // and the buttons disappear, no manual re-enable needed.
  const [resolving, setResolving] = useState(false);
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

  if (status === 'processing') {
    // Mid-flight server-side transition (race-guard window). User sees the
    // card grayed for the brief duration; if addJob fails the bridge
    // reverts to `pending` and the buttons return.
    return (
      <div className={classNames(styles.shell, styles.pending)} style={{ opacity: 0.6 }}>
        <div className={styles.header}>
          <Calendar size={16} /> {t('cron.propose.title')}
        </div>
      </div>
    );
  }

  // pending - render review fields + action buttons
  const sendAction = async (action: 'accept' | 'edit' | 'cancel') => {
    if (resolving) return; // client-side race guard
    setResolving(true);
    try {
      const result = await ipcBridge.cron.confirmProposal.invoke({
        conversationId: message.conversation_id,
        msgId: message.msg_id ?? message.id,
        action,
      });
      if (result.ok === false) {
        // Bridge rejected - surface to user via toast + re-enable so retry
        // is possible. Reason strings are stable + map to i18n keys when
        // available; fall back to a generic error.
        const reason = (result as { ok: false; reason: string }).reason;
        const i18nKey = `cron.propose.error.${reason}`;
        const fallback = t('cron.propose.error.unknown');
        const translated = t(i18nKey as never);
        Message.error(translated === i18nKey ? fallback : translated);
        setResolving(false);
        return;
      }
      if (action === 'edit' && result.editPayload) {
        // Fixes Gemini G-P-01 (Edit dead-end): fire event so CronJobManager
        // opens CreateTaskDialog pre-filled with the proposed fields.
        emitter.emit('cron.modal.openWithProposal', {
          conversationId: result.editPayload.conversationId,
          conversationTitle: result.editPayload.conversationTitle,
          agentType: result.editPayload.agentType,
          initialName: result.editPayload.initialName,
          initialPrompt: result.editPayload.initialPrompt,
          initialSchedule: result.editPayload.initialSchedule,
          initialScheduleDescription: result.editPayload.initialScheduleDescription,
        });
        // Don't lock the card - user may cancel out of modal + re-engage.
        setResolving(false);
      }
      if (action === 'accept' && result.jobId) {
        // v0.6.2.6.1 (Codex C-P-04 fix) - surface success toast so the
        // user gets a clear signal the cron landed. The card's lifecycle
        // also flips to 'accepted' via responseStream, but a toast is
        // more discoverable when the card has scrolled out of view.
        Message.success(t('cron.propose.successToast', { name }));
      }
      // accept + cancel: card transitions via responseStream broadcast; the
      // re-render with new status removes the buttons; no need to clear
      // resolving (component unmount or branch change handles it).
    } catch (err) {
      console.warn('[CronProposeCard] confirmProposal failed:', err);
      Message.error(t('cron.propose.error.unknown'));
      setResolving(false);
    }
  };

  return (
    <div className={classNames(styles.shell, styles.pending)}>
      <div className={styles.header}>
        <Calendar size={16} /> {t('cron.propose.title')}
      </div>
      <dl className={styles.body}>
        <dt>{t('cron.propose.name')}</dt>
        <dd className={styles.singleLine}>{name}</dd>
        <dt>{t('cron.propose.schedule')}</dt>
        <dd>
          <span className={styles.singleLine}>{scheduleDescription}</span>
          {parseError && (
            <>
              <Tag color='red' size='small' className={styles.errorTag}>
                {t('cron.propose.parseError')}
              </Tag>
              <div className={styles.parseErrorHelp}>{t('cron.propose.parseErrorHelp')}</div>
            </>
          )}
        </dd>
        <dt>{t('cron.propose.prompt')}</dt>
        <dd className={styles.prompt}>{prompt}</dd>
      </dl>
      <div className={styles.actions}>
        <Button
          type='primary'
          size='mini'
          disabled={parseError || resolving}
          onClick={() => void sendAction('accept')}
        >
          <Check size={14} /> {t('cron.propose.yes')}
        </Button>
        <Button size='mini' disabled={resolving} onClick={() => void sendAction('edit')}>
          <Edit size={14} /> {t('cron.propose.edit')}
        </Button>
        <Button type='text' size='mini' disabled={resolving} onClick={() => void sendAction('cancel')}>
          <X size={14} /> {t('cron.propose.cancel')}
        </Button>
      </div>
    </div>
  );
};

export default CronProposeCard;
