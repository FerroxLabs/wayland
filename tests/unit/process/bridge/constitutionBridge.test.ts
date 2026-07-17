import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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

import { DEFAULT_CONSTITUTION } from '@/common/constitutionDefault';
import { initConstitutionBridge } from '@process/bridge/constitutionBridge';
import { ConstitutionFsBinaryError } from '@process/services/constitution/constitutionFsBinary';
import { ConstitutionFsService } from '@process/services/constitution/constitutionFsService';

function service() {
  return {
    capability: vi.fn(() => ({ supported: true as const })),
    readConstitution: vi.fn(() => ({ status: 'absent', revision: 'rev:v1:internal-absent' })),
    writeConstitution: vi.fn((_content: string, _revision: string, requestId: string) => ({
      status: 'committed',
      revision: 'rev:v1:next',
      transactionId: requestId,
      receiptId: 'receipt',
      requestFingerprint: `sha256:${'a'.repeat(64)}`,
    })),
    readWithOverlay: vi.fn(() => ({
      constitution: { status: 'present', content: '', revision: 'rev:v1:main' },
      overlay: { status: 'absent', revision: 'rev:v1:internal-overlay' },
    })),
    listSpecialists: vi.fn(() => [{ id: 'copy', bytes: 0, revision: 'rev:v1:copy' }]),
    readSpecialist: vi.fn(() => ({ status: 'present', content: '', revision: 'rev:v1:copy' })),
    writeSpecialist: vi.fn((_id: string, _content: string, _revision: string, requestId: string) => ({
      status: 'committed',
      revision: 'rev:v1:copy-next',
      transactionId: requestId,
      receiptId: 'receipt-copy',
      requestFingerprint: `sha256:${'b'.repeat(64)}`,
    })),
    deleteSpecialist: vi.fn((_id: string, _revision: string, requestId: string) => ({
      status: 'committed',
      revision: 'rev:v1:copy-absent',
      transactionId: requestId,
      receiptId: 'receipt-delete',
      requestFingerprint: `sha256:${'c'.repeat(64)}`,
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
    expect(handlers.get('constitution:read')?.({})).toEqual({
      availability: 'available',
      value: { state: 'absent', revision: 'rev:v1:internal-absent' },
    });
    expect(handlers.get('constitution:readSpecialist')?.({}, 'copy')).toEqual({
      availability: 'available',
      value: { state: 'present', content: '', revision: 'rev:v1:copy' },
    });
    expect(handlers.get('constitution:readWithOverlay')?.({}, 'copy')).toEqual({
      availability: 'available',
      value: {
        constitution: { state: 'present', content: '', revision: 'rev:v1:main' },
        overlay: { state: 'absent', revision: 'rev:v1:internal-overlay' },
      },
    });
  });

  it('passes CAS expectations to the sole service and exposes only revision plus receipt identity', async () => {
    const owner = service();
    initConstitutionBridge(owner as never);
    const writeRequestId = '11111111-1111-4111-8111-111111111111';
    expect(handlers.get('constitution:write')?.({}, 'rules', 'rev:v1:absent', writeRequestId)).toEqual({
      availability: 'available',
      value: {
        ok: true,
        revision: 'rev:v1:next',
        receiptId: 'receipt',
        requestId: writeRequestId,
        requestFingerprint: `sha256:${'a'.repeat(64)}`,
      },
    });
    expect(owner.writeConstitution).toHaveBeenCalledWith('rules', 'rev:v1:absent', writeRequestId);

    const resetRequestId = '22222222-2222-4222-8222-222222222222';
    expect(handlers.get('constitution:reset')?.({}, 'rev:v1:main', resetRequestId)).toEqual({
      availability: 'available',
      value: {
        ok: true,
        revision: 'rev:v1:next',
        receiptId: 'receipt',
        requestId: resetRequestId,
        requestFingerprint: `sha256:${'a'.repeat(64)}`,
      },
    });
    expect(owner.writeConstitution).toHaveBeenCalledWith(DEFAULT_CONSTITUTION, 'rev:v1:main', resetRequestId);

    const specialistRequestId = '33333333-3333-4333-8333-333333333333';
    expect(
      handlers.get('constitution:writeSpecialist')?.({}, 'copy', 'overlay', 'rev:v1:copy-absent', specialistRequestId)
    ).toEqual({
      availability: 'available',
      value: {
        ok: true,
        revision: 'rev:v1:copy-next',
        receiptId: 'receipt-copy',
        requestId: specialistRequestId,
        requestFingerprint: `sha256:${'b'.repeat(64)}`,
      },
    });
    expect(owner.writeSpecialist).toHaveBeenCalledWith('copy', 'overlay', 'rev:v1:copy-absent', specialistRequestId);

    const deleteRequestId = '44444444-4444-4444-8444-444444444444';
    expect(handlers.get('constitution:deleteSpecialist')?.({}, 'copy', 'rev:v1:copy', deleteRequestId)).toEqual({
      availability: 'available',
      value: {
        ok: true,
        revision: 'rev:v1:copy-absent',
        receiptId: 'receipt-delete',
        requestId: deleteRequestId,
        requestFingerprint: `sha256:${'c'.repeat(64)}`,
      },
    });
    expect(owner.deleteSpecialist).toHaveBeenCalledWith('copy', 'rev:v1:copy', deleteRequestId);
  });

  it('rejects missing or malformed mutation identities before the service', () => {
    const owner = service();
    initConstitutionBridge(owner as never);

    expect(() => handlers.get('constitution:write')?.({}, 'rules', 'rev:v1:absent', undefined)).toThrowError(
      expect.objectContaining({ code: 'CONSTITUTION_FS_INVALID_REQUEST' })
    );
    expect(() => handlers.get('constitution:reset')?.({}, 'rev:v1:main', 'not-a-uuid')).toThrowError(
      expect.objectContaining({ code: 'CONSTITUTION_FS_INVALID_REQUEST' })
    );
    expect(() => handlers.get('constitution:writeSpecialist')?.({}, 'copy', 'overlay', 'rev:v1:copy', '')).toThrowError(
      expect.objectContaining({ code: 'CONSTITUTION_FS_INVALID_REQUEST' })
    );
    expect(() => handlers.get('constitution:deleteSpecialist')?.({}, 'copy', 'rev:v1:copy', 'bad')).toThrowError(
      expect.objectContaining({ code: 'CONSTITUTION_FS_INVALID_REQUEST' })
    );
    expect(owner.writeConstitution).not.toHaveBeenCalled();
    expect(owner.writeSpecialist).not.toHaveBeenCalled();
    expect(owner.deleteSpecialist).not.toHaveBeenCalled();
  });

  it('serializes supported authority failures instead of relying on Electron Error properties', () => {
    const owner = service();
    owner.writeConstitution.mockImplementation(() => {
      throw Object.assign(new Error('revision changed'), { code: 'CONSTITUTION_FS_CONFLICT' });
    });
    owner.readConstitution.mockImplementation(() => {
      throw Object.assign(new Error('journal authentication failed'), { code: 'CONSTITUTION_FS_MALFORMED_RESPONSE' });
    });
    initConstitutionBridge(owner as never);

    expect(
      handlers.get('constitution:write')?.({}, 'rules', 'rev:v1:stale', '55555555-5555-4555-8555-555555555555')
    ).toEqual({ availability: 'failed', code: 'CONSTITUTION_FS_CONFLICT', reason: 'revision changed' });
    expect(handlers.get('constitution:read')?.({})).toEqual({
      availability: 'failed',
      code: 'CONSTITUTION_FS_AUTHORITY_FAILURE',
      reason: 'journal authentication failed',
    });
  });

  it('registers on an unsupported packaged authority and refuses every operation without state', () => {
    const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-bridge-unsupported-'));
    const root = path.join(parent, '.wayland');
    const owner = ConstitutionFsService.createProduction('ignored-resources', {
      root,
      secretBackend: {
        encryptString: (value) => value,
        decryptString: (value) => value,
      },
      verifyPackagedBinary: () => {
        throw new ConstitutionFsBinaryError(
          'CONSTITUTION_FS_UNSAFE_PLATFORM',
          'No packaged Constitution filesystem authority exists for win32-x64.'
        );
      },
    });

    expect(() => initConstitutionBridge(owner)).not.toThrow();
    expect(handlers.get('constitution:read')?.({})).toEqual({
      availability: 'unavailable',
      code: 'CONSTITUTION_FS_UNSAFE_PLATFORM',
      reason: 'No packaged Constitution filesystem authority exists for win32-x64.',
    });
    expect(
      handlers.get('constitution:write')?.({}, 'blocked', 'rev:v1:unavailable', '55555555-5555-4555-8555-555555555555')
    ).toEqual({
      availability: 'unavailable',
      code: 'CONSTITUTION_FS_UNSAFE_PLATFORM',
      reason: 'No packaged Constitution filesystem authority exists for win32-x64.',
    });
    expect(existsSync(root)).toBe(false);
  });

  it('fails closed at the existing renderer write rate limit', async () => {
    const owner = service();
    initConstitutionBridge(owner as never);
    enforceRateLimit.mockReturnValue(false);
    expect(() => handlers.get('constitution:write')?.({}, 'rules', null)).toThrow('CONSTITUTION_RATE_LIMITED');
    expect(owner.writeConstitution).not.toHaveBeenCalled();
  });
});
