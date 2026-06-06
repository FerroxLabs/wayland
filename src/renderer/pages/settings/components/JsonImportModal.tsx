import type { IMcpServer, IMcpServerTransport, IMcpTool } from '@/common/config/storage';
import { Alert, Button } from '@arco-design/web-react';
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';
import WaylandModal from '@/renderer/components/base/WaylandModal';

interface JsonImportModalProps {
  visible: boolean;
  server?: IMcpServer;
  onCancel: () => void;
  onSubmit: (server: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBatchImport?: (servers: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

type JsonServerConfig = Record<string, any>;

const JsonImportModal: React.FC<JsonImportModalProps> = ({ visible, server, onCancel, onSubmit, onBatchImport }) => {
  const { t } = useTranslation();
  const { theme } = useThemeContext();
  const [jsonInput, setJsonInput] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });

  /**
   * JSON syntax validation
   */
  const validateJsonSyntax = useCallback((input: string): ValidationResult => {
    if (!input.trim()) {
      return { isValid: true }; // Treat empty value as valid
    }

    try {
      JSON.parse(input);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: error instanceof SyntaxError ? error.message : 'Invalid JSON format',
      };
    }
  }, []);

  // Watch jsonInput changes and update validation result in real time
  React.useEffect(() => {
    setValidation(validateJsonSyntax(jsonInput));
  }, [jsonInput, validateJsonSyntax]);

  // When editing an existing server, pre-fill JSON data
  React.useEffect(() => {
    if (visible && server) {
      // Prefer stored originalJson; if absent, generate JSON config
      if (server.originalJson) {
        setJsonInput(server.originalJson);
      } else {
        // Backward-compatible: generate JSON config for older data without originalJson
        const serverConfig = {
          mcpServers: {
            [server.name]: {
              description: server.description,
              ...(server.transport.type === 'stdio'
                ? {
                    command: server.transport.command,
                    args: server.transport.args || [],
                    env: server.transport.env || {},
                  }
                : {
                    type: server.transport.type,
                    url: server.transport.url,
                    ...(server.transport.headers && { headers: server.transport.headers }),
                  }),
            },
          },
        };
        setJsonInput(JSON.stringify(serverConfig, null, 2));
      }
    } else if (visible && !server) {
      // Clear JSON input in create mode
      setJsonInput('');
    }
  }, [visible, server]);

  /**
   * Parse transport config from JSON server config.
   * Supports both "type" field (standard) and "transport" field (Gemini CLI format).
   */
  const parseTransport = (serverConfig: JsonServerConfig): IMcpServerTransport => {
    if (serverConfig.command) {
      return {
        type: 'stdio',
        command: serverConfig.command,
        args: serverConfig.args || [],
        env: serverConfig.env || {},
      };
    }

    // Check both "type" and "transport" fields for transport type detection
    // Gemini CLI uses "transport" field, standard format uses "type" field
    const transportType = serverConfig.type || serverConfig.transport;

    if (transportType === 'sse' || serverConfig.url?.includes('/sse')) {
      return { type: 'sse', url: serverConfig.url, headers: serverConfig.headers };
    }
    if (transportType === 'streamable_http') {
      return { type: 'streamable_http', url: serverConfig.url, headers: serverConfig.headers };
    }
    return { type: 'http', url: serverConfig.url, headers: serverConfig.headers };
  };

  const normalizeArrayServer = (serverItem: unknown): { name: string; config: JsonServerConfig } => {
    if (!serverItem || typeof serverItem !== 'object' || Array.isArray(serverItem)) {
      throw new Error(t('settings.mcpJsonFormatError'));
    }

    const rawServer = serverItem as JsonServerConfig;
    if (typeof rawServer.name !== 'string' || !rawServer.name.trim()) {
      throw new Error(t('settings.mcpJsonFormatError'));
    }

    const { name, ...restConfig } = rawServer;
    const transportConfig = restConfig.transport;
    if (transportConfig && typeof transportConfig === 'object' && !Array.isArray(transportConfig)) {
      const typedTransport = transportConfig as JsonServerConfig;
      if (typedTransport.type === 'stdio') {
        return {
          name,
          config: {
            ...restConfig,
            command: typedTransport.command,
            args: typedTransport.args,
            env: typedTransport.env,
            transport: undefined,
          },
        };
      }

      return {
        name,
        config: {
          ...restConfig,
          type: typedTransport.type,
          url: typedTransport.url,
          headers: typedTransport.headers,
          transport: undefined,
        },
      };
    }

    return { name, config: restConfig };
  };

  const normalizeMcpServers = (config: JsonServerConfig): Record<string, JsonServerConfig> => {
    const rawServers = config.mcpServers ?? config;

    if (Array.isArray(rawServers)) {
      return rawServers.reduce<Record<string, JsonServerConfig>>((accumulator, serverItem) => {
        const { name, config: normalizedConfig } = normalizeArrayServer(serverItem);
        accumulator[name] = normalizedConfig;
        return accumulator;
      }, {});
    }

    if (!rawServers || typeof rawServers !== 'object') {
      throw new Error(t('settings.mcpJsonFormatError'));
    }

    return rawServers as Record<string, JsonServerConfig>;
  };

  const handleSubmit = () => {
    // Re-validate at submit time to guard against race between useEffect validation and click
    let config: Record<string, any>;
    try {
      config = JSON.parse(jsonInput);
    } catch {
      setValidation({ isValid: false, errorMessage: 'Invalid JSON format' });
      return;
    }
    let mcpServers: Record<string, JsonServerConfig>;
    try {
      mcpServers = normalizeMcpServers(config);
    } catch (error) {
      setValidation({
        isValid: false,
        errorMessage: error instanceof Error ? error.message : t('settings.mcpJsonFormatError'),
      });
      return;
    }

    const serverKeys = Object.keys(mcpServers);
    if (serverKeys.length === 0) {
      console.warn('No MCP server found in configuration');
      return;
    }

    // If multiple servers exist, use batch import
    if (serverKeys.length > 1 && onBatchImport) {
      const serversToImport = serverKeys.map((serverKey) => {
        const serverConfig = mcpServers[serverKey];
        return {
          name: serverKey,
          description: serverConfig.description || `Imported from JSON`,
          enabled: true,
          transport: parseTransport(serverConfig),
          status: 'disconnected' as const,
          tools: [] as IMcpTool[], // Initialize as empty array on JSON import; populated later via connection test
          originalJson: JSON.stringify({ mcpServers: { [serverKey]: serverConfig } }, null, 2),
        };
      });

      onBatchImport(serversToImport);
      onCancel();
      return;
    }

    // Single server import
    const firstServerKey = serverKeys[0];
    const serverConfig = mcpServers[firstServerKey];

    onSubmit({
      name: firstServerKey,
      description: serverConfig.description || 'Imported from JSON',
      enabled: true,
      transport: parseTransport(serverConfig),
      status: 'disconnected',
      tools: [] as IMcpTool[], // Initialize as empty array on JSON import; populated later via connection test
      originalJson: jsonInput,
    });
    onCancel();
  };

  if (!visible) return null;

  return (
    <WaylandModal
      visible={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okButtonProps={{ disabled: !validation.isValid }}
      header={{ title: server ? t('settings.mcpEditServer') : t('settings.mcpImportFromJSON'), showClose: true }}
      style={{ width: 600, height: 450 }}
      contentStyle={{
        borderRadius: 16,
        padding: '24px',
        background: 'var(--dialog-fill-0)',
        overflow: 'auto',
        height: 420 - 80,
      }} // Keep same size as Add Model modal
    >
      <div className='space-y-12px'>
        <div>
          <div className='mb-2 text-sm text-t-secondary'>{t('settings.mcpImportPlaceholder')}</div>
          <div className='relative'>
            <CodeMirror
              value={jsonInput}
              height='300px'
              theme={theme}
              extensions={[json()]}
              onChange={(value: string) => setJsonInput(value)}
              placeholder={`{
  "mcpServers": {
    "weather": {
      "command": "uv",
      "args": ["--directory", "/path/to/weather", "run", "weather.py"],
      "description": "Weather information server"
    }
  }
}`}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
              }}
              style={{
                fontSize: '13px',
                border: validation.isValid || !jsonInput.trim() ? '1px solid var(--color-border-1)' : '1px solid var(--danger)',
                borderRadius: '6px',
                marginBottom: '20px',
                overflow: 'hidden',
              }}
              className='[&_.cm-editor]:rounded-[6px]'
            />
            {jsonInput && (
              <Button
                size='mini'
                type='outline'
                className='absolute top-2 right-2 z-10'
                onClick={() => {
                  const copyToClipboard = async () => {
                    try {
                      if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(jsonInput);
                      } else {
                        // Fallback to legacy method
                        const textArea = document.createElement('textarea');
                        textArea.value = jsonInput;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-9999px';
                        textArea.style.top = '-9999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                      }
                      setCopyStatus('success');
                      setTimeout(() => setCopyStatus('idle'), 2000);
                    } catch (err) {
                      console.error('Copy failed:', err);
                      setCopyStatus('error');
                      setTimeout(() => setCopyStatus('idle'), 2000);
                    }
                  };

                  void copyToClipboard();
                }}
                style={{
                  backdropFilter: 'blur(4px)',
                }}
              >
                {copyStatus === 'success'
                  ? t('common.copySuccess')
                  : copyStatus === 'error'
                    ? t('common.copyFailed')
                    : t('common.copy')}
              </Button>
            )}
          </div>

          {/* JSON format error hint */}
          {!validation.isValid && jsonInput.trim() && (
            <div className='mt-2 text-sm text-red-600'>
              {validation.errorMessage || t('settings.mcpJsonFormatError') || 'JSON format error'}
            </div>
          )}
        </div>

        <Alert
          type='info'
          showIcon
          content={
            <div>
              <div>{t('settings.mcpImportTips')}</div>
              <ul className='list-disc pl-5 mt-2 space-y-1 text-sm'>
                <li>{t('settings.mcpImportTip1')}</li>
                <li>{t('settings.mcpImportTip2')}</li>
                <li>{t('settings.mcpImportTip3')}</li>
              </ul>
            </div>
          }
        />
      </div>
    </WaylandModal>
  );
};

export default JsonImportModal;
