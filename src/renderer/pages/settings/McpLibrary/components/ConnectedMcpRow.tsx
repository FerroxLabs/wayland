/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '@arco-design/web-react';
import { Plug, Power, RefreshCw, Trash2, Wrench, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StatusChip from './StatusChip';
import type { ConnectedServerRow } from '../hooks/useConnectedMcps';
import styles from '../ConnectedPage.module.css';

const ICON = 13;

export type ConnectedMcpRowProps = {
  row: ConnectedServerRow;
  /** Turn a disabled connector ON. Distinct from re-probing one already on. */
  onEnable: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
  onRemove: () => void;
};

/**
 * One server in the Connected-MCPs overview: name + status chip + tool count +
 * which agents it reaches, plus the lifecycle actions. Extension-contributed
 * servers are read-only (no disconnect/remove) — they are owned by the extension.
 */
const ConnectedMcpRow: React.FC<ConnectedMcpRowProps> = ({ row, onEnable, onReconnect, onDisconnect, onRemove }) => {
  const { t } = useTranslation();
  const { server, status, toolCount, agents, testing } = row;
  // Extension-contributed servers carry a runtime `_source` tag (set in useMcpServers)
  // that isn't part of the persisted IMcpServer shape.
  const isExtension = (server as { _source?: string })._source === 'extension';
  const isReachable = status === 'reachable';
  // Three states, three verbs. The row used to carry only `isReachable ?
  // Disable : Reconnect`, so a DISABLED connector - the state a fresh install
  // lands in - had no control that says "turn this on" (#B4e).
  const isEnabled = server.enabled === true;

  return (
    <div className={styles.row} data-testid={`connected-mcp-${server.id}`}>
      <div className={styles.main}>
        <div className={styles.titleLine}>
          <span className={styles.name}>{server.name}</span>
          <StatusChip status={status} />
          {isExtension && <span className={styles.extBadge}>{t('mcpLibrary.connected.extension', 'Extension')}</span>}
        </div>
        <div className={styles.meta}>
          {isExtension && status !== 'reachable' ? (
            <span className={styles.metaItem}>
              <Wrench size={12} />
              {t('mcpLibrary.connected.extensionUnverified', 'Declared by extension · tools verified per chat')}
            </span>
          ) : (
            <span className={styles.metaItem}>
              <Wrench size={12} />
              {t('mcpLibrary.connected.probeToolCount', 'Probe reported {{count}} tools', { count: toolCount })}
            </span>
          )}
          {agents.length > 0 && (
            <span className={styles.metaItem}>
              <Cpu size={12} />
              {t('mcpLibrary.connected.agentReach', 'Published to {{count}} agent configs', { count: agents.length })}
            </span>
          )}
        </div>
        {status === 'error' && server.lastError && (
          <div className={styles.error}>
            {t('mcpLibrary.connected.probeFailed', 'Probe failed: {{error}}', { error: server.lastError })}
          </div>
        )}
      </div>

      {!isExtension && (
        <div className={styles.actions}>
          {isReachable && (
            <Button size='small' icon={<Plug size={ICON} />} onClick={onDisconnect}>
              {t('mcpLibrary.connected.disable', 'Disable')}
            </Button>
          )}
          {!isEnabled && (
            <Button size='small' loading={testing} icon={<Power size={ICON} />} onClick={onEnable}>
              {t('mcpLibrary.connected.enable', 'Enable')}
            </Button>
          )}
          {isEnabled && !isReachable && (
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
