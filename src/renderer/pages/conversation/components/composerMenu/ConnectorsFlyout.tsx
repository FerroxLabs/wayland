/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Switch } from '@arco-design/web-react';
import { ChevronRight, LayoutGrid, Plus, Settings } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { iconColors } from '@/renderer/styles/colors';
import type { IMcpServer } from '@/common/config/storage';
import styles from './ComposerAddMenu.module.css';

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

const ConnectorsFlyout: React.FC<Props> = ({ servers, onToggle, onAddConnector, onManageConnectors }) => {
  const { t } = useTranslation();

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
