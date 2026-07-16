import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@process/webserver/middleware/csrfClient', () => ({
  getCsrfToken: () => 'csrf-token',
}));

import {
  deleteConstitutionSpecialistHttp,
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
      response(401, {
        success: false,
        code: 'CONSTITUTION_EDIT_AUTHORIZATION_REQUIRED',
        msg: 'unlock',
      })
    );
    await expect(writeConstitutionHttp('# dirty buffer', 'opaque-grant')).resolves.toEqual({
      ok: false,
      reason: 'authorization_required',
      status: 401,
      message: 'unlock',
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      'x-csrf-token': 'csrf-token',
      'x-wayland-constitution-edit-grant': 'opaque-grant',
    });
    expect(JSON.parse(init.body as string)).toEqual({ content: '# dirty buffer', _csrf: 'csrf-token' });
  });

  it('uses exact specialist grant scope at the caller and never sends a password on autosave', async () => {
    fetchMock.mockResolvedValueOnce(response(200, { success: true, data: { ok: true } }));
    await expect(writeConstitutionSpecialistHttp('copy', '# rules', 'copy-grant')).resolves.toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'x-wayland-constitution-edit-grant': 'copy-grant' });
    expect(JSON.parse(init.body as string)).toEqual({ id: 'copy', content: '# rules', _csrf: 'csrf-token' });
  });

  it('keeps reset and delete on fresh password authority rather than the edit-grant header', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, { success: true, data: { ok: true } }))
      .mockResolvedValueOnce(response(200, { success: true, data: { ok: true } }));
    await resetConstitutionHttp('reset-password');
    await deleteConstitutionSpecialistHttp('copy', 'delete-password');

    const resetInit = fetchMock.mock.calls[0][1] as RequestInit;
    const deleteInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(resetInit.headers).not.toHaveProperty('x-wayland-constitution-edit-grant');
    expect(deleteInit.headers).not.toHaveProperty('x-wayland-constitution-edit-grant');
    expect(JSON.parse(resetInit.body as string)).toMatchObject({ password: 'reset-password' });
    expect(JSON.parse(deleteInit.body as string)).toMatchObject({ id: 'copy', password: 'delete-password' });
  });

  it('revokes with the opaque header and no token in the request body', async () => {
    fetchMock.mockResolvedValueOnce(response(200, { success: true, data: { ok: true } }));
    await revokeConstitutionEditGrantHttp('opaque-grant');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'x-wayland-constitution-edit-grant': 'opaque-grant' });
    expect(JSON.parse(init.body as string)).toEqual({ _csrf: 'csrf-token' });
  });
});
