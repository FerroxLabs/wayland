/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { toolSummaryToSteps } from '@/common/chat/activity/projectMessages';
import type { IMessageActivity, IMessageSubAgent, IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
import ActivityTimeline from '@/renderer/components/chat/observability/ActivityTimeline';
import { useObservabilitySettings } from '@/renderer/hooks/settings/useObservabilitySettings';
import { Switch } from '@arco-design/web-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import MessageActivity from './MessageActivity';
import SubAgentActivityCard from './SubAgentActivityCard';
import styles from './ObservabilityPanel.module.css';

/**
 * #252 reframe - opt-in right-side observability panel.
 *
 * The chat center stays calm (only the inline working pulse remains there); the
 * full activity tree moves here. The panel mounts INSIDE WCoreChat's
 * MessageListProvider subtree so it can read the same message stream via
 * useMessageList, filter the `activity` + `sub_agent` turns, and render each one
 * through the existing MessageActivity / SubAgentActivityCard cards (reused
 * as-is, not rewritten). Sub-agent turns carry the swarm/delegation tree, so the
 * panel must surface them too. Cost is gated by the opt-in `showCost` setting
 * (off by default).
 */

/**
 * `activity` and `sub_agent` are the Gemini/ACP shapes. WCore reports its tool
 * work as `tool_group` and never emits an `activity` message at all, so a real
 * WCore turn left this panel on its empty hint while the chat beside it listed
 * every tool. The chat projects those same messages through toolSummaryToSteps;
 * doing it here keeps one projection, not two renderings of one truth.
 */
const isObservable = (m: TMessage): m is IMessageActivity | IMessageSubAgent | IMessageToolGroup =>
  m.type === 'activity' || m.type === 'sub_agent' || m.type === 'tool_group';

/**
 * Body only. The workbench card owns the title and the close control, so this
 * panel must not render either: when it did, "Observability" appeared three
 * times in one card (card header, section row, and here) with two close buttons
 * that did different things. One card, one chrome.
 */
const ObservabilityPanel: React.FC<{ messages: readonly TMessage[] }> = ({ messages }) => {
  const { t } = useTranslation();
  const { settings, update } = useObservabilitySettings();

  const observableMessages = useMemo(() => messages.filter(isObservable), [messages]);

  return (
    <div className={styles.container} data-testid='observability-panel'>
      <div className={styles.body}>
        {observableMessages.length === 0 ? (
          <div className={styles.empty}>
            {t('conversation.observability.empty', {
              defaultValue: 'Activity from this conversation will appear here.',
            })}
          </div>
        ) : (
          observableMessages.map((m) =>
            m.type === 'sub_agent' ? (
              <SubAgentActivityCard key={m.id} message={m} />
            ) : m.type === 'tool_group' ? (
              // Expanded by default: in the chat a collapsed "Did 3 things" keeps
              // the conversation calm, but this panel exists to show the detail.
              <ActivityTimeline key={m.id} steps={toolSummaryToSteps([m])} defaultExpanded />
            ) : (
              <MessageActivity key={m.id} message={m} showCost={settings.showCost} />
            )
          )
        )}
      </div>

      <footer className={styles.settings}>
        <span className={styles.settingLabel}>
          {t('conversation.observability.showCost', { defaultValue: 'Show cost' })}
        </span>
        <span className={styles.settingHint}>
          {t('conversation.observability.showCostHint', { defaultValue: 'off by default' })}
        </span>
        <span className={styles.spacer} />
        <Switch checked={settings.showCost} onChange={(v) => update('showCost', v)} size='small' />
      </footer>
    </div>
  );
};

export default ObservabilityPanel;
