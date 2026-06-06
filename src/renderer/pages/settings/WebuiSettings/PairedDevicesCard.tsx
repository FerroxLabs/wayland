import React, { useState } from 'react';
import { Button, Modal, Spin } from '@arco-design/web-react';
import { Monitor, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePairedDevices } from '@renderer/hooks/usePairedDevices';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PairedDevicesCard: React.FC = () => {
  const { t } = useTranslation();
  const { devices, loading, revoke } = usePairedDevices();
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    if (!revokeId) return;
    setRevoking(true);
    try {
      await revoke(revokeId);
    } finally {
      setRevoking(false);
      setRevokeId(null);
    }
  };

  return (
    <div className="px-[12px] md:px-[28px] py-14px bg-[var(--color-bg-2)] border border-solid border-[var(--color-border-2)] rd-12px">
      <div className="text-14px font-500 mb-12px text-t-primary">
        {t('settings.webui.pairedDevices.title')}
      </div>

      {loading && (
        <div className="flex justify-center py-12px">
          <Spin />
        </div>
      )}

      {!loading && devices.length === 0 && (
        <div className="text-13px text-t-tertiary py-8px">{t('settings.webui.pairedDevices.empty')}</div>
      )}

      {!loading && devices.length > 0 && (
        <div className="flex flex-col gap-8px">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center gap-10px px-12px py-10px rd-10px border border-[var(--color-border-2)] bg-fill-1"
            >
              <Monitor size={16} className="text-t-tertiary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-13px font-500 text-t-primary truncate">{device.deviceName}</div>
                <div className="text-11px text-t-tertiary truncate">
                  {device.ipFirstSeen && <span>{device.ipFirstSeen} · </span>}
                  {t('settings.webui.pairedDevices.lastSeen', { time: formatDate(device.lastSeenAt) })}
                </div>
              </div>
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<Trash2 size={14} />}
                onClick={() => setRevokeId(device.id)}
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        visible={revokeId !== null}
        title={t('settings.webui.pairedDevices.revokeTitle')}
        onCancel={() => setRevokeId(null)}
        onOk={handleRevoke}
        confirmLoading={revoking}
        okButtonProps={{ status: 'danger' }}
        okText={t('settings.webui.pairedDevices.revoke')}
      >
        <p className="text-13px text-t-secondary">{t('settings.webui.pairedDevices.revokeConfirm')}</p>
      </Modal>
    </div>
  );
};

export default PairedDevicesCard;
