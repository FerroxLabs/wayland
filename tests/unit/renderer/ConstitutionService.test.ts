import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@process/webserver/middleware/csrfClient', () => ({
  getCsrfToken: () => 'csrf-token',
}));

import {
  decideConstitutionClassicRecoveryHttp,
  deleteConstitutionSpecialistHttp,
  getConstitutionClassicRecoveryHttp,
  listConstitutionArchivesHttp,
  listConstitutionSpecialistsHttp,
  readConstitutionHttp,
  readConstitutionSpecialistHttp,
  requestConstitutionEditGrantHttp,
  resetConstitutionHttp,
  revokeConstitutionEditGrantHttp,
  restoreConstitutionArchiveHttp,
  runDesktopConstitutionArchiveInventory,
  runDesktopConstitutionArchiveRestore,
  runDesktopConstitutionClassicRecoveryMetadata,
  runDesktopConstitutionClassicRecoveryMutation,
  runDesktopConstitutionMutation,
  runDesktopConstitutionRead,
  runDesktopConstitutionSpecialistList,
  resumeConstitutionClassicRecoveryHttp,
  writeConstitutionHttp,
  writeConstitutionSpecialistHttp,
} from '@renderer/services/ConstitutionService';

const REQUEST_ID = '19ec5caf-d10c-420c-a4e4-5b34bb8dd122';

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
      .mockResolvedValueOnce(
        response(200, { success: true, data: { state: 'absent', revision: 'rev:main:absent001' } })
      );

    await expect(readConstitutionHttp()).resolves.toEqual({
      state: 'present',
      content: '',
      revision: 'rev:main:00000001',
    });
    await expect(readConstitutionHttp()).resolves.toEqual({ state: 'absent', revision: 'rev:main:absent001' });
  });

  it('uses the shared archive DTO for hosted inventory and exact restore requests', async () => {
    const inventory = {
      success: true,
      data: { contract: 'wayland-constitution-archive-recovery-dto/1.0', archives: [] },
    } as const;
    const request = {
      operationId: '11111111-1111-4111-8111-111111111111',
      archiveId: '22222222-2222-4222-8222-222222222222',
      expectedArchiveRevision: 'rev:v1:archive',
      password: 'fresh password',
      expectedRevision: 'rev:v1:target',
    };
    const success = {
      success: true,
      data: {
        status: 'committed',
        operationId: request.operationId,
        revision: 'rev:v1:restored',
        receiptId: 'receipt:v1:restored',
      },
    } as const;
    fetchMock.mockResolvedValueOnce(response(200, inventory)).mockResolvedValueOnce(response(200, success));

    await expect(listConstitutionArchivesHttp()).resolves.toEqual(inventory);
    await expect(restoreConstitutionArchiveHttp(request)).resolves.toEqual(success);

    expect(fetchMock.mock.calls[0]).toEqual(['/api/constitution/archives', { method: 'GET', credentials: 'include' }]);
    const [path, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(path).toBe('/api/constitution/archives/restore');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', 'x-csrf-token': 'csrf-token' });
    expect(JSON.parse(init.body as string)).toEqual(request);
    expect(JSON.parse(init.body as string)).not.toHaveProperty('_csrf');
  });

  it('rejects malformed archive responses identically on hosted and Desktop transports', async () => {
    const malformed = {
      success: false,
      error: { code: 'AUTH_FAILED', message: 'No', retryable: false, operationId: null },
    };
    fetchMock.mockResolvedValueOnce(response(401, malformed));
    await expect(listConstitutionArchivesHttp()).rejects.toMatchObject({ code: 'malformed_response', status: 401 });
    await expect(runDesktopConstitutionArchiveInventory(async () => malformed)).rejects.toMatchObject({
      code: 'malformed_response',
      status: 0,
    });
    await expect(
      runDesktopConstitutionArchiveRestore(async () => ({ ...malformed, ignored: true }))
    ).rejects.toMatchObject({
      code: 'malformed_response',
      status: 0,
    });
  });

  it('uses one exact Classic recovery DTO across hosted metadata, decision, and resume', async () => {
    const item = {
      objectId: 'constitution',
      operation: 'replace' as const,
      state: 'pending' as const,
      resultRevision: null,
      receiptId: null,
      conflictCode: null,
    };
    const metadata = {
      success: true as const,
      data: {
        contract: 'wayland-constitution-classic-recovery-dto/1.0' as const,
        recoveryRevision: 'recovery:v1',
        projectionReceiptSha256: `sha256:${'a'.repeat(64)}` as const,
        promotionId: null,
        journalHeadSha256: null,
        state: 'awaiting-decision' as const,
        items: [item],
        rescue: null,
        allowedActions: ['promote', 'keep-v2', 'discard'] as const,
        discardChallenge: 'DISCARD constitution',
      },
    };
    const committedItem = {
      ...item,
      state: 'committed' as const,
      resultRevision: 'rev:v1:classic',
      receiptId: 'receipt:v1:classic',
    };
    const mutation = {
      success: true as const,
      data: {
        status: 'committed' as const,
        operationId: '11111111-1111-4111-8111-111111111111',
        recoveryRevision: 'recovery:v2',
        promotionId: '22222222-2222-4222-8222-222222222222',
        journalHeadSha256: `sha256:${'b'.repeat(64)}` as const,
        receiptId: 'classic-recovery-receipt:v1',
        items: [committedItem],
        rescue: null,
      },
    };
    const decision = {
      operationId: mutation.data.operationId,
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.data.recoveryRevision,
      password: 'fresh password',
      decision: { kind: 'promote' as const },
    };
    const resume = {
      operationId: '33333333-3333-4333-8333-333333333333',
      promotionId: mutation.data.promotionId,
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: mutation.data.recoveryRevision,
      expectedJournalHeadSha256: mutation.data.journalHeadSha256,
      password: 'fresh password',
    };
    fetchMock
      .mockResolvedValueOnce(response(200, metadata))
      .mockResolvedValueOnce(response(200, mutation))
      .mockResolvedValueOnce(response(200, mutation));

    await expect(getConstitutionClassicRecoveryHttp()).resolves.toEqual(metadata);
    await expect(decideConstitutionClassicRecoveryHttp(decision)).resolves.toEqual(mutation);
    await expect(resumeConstitutionClassicRecoveryHttp(resume)).resolves.toEqual(mutation);

    expect(fetchMock.mock.calls[0]).toEqual([
      '/api/constitution/classic-recovery',
      { method: 'GET', credentials: 'include' },
    ]);
    for (const [index, endpoint, request] of [
      [1, '/api/constitution/classic-recovery/decision', decision],
      [2, '/api/constitution/classic-recovery/resume', resume],
    ] as const) {
      const [path, init] = fetchMock.mock.calls[index] as [string, RequestInit];
      expect(path).toBe(endpoint);
      expect(init.credentials).toBe('include');
      expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', 'x-csrf-token': 'csrf-token' });
      expect(JSON.parse(init.body as string)).toEqual(request);
      expect(JSON.parse(init.body as string)).not.toHaveProperty('_csrf');
    }
  });

  it('rejects malformed Classic recovery responses on both Desktop and hosted transports', async () => {
    const malformed = {
      success: true,
      data: {
        contract: 'wayland-constitution-classic-recovery-dto/1.0',
        state: 'awaiting-decision',
      },
    };
    await expect(runDesktopConstitutionClassicRecoveryMetadata(async () => malformed)).rejects.toMatchObject({
      code: 'malformed_response',
      status: 0,
    });
    await expect(
      runDesktopConstitutionClassicRecoveryMutation(async () => ({ ...malformed, extra: true }))
    ).rejects.toMatchObject({
      code: 'malformed_response',
      status: 0,
    });
    fetchMock.mockResolvedValueOnce(response(200, malformed));
    await expect(getConstitutionClassicRecoveryHttp()).rejects.toMatchObject({
      code: 'malformed_response',
      status: 200,
    });
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

  it('classifies a non-JSON rejected read as HTTP failure, not malformed success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new Error('not json')),
    } as unknown as Response);
    await expect(readConstitutionHttp()).rejects.toMatchObject({ code: 'http_error', status: 502 });
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

  it('rejects duplicate specialist IDs and extra response fields', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: {
            items: [
              { id: 'copy', bytes: 12, revision: 'rev:copy:00000001' },
              { id: 'copy', bytes: 13, revision: 'rev:copy:00000002' },
            ],
          },
        })
      )
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: { state: 'present', content: '# Copy', revision: 'rev:copy:00000001', ignored: true },
        })
      );

    await expect(listConstitutionSpecialistsHttp()).rejects.toMatchObject({ code: 'malformed_response' });
    await expect(readConstitutionSpecialistHttp('copy')).rejects.toMatchObject({ code: 'malformed_response' });
  });

  it('exchanges a password once for a short-lived scoped grant', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, { success: true, data: { grant: 'opaque-grant', expiresAt: Date.now() + 60_000 } })
    );
    const grant = await requestConstitutionEditGrantHttp('password-once', [
      'constitution.write',
      'specialist.write:copy',
    ]);
    expect(grant).toMatchObject({ token: 'opaque-grant' });
    expect(grant?.expiresAt).toBeGreaterThan(Date.now());

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

  it('rejects truthy non-boolean grant success discriminators', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, {
        success: 'false',
        data: { grant: 'opaque-grant', expiresAt: Date.now() + 60_000 },
      })
    );
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
    await expect(
      writeConstitutionHttp('# dirty buffer', 'rev:main:00000001', 'opaque-grant', REQUEST_ID)
    ).resolves.toEqual({
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
      requestId: REQUEST_ID,
      _csrf: 'csrf-token',
    });
  });

  it('uses exact specialist grant scope at the caller and never sends a password on autosave', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, {
        success: true,
        data: {
          ok: true,
          revision: 'rev:copy:00000002',
          receiptId: 'receipt:copy:00000001',
          requestId: REQUEST_ID,
          requestFingerprint: `sha256:${'a'.repeat(64)}`,
        },
      })
    );
    await expect(
      writeConstitutionSpecialistHttp('copy', '# rules', 'rev:copy:00000001', 'copy-grant', REQUEST_ID)
    ).resolves.toEqual({
      ok: true,
      revision: 'rev:copy:00000002',
      receiptId: 'receipt:copy:00000001',
      requestId: REQUEST_ID,
      requestFingerprint: `sha256:${'a'.repeat(64)}`,
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'x-wayland-constitution-edit-grant': 'copy-grant' });
    expect(JSON.parse(init.body as string)).toEqual({
      id: 'copy',
      content: '# rules',
      expectedRevision: 'rev:copy:00000001',
      requestId: REQUEST_ID,
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

    await expect(
      writeConstitutionHttp('# one', 'rev:main:00000001', 'opaque-grant', REQUEST_ID)
    ).resolves.toMatchObject({
      ok: false,
      reason: 'request_failed',
    });
    await expect(
      writeConstitutionHttp('# two', 'rev:main:00000001', 'opaque-grant', REQUEST_ID)
    ).resolves.toMatchObject({
      ok: false,
      reason: 'request_failed',
    });
    await expect(
      writeConstitutionHttp('# three', 'rev:main:00000001', 'opaque-grant', REQUEST_ID)
    ).resolves.toMatchObject({
      ok: false,
      reason: 'request_failed',
    });
  });

  it('rejects truthy non-boolean mutation success discriminators', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, {
        success: 'false',
        data: { ok: true, revision: 'rev:main:00000002', receiptId: 'receipt:main:00000001' },
      })
    );
    await expect(writeConstitutionHttp('# dirty', 'rev:main:00000001', 'opaque-grant', REQUEST_ID)).resolves.toEqual({
      ok: false,
      reason: 'request_failed',
      status: 200,
    });
  });

  it('turns mutation transport failure into an explicit retryable result', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(writeConstitutionHttp('# dirty', 'rev:main:00000001', 'opaque-grant', REQUEST_ID)).resolves.toEqual({
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
          data: {
            ok: true,
            revision: 'rev:main:00000002',
            receiptId: 'receipt:main:00000001',
            requestId: REQUEST_ID,
            requestFingerprint: `sha256:${'a'.repeat(64)}`,
          },
        })
      )
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: {
            ok: true,
            revision: 'rev:copy:absent002',
            receiptId: 'receipt:copy:00000002',
            requestId: REQUEST_ID,
            requestFingerprint: `sha256:${'b'.repeat(64)}`,
          },
        })
      );
    await resetConstitutionHttp('reset-password', 'rev:main:00000001', REQUEST_ID);
    await deleteConstitutionSpecialistHttp('copy', 'delete-password', 'rev:copy:00000001', REQUEST_ID);

    const resetInit = fetchMock.mock.calls[0][1] as RequestInit;
    const deleteInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(resetInit.headers).not.toHaveProperty('x-wayland-constitution-edit-grant');
    expect(deleteInit.headers).not.toHaveProperty('x-wayland-constitution-edit-grant');
    expect(JSON.parse(resetInit.body as string)).toMatchObject({ password: 'reset-password', requestId: REQUEST_ID });
    expect(JSON.parse(resetInit.body as string)).toMatchObject({ expectedRevision: 'rev:main:00000001' });
    expect(JSON.parse(deleteInit.body as string)).toMatchObject({
      id: 'copy',
      password: 'delete-password',
      expectedRevision: 'rev:copy:00000001',
      requestId: REQUEST_ID,
    });
  });

  it('fails closed on malformed resolved Electron mutation receipts', async () => {
    await expect(
      runDesktopConstitutionMutation(async () => ({
        availability: 'available',
        value: {
          ok: true,
          revision: 'rev:main:00000002',
          receiptId: 'receipt:main:00000001',
          ignored: true,
        },
      }))
    ).resolves.toMatchObject({ ok: false, reason: 'request_failed' });
    await expect(
      runDesktopConstitutionMutation(async () => ({
        availability: 'available',
        value: { ok: true, revision: '', receiptId: 'receipt:main:00000001' },
      }))
    ).resolves.toMatchObject({ ok: false, reason: 'request_failed' });
    await expect(
      runDesktopConstitutionMutation(async () => ({
        availability: 'available',
        value: {
          ok: true,
          revision: 'rev:main:00000002',
          receiptId: 'receipt:main:00000001',
          requestId: REQUEST_ID,
          requestFingerprint: `sha256:${'a'.repeat(64)}`,
        },
      }))
    ).resolves.toEqual({
      ok: true,
      revision: 'rev:main:00000002',
      receiptId: 'receipt:main:00000001',
      requestId: REQUEST_ID,
      requestFingerprint: `sha256:${'a'.repeat(64)}`,
    });
  });

  it('preserves structured-clone-safe Electron conflict and rejects unknown failure envelopes', async () => {
    const clonedConflict = JSON.parse(
      JSON.stringify({ availability: 'failed', code: 'CONSTITUTION_FS_CONFLICT', reason: 'revision changed' })
    );
    await expect(runDesktopConstitutionMutation(async () => clonedConflict)).resolves.toEqual({
      ok: false,
      reason: 'conflict',
      status: 409,
      message: 'revision changed',
    });
    await expect(
      runDesktopConstitutionMutation(async () => ({
        availability: 'failed',
        code: 'CONSTITUTION_FS_NOT_ALLOWLISTED',
        reason: 'must not cross IPC',
      }))
    ).resolves.toMatchObject({ ok: false, reason: 'request_failed' });
  });

  it('runtime-validates exact Electron read and specialist inventory envelopes', async () => {
    await expect(
      runDesktopConstitutionRead(async () => ({
        availability: 'available',
        value: { state: 'present', content: '# rules', revision: 'rev:main:00000001' },
      }))
    ).resolves.toEqual({ state: 'present', content: '# rules', revision: 'rev:main:00000001' });
    await expect(
      runDesktopConstitutionRead(async () => ({
        availability: 'available',
        value: { state: 'present', content: '# rules', revision: 'rev:main:00000001', ignored: true },
      }))
    ).rejects.toMatchObject({ code: 'malformed_response' });

    await expect(
      runDesktopConstitutionSpecialistList(async () => ({
        availability: 'available',
        value: [{ id: 'copy', bytes: 12, revision: 'rev:copy:00000001' }],
      }))
    ).resolves.toEqual([{ id: 'copy', bytes: 12, revision: 'rev:copy:00000001' }]);
    await expect(
      runDesktopConstitutionSpecialistList(async () => ({
        availability: 'available',
        value: [{ id: 'copy', bytes: 12, revision: 'rev:copy:00000001', ignored: true }],
      }))
    ).rejects.toMatchObject({ code: 'malformed_response' });

    await expect(
      runDesktopConstitutionRead(async () => ({
        availability: 'unavailable',
        code: 'CONSTITUTION_FS_UNSAFE_PLATFORM',
        reason: 'No packaged helper for this platform.',
      }))
    ).rejects.toMatchObject({ code: 'unavailable' });
    await expect(
      runDesktopConstitutionMutation(async () => ({
        availability: 'unavailable',
        code: 'CONSTITUTION_FS_UNSAFE_PLATFORM',
        reason: 'No packaged helper for this platform.',
      }))
    ).resolves.toMatchObject({ ok: false, reason: 'unavailable' });
    await expect(
      runDesktopConstitutionRead(async () => ({
        availability: 'unavailable',
        code: 'CONSTITUTION_FS_UNSAFE_PLATFORM',
        reason: 'No packaged helper for this platform.',
        ignored: true,
      }))
    ).rejects.toMatchObject({ code: 'CONSTITUTION_FS_INVALID_ENVELOPE' });
  });

  it('does not trust hosted failure classifications with extra or malformed fields', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(409, {
          success: false,
          code: 'CONSTITUTION_REVISION_CONFLICT',
          msg: 'reload',
          ignored: true,
        })
      )
      .mockResolvedValueOnce(
        response(401, {
          success: 'false',
          code: 'CONSTITUTION_EDIT_AUTHORIZATION_REQUIRED',
          msg: 'unlock',
        })
      );

    await expect(writeConstitutionHttp('# one', 'rev:main:00000001', 'opaque-grant', REQUEST_ID)).resolves.toEqual({
      ok: false,
      reason: 'request_failed',
      status: 409,
    });
    await expect(writeConstitutionHttp('# two', 'rev:main:00000001', 'opaque-grant', REQUEST_ID)).resolves.toEqual({
      ok: false,
      reason: 'request_failed',
      status: 401,
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
