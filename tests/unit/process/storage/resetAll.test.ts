import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAll } from '@process/storage/resetAll';

vi.mock('@office-ai/platform', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

describe('resetAll recovery gate', () => {
  let root: string;
  let logs: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-reset-'));
    logs = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-reset-logs-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(logs, { recursive: true, force: true });
  });

  it('fails closed and preserves the database when no authoritative recovery point exists', async () => {
    const databaseDir = path.join(root, 'wayland');
    fs.mkdirSync(databaseDir, { recursive: true });
    for (const filename of ['wayland.db', 'wayland.db-wal', 'wayland.db-shm']) {
      fs.writeFileSync(path.join(databaseDir, filename), filename);
    }

    await expect(resetAll(root, logs)).rejects.toThrow('RESET_RECOVERY_POINT_REQUIRED');

    for (const filename of ['wayland.db', 'wayland.db-wal', 'wayland.db-shm']) {
      expect(fs.readFileSync(path.join(databaseDir, filename), 'utf8')).toBe(filename);
    }
    expect(fs.existsSync(path.join(logs, 'pre-reset-manifest.json'))).toBe(false);
  });
});
