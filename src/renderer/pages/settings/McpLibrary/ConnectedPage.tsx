/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal } from '@arco-design/web-react';
import { Activity, ArrowLeft, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import PageShell from '@renderer/components/layout/PageShell/PageShell';
import LibrarySectionHeader from '@renderer/components/layout/library/LibrarySectionHeader';
import { useConnectedMcps } from './hooks/useConnectedMcps';
import ConnectedMcpRow from './components/ConnectedMcpRow';
import styles from './ConnectedPage.module.css';

/**
 * Lane 1 — the global "Connected MCPs" overview. Lists every configured + live
 * server with status and per-server tool count, with disconnect/reconnect/remove
 * per server, and surfaces + clears stale leftover servers carried over from a
 * prior session.
 */
export function ConnectedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [message, contextHolder] = Message.useMessage();
  const { rows, stale, refreshing, refresh, disconnect, reconnect, remove, removeStale } = useConnectedMcps(message);

  const confirmRemove = useCallback(
    (id: string, name: string) => {
      Modal.confirm({
        title: t('mcpLibrary.connected.removeTitle', 'Remove connector?'),
        content: t(
          'mcpLibrary.connected.removeBody',
          'This removes {{name}} and its config from your agents. You can re-add it any time.',
          { name }
        ),
        okButtonProps: { status: 'danger' },
        okText: t('mcpLibrary.connected.remove', 'Remove'),
        onOk: () => remove(id),
      });
    },
    [remove, t]
  );

  const confirmRemoveStale = useCallback(
    (name: string) => {
      Modal.confirm({
        title: t('mcpLibrary.connected.removeStaleTitle', 'Clear leftover server?'),
        content: t(
          'mcpLibrary.connected.removeStaleBody',
          '{{name}} is still installed in your agents but is no longer in your config. Clearing it stops its stale tools from being sent.',
          { name }
        ),
        okButtonProps: { status: 'danger' },
        okText: t('mcpLibrary.connected.clear', 'Clear'),
        onOk: () => void removeStale(name),
      });
    },
    [removeStale, t]
  );

  const actions = (
    <>
      <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/settings/mcp-library/browse')}>
        {t('mcpLibrary.connected.backToLibrary', 'Library')}
      </Button>
      <Button type='primary' loading={refreshing} icon={<RefreshCw size={14} />} onClick={() => void refresh()}>
        {t('mcpLibrary.connected.refresh', 'Refresh')}
      </Button>
    </>
  );

  return (
    <>
      {contextHolder}
      <PageShell
        title={t('mcpLibrary.connected.title', 'Connected MCPs')}
        icon={<Activity size={20} />}
        countLabel={t('mcpLibrary.connected.count', '{{n}} servers', { n: rows.length })}
        subtitle={t(
          'mcpLibrary.connected.subtitle',
          'Every MCP server Wayland knows about — live status, tool count, and one place to disconnect, reconnect, or remove any of them.'
        )}
        actions={actions}
        width='standard'
      >
        <div className={styles.content}>
          <LibrarySectionHeader
            variant='primary'
            label={t('mcpLibrary.connected.sectionConfigured', 'Configured')}
            count={rows.length}
          />
          {rows.length === 0 ? (
            <div className={styles.empty}>{t('mcpLibrary.connected.empty', 'No MCP servers configured yet.')}</div>
          ) : (
            <div className={styles.list}>
              {rows.map((row) => (
                <ConnectedMcpRow
                  key={row.server.id}
                  row={row}
                  onReconnect={() => void reconnect(row.server)}
                  onDisconnect={() => disconnect(row.server.id)}
                  onRemove={() => confirmRemove(row.server.id, row.server.name)}
                />
              ))}
            </div>
          )}

          {stale.length > 0 && (
            <div className={styles.staleSection}>
              <LibrarySectionHeader
                variant='tier'
                label={t('mcpLibrary.connected.sectionStale', 'Leftover servers')}
                count={stale.length}
                hint={t(
                  'mcpLibrary.connected.staleHint',
                  'Installed in your agents but not in your config — likely carried over from a prior session.'
                )}
              />
              <div className={styles.list}>
                {stale.map((s) => (
                  <div key={s.name} className={styles.row} data-testid={`stale-mcp-${s.name}`}>
                    <div className={styles.main}>
                      <div className={styles.titleLine}>
                        <AlertTriangle size={14} className={styles.staleIcon} />
                        <span className={styles.name}>{s.name}</span>
                      </div>
                      <div className={styles.meta}>
                        <span className={styles.metaItem}>
                          {t('mcpLibrary.connected.staleAgents', 'In: {{agents}}', { agents: s.agents.join(', ') })}
                        </span>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Button
                        size='small'
                        status='danger'
                        icon={<Trash2 size={13} />}
                        onClick={() => confirmRemoveStale(s.name)}
                      >
                        {t('mcpLibrary.connected.clear', 'Clear')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}
