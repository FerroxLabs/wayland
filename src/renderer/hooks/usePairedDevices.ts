import { useState, useEffect, useCallback } from 'react';
import { webui } from '@/common/adapter/ipcBridge';

type PairedDevice = {
  id: string;
  deviceName: string;
  ua: string;
  ipFirstSeen: string;
  lastSeenAt: number;
  createdAt: number;
};

type UsePairedDevicesResult = {
  devices: PairedDevice[];
  loading: boolean;
  reload: () => Promise<void>;
  revoke: (id: string) => Promise<void>;
};

export function usePairedDevices(): UsePairedDevicesResult {
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await webui.listPairedDevices.invoke();
      if (result.success && result.data) {
        setDevices(result.data.devices);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const revoke = useCallback(
    async (id: string) => {
      await webui.revokeDevice.invoke({ id });
      await reload();
    },
    [reload]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { devices, loading, reload, revoke };
}
