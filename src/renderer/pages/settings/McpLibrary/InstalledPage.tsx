import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Message, Modal } from '@arco-design/web-react';
import { useMcpServers, useMcpAgentStatus, useMcpOperations, useMcpOAuth, useMcpServerCRUD } from '@renderer/hooks/mcp';
import type { McpOAuthStatus } from '@renderer/hooks/mcp/useMcpOAuth';
import type { IMcpServer } from '@/common/config/storage';
import { useMcpLibrary } from './hooks/useMcpLibrary';
import { ServerRow, type UIStatus } from './components/ServerRow';

// 4-state UI status derivation per RECON.md §5.
// error short-circuits first, then warn (needsLogin), then running (enabled + connected),
// else stopped (which absorbs disconnected / testing / undefined).
function deriveStatus(s: IMcpServer, oauth: McpOAuthStatus | undefined): UIStatus {
  if (s.status === 'error') return 'error';
  if (oauth?.needsLogin === true) return 'warn';
  if (s.enabled === true && s.status === 'connected') return 'running';
  return 'stopped';
}

export function InstalledPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const library = useMcpLibrary();

  const [message, contextHolder] = Message.useMessage();
  const { mcpServers, saveMcpServers } = useMcpServers();
  const { setAgentInstallStatus, checkSingleServerInstallStatus } = useMcpAgentStatus();
  const { syncMcpToAgents, removeMcpFromAgents } = useMcpOperations(mcpServers, message);
  const { oauthStatus, login } = useMcpOAuth();
  const crud = useMcpServerCRUD(
    mcpServers,
    saveMcpServers,
    syncMcpToAgents,
    removeMcpFromAgents,
    checkSingleServerInstallStatus,
    setAgentInstallStatus
  );

  const fromLibrary = useMemo(() => mcpServers.filter((s) => s.source === 'library'), [mcpServers]);
  const custom = useMemo(() => mcpServers.filter((s) => s.source !== 'library'), [mcpServers]);

  const summary = useMemo(() => {
    let running = 0;
    let warn = 0;
    let error = 0;
    for (const s of mcpServers) {
      const status = deriveStatus(s, oauthStatus[s.id]);
      if (status === 'running') running++;
      else if (status === 'warn') warn++;
      else if (status === 'error') error++;
    }
    const tools = mcpServers.reduce((n, s) => n + (s.tools?.length ?? 0), 0);
    return { running, warn, error, tools };
  }, [mcpServers, oauthStatus]);

  const handleToggle = useCallback(
    (s: IMcpServer) => {
      void crud.handleToggleMcpServer(s.id, !s.enabled);
    },
    [crud]
  );

  const handleReauth = useCallback(
    async (s: IMcpServer) => {
      const result = await login(s);
      if (result.success === true) {
        message.success(t('mcpLibrary.install.oauthSuccess', 'Authorized.'));
        return;
      }
      if (result.success === false && result.code === 'needs_byo') {
        // Drop the user onto the detail page where the BYO modal lives - the
        // installed-page row UI doesn't have room for the credential inputs.
        if (s.libraryEntryId) {
          navigate(`/settings/mcp-library/${encodeURIComponent(s.libraryEntryId)}`);
          return;
        }
      }
      message.error(
        t('mcpLibrary.install.oauthFailed', 'Authorization failed: {{error}}', {
          error: (result.success === false && result.error) || 'Unknown error',
        })
      );
    },
    [login, message, t, navigate]
  );

  const handleSettings = useCallback(
    (s: IMcpServer) => {
      if (s.source === 'library' && s.libraryEntryId) {
        navigate(`/settings/mcp-library/${encodeURIComponent(s.libraryEntryId)}`);
      } else {
        message.info(t('mcpLibrary.installed.customNoDetail', "Custom servers don't have a detail page yet."));
      }
    },
    [navigate, message, t]
  );

  const handleLogs = useCallback(() => {
    message.info(t('mcpLibrary.installed.logsToast', 'Log viewer coming soon.'));
  }, [message, t]);

  const handleReconnect = useCallback(
    async (s: IMcpServer) => {
      try {
        // Re-enable re-pushes the server config to every agent; running workers
        // pick it up on their next message via the MCP-changed refresh.
        await crud.handleToggleMcpServer(s.id, true);
        message.success(
          t(
            'mcpLibrary.installed.reconnectToast',
            'Reconnecting {{name}} - agents will pick it up on the next message.',
            {
              name: s.name,
            }
          )
        );
      } catch {
        message.error(t('settings.mcpSyncError', 'Failed to sync MCP to agents.'));
      }
    },
    [crud, message, t]
  );

  const handleRemove = useCallback(
    (s: IMcpServer) => {
      Modal.confirm({
        title: t('mcpLibrary.installed.actionRemove', 'Remove'),
        content: t(
          'mcpLibrary.installed.removeConfirm',
          'Remove {{name}} from your library? This will also uninstall it from all CLI agents.',
          { name: s.name }
        ),
        okText: t('mcpLibrary.installed.actionRemove', 'Remove'),
        cancelText: t('mcpLibrary.installed.confirmCancel', 'Cancel'),
        okButtonProps: { status: 'danger' },
        onOk: async () => {
          await crud.handleDeleteMcpServer(s.id);
        },
      });
    },
    [crud, t]
  );

  const renderRow = (s: IMcpServer) => {
    const entry = s.libraryEntryId ? library.entries.find((e) => e.id === s.libraryEntryId) : undefined;
    const oauth = oauthStatus[s.id];
    const status = deriveStatus(s, oauth);
    return (
      <ServerRow
        key={s.id}
        server={{
          id: s.id,
          name: entry?.name ?? s.name,
          source: s.source,
          libraryEntryId: s.libraryEntryId,
          status,
          toolCount: s.tools?.length ?? 0,
          publisher: entry?.id ?? s.name,
          enabled: s.enabled,
        }}
        iconUrl={entry?.iconUrl}
        oauthStatus={oauth}
        onReauth={() => void handleReauth(s)}
        onSettings={() => handleSettings(s)}
        onRemove={() => handleRemove(s)}
        onToggle={() => handleToggle(s)}
        onLogs={handleLogs}
        onReconnect={() => void handleReconnect(s)}
      />
    );
  };

  return (
    <div className='mcp-installed-page'>
      {contextHolder}
      <header className='mcp-page-head'>
        <h2>{t('mcpLibrary.installed.title', 'MCP Library - Installed')}</h2>
        <button className='mcp-btn-primary' onClick={() => navigate('/settings/mcp-library/browse')}>
          {t('mcpLibrary.installed.addCustom', '+ Add custom MCP')}
        </button>
      </header>

      <div className='mcp-status-strip'>
        <div className='mcp-status-cell mcp-status-running'>
          <b>{summary.running}</b> {t('mcpLibrary.installed.statusRunningCountLabel', 'Running')}
        </div>
        <div className='mcp-status-cell mcp-status-warn'>
          <b>{summary.warn}</b> {t('mcpLibrary.installed.statusReauthCountLabel', 'Needs re-auth')}
        </div>
        <div className='mcp-status-cell mcp-status-error'>
          <b>{summary.error}</b> {t('mcpLibrary.installed.statusErrorCountLabel', 'Error')}
        </div>
        <div className='mcp-status-cell'>
          <b>{summary.tools}</b> {t('mcpLibrary.installed.statusToolCountLabel', 'Tools available')}
        </div>
      </div>

      <section>
        <header className='mcp-group-head'>
          <h3>{t('mcpLibrary.installed.fromLibrary', 'From Library')}</h3>
          <button onClick={() => navigate('/settings/mcp-library/browse')}>
            {t('mcpLibrary.installed.browseLibrary', '+ Browse library')}
          </button>
        </header>
        {fromLibrary.length === 0 ? (
          <div className='mcp-empty'>
            {t('mcpLibrary.installed.empty', 'No MCPs installed yet. Browse the library to add one.')}
          </div>
        ) : (
          <div className='mcp-server-list'>{fromLibrary.map(renderRow)}</div>
        )}
      </section>

      <section>
        <header className='mcp-group-head'>
          <h3>{t('mcpLibrary.installed.custom', 'Custom')}</h3>
          <button onClick={() => navigate('/settings/mcp-library/browse')}>
            {t('mcpLibrary.installed.addCustom', '+ Add custom MCP')}
          </button>
        </header>
        {custom.length === 0 ? (
          <div className='mcp-empty'>{t('mcpLibrary.installed.customEmpty', 'No custom MCPs.')}</div>
        ) : (
          <div className='mcp-server-list'>{custom.map(renderRow)}</div>
        )}
      </section>
    </div>
  );
}
