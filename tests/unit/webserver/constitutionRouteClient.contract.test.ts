import http from 'node:http';
import { createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockService } = vi.hoisted(() => ({
  mockService: {
    readConstitution: vi.fn(),
    listSpecialists: vi.fn(),
    readSpecialist: vi.fn(),
    writeConstitution: vi.fn(),
    writeSpecialist: vi.fn(),
    deleteSpecialist: vi.fn(),
  },
}));

vi.mock('@process/services/constitution/constitutionFsService', () => ({
  getConstitutionFsService: () => mockService,
}));
vi.mock('@process/webserver/middleware/security', () => ({
  apiRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock('@process/webserver/routes/configWriteGuards', () => ({
  redactSecrets: (value: string) => value,
  requireDestructive: async () => true,
  requireSecureConfigWrite: () => true,
}));
vi.mock('@process/webserver/routes/constitutionEditGrant', () => ({
  authorizeConstitutionEditGrant: () => ({ authorized: true }),
  CONSTITUTION_EDIT_GRANT_HEADER: 'x-wayland-constitution-edit-grant',
  isConstitutionEditScope: () => true,
  issueConstitutionEditGrant: () => null,
  revokeConstitutionEditGrant: () => undefined,
}));
vi.mock('@process/webserver/middleware/detectNetworkContext', () => ({
  detectNetworkContext: () => ({ reachedVia: 'direct' }),
}));
vi.mock('@process/webserver/audit/auditLog', () => ({ appendAudit: async () => true }));
vi.mock('@process/webserver/middleware/csrfClient', () => ({ getCsrfToken: () => 'contract-csrf-token' }));

import { registerConstitutionRoutes } from '@process/webserver/routes/constitutionRoutes';
import { DEFAULT_CONSTITUTION } from '@/common/constitutionDefault';
import {
  deleteConstitutionSpecialistHttp,
  listConstitutionSpecialistsHttp,
  readConstitutionHttp,
  readConstitutionSpecialistHttp,
  resetConstitutionHttp,
  writeConstitutionHttp,
  writeConstitutionSpecialistHttp,
} from '@renderer/services/ConstitutionService';

type ReadState = { status: 'absent'; revision: string } | { status: 'present'; content: string; revision: string };
type Mutation = {
  status: 'committed';
  revision: string;
  transactionId: string;
  receiptId: string;
  requestFingerprint: `sha256:${string}`;
};

const mutationFingerprint = (value: string): `sha256:${string}` =>
  `sha256:${createHash('sha256').update(value).digest('hex')}`;

function conflict(): never {
  throw Object.assign(new Error('stale revision'), { code: 'CONSTITUTION_FS_CONFLICT' });
}

function unavailableNativeAuthority(): never {
  throw Object.assign(new Error('native authority is unavailable'), {
    code: 'CONSTITUTION_FS_UNSAFE_PLATFORM',
  });
}

describe('registered Constitution routes consumed by the renderer HTTP client', () => {
  let server: http.Server;
  let baseUrl: string;
  const originalFetch = globalThis.fetch;
  let main: ReadState;
  let specialists: Map<string, ReadState>;
  let revisionSequence: number;
  let replay: Map<string, { fingerprint: string; result: Mutation }>;

  const commit = (target: string, requestId: string, fingerprint: string, revision: string): Mutation => {
    const prior = replay.get(requestId);
    if (prior) {
      if (prior.fingerprint !== fingerprint) conflict();
      return prior.result;
    }
    const result = {
      status: 'committed' as const,
      revision,
      transactionId: requestId,
      receiptId: `receipt:${target}:${revisionSequence}`,
      requestFingerprint: mutationFingerprint(fingerprint),
    };
    replay.set(requestId, { fingerprint, result });
    return result;
  };

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    registerConstitutionRoutes(app, (_req, _res, next) => next());
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    globalThis.fetch = (input, init) => originalFetch(new URL(String(input), baseUrl), init);
  });

  afterAll(async () => {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  beforeEach(() => {
    main = { status: 'absent', revision: 'rev:main:absent001' };
    specialists = new Map();
    revisionSequence = 1;
    replay = new Map();
    vi.clearAllMocks();

    mockService.readConstitution.mockImplementation(() => main);
    mockService.listSpecialists.mockImplementation(() =>
      [...specialists.entries()]
        .filter((entry): entry is [string, Extract<ReadState, { status: 'present' }>] => entry[1].status === 'present')
        .map(([id, state]) => ({ id, bytes: Buffer.byteLength(state.content), revision: state.revision }))
    );
    mockService.readSpecialist.mockImplementation(
      (id: string) => specialists.get(id) ?? { status: 'absent', revision: `rev:${id}:absent001` }
    );
    mockService.writeConstitution.mockImplementation(
      (content: string, expectedRevision: string, requestId: string): Mutation => {
        const fingerprint = JSON.stringify({ content, expectedRevision });
        const prior = replay.get(requestId);
        if (prior) return commit('main', requestId, fingerprint, prior.result.revision);
        if (main.revision !== expectedRevision) conflict();
        const revision = `rev:main:${String(++revisionSequence).padStart(8, '0')}`;
        main = { status: 'present', content, revision };
        return commit('main', requestId, fingerprint, revision);
      }
    );
    mockService.writeSpecialist.mockImplementation(
      (id: string, content: string, expectedRevision: string, requestId: string): Mutation => {
        const fingerprint = JSON.stringify({ id, content, expectedRevision });
        const prior = replay.get(requestId);
        if (prior) return commit(id, requestId, fingerprint, prior.result.revision);
        const current = specialists.get(id) ?? { status: 'absent' as const, revision: `rev:${id}:absent001` };
        if (current.revision !== expectedRevision) conflict();
        const revision = `rev:${id}:${String(++revisionSequence).padStart(8, '0')}`;
        specialists.set(id, { status: 'present', content, revision });
        return commit(id, requestId, fingerprint, revision);
      }
    );
    mockService.deleteSpecialist.mockImplementation(
      (id: string, expectedRevision: string, requestId: string): Mutation => {
        const fingerprint = JSON.stringify({ id, expectedRevision, delete: true });
        const prior = replay.get(requestId);
        if (prior) return commit(id, requestId, fingerprint, prior.result.revision);
        const current = specialists.get(id) ?? { status: 'absent' as const, revision: `rev:${id}:absent001` };
        if (current.revision !== expectedRevision) conflict();
        const revision = `rev:${id}:absent${String(++revisionSequence).padStart(3, '0')}`;
        specialists.set(id, { status: 'absent', revision });
        return commit(id, requestId, fingerprint, revision);
      }
    );
  });

  it('replays main read, CAS write, response-loss retry, and stale conflict through the real boundary', async () => {
    const absent = await readConstitutionHttp();
    expect(absent).toEqual({ state: 'absent', revision: 'rev:main:absent001' });

    const requestId = '9e32a593-8f1f-4c0e-92dd-f46ae33eeb56';
    const committed = await writeConstitutionHttp('# authoritative', absent.revision, 'opaque-grant', requestId);
    expect(committed).toMatchObject({ ok: true, revision: 'rev:main:00000002' });

    const replayed = await writeConstitutionHttp('# authoritative', absent.revision, 'opaque-grant', requestId);
    expect(replayed).toEqual(committed);
    expect(mockService.writeConstitution).toHaveBeenLastCalledWith('# authoritative', absent.revision, requestId);

    await expect(readConstitutionHttp()).resolves.toEqual({
      state: 'present',
      content: '# authoritative',
      revision: committed.ok ? committed.revision : '',
    });
    await expect(
      writeConstitutionHttp(
        '# stale overwrite',
        absent.revision,
        'opaque-grant',
        'c66b4399-c8ea-407f-9152-8befbcfa961d'
      )
    ).resolves.toMatchObject({ ok: false, reason: 'conflict', status: 409 });

    const resetRequestId = '2aac5b3b-57d8-49a0-bf71-b50a3f531a4c';
    const reset = await resetConstitutionHttp('fresh-password', committed.ok ? committed.revision : '', resetRequestId);
    expect(reset).toMatchObject({ ok: true });
    await expect(
      resetConstitutionHttp('fresh-password', committed.ok ? committed.revision : '', resetRequestId)
    ).resolves.toEqual(reset);
    await expect(readConstitutionHttp()).resolves.toMatchObject({
      state: 'present',
      content: DEFAULT_CONSTITUTION,
    });
  });

  it('replays specialist absent read, create, inventory, read, and receipt-authoritative delete', async () => {
    const absent = await readConstitutionSpecialistHttp('copy');
    expect(absent).toEqual({ state: 'absent', revision: 'rev:copy:absent001' });
    const created = await writeConstitutionSpecialistHttp(
      'copy',
      '# rules',
      absent.revision,
      'copy-grant',
      'b4d8aeb2-503a-49df-9630-350183a13610'
    );
    expect(created.ok).toBe(true);
    await expect(
      writeConstitutionSpecialistHttp(
        'copy',
        '# rules',
        absent.revision,
        'copy-grant',
        'b4d8aeb2-503a-49df-9630-350183a13610'
      )
    ).resolves.toEqual(created);
    await expect(listConstitutionSpecialistsHttp()).resolves.toEqual([
      { id: 'copy', bytes: 7, revision: created.ok ? created.revision : '' },
    ]);
    await expect(readConstitutionSpecialistHttp('copy')).resolves.toEqual({
      state: 'present',
      content: '# rules',
      revision: created.ok ? created.revision : '',
    });

    const deleted = await deleteConstitutionSpecialistHttp(
      'copy',
      'fresh-password',
      created.ok ? created.revision : '',
      '7b5ecdd5-68b5-4c6e-888e-c2c851367ca8'
    );
    expect(deleted).toMatchObject({ ok: true, revision: expect.stringContaining('absent') });
    await expect(
      deleteConstitutionSpecialistHttp(
        'copy',
        'fresh-password',
        created.ok ? created.revision : '',
        '7b5ecdd5-68b5-4c6e-888e-c2c851367ca8'
      )
    ).resolves.toEqual(deleted);
    await expect(listConstitutionSpecialistsHttp()).resolves.toEqual([]);
    await expect(readConstitutionSpecialistHttp('copy')).resolves.toEqual({
      state: 'absent',
      revision: deleted.ok ? deleted.revision : '',
    });
  });

  it('preserves typed unsafe-platform unavailability across real routes and the real hosted client', async () => {
    mockService.readConstitution.mockImplementation(unavailableNativeAuthority);
    mockService.listSpecialists.mockImplementation(unavailableNativeAuthority);
    mockService.writeConstitution.mockImplementation(unavailableNativeAuthority);

    await expect(readConstitutionHttp()).rejects.toMatchObject({
      name: 'ConstitutionReadError',
      code: 'unavailable',
      status: 503,
      message: 'The Constitution authority is unavailable on this platform.',
    });
    await expect(listConstitutionSpecialistsHttp()).rejects.toMatchObject({
      name: 'ConstitutionReadError',
      code: 'unavailable',
      status: 503,
      message: 'The Constitution authority is unavailable on this platform.',
    });
    await expect(
      writeConstitutionHttp(
        '# cannot commit',
        'rev:main:absent001',
        'opaque-grant',
        '16dd9d49-7cb9-4423-8835-005ac05c3f73'
      )
    ).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
      status: 503,
      message: 'Constitution editing is unavailable on this platform.',
    });
  });
});
