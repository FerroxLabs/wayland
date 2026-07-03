/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Doctor report modal for the `/doctor` slash command (issue #458).
 *
 * Runs the full diagnostic battery via `ipcBridge.doctor.runDoctor` and renders
 * the plain-text report inline, so a user reporting "nothing works" gets a real
 * diagnosis without leaving the chat. Reuses the same `buildDoctorReportText`
 * renderer as the Doctor settings page; the "Copy report" action reuses the
 * shared, Windows-hardened clipboard helper.
 */

import { Button, Message, Modal, Spin } from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doctor } from '@/common/adapter/ipcBridge';
import { copyText } from '@/renderer/utils/ui/clipboard';
import { buildDoctorReportText } from '@renderer/pages/settings/DoctorSettings/reportText';
import type { DoctorReport } from '@process/doctor/types';

type DoctorReportModalProps = {
  visible: boolean;
  onClose: () => void;
};

const DoctorReportModal: React.FC<DoctorReportModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    setReport(null);
    setFailed(false);
    try {
      setReport(await doctor.runDoctor.invoke());
    } catch {
      setFailed(true);
      Message.error(t('settings.doctor.runFailed', { defaultValue: 'Could not run the Doctor' }));
    } finally {
      setRunning(false);
    }
  }, [t]);

  // Run the battery each time the modal opens so the report is always fresh.
  useEffect(() => {
    if (visible) void run();
  }, [visible, run]);

  const reportText = useMemo(
    () => (report ? buildDoctorReportText(report, (key) => t(key, { defaultValue: key })) : ''),
    [report, t]
  );

  const copyReport = useCallback(async () => {
    if (!reportText) return;
    try {
      await copyText(reportText);
      Message.success(t('settings.doctor.copied', { defaultValue: 'Report copied' }));
    } catch {
      Message.error(t('settings.doctor.copyFailed', { defaultValue: 'Could not copy the report' }));
    }
  }, [reportText, t]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      title={t('settings.doctor.title', { defaultValue: 'Doctor' })}
      footer={
        <div className='flex items-center justify-end gap-8px'>
          <Button onClick={() => void copyReport()} disabled={!reportText || running}>
            {t('settings.doctor.copy', { defaultValue: 'Copy report' })}
          </Button>
          <Button type='primary' onClick={onClose}>
            {t('messages.doctor.close', { defaultValue: 'Close' })}
          </Button>
        </div>
      }
    >
      {running && !report ? (
        <div className='flex items-center justify-center py-32px'>
          <Spin />
        </div>
      ) : failed ? (
        <div className='py-24px text-center text-13px text-[var(--color-text-2)]' role='alert'>
          {t('messages.doctor.runError', { defaultValue: 'Could not run the Doctor. Please try again.' })}
        </div>
      ) : (
        <pre className='max-h-400px overflow-auto whitespace-pre-wrap break-words m-0 text-12px text-[var(--color-text-1)]'>
          {reportText}
        </pre>
      )}
    </Modal>
  );
};

export default DoctorReportModal;
