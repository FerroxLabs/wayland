/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Switch } from '@arco-design/web-react';
import { AlertTriangle, ChevronRight, LayoutGrid, Plus, Settings } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { iconColors } from '@/renderer/styles/colors';
import type { IMcpServer } from '@/common/config/storage';
import type { McpSessionReceipt, McpSessionState } from '@/common/mcp/sessionReceipt';
import { configSafeMcpServerName } from '@/common/mcp';
import styles from './ComposerAddMenu.module.css';
import { countEnabledMcpTools, nextActiveSelection, toolBudgetStatus } from './toolBudget';

type Props = {
  /** Installed MCP servers (user-configured + extension-contributed). */
  servers: IMcpServer[];
  /**
   * Toggle a connector's GLOBAL `enabled` flag. Used in staged (home) mode where
   * there is no conversation to scope. In live mode `onScopeChange` takes over
   * and the toggle becomes per-conversation.
   */
  onToggle: (id: string, enabled: boolean) => void;
  /** Open the MCP Library to add a new connector. */
  onAddConnector: () => void;
  /** Open the MCP Library to manage connectors. */
  onManageConnectors: () => void;
  /**
   * The target model's tool-array cap (#348). When provided and the probe-based
   * inventory estimate is near/over it, a count-vs-cap nudge is shown so the user can scope
   * servers or switch models. Absent (no known cap / staged composer) hides it.
   */
  modelCap?: number;
  /** Display name of the target model, used in the nudge text. */
  modelLabel?: string;
  /**
   * Per-conversation scoping (#348). When provided (live mode), the toggle
   * controls whether each server is active for THIS chat (not the global
   * `enabled` flag). `activeServerIds === undefined` ⇒ all enabled servers
   * active. The flyout writes the next selection back through this callback.
   */
  onScopeChange?: (ids: string[] | undefined) => void;
  /** Current per-conversation selection (undefined = all enabled active). */
  activeServerIds?: string[];
  /** Runtime receipts for this exact Core launch; Library probe state is never substituted. */
  sessionState?: McpSessionState;
};

const ConnectorRow: React.FC<{
  server: IMcpServer;
  checked: boolean;
  onChange: (on: boolean) => void;
  toolsLabel: string;
  receipt?: McpSessionReceipt;
  expectedInSession: boolean;
  globalToggleLocked: boolean;
}> = ({ server, checked, onChange, toolsLabel, receipt, expectedInSession, globalToggleLocked }) => {
  const sessionReceipt = expectedInSession ? receipt : undefined;
  const verifiedWithTools = sessionReceipt?.status === 'ready' && sessionReceipt.tools.length > 0;
  const failed =
    sessionReceipt?.status === 'failed' || (sessionReceipt?.status === 'ready' && sessionReceipt.tools.length === 0);
  const runtimeLabel = sessionReceipt
    ? sessionReceipt.status === 'failed'
      ? `Unavailable in this chat · ${sessionReceipt.reason}`
      : sessionReceipt.tools.length > 0
        ? `${sessionReceipt.tools.length} tools verified in this chat`
        : 'Loaded, but no tools were registered'
    : expectedInSession
      ? 'Waiting for this chat to report its tools'
      : toolsLabel;
  return (
    <div className={styles.row}>
      <div className={styles.tile}>{(server.name || '?').charAt(0)}</div>
      <div className={styles.meta}>
        <div className={styles.name}>
          {verifiedWithTools && <span className={styles.statusDot} title='Tools verified in this chat' />}
          {failed && <span className={styles.statusDotError} title='Connector unavailable in this chat' />}
          {server.name}
        </div>
        <div className={styles.desc}>{runtimeLabel || server.description}</div>
      </div>
      <Switch
        size='small'
        checked={checked}
        disabled={globalToggleLocked}
        onChange={onChange}
        aria-label={server.name}
        title={globalToggleLocked ? 'Managed by its extension; scope it after this chat starts' : undefined}
      />
    </div>
  );
};

const ConnectorsFlyout: React.FC<Props> = ({
  servers,
  onToggle,
  onAddConnector,
  onManageConnectors,
  modelCap,
  modelLabel,
  onScopeChange,
  activeServerIds,
  sessionState,
}) => {
  const { t } = useTranslation();

  // Count-vs-cap nudge (#348): based on the latest probe inventory, not a live
  // session receipt. `ok` stays silent to avoid noise.
  const toolCount = countEnabledMcpTools(servers);
  const budget = modelCap ? toolBudgetStatus(toolCount, modelCap) : 'ok';
  const showNudge = modelCap !== undefined && budget !== 'ok';

  // Per-conversation scoping (#348): in live mode (onScopeChange given) the
  // toggle reflects "active for THIS chat" over the enabled servers; in staged
  // mode it flips the global `enabled` flag (legacy behaviour).
  const scoping = onScopeChange !== undefined;
  const candidates = scoping ? servers.filter((s) => s.enabled !== false) : servers;
  const enabledIds = candidates.map((s) => s.id);
  const isActiveForChat = (id: string) => activeServerIds === undefined || activeServerIds.includes(id);
  const rowChecked = (server: IMcpServer) => (scoping ? isActiveForChat(server.id) : server.enabled !== false);
  const rowOnChange = (server: IMcpServer) => (on: boolean) =>
    scoping
      ? onScopeChange?.(nextActiveSelection(activeServerIds, enabledIds, server.id, on))
      : onToggle(server.id, on);

  return (
    <div className={styles.flyout}>
      <div className={styles.flyoutHead}>
        <div className={styles.flyoutTitle}>
          <LayoutGrid size={15} color='rgb(var(--primary-6))' strokeWidth={2} />
          {t('conversation.composerMenu.connectorsTitle', { defaultValue: 'Connectors' })}
        </div>
        <div className={styles.flyoutSub}>
          {t('conversation.composerMenu.connectorsSub', {
            defaultValue: 'Choose connectors for this chat. Changes apply when its next agent session starts.',
          })}
        </div>
      </div>

      <div className={styles.flyoutScroll}>
        {showNudge && (
          <div className={`${styles.toolNudge} ${budget === 'over' ? styles.toolNudgeOver : ''}`} role='status'>
            <AlertTriangle size={14} strokeWidth={2} className={styles.toolNudgeIc} />
            <span>
              {budget === 'over'
                ? t('conversation.composerMenu.toolNudgeOver', {
                    defaultValue:
                      '{{count}} tools enabled · {{model}} caps at {{cap}}. Scope servers for this chat or switch models.',
                    count: toolCount,
                    cap: modelCap,
                    model:
                      modelLabel ??
                      t('conversation.composerMenu.toolNudgeModelFallback', { defaultValue: 'this model' }),
                  })
                : t('conversation.composerMenu.toolNudgeNear', {
                    defaultValue:
                      '{{count}} of {{cap}} tools · {{model}}. Near the limit — scope servers or switch models before adding more.',
                    count: toolCount,
                    cap: modelCap,
                    model:
                      modelLabel ??
                      t('conversation.composerMenu.toolNudgeModelFallback', { defaultValue: 'this model' }),
                  })}
            </span>
          </div>
        )}
        {candidates.length > 0 ? (
          <>
            <div className={styles.sectionLabel}>
              {scoping
                ? t('conversation.composerMenu.connectorsForChat', { defaultValue: 'Selected for this chat' })
                : t('conversation.composerMenu.connectorsConfigured', { defaultValue: 'Configured' })}
            </div>
            {candidates.map((server) => (
              <ConnectorRow
                key={server.id}
                server={server}
                checked={rowChecked(server)}
                onChange={rowOnChange(server)}
                receipt={sessionState?.receipts[configSafeMcpServerName(server.name)]}
                expectedInSession={
                  sessionState?.expectedServerNames.includes(configSafeMcpServerName(server.name)) === true
                }
                globalToggleLocked={!scoping && (server as { _source?: string })._source === 'extension'}
                toolsLabel={
                  server.tools && server.tools.length > 0
                    ? t('conversation.composerMenu.toolCount', {
                        defaultValue: 'Probe reported {{count}} tools · chat not verified',
                        count: server.tools.length,
                      })
                    : t('conversation.composerMenu.chatNotVerified', {
                        defaultValue: 'Chat has not verified this connector',
                      })
                }
              />
            ))}
          </>
        ) : (
          <div className={styles.empty}>
            {t('conversation.composerMenu.noConnectors', { defaultValue: 'No connectors installed yet.' })}
          </div>
        )}
      </div>

      <div className={styles.foot}>
        <div
          className={styles.footItem}
          role='button'
          tabIndex={0}
          onClick={onAddConnector}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onAddConnector();
          }}
        >
          <Plus size={16} color={iconColors.secondary} />
          {t('conversation.composerMenu.addConnector', { defaultValue: 'Add a connector' })}
        </div>
        <div
          className={styles.footItem}
          role='button'
          tabIndex={0}
          onClick={onManageConnectors}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onManageConnectors();
          }}
        >
          <Settings size={16} color={iconColors.secondary} />
          {t('conversation.composerMenu.manageConnectors', { defaultValue: 'Manage connectors' })}
          <span className={styles.footChev}>
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectorsFlyout;
