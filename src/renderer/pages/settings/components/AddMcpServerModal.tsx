import type { IMcpServer } from '@/common/config/storage';
import React, { useEffect, useState } from 'react';
import UrlAddModal from './UrlAddModal';
import JsonImportModal from './JsonImportModal';
import OneClickImportModal from './OneClickImportModal';

interface AddMcpServerModalProps {
  visible: boolean;
  server?: IMcpServer;
  onCancel: () => void;
  onSubmit: (server: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBatchImport?: (servers: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  importMode?: 'url' | 'json' | 'oneclick';
}

type Mode = 'url' | 'json' | 'oneclick' | null;

/**
 * Add-server router. The default surface is now URL-first (paste a server URL,
 * Wayland probes transport + auth and connects) - the "don't make me think"
 * happy path. JSON is the power-user escape hatch (reachable from the URL modal
 * or via importMode), and One-click imports existing agent configs.
 */
const AddMcpServerModal: React.FC<AddMcpServerModalProps> = ({
  visible,
  server,
  onCancel,
  onSubmit,
  onBatchImport,
  importMode,
}) => {
  const [mode, setMode] = useState<Mode>(null);

  useEffect(() => {
    if (!visible) {
      setMode(null);
      return;
    }
    if (server) {
      // Editing an existing server uses the JSON editor.
      setMode('json');
      return;
    }
    if (importMode === 'oneclick') {
      setMode('oneclick');
      return;
    }
    if (importMode === 'json') {
      setMode('json');
      return;
    }
    setMode('url');
  }, [visible, server, importMode]);

  const handleCancel = () => {
    setMode(null);
    onCancel();
  };

  if (!visible) return null;

  return (
    <>
      <UrlAddModal
        visible={mode === 'url'}
        onCancel={handleCancel}
        onSubmit={onSubmit}
        onUseJson={() => setMode('json')}
      />
      <JsonImportModal
        visible={mode === 'json'}
        server={server}
        onCancel={handleCancel}
        onSubmit={onSubmit}
        onBatchImport={onBatchImport}
      />
      <OneClickImportModal visible={mode === 'oneclick'} onCancel={handleCancel} onBatchImport={onBatchImport} />
    </>
  );
};

export default AddMcpServerModal;
