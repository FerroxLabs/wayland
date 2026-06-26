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
import styles from './ComposerAddMenu.module.css';
import { countEnabledMcpTools, toolBudgetStatus } from './toolBudget';

type Props = {
  /** Installed MCP servers (user-configured + extension-contributed). */
  servers: IMcpServer[];
  /**
   * Toggle a connector. NOTE: this flips the server's GLOBAL `enabled` flag -
   * MCP enablement is not yet per-conversation, so toggling here affects the
   * connector everywhere. True per-chat connector scoping is a follow-up.
   */
  onToggle: (id: string, enabled: boolean) => void;
  /** Open the MCP Library to add a new connector. */
  onAddConnector: () => void;
  /** Open the MCP Library to manage connectors. */
  onManageConnectors: () => void;
  /**
   * The target model's tool-array cap (#348). When provided and the live tool
   * count is near/over it, a count-vs-cap nudge is shown so the user can scope
   * servers or switch models. Absent (no known cap / staged composer) hides it.
   */
  modelCap?: number;
  /** Display name of the target model, used in the nudge text. */
  modelLabel?: string;
};

const ConnectorRow: React.FC<{ server: IMcpServer; onToggle: Props['onToggle']; toolsLabel: string }> = ({
  server,
  onToggle,
  toolsLabel,
}) => {
  const connected = server.status === 'connected';
  return (
    <div className={styles.row}>
      <div className={styles.tile}>{(server.name || '?').charAt(0)}</div>
      <div className={styles.meta}>
        <div className={styles.name}>
          {connected && <span className={styles.statusDot} />}
          {server.name}
        </div>
        <div className={styles.desc}>{server.description || toolsLabel}</div>
      </div>
      <Switch
        size='small'
        checked={server.enabled !== false}
        onChange={(v) => onToggle(server.id, v)}
        aria-label={server.name}
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
}) => {
  const { t } = useTranslation();

  // Count-vs-cap nudge (#348): only when a cap is known and the live tool count
  // is approaching/over it. `ok` stays silent to avoid noise.
  const toolCount = countEnabledMcpTools(servers);
  const budget = modelCap ? toolBudgetStatus(toolCount, modelCap) : 'ok';
  const showNudge = modelCap !== undefined && budget !== 'ok';

  return (
    <div className={styles.flyout}>
      <div className={styles.flyoutHead}>
        <div className={styles.flyoutTitle}>
          <LayoutGrid size={15} color='rgb(var(--primary-6))' strokeWidth={2} />
          {t('conversation.composerMenu.connectorsTitle', { defaultValue: 'Connectors' })}
        </div>
        <div className={styles.flyoutSub}>
          {t('conversation.composerMenu.connectorsSub', {
            defaultValue: 'Turn a connected MCP server on or off.',
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
        {servers.length > 0 ? (
          <>
            <div className={styles.sectionLabel}>
              {t('conversation.composerMenu.connectorsConnected', { defaultValue: 'Connected' })}
            </div>
            {servers.map((server) => (
              <ConnectorRow
                key={server.id}
                server={server}
                onToggle={onToggle}
                toolsLabel={
                  server.tools && server.tools.length > 0
                    ? t('conversation.composerMenu.toolCount', {
                        defaultValue: '{{count}} tools',
                        count: server.tools.length,
                      })
                    : ''
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
