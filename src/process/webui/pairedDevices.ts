import { randomUUID } from 'crypto';
import { getDatabase } from '@process/services/database';
import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';

export type PairedDevice = {
  id: string;
  deviceName: string;
  ua: string;
  ipFirstSeen: string;
  lastSeenAt: number;
  createdAt: number;
};

type DeviceRow = {
  id: string;
  device_name: string;
  ua: string;
  ip_first_seen: string;
  last_seen_at: number;
  created_at: number;
};

function rowToDevice(row: DeviceRow): PairedDevice {
  return {
    id: row.id,
    deviceName: row.device_name,
    ua: row.ua,
    ipFirstSeen: row.ip_first_seen,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  };
}

export function registerDevice(
  db: ISqliteDriver,
  opts: { deviceName?: string; ua?: string; ipFirstSeen?: string }
): PairedDevice {
  const now = Date.now();
  const device: PairedDevice = {
    id: randomUUID(),
    deviceName: opts.deviceName ?? 'Unknown Device',
    ua: opts.ua ?? '',
    ipFirstSeen: opts.ipFirstSeen ?? '',
    lastSeenAt: now,
    createdAt: now,
  };
  db.prepare(
    `INSERT INTO webui_paired_devices (id, device_name, ua, ip_first_seen, last_seen_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(device.id, device.deviceName, device.ua, device.ipFirstSeen, device.lastSeenAt, device.createdAt);
  return device;
}

export function updateLastSeen(db: ISqliteDriver, id: string): void {
  db.prepare(`UPDATE webui_paired_devices SET last_seen_at = ? WHERE id = ?`).run(Date.now(), id);
}

export function listDevices(db: ISqliteDriver): PairedDevice[] {
  const rows = db.prepare(`SELECT * FROM webui_paired_devices ORDER BY last_seen_at DESC`).all() as DeviceRow[];
  return rows.map(rowToDevice);
}

export function revokeDevice(db: ISqliteDriver, id: string): void {
  db.prepare(`DELETE FROM webui_paired_devices WHERE id = ?`).run(id);
}

// Convenience wrappers used by IPC handlers
export async function ipcListPairedDevices(): Promise<PairedDevice[]> {
  const db = await getDatabase();
  return listDevices(db.getDriver());
}

export async function ipcRevokeDevice(id: string): Promise<void> {
  const db = await getDatabase();
  revokeDevice(db.getDriver(), id);
}
