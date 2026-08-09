/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { toolSummaryToSteps } from '@/common/chat/activity/projectMessages';
import type {
  IMessageActivity,
  IMessageAcpToolCall,
  IMessageSubAgent,
  IMessageToolGroup,
  TMessage,
} from '@/common/chat/chatLib';
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
 * full activity tree moves here. The panel mounts INSIDE the conversation's
 * MessageListProvider subtree (ExecutionSpine registers it, for every backend)
 * so it can read the same message stream via useMessageList, filter the
 * observable turns, and render each one through the existing MessageActivity /
 * SubAgentActivityCard / ActivityTimeline components (reused as-is, not
 * rewritten). Sub-agent turns carry the swarm/delegation tree, so the panel must
 * surface them too. Cost is gated by the opt-in `showCost` setting (off by
 * default).
 */

/**
 * Which message shapes carry observable work, per backend - each half of this
 * was measured by driving the real producers, not read:
 *
 *   `activity`, `sub_agent`   WCore ONLY (tool_chunk / session_cost /
 *                             browser_event / cua_event / sub_agent_event).
 *   `tool_group`              WCore AND Gemini.
 *   `acp_tool_call`           ACP ONLY - Claude Code and Codex. The ACP
 *                             MessageTranslator emits NO `activity` and NO
 *                             `tool_group`, so while this predicate omitted
 *                             `acp_tool_call` the panel was structurally
 *                             incapable of ever showing anything on those two
 *                             backends.
 *
 * The chat transcript projects tool_group AND acp_tool_call through the very
 * same toolSummaryToSteps; doing it here keeps one projection, not two
 * renderings of one truth.
 */
export type ObservableMessage = IMessageActivity | IMessageSubAgent | IMessageToolGroup | IMessageAcpToolCall;

export const isObservable = (m: TMessage): m is ObservableMessage =>
  m.type === 'activity' || m.type === 'sub_agent' || m.type === 'tool_group' || m.type === 'acp_tool_call';

type ToolMessage = IMessageToolGroup | IMessageAcpToolCall;

const isToolMessage = (m: ObservableMessage): m is ToolMessage =>
  m.type === 'tool_group' || m.type === 'acp_tool_call';

type PanelEntry =
  | { kind: 'tools'; id: string; messages: ToolMessage[] }
  | { kind: 'card'; id: string; message: IMessageActivity | IMessageSubAgent };

/**
 * Fold RUNS of consecutive tool turns into one timeline, mirroring how the chat
 * transcript groups them (MessageList's pushToolList). ACP emits one message per
 * tool call where wcore emits one message per group, so without this an ACP turn
 * rendered as N separate one-step cards beside wcore's single "Did N things".
 */
const groupObservable = (messages: readonly ObservableMessage[]): PanelEntry[] => {
  const entries: PanelEntry[] = [];
  let run: ToolMessage[] | null = null;
  for (const message of messages) {
    if (isToolMessage(message)) {
      if (!run) {
        run = [];
        entries.push({ kind: 'tools', id: `tools-${message.id}`, messages: run });
      }
      run.push(message);
      continue;
    }
    run = null;
    entries.push({ kind: 'card', id: message.id, message });
  }
  return entries;
};

/**
 * Body only. The workbench card owns the title and the close control, so this
 * panel must not render either: when it did, "Observability" appeared three
 * times in one card (card header, section row, and here) with two close buttons
 * that did different things. One card, one chrome.
 */
const ObservabilityPanel: React.FC<{ messages: readonly TMessage[] }> = ({ messages }) => {
  const { t } = useTranslation();
  const { settings, update } = useObservabilitySettings();

  const entries = useMemo(() => groupObservable(messages.filter(isObservable)), [messages]);

  return (
    <div className={styles.container} data-testid='observability-panel'>
      <div className={styles.body}>
        {entries.length === 0 ? (
          <div className={styles.empty}>
            {t('conversation.observability.empty', {
              defaultValue: 'Activity from this conversation will appear here.',
            })}
          </div>
        ) : (
          entries.map((entry) =>
            entry.kind === 'tools' ? (
              // Expanded by default: in the chat a collapsed "Did 3 things" keeps
              // the conversation calm, but this panel exists to show the detail.
              <ActivityTimeline key={entry.id} steps={toolSummaryToSteps(entry.messages)} defaultExpanded />
            ) : entry.message.type === 'sub_agent' ? (
              <SubAgentActivityCard key={entry.id} message={entry.message} />
            ) : (
              <MessageActivity key={entry.id} message={entry.message} showCost={settings.showCost} />
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
