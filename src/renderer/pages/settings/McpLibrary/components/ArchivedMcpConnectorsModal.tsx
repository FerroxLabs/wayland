/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Empty, Message, Modal, Spin } from '@arco-design/web-react';
import { ArchiveRestore } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { mcpService } from '@/common/adapter/ipcBridge';
import {
  listArchivedMcpServersHttp,
  restoreArchivedMcpServerHttp,
  type ArchivedMcpConnector,
} from '@/renderer/services/McpConfigService';
import { isElectronDesktop } from '@/renderer/utils/platform';

type ArchivedConnector = ArchivedMcpConnector;

interface ArchivedMcpConnectorsModalProps {
  visible: boolean;
  onClose(): void;
  onRestored(): Promise<void>;
}

export default function ArchivedMcpConnectorsModal({ visible, onClose, onRestored }: ArchivedMcpConnectorsModalProps) {
  const { t } = useTranslation();
  const [archives, setArchives] = useState<ArchivedConnector[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string>();
  const [loadError, setLoadError] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(undefined);
    try {
      const response = isElectronDesktop()
        ? await mcpService.listArchivedServers.invoke()
        : await listArchivedMcpServersHttp();
      if (!response.success || !response.data) throw new Error(response.msg || 'Unable to list archived connectors');
      setArchives(response.data);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : String(error));
      setArchives([]);
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) void load();
  }, [visible, load]);

  const restore = useCallback(
    async (archiveId: string) => {
      setRestoring(archiveId);
      try {
        const response = isElectronDesktop()
          ? await mcpService.restoreArchivedServer.invoke({ archiveId })
          : await restoreArchivedMcpServerHttp(archiveId);
        if (!response.success) throw new Error(response.msg || 'Unable to restore connector');
        await onRestored();
        await load();
        Message.success(t('mcpLibrary.archive.restored', 'Connector restored in the disconnected state.'));
      } catch (error) {
        Message.error(error instanceof Error ? error.message : String(error));
      } finally {
        setRestoring(undefined);
      }
    },
    [load, onRestored, t]
  );

  return (
    <Modal
      visible={visible}
      title={t('mcpLibrary.archive.title', 'Archived connectors')}
      footer={null}
      onCancel={onClose}
      unmountOnExit
    >
      <p>
        {t(
          'mcpLibrary.archive.description',
          'Archived definitions retain their command, transport, environment, headers and setup details. Restored connectors stay disconnected until you explicitly reconnect them.'
        )}
      </p>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : loadError ? (
        <div role='alert'>{loadError}</div>
      ) : archives.length === 0 ? (
        <Empty description={t('mcpLibrary.archive.empty', 'No archived connectors.')} />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {archives.map((archive) => (
            <div
              key={archive.archiveId}
              data-testid={`archived-mcp-${archive.archiveId}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
            >
              <div style={{ minWidth: 0 }}>
                <strong>{archive.name}</strong>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {archive.transportType} · {new Date(archive.archivedAt).toLocaleString()}
                </div>
              </div>
              <Button
                size='small'
                icon={<ArchiveRestore size={14} />}
                loading={restoring === archive.archiveId}
                onClick={() => void restore(archive.archiveId)}
              >
                {t('mcpLibrary.archive.restore', 'Restore')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
