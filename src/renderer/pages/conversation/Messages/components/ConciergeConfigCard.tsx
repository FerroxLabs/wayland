/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ConciergeConfigCard - inline confirmation card for a conversational config
 * change (Concierge Phase 2b). Rendered by MessageList when a `concierge_propose`
 * message is detected; mirrors CronProposeCard.
 *
 * The agent emits a [CONCIERGE_PROPOSE] block; MessageMiddleware stores a
 * `concierge_propose` message (status='pending') and broadcasts it. This card is
 * the consent surface: the config mutation applies in MAIN only when the user
 * clicks Accept (conciergeConfigBridge.confirmProposal).
 *
 * SECURITY: for provider_connect the API key is entered HERE (local state only)
 * and sent over the confirm IPC's `secret` field - it is never part of the
 * proposal/message, never rendered back, never logged. add_mcp env values are
 * shown masked. All content is plain-text JSX (no raw HTML), so agent output
 * cannot escape the card boundary.
 */

import { Button, Input, Message, Typography } from '@arco-design/web-react';
import { Check, Settings, X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import { ipcBridge } from '@/common';
import type { IMessageConciergeConfig } from '@/common/chat/chatLib';
import { proposalNeedsCardSecret, maskSecretValue, summarizeProposal } from '@/common/chat/conciergeConfig';
import { fileBugReport } from '@/renderer/utils/bugReport';

import styles from './ConciergeConfigCard.module.css';

export type ConciergeConfigCardProps = {
  message: IMessageConciergeConfig;
};

const ConciergeConfigCard: React.FC<ConciergeConfigCardProps> = ({ message }) => {
  const { t } = useTranslation();
  const [resolving, setResolving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const content = message.content;
  const { status } = content;

  if (status === 'accepted') {
    return (
      <div className={classNames(styles.shell, styles.accepted)}>
        <div className={styles.header}>
          <Check size={16} /> {content.resultSummary || t('concierge.config.applied')}
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className={classNames(styles.shell, styles.cancelled)}>
        <X size={14} /> {t('concierge.config.cancelled')}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={classNames(styles.shell, styles.errored)}>
        <X size={14} /> {content.error || t('concierge.config.error')}
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className={classNames(styles.shell, styles.pending)} style={{ opacity: 0.6 }}>
        <div className={styles.header}>
          <Settings size={16} /> {t('concierge.config.applying')}
        </div>
      </div>
    );
  }

  const needsKey = proposalNeedsCardSecret(content.kind);
  const acceptDisabled = resolving || (needsKey && !apiKey.trim());

  const sendAction = async (action: 'accept' | 'cancel') => {
    if (resolving) return;
    setResolving(true);
    try {
      // file_bug_report (#464) is non-mutating: run the capture → clipboard → open
      // flow in the renderer, then record acceptance in MAIN so the card resolves.
      if (action === 'accept' && content.kind === 'file_bug_report') {
        await fileBugReport(t);
      }
      const result = await ipcBridge.conciergeConfig.confirmProposal.invoke({
        conversationId: message.conversation_id,
        msgId: message.msg_id ?? message.id,
        action,
        secret:
          action === 'accept' && content.kind === 'provider_connect'
            ? { apiKey: apiKey.trim(), baseUrl: baseUrl.trim() || undefined }
            : undefined,
      });
      if (result.ok === false) {
        // Map known machine reasons to actionable text; fall back to generic.
        const reason = result.reason;
        const i18nKey = reason ? `concierge.config.error.${reason}` : 'concierge.config.error';
        const translated = t(i18nKey as never);
        Message.error(translated === i18nKey ? t('concierge.config.error') : translated);
        setResolving(false);
        return;
      }
      if (action === 'accept' && content.kind !== 'file_bug_report') {
        // file_bug_report already toasts from fileBugReport(); avoid a double toast.
        Message.success(t('concierge.config.applied'));
      }
      // accept + cancel: the card transitions via the responseStream broadcast;
      // the re-render with the new status removes the buttons.
    } catch (err) {
      console.warn('[ConciergeConfigCard] confirmProposal failed:', err);
      Message.error(t('concierge.config.error'));
      setResolving(false);
    }
  };

  return (
    <div className={classNames(styles.shell, styles.pending)}>
      <div className={styles.header}>
        <Settings size={16} /> {t('concierge.config.title')}
      </div>
      <div className={styles.body}>
        <div className={styles.summary}>{summarizeProposal(content)}</div>

        {content.kind === 'add_mcp' && content.env && Object.keys(content.env).length > 0 && (
          <div className={styles.env} data-testid='mcp-env'>
            {Object.entries(content.env).map(([k, v]) => (
              <div key={k}>
                {k}={maskSecretValue(v)}
              </div>
            ))}
          </div>
        )}

        {content.kind === 'edit_assistant' && (
          <Typography.Paragraph className={styles.rules} ellipsis={{ rows: 4, expandable: true }}>
            {content.rules}
          </Typography.Paragraph>
        )}

        {needsKey && (
          <div className={styles.secret}>
            <Input.Password
              value={apiKey}
              onChange={setApiKey}
              placeholder={t('concierge.config.apiKeyPlaceholder')}
              aria-label={t('concierge.config.apiKeyLabel')}
              data-testid='concierge-api-key'
            />
            <Input value={baseUrl} onChange={setBaseUrl} placeholder={t('concierge.config.baseUrlLabel')} />
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <Button type='primary' size='mini' disabled={acceptDisabled} onClick={() => void sendAction('accept')}>
          <Check size={14} /> {t('concierge.config.accept')}
        </Button>
        <Button type='text' size='mini' disabled={resolving} onClick={() => void sendAction('cancel')}>
          <X size={14} /> {t('concierge.config.cancel')}
        </Button>
      </div>
    </div>
  );
};

export default ConciergeConfigCard;
