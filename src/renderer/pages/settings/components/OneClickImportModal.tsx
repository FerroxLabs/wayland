import { Check } from 'lucide-react';
import type { IMcpServer, IMcpTool } from '@/common/config/storage';
import { acpConversation, mcpService } from '@/common/adapter/ipcBridge';
import { Button, Select, Spin } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { iconColors } from '@/renderer/styles/colors';
import WaylandSteps from '@/renderer/components/base/WaylandSteps';
import WaylandModal from '@/renderer/components/base/WaylandModal';

interface OneClickImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onBatchImport?: (servers: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

const OneClickImportModal: React.FC<OneClickImportModalProps> = ({ visible, onCancel, onBatchImport }) => {
  const { t } = useTranslation();
  const [detectedAgents, setDetectedAgents] = useState<Array<{ backend: string; name: string }>>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [importableServers, setImportableServers] = useState<IMcpServer[]>([]);
  const [loadingImport, setLoadingImport] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    if (visible) {
      // Reset state
      setCurrentStep(1);
      setSelectedAgent('');
      setImportableServers([]);
      setLoadingImport(false);

      // Detect available agents during initialization
      const loadAgents = async () => {
        try {
          const response = await acpConversation.getAvailableAgents.invoke();
          if (response.success && response.data) {
            const agents = response.data.map((agent) => ({ backend: agent.backend, name: agent.name }));
            setDetectedAgents(agents);
            // Set first agent as the default value
            if (agents.length > 1) {
              setSelectedAgent(agents[0].backend);
            }
          }
        } catch (error) {
          console.error('Failed to load agents:', error);
        }
      };
      void loadAgents();
    }
  }, [visible]);

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Step 1 -> Step 2: after selecting Agent, enter the fetch-MCP stage
      if (!selectedAgent) return;
      setCurrentStep(2);
      await handleImportFromCLI();
    } else if (currentStep === 2) {
      // Step 2 -> Step 3: perform import, show success page
      handleBatchImport();
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setImportableServers([]);
      setLoadingImport(false);
    }
  };

  const handleImportFromCLI = async () => {
    setLoadingImport(true);
    try {
      // Fetch all available agents
      const agentsResponse = await acpConversation.getAvailableAgents.invoke();
      if (!agentsResponse.success || !agentsResponse.data) {
        throw new Error('Failed to get available agents');
      }

      // Call the backend service via IPC to fetch MCP configs
      const mcpResponse = await mcpService.getAgentMcpConfigs.invoke(agentsResponse.data);
      if (mcpResponse.success && mcpResponse.data) {
        const allServers: IMcpServer[] = [];

        // Filter servers for the selected agent
        mcpResponse.data.forEach((agentConfig) => {
          if (agentConfig.source === selectedAgent) {
            allServers.push(...agentConfig.servers);
          }
        });

        setImportableServers(allServers);
      } else {
        throw new Error(mcpResponse.msg || 'Failed to get MCP configs');
      }
    } catch (error) {
      console.error('Failed to import from CLI:', error);
      setImportableServers([]);
    } finally {
      setLoadingImport(false);
    }
  };

  const handleBatchImport = () => {
    if (onBatchImport && importableServers.length > 0) {
      const serversToImport = importableServers.map((server) => {
        // Generate standard JSON format for CLI-imported servers
        const serverConfig: Record<string, string | string[] | Record<string, string>> = {
          description: server.description,
        };

        if (server.transport.type === 'stdio') {
          serverConfig.command = server.transport.command;
          if (server.transport.args?.length) {
            serverConfig.args = server.transport.args;
          }
          if (server.transport.env && Object.keys(server.transport.env).length) {
            serverConfig.env = server.transport.env;
          }
        } else {
          serverConfig.type = server.transport.type;
          serverConfig.url = server.transport.url;
          if (server.transport.headers && Object.keys(server.transport.headers).length) {
            serverConfig.headers = server.transport.headers;
          }
        }

        return {
          name: server.name,
          description: server.description,
          enabled: server.enabled,
          transport: server.transport,
          status: server.status as IMcpServer['status'],
          tools: (server.tools || []) as IMcpTool[], // Preserve original tools info
          originalJson: JSON.stringify({ mcpServers: { [server.name]: serverConfig } }, null, 2),
        };
      });
      onBatchImport(serversToImport);
    }
  };

  // Render step 1: select Agent
  const renderStep1 = () => (
    <div className='py-4'>
      <Select
        placeholder={t('settings.mcpSelectCLI')}
        value={selectedAgent}
        onChange={setSelectedAgent}
        className='w-full'
        size='large'
      >
        {detectedAgents.map((agent) => (
          <Select.Option key={agent.backend} value={agent.backend}>
            {agent.name}
          </Select.Option>
        ))}
      </Select>
    </div>
  );

  // Render step 2: fetch MCP tools list
  const renderStep2 = () => (
    <div>
      {loadingImport ? (
        <div className='py-8'>
          <div className='flex items-center gap-3 bg-fill-1 rounded-lg p-4'>
            <Spin size={20} />
            <div className='text-t-secondary text-sm'>{t('settings.mcpLoadingTools')}</div>
          </div>
        </div>
      ) : importableServers.length > 0 ? (
        <div>
          <div className='mb-3 flex items-center gap-2'>
            <Check size={20} color={iconColors.success} />
            <span className='text-t-primary'>{t('settings.mcpToolsLoaded', { count: importableServers.length })}</span>
          </div>
          <div className='bg-base rounded-lg max-h-[200px] overflow-y-auto'>
            {importableServers.map((server, index) => (
              <div
                key={index}
                className='p-3'
                style={index < importableServers.length - 1 ? { borderBottom: '1px solid var(--color-border-1)' } : undefined}
              >
                <div className='font-medium text-t-primary'>{server.name}</div>
                {server.description && <div className='text-sm text-t-secondary mt-1'>{server.description}</div>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='text-center py-8 text-t-secondary'>{t('settings.mcpNoServersFound')}</div>
      )}
    </div>
  );

  // Render step 3: import success
  const renderStep3 = () => (
    <div>
      {importableServers.length > 0 ? (
        <div>
          <div className='mb-3 flex items-center gap-2'>
            <Check size={20} color={iconColors.success} />
            <span className='text-t-primary'>
              {t('settings.mcpImportedSuccess', { count: importableServers.length })}
            </span>
          </div>
          <div className='bg-base rounded-lg max-h-[200px] overflow-y-auto'>
            {importableServers.map((server, index) => (
              <div
                key={index}
                className='p-3'
                style={index < importableServers.length - 1 ? { borderBottom: '1px solid var(--color-border-1)' } : undefined}
              >
                <div className='font-medium text-t-primary'>{server.name}</div>
                {server.description && <div className='text-sm text-t-secondary mt-1'>{server.description}</div>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='text-center py-8 text-t-secondary'>{t('settings.mcpNoServersFound')}</div>
      )}
    </div>
  );

  if (!visible) return null;

  const renderFooter = () => (
    <div className='flex justify-end gap-10px'>
      {currentStep === 1 && (
        <>
          <Button onClick={onCancel} className='min-w-100px' style={{ borderRadius: 8 }}>
            {t('common.cancel')}
          </Button>
          <Button
            type='primary'
            onClick={handleNextStep}
            disabled={!selectedAgent}
            className='min-w-120px'
            style={{ borderRadius: 8 }}
          >
            {t('settings.mcpNextStep')}
          </Button>
        </>
      )}
      {currentStep === 2 && (
        <>
          <Button onClick={handlePrevStep} className='min-w-100px' style={{ borderRadius: 8 }}>
            {t('settings.mcpPrevStep')}
          </Button>
          <Button
            type='primary'
            onClick={handleNextStep}
            disabled={loadingImport || importableServers.length === 0}
            className='min-w-120px'
            style={{ borderRadius: 8 }}
          >
            {t('settings.mcpImportButton')}
          </Button>
        </>
      )}
      {currentStep === 3 && (
        <Button type='primary' onClick={onCancel} className='min-w-120px' style={{ borderRadius: 8 }}>
          {t('settings.mcpConfirmButton')}
        </Button>
      )}
    </div>
  );

  return (
    <WaylandModal
      header={{ title: t('settings.mcpOneKeyImport'), showClose: true }}
      visible={visible}
      onCancel={onCancel}
      footer={{ render: renderFooter }}
      style={{ width: 600, height: 420 }}
      contentStyle={{
        borderRadius: 16,
        padding: '24px',
        background: 'var(--dialog-fill-0)',
        overflow: 'hidden',
        height: 420 - 96,
      }}
    >
      <div className='flex flex-col h-275px mt-20px'>
        <div className='mb-6 text-t-secondary text-sm'>{t('settings.mcpImportDescription')}</div>

        <div className='mb-6'>
          <WaylandSteps current={currentStep} size='small'>
            <WaylandSteps.Step
              title={t('settings.mcpStepSelectAgent')}
              icon={currentStep > 1 ? <Check size={16} color='rgb(var(--primary-6))' /> : undefined}
            />
            <WaylandSteps.Step
              title={t('settings.mcpStepFetchTools')}
              icon={currentStep > 2 ? <Check size={16} color='rgb(var(--primary-6))' /> : undefined}
            />
            <WaylandSteps.Step title={t('settings.mcpStepImportSuccess')} />
          </WaylandSteps>
        </div>

        <div className={`mb-6 flex-1 overflow-y-auto ${currentStep === 1 ? 'min-h-[60px]' : 'min-h-[180px]'}`}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
    </WaylandModal>
  );
};

export default OneClickImportModal;
