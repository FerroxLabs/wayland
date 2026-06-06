import React from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@arco-design/web-react';
import { Settings, Trash2, FileText, LogIn, Server, RefreshCw } from 'lucide-react';
import type { McpOAuthStatus } from '@renderer/hooks/mcp/useMcpOAuth';

export type UIStatus = 'running' | 'warn' | 'error' | 'stopped';

type ServerRowServer = {
  id: string;
  name?: string;
  source?: 'library' | 'custom';
  libraryEntryId?: string;
  status: UIStatus;
  toolCount?: number;
  publisher?: string;
  enabled?: boolean;
};

type Props = {
  server: ServerRowServer;
  iconUrl?: string;
  oauthStatus?: McpOAuthStatus;
  onReauth: () => void;
  onSettings: () => void;
  onRemove: () => void;
  onToggle: () => void;
  onLogs: () => void;
  onReconnect: () => void;
};

export function ServerRow({
  server,
  iconUrl,
  oauthStatus,
  onReauth,
  onSettings,
  onRemove,
  onToggle,
  onLogs,
  onReconnect,
}: Props) {
  const { t } = useTranslation();
  const needsReauth = oauthStatus?.needsLogin === true;
  // `stopped` is a catch-all in deriveStatus: it covers BOTH user-disabled
  // (toggle off) and enabled-but-not-yet-connected. Split the label so the
  // pill doesn't say "Disabled" while the user is staring at the toggle they
  // just flipped on.
  const stoppedLabel = server.enabled
    ? t('mcpLibrary.installed.statusIdle', 'Idle')
    : t('mcpLibrary.installed.statusStopped', 'Disabled');
  const statusLabel = {
    running: t('mcpLibrary.installed.statusRunning', 'Running'),
    warn: t('mcpLibrary.installed.statusWarn', 'Needs re-authorization'),
    error: t('mcpLibrary.installed.statusError', 'Error'),
    stopped: stoppedLabel,
  }[server.status];
  const toggleLabel = t('mcpLibrary.installed.actionToggle', 'Enable / disable');
  // Enabled but not running (error / idle) → offer an explicit reconnect that
  // re-pushes the server config to every agent. The on/off switch handles the
  // disabled case; this is the "force a re-connect" affordance.
  const canReconnect = server.enabled === true && (server.status === 'error' || server.status === 'stopped');
  return (
    <div className={`mcp-server-row mcp-server-${server.status}`}>
      {iconUrl ? (
        <img className='mcp-server-logo' src={iconUrl} alt='' />
      ) : (
        <span className='mcp-server-logo mcp-server-logo-fallback' aria-hidden='true'>
          <Server size={18} />
        </span>
      )}
      <div className='mcp-server-main'>
        <div className='mcp-server-name'>{server.name ?? server.id}</div>
        <div className='mcp-server-pub'>{server.publisher ?? ''}</div>
      </div>
      <div className='mcp-server-stats'>{server.toolCount ?? 0} tools</div>
      <div className='mcp-server-status'>
        <span className={`mcp-status-pill mcp-status-${server.status}`}>
          <span className='mcp-dot' /> {statusLabel}
        </span>
      </div>
      <div className='mcp-server-actions'>
        <Switch size='small' checked={server.enabled ?? false} onChange={onToggle} aria-label={toggleLabel} />
        {needsReauth && (
          <button
            onClick={onReauth}
            className='mcp-btn-warn'
            aria-label={t('mcpLibrary.installed.actionReauth', 'Re-authorize')}
          >
            <LogIn size={15} /> {t('mcpLibrary.installed.actionReauth', 'Re-authorize')}
          </button>
        )}
        {canReconnect && !needsReauth && (
          <button
            onClick={onReconnect}
            title={t('mcpLibrary.installed.actionReconnect', 'Reconnect')}
            aria-label={t('mcpLibrary.installed.actionReconnect', 'Reconnect')}
          >
            <RefreshCw size={15} />
          </button>
        )}
        <button
          onClick={onSettings}
          title={t('mcpLibrary.installed.actionSettings', 'Settings')}
          aria-label={t('mcpLibrary.installed.actionSettings', 'Settings')}
        >
          <Settings size={15} />
        </button>
        <button
          onClick={onLogs}
          title={t('mcpLibrary.installed.actionLogs', 'View logs')}
          aria-label={t('mcpLibrary.installed.actionLogs', 'View logs')}
        >
          <FileText size={15} />
        </button>
        <button
          onClick={onRemove}
          title={t('mcpLibrary.installed.actionRemove', 'Remove')}
          className='mcp-danger'
          aria-label={t('mcpLibrary.installed.actionRemove', 'Remove')}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
