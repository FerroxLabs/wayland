import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@process/webserver/middleware/csrfClient', () => ({
  getCsrfToken: () => 'csrf-token',
}));

import {
  deleteConstitutionSpecialistHttp,
  listConstitutionSpecialistsHttp,
  readConstitutionHttp,
  readConstitutionSpecialistHttp,
  requestConstitutionEditGrantHttp,
  resetConstitutionHttp,
  revokeConstitutionEditGrantHttp,
  writeConstitutionHttp,
  writeConstitutionSpecialistHttp,
} from '@renderer/services/ConstitutionService';

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('hosted Constitution service', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('preserves present-empty and absent as different read states', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, { success: true, data: { state: 'present', content: '', revision: 'rev:main:00000001' } })
      )
      .mockResolvedValueOnce(response(200, { success: true, data: { state: 'absent', revision: null } }));

    await expect(readConstitutionHttp()).resolves.toEqual({
      state: 'present',
      content: '',
      revision: 'rev:main:00000001',
    });
    await expect(readConstitutionHttp()).resolves.toEqual({ state: 'absent', revision: null });
  });

  it.each([401, 403, 429, 500])('keeps HTTP %i as an error instead of an empty document', async (status) => {
    fetchMock.mockResolvedValueOnce(response(status, { success: false, msg: 'must not become content' }));
    await expect(readConstitutionHttp()).rejects.toMatchObject({ code: 'http_error', status });
  });

  it('keeps network and malformed response failures explicit', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(readConstitutionHttp()).rejects.toMatchObject({ code: 'network_error', status: 0 });

    fetchMock.mockResolvedValueOnce(response(200, { success: true, data: { content: '' } }));
    await expect(readConstitutionHttp()).rejects.toMatchObject({ code: 'malformed_response' });
  });

  it('validates hosted specialist inventory and single-item read truth', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: { items: [{ id: 'copy', bytes: 12, revision: 'rev:copy:00000001' }] },
        })
      )
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: { state: 'present', content: '# Copy', revision: 'rev:copy:00000001' },
        })
      );

    await expect(listConstitutionSpecialistsHttp()).resolves.toEqual([
      { id: 'copy', bytes: 12, revision: 'rev:copy:00000001' },
    ]);
    await expect(readConstitutionSpecialistHttp('copy')).resolves.toEqual({
      state: 'present',
      content: '# Copy',
      revision: 'rev:copy:00000001',
    });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/constitution/specialist?id=copy');
  });

  it('exchanges a password once for a short-lived scoped grant', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, { success: true, data: { grant: 'opaque-grant', expiresAt: 123_456 } })
    );
    await expect(
      requestConstitutionEditGrantHttp('password-once', ['constitution.write', 'specialist.write:copy'])
    ).resolves.toEqual({ token: 'opaque-grant', expiresAt: 123_456 });

    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe('/api/constitution/edit-grant');
    expect(init.credentials).toBe('include');
    expect(init.headers).not.toHaveProperty('x-wayland-constitution-edit-grant');
    expect(JSON.parse(init.body as string)).toEqual({
      password: 'password-once',
      scopes: ['constitution.write', 'specialist.write:copy'],
      _csrf: 'csrf-token',
    });
  });

  it('converts an authorization-network failure into a retryable null result', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(requestConstitutionEditGrantHttp('password-once', ['constitution.write'])).resolves.toBeNull();
  });

  it('sends only the opaque grant for autosave and preserves authorization-required truth', async () => {
    fetchMock.mockResolvedValueOnce(
      response(409, {
        success: false,
        code: 'CONSTITUTION_REVISION_CONFLICT',
        msg: 'reload',
      })
    );
    await expect(writeConstitutionHttp('# dirty buffer', 'rev:main:00000001', 'opaque-grant')).resolves.toEqual({
      ok: false,
      reason: 'conflict',
      status: 409,
      message: 'reload',
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      'x-csrf-token': 'csrf-token',
      'x-wayland-constitution-edit-grant': 'opaque-grant',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      content: '# dirty buffer',
      expectedRevision: 'rev:main:00000001',
      _csrf: 'csrf-token',
    });
  });

  it('uses exact specialist grant scope at the caller and never sends a password on autosave', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, {
        success: true,
        data: { ok: true, revision: 'rev:copy:00000002', receiptId: 'receipt:copy:00000001' },
      })
    );
    await expect(
      writeConstitutionSpecialistHttp('copy', '# rules', 'rev:copy:00000001', 'copy-grant')
    ).resolves.toEqual({
      ok: true,
      revision: 'rev:copy:00000002',
      receiptId: 'receipt:copy:00000001',
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'x-wayland-constitution-edit-grant': 'copy-grant' });
    expect(JSON.parse(init.body as string)).toEqual({
      id: 'copy',
      content: '# rules',
      expectedRevision: 'rev:copy:00000001',
      _csrf: 'csrf-token',
    });
  });

  it('rejects false success, missing receipts, and the wrong post-state revision', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: { ok: false, revision: 'rev:main:00000002', receiptId: 'receipt:main:00000001' },
        })
      )
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: { ok: true, revision: 'rev:main:00000002' },
        })
      )
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: { ok: true, revision: null, receiptId: 'receipt:main:00000002' },
        })
      );

    await expect(writeConstitutionHttp('# one', 'rev:main:00000001', 'opaque-grant')).resolves.toMatchObject({
      ok: false,
      reason: 'request_failed',
    });
    await expect(writeConstitutionHttp('# two', 'rev:main:00000001', 'opaque-grant')).resolves.toMatchObject({
      ok: false,
      reason: 'request_failed',
    });
    await expect(writeConstitutionHttp('# three', 'rev:main:00000001', 'opaque-grant')).resolves.toMatchObject({
      ok: false,
      reason: 'request_failed',
    });
  });

  it('turns mutation transport failure into an explicit retryable result', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(writeConstitutionHttp('# dirty', 'rev:main:00000001', 'opaque-grant')).resolves.toEqual({
      ok: false,
      reason: 'request_failed',
      status: 0,
    });
  });

  it('keeps reset and delete on fresh password authority rather than the edit-grant header', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: { ok: true, revision: 'rev:main:00000002', receiptId: 'receipt:main:00000001' },
        })
      )
      .mockResolvedValueOnce(
        response(200, { success: true, data: { ok: true, revision: null, receiptId: 'receipt:copy:00000002' } })
      );
    await resetConstitutionHttp('reset-password', 'rev:main:00000001');
    await deleteConstitutionSpecialistHttp('copy', 'delete-password', 'rev:copy:00000001');

    const resetInit = fetchMock.mock.calls[0][1] as RequestInit;
    const deleteInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(resetInit.headers).not.toHaveProperty('x-wayland-constitution-edit-grant');
    expect(deleteInit.headers).not.toHaveProperty('x-wayland-constitution-edit-grant');
    expect(JSON.parse(resetInit.body as string)).toMatchObject({ password: 'reset-password' });
    expect(JSON.parse(resetInit.body as string)).toMatchObject({ expectedRevision: 'rev:main:00000001' });
    expect(JSON.parse(deleteInit.body as string)).toMatchObject({
      id: 'copy',
      password: 'delete-password',
      expectedRevision: 'rev:copy:00000001',
    });
  });

  it('revokes with the opaque header and no token in the request body', async () => {
    fetchMock.mockResolvedValueOnce(response(200, { success: true, data: { ok: true } }));
    await revokeConstitutionEditGrantHttp('opaque-grant');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'x-wayland-constitution-edit-grant': 'opaque-grant' });
    expect(JSON.parse(init.body as string)).toEqual({ _csrf: 'csrf-token' });
  });
});
