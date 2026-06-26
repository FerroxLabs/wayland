/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '@arco-design/web-react';
import { Plug, RefreshCw, Trash2, Wrench, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StatusChip from './StatusChip';
import type { ConnectedServerRow } from '../hooks/useConnectedMcps';
import styles from '../ConnectedPage.module.css';

const ICON = 13;

export type ConnectedMcpRowProps = {
  row: ConnectedServerRow;
  onReconnect: () => void;
  onDisconnect: () => void;
  onRemove: () => void;
};

/**
 * One server in the Connected-MCPs overview: name + status chip + tool count +
 * which agents it reaches, plus the lifecycle actions. Extension-contributed
 * servers are read-only (no disconnect/remove) — they are owned by the extension.
 */
const ConnectedMcpRow: React.FC<ConnectedMcpRowProps> = ({ row, onReconnect, onDisconnect, onRemove }) => {
  const { t } = useTranslation();
  const { server, status, toolCount, agents, testing } = row;
  // Extension-contributed servers carry a runtime `_source` tag (set in useMcpServers)
  // that isn't part of the persisted IMcpServer shape.
  const isExtension = (server as { _source?: string })._source === 'extension';
  const isRunning = status === 'running';

  return (
    <div className={styles.row} data-testid={`connected-mcp-${server.id}`}>
      <div className={styles.main}>
        <div className={styles.titleLine}>
          <span className={styles.name}>{server.name}</span>
          <StatusChip status={status} />
          {isExtension && (
            <span className={styles.extBadge}>{t('mcpLibrary.connected.extension', 'Extension')}</span>
          )}
        </div>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Wrench size={12} />
            {t('mcpLibrary.connected.toolCount', '{{count}} tools', { count: toolCount })}
          </span>
          {agents.length > 0 && (
            <span className={styles.metaItem}>
              <Cpu size={12} />
              {t('mcpLibrary.connected.agentReach', 'Available to {{count}} agents', { count: agents.length })}
            </span>
          )}
        </div>
        {status === 'error' && server.lastError && <div className={styles.error}>{server.lastError}</div>}
      </div>

      {!isExtension && (
        <div className={styles.actions}>
          {isRunning ? (
            <Button size='small' icon={<Plug size={ICON} />} onClick={onDisconnect}>
              {t('mcpLibrary.connected.disconnect', 'Disconnect')}
            </Button>
          ) : (
            <Button size='small' loading={testing} icon={<RefreshCw size={ICON} />} onClick={onReconnect}>
              {t('mcpLibrary.connected.reconnect', 'Reconnect')}
            </Button>
          )}
          <Button size='small' status='danger' icon={<Trash2 size={ICON} />} onClick={onRemove}>
            {t('mcpLibrary.connected.remove', 'Remove')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConnectedMcpRow;
