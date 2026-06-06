/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Alert, Button, Message, Modal, Spin, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type {
  CodexSetupResult,
  CodexStatusResult,
  FluxConnectorReport,
  OpencodeSetupResult,
  OpencodeStatusResult,
} from '@/common/types/fluxConnector';
import styles from './AgentsSettings.module.css';

/** Backends that route through Flux via a one-time config write. */
type FluxSetupBackend = 'opencode' | 'codex';

type SetupStatusResult = OpencodeStatusResult | CodexStatusResult;
type SetupActionResult = OpencodeSetupResult | CodexSetupResult;

/**
 * Resolve the IPC trio (status / setup / remove) for a given setup backend.
 * Both backends share identical result shapes, so the modal stays uniform and
 * only the bridge target differs.
 */
function connectorFor(backend: FluxSetupBackend): {
  status: () => Promise<SetupStatusResult>;
  setup: () => Promise<SetupActionResult>;
  remove: () => Promise<FluxConnectorReport>;
} {
  if (backend === 'codex') {
    return {
      status: () => ipcBridge.fluxConnector.codexStatus.invoke(),
      setup: () => ipcBridge.fluxConnector.setupCodex.invoke(),
      remove: () => ipcBridge.fluxConnector.removeCodex.invoke(),
    };
  }
  return {
    status: () => ipcBridge.fluxConnector.opencodeStatus.invoke(),
    setup: () => ipcBridge.fluxConnector.setupOpencode.invoke(),
    remove: () => ipcBridge.fluxConnector.removeOpencode.invoke(),
  };
}

/**
 * Setup surface for routing a generic ACP CLI (`opencode` or `codex`) through
 * Flux. The setup WRITES into the user's own tool config (backed up first), so
 * the modal is deliberately honest: it states what will change before the
 * action, then shows what happened plus how to undo it. The backend-named copy
 * is interpolated with the tool name and the real `configPath` from status, so
 * the same modal is correct for either backend.
 */
type FluxSetupModalProps = {
  visible: boolean;
  onClose: () => void;
  backend: FluxSetupBackend;
};

/** Reusable report panel: the changes list, backup path, and rollback hint. */
const ReportPanel: React.FC<{ report: FluxConnectorReport }> = ({ report }) => {
  const { t } = useTranslation();
  return (
    <div className={styles.fluxReport} data-testid='flux-setup-report'>
      {report.changes.length > 0 && (
        <div className={styles.fluxReportBlock}>
          <Typography.Text className={styles.fluxReportLabel}>
            {t('settings.agentsPage.fluxSetup.report.changesLabel')}
          </Typography.Text>
          <ul className={styles.fluxReportList}>
            {report.changes.map((change) => (
              <li key={change}>
                <Typography.Text className='text-12px'>{change}</Typography.Text>
              </li>
            ))}
          </ul>
        </div>
      )}
      {report.backupPath && (
        <div className={styles.fluxReportBlock}>
          <Typography.Text className={styles.fluxReportLabel}>
            {t('settings.agentsPage.fluxSetup.report.backupLabel')}
          </Typography.Text>
          <Typography.Text code className='text-12px' data-testid='flux-setup-backup'>
            {report.backupPath}
          </Typography.Text>
        </div>
      )}
      <div className={styles.fluxReportBlock}>
        <Typography.Text className={styles.fluxReportLabel}>
          {t('settings.agentsPage.fluxSetup.report.rollbackLabel')}
        </Typography.Text>
        <Typography.Text code copyable className='text-12px' data-testid='flux-setup-rollback'>
          {report.rollbackCommand}
        </Typography.Text>
      </div>
    </div>
  );
};

const FluxSetupModal: React.FC<FluxSetupModalProps> = ({ visible, onClose, backend }) => {
  const { t } = useTranslation();
  const connector = React.useMemo(() => connectorFor(backend), [backend]);

  const [statusLoading, setStatusLoading] = React.useState(false);
  const [status, setStatus] = React.useState<SetupStatusResult | null>(null);
  const [busy, setBusy] = React.useState(false);
  // The most recent action report (setup or remove), shown in the modal body.
  const [report, setReport] = React.useState<FluxConnectorReport | null>(null);
  // Inline notice when Flux Router is not connected yet (not an error toast).
  const [notConnected, setNotConnected] = React.useState(false);
  // Hard error message from a failed action, shown in an Alert.
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadStatus = React.useCallback(async () => {
    setStatusLoading(true);
    try {
      const result = await connector.status();
      setStatus(result);
    } finally {
      setStatusLoading(false);
    }
  }, [connector]);

  // Refresh status each time the modal opens; clear transient action state.
  React.useEffect(() => {
    if (!visible) return;
    setReport(null);
    setNotConnected(false);
    setErrorMessage(null);
    void loadStatus();
  }, [visible, loadStatus]);

  const handleSetup = React.useCallback(async () => {
    setBusy(true);
    setNotConnected(false);
    setErrorMessage(null);
    try {
      const result = await connector.setup();
      if (result.ok === true) {
        setReport(result.report);
        await loadStatus();
        Message.success(t('settings.agentsPage.fluxSetup.setupDone', { tool: backend }));
      } else if (result.reason === 'flux-not-connected') {
        setNotConnected(true);
      } else {
        setErrorMessage(result.message || t('settings.agentsPage.fluxSetup.genericError'));
      }
    } finally {
      setBusy(false);
    }
  }, [backend, connector, loadStatus, t]);

  const handleRemove = React.useCallback(async () => {
    setBusy(true);
    setNotConnected(false);
    setErrorMessage(null);
    try {
      const result = await connector.remove();
      setReport(result);
      await loadStatus();
      Message.success(t('settings.agentsPage.fluxSetup.removeDone', { tool: backend }));
    } finally {
      setBusy(false);
    }
  }, [backend, connector, loadStatus, t]);

  const configPath = status?.configPath ?? '';

  const renderBody = () => {
    if (statusLoading && !status) {
      return (
        <div className='flex justify-center py-32px'>
          <Spin />
        </div>
      );
    }
    if (!status) return null;

    const isAbsent = status.installed === false && status.status === 'absent';

    return (
      <div className={styles.fluxSetupBody}>
        {isAbsent && (
          <Typography.Paragraph className='text-13px'>
            {t('settings.agentsPage.fluxSetup.absentBody', { tool: backend })}
          </Typography.Paragraph>
        )}

        {status.status === 'unconfigured' && (
          <Typography.Paragraph className='text-13px'>
            {t('settings.agentsPage.fluxSetup.unconfiguredBody', { tool: backend, configPath })}
          </Typography.Paragraph>
        )}

        {status.status === 'routed' && (
          <Typography.Paragraph className='text-13px' data-testid='flux-setup-routed'>
            {t('settings.agentsPage.fluxSetup.routedBody', { tool: backend })}
          </Typography.Paragraph>
        )}

        {status.status === 'drifted' && (
          <Typography.Paragraph className='text-13px' data-testid='flux-setup-drifted'>
            {t('settings.agentsPage.fluxSetup.driftedBody', { tool: backend })}
          </Typography.Paragraph>
        )}

        {notConnected && (
          <Alert
            type='info'
            className='mb-12px'
            data-testid='flux-setup-not-connected'
            content={t('settings.agentsPage.fluxSetup.notConnected', { tool: backend })}
          />
        )}

        {errorMessage && (
          <Alert type='error' className='mb-12px' data-testid='flux-setup-error' content={errorMessage} />
        )}

        {report && <ReportPanel report={report} />}
      </div>
    );
  };

  const renderFooter = () => {
    if (!status) return null;
    const isAbsent = status.installed === false && status.status === 'absent';

    if (isAbsent) {
      return <Button onClick={onClose}>{t('settings.agentsPage.fluxSetup.close')}</Button>;
    }

    if (status.status === 'routed') {
      return (
        <>
          <Button onClick={onClose}>{t('settings.agentsPage.fluxSetup.close')}</Button>
          <Button status='danger' type='text' loading={busy} disabled={busy} onClick={handleRemove}>
            {t('settings.agentsPage.fluxSetup.remove', { tool: backend })}
          </Button>
        </>
      );
    }

    if (status.status === 'drifted') {
      return (
        <>
          <Button onClick={onClose}>{t('settings.agentsPage.fluxSetup.close')}</Button>
          <Button status='danger' type='text' loading={busy} disabled={busy} onClick={handleRemove}>
            {t('settings.agentsPage.fluxSetup.remove', { tool: backend })}
          </Button>
          <Button type='primary' loading={busy} disabled={busy} onClick={handleSetup}>
            {t('settings.agentsPage.fluxSetup.reapply')}
          </Button>
        </>
      );
    }

    // unconfigured
    return (
      <>
        <Button onClick={onClose}>{t('settings.agentsPage.fluxSetup.close')}</Button>
        <Button type='primary' loading={busy} disabled={busy} onClick={handleSetup} data-testid='flux-setup-action'>
          {t('settings.agentsPage.fluxSetup.setup', { tool: backend })}
        </Button>
      </>
    );
  };

  return (
    <Modal
      title={t('settings.agentsPage.fluxSetup.title', { tool: backend })}
      visible={visible}
      onCancel={onClose}
      footer={renderFooter()}
      autoFocus={false}
      focusLock
      unmountOnExit
    >
      {renderBody()}
    </Modal>
  );
};

export default FluxSetupModal;
