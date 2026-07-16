import { beforeEach, describe, expect, it, vi } from 'vitest';

const { handlers, enforceRateLimit } = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  enforceRateLimit: vi.fn(() => true),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler),
  },
}));
vi.mock('@process/bridge/webuiDirectAuth', () => ({ enforceRateLimit }));

import { DEFAULT_CONSTITUTION, initConstitutionBridge } from '@process/bridge/constitutionBridge';

function service() {
  return {
    readConstitution: vi.fn(() => ({ status: 'absent', revision: 'rev:v1:internal-absent' })),
    writeConstitution: vi.fn(() => ({
      status: 'committed',
      revision: 'rev:v1:next',
      transactionId: 'tx',
      receiptId: 'receipt',
    })),
    readWithOverlay: vi.fn(() => ({
      constitution: { status: 'present', content: '', revision: 'rev:v1:main' },
      overlay: { status: 'absent', revision: 'rev:v1:internal-overlay' },
    })),
    listSpecialists: vi.fn(() => [{ id: 'copy', bytes: 0, revision: 'rev:v1:copy' }]),
    readSpecialist: vi.fn(() => ({ status: 'present', content: '', revision: 'rev:v1:copy' })),
    writeSpecialist: vi.fn(() => ({
      status: 'committed',
      revision: 'rev:v1:copy-next',
      transactionId: 'tx-copy',
      receiptId: 'receipt-copy',
    })),
    deleteSpecialist: vi.fn(() => ({
      status: 'committed',
      revision: 'rev:v1:copy-absent',
      transactionId: 'tx-delete',
      receiptId: 'receipt-delete',
    })),
  };
}

describe('Constitution IPC service boundary', () => {
  beforeEach(() => {
    handlers.clear();
    enforceRateLimit.mockReset();
    enforceRateLimit.mockReturnValue(true);
  });

  it('preserves typed absent/present-empty reads and backend revisions', async () => {
    const owner = service();
    initConstitutionBridge(owner as never);
    expect(handlers.get('constitution:read')?.({})).toEqual({ state: 'absent', revision: 'rev:v1:internal-absent' });
    expect(handlers.get('constitution:readSpecialist')?.({}, 'copy')).toEqual({
      state: 'present',
      content: '',
      revision: 'rev:v1:copy',
    });
    expect(handlers.get('constitution:readWithOverlay')?.({}, 'copy')).toEqual({
      constitution: { state: 'present', content: '', revision: 'rev:v1:main' },
      overlay: { state: 'absent', revision: 'rev:v1:internal-overlay' },
    });
  });

  it('passes CAS expectations to the sole service and exposes only revision plus receipt identity', async () => {
    const owner = service();
    initConstitutionBridge(owner as never);
    expect(handlers.get('constitution:write')?.({}, 'rules', 'rev:v1:absent')).toEqual({
      ok: true,
      revision: 'rev:v1:next',
      receiptId: 'receipt',
    });
    expect(owner.writeConstitution).toHaveBeenCalledWith('rules', 'rev:v1:absent', undefined);

    expect(handlers.get('constitution:reset')?.({}, 'rev:v1:main')).toEqual({
      ok: true,
      revision: 'rev:v1:next',
      receiptId: 'receipt',
    });
    expect(owner.writeConstitution).toHaveBeenCalledWith(DEFAULT_CONSTITUTION, 'rev:v1:main', undefined);

    expect(handlers.get('constitution:writeSpecialist')?.({}, 'copy', 'overlay', 'rev:v1:copy-absent')).toEqual({
      ok: true,
      revision: 'rev:v1:copy-next',
      receiptId: 'receipt-copy',
    });
    expect(owner.writeSpecialist).toHaveBeenCalledWith('copy', 'overlay', 'rev:v1:copy-absent', undefined);

    expect(handlers.get('constitution:deleteSpecialist')?.({}, 'copy', 'rev:v1:copy')).toEqual({
      ok: true,
      revision: 'rev:v1:copy-absent',
      receiptId: 'receipt-delete',
    });
    expect(owner.deleteSpecialist).toHaveBeenCalledWith('copy', 'rev:v1:copy', undefined);
  });

  it('fails closed at the existing renderer write rate limit', async () => {
    const owner = service();
    initConstitutionBridge(owner as never);
    enforceRateLimit.mockReturnValue(false);
    expect(() => handlers.get('constitution:write')?.({}, 'rules', null)).toThrow('CONSTITUTION_RATE_LIMITED');
    expect(owner.writeConstitution).not.toHaveBeenCalled();
  });
});
