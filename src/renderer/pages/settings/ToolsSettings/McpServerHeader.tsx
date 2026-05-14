import { Check, Loader2, LogIn, PenSquare, RefreshCw, Settings, Trash2, X, XCircle } from 'lucide-react';
import type { IMcpServer } from '@/common/config/storage';
import { Button, Dropdown, Menu, Switch, Tooltip } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import McpAgentStatusDisplay from './McpAgentStatusDisplay';
import type { McpOAuthStatus } from '@/renderer/hooks/mcp/useMcpOAuth';
import { iconColors } from '@/renderer/styles/colors';

interface McpServerHeaderProps {
  server: IMcpServer;
  agentInstallStatus: Record<string, string[]>;
  isServerLoading: (serverName: string) => boolean;
  isTestingConnection: boolean;
  oauthStatus?: McpOAuthStatus;
  isLoggingIn?: boolean;
  /** Extension-contributed servers are read-only */
  isReadOnly?: boolean;
  onTestConnection: (server: IMcpServer) => void;
  onEditServer: (server: IMcpServer) => void;
  onDeleteServer: (serverId: string) => void;
  onToggleServer: (serverId: string, enabled: boolean) => void;
  onOAuthLogin?: (server: IMcpServer) => void;
}

const getStatusIcon = (status?: IMcpServer['status'], oauthStatus?: McpOAuthStatus) => {
  if (status === 'testing' || oauthStatus?.isChecking) {
    return <Loader2 color={iconColors.primary} className='h-[24px]' />;
  }

  if (status === 'error') {
    return <X color={iconColors.danger} className='h-[24px]' />;
  }

  if (oauthStatus?.needsLogin) {
    return <span className='text-orange-500 text-xl font-bold leading-none'>△</span>;
  }

  if (status === 'connected' || oauthStatus?.isAuthenticated) {
    return <Check color={iconColors.success} className='h-[24px] items-center' />;
  }

  return <XCircle color={iconColors.secondary} className='h-[24px]' />;
};

const getStatusText = (status?: IMcpServer['status'], oauthStatus?: McpOAuthStatus, t?: any) => {
  // Priority 1: testing state
  if (status === 'testing' || oauthStatus?.isChecking) {
    return t?.('settings.mcpTesting') || 'testing';
  }

  // Priority 2: error state
  if (status === 'error') {
    return t?.('settings.mcpError') || 'error';
  }

  // Priority 3: OAuth login required
  if (oauthStatus?.needsLogin) {
    return t?.('settings.mcpNeedsLogin') || 'disconnected · Enter to login';
  }

  // Priority 4: connected or authenticated
  if (status === 'connected' || oauthStatus?.isAuthenticated) {
    return t?.('settings.mcpConnected') || 'connected';
  }

  // Default: disconnected
  return t?.('settings.mcpDisconnected') || 'disconnected';
};

const McpServerHeader: React.FC<McpServerHeaderProps> = ({
  server,
  agentInstallStatus,
  isServerLoading,
  isTestingConnection,
  oauthStatus,
  isLoggingIn,
  isReadOnly,
  onTestConnection,
  onEditServer,
  onDeleteServer,
  onToggleServer,
  onOAuthLogin,
}) => {
  const { t } = useTranslation();

  // Determine if OAuth is supported (HTTP/SSE only)
  const supportsOAuth = server.transport.type === 'http' || server.transport.type === 'sse';
  const needsLogin = supportsOAuth && oauthStatus?.needsLogin;
  const statusText = getStatusText(server.status, oauthStatus, t);
  const statusIcon = getStatusIcon(server.status, oauthStatus);

  return (
    <div className='flex items-center justify-between group'>
      <div className='flex items-center gap-2'>
        <span>{server.name}</span>
        <Tooltip content={statusText} position='top'>
          <span className='flex items-center cursor-default'>{statusIcon}</span>
        </Tooltip>
        {isReadOnly && (
          <McpAgentStatusDisplay
            serverName={server.name}
            agentInstallStatus={agentInstallStatus}
            isLoadingAgentStatus={isServerLoading(server.name)}
            alwaysVisible
          />
        )}
        {!isReadOnly && needsLogin && onOAuthLogin && (
          <Button
            size='mini'
            type='primary'
            icon={<LogIn size={'14'} />}
            title={t('settings.mcpLogin') || 'Login'}
            loading={isLoggingIn}
            onClick={() => onOAuthLogin(server)}
          >
            {t('settings.mcpLogin') || 'Login'}
          </Button>
        )}
        {!isReadOnly && !needsLogin && (
          <Button
            size='mini'
            icon={<RefreshCw size={'14'} />}
            title={t('settings.mcpTestConnection')}
            loading={isTestingConnection}
            onClick={() => onTestConnection(server)}
          />
        )}
      </div>
      {!isReadOnly && (
        <div className='flex items-center gap-2' onClick={(e) => e.stopPropagation()}>
          <div className='flex items-center gap-2 invisible group-hover:visible'>
            <McpAgentStatusDisplay
              serverName={server.name}
              agentInstallStatus={agentInstallStatus}
              isLoadingAgentStatus={isServerLoading(server.name)}
            />
            {!server.builtin && (
              <Dropdown
                trigger='hover'
                droplist={
                  <Menu>
                    <Menu.Item key='edit' onClick={() => onEditServer(server)}>
                      <div className='flex items-center gap-2'>
                        <PenSquare size={'14'} />
                        {t('settings.mcpEditServer')}
                      </div>
                    </Menu.Item>
                    <Menu.Item key='delete' onClick={() => onDeleteServer(server.id)}>
                      <div className='flex items-center gap-2 text-red-500'>
                        <Trash2 size={'14'} />
                        {t('settings.mcpDeleteServer')}
                      </div>
                    </Menu.Item>
                  </Menu>
                }
              >
                <Button size='mini' icon={<Settings size={'14'} />} />
              </Dropdown>
            )}
          </div>
          <Switch
            checked={server.enabled}
            onChange={(checked) => onToggleServer(server.id, checked)}
            size='small'
            disabled={server.status === 'testing'}
          />
        </div>
      )}
    </div>
  );
};

export default McpServerHeader;
