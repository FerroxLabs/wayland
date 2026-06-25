import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRun, mockPrepare, mockGetDriver, mockGetDatabase } = vi.hoisted(() => {
  const run = vi.fn();
  const prepare = vi.fn(() => ({ run }));
  const getDriver = vi.fn(() => ({ prepare }));
  const getDatabase = vi.fn(async () => ({ getDriver }));
  return { mockRun: run, mockPrepare: prepare, mockGetDriver: getDriver, mockGetDatabase: getDatabase };
});

vi.mock('@process/services/database/export', () => ({
  getDatabase: mockGetDatabase,
}));

import { appendAudit } from '@process/webserver/audit/auditLog';

describe('appendAudit', () => {
  beforeEach(() => {
    mockRun.mockReset();
    mockPrepare.mockClear();
    mockGetDriver.mockClear();
    mockGetDatabase.mockClear();
    mockPrepare.mockReturnValue({ run: mockRun });
  });

  it('inserts a row with all fields and returns true', async () => {
    const ok = await appendAudit({
      userId: 'u1',
      action: 'provider.connect',
      target: 'openai',
      ip: '100.64.0.1',
      reachedVia: 'tailscale',
    });
    expect(ok).toBe(true);
    expect(mockPrepare).toHaveBeenCalledTimes(1);
    const args = mockRun.mock.calls[0];
    expect(args[0]).toBe('u1');
    expect(args[1]).toBe('provider.connect');
    expect(args[2]).toBe('openai');
    expect(args[3]).toBe('100.64.0.1');
    expect(args[4]).toBe('tailscale');
    expect(typeof args[5]).toBe('number'); // created_at epoch ms
  });

  it('coerces missing optional fields to null', async () => {
    await appendAudit({ userId: null, action: 'storage.restore' });
    const args = mockRun.mock.calls[0];
    expect(args[0]).toBeNull();
    expect(args[1]).toBe('storage.restore');
    expect(args[2]).toBeNull(); // target
    expect(args[3]).toBeNull(); // ip
    expect(args[4]).toBeNull(); // reachedVia
  });

  it('never throws and returns false on a store failure', async () => {
    mockRun.mockImplementation(() => {
      throw new Error('db down');
    });
    const ok = await appendAudit({ userId: 'u1', action: 'provider.connect' });
    expect(ok).toBe(false);
  });
});
