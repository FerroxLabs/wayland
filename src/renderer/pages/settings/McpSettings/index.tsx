import React from 'react';
import { Message } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import McpManagement from '../ToolsSettings/McpManagement';

const McpSettings: React.FC = () => {
  const { t } = useTranslation();
  const [message, contextHolder] = Message.useMessage();

  return (
    <SettingsPageShell
      title={t('settings.mcpPage.title', 'MCP Servers')}
      subtitle={t(
        'settings.mcpPage.subtitle',
        'Connect Wayland to external tool servers via Model Context Protocol. Add, configure, and sync MCP servers across your agents.'
      )}
    >
      {contextHolder}
      <McpManagement message={message} />
    </SettingsPageShell>
  );
};

export default McpSettings;
