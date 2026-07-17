import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({ service: null as unknown }));

vi.mock('@process/services/constitution/constitutionFsService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/services/constitution/constitutionFsService')>();
  return { ...actual, getConstitutionFsService: () => holder.service };
});
vi.mock('@process/bridge/constitutionBridge', () => ({ DEFAULT_CONSTITUTION: '# Default Constitution\n' }));
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
vi.mock('@process/webserver/middleware/csrfClient', () => ({ getCsrfToken: () => 'native-contract-csrf' }));

import {
  createTestOnlyConstitutionFsBinaryAuthority,
  verifyConstitutionFsBinary,
} from '@process/services/constitution/constitutionFsBinary';
import { ConstitutionFsService } from '@process/services/constitution/constitutionFsService';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';
import { registerConstitutionRoutes } from '@process/webserver/routes/constitutionRoutes';
import {
  readConstitutionHttp,
  writeConstitutionHttp,
  writeConstitutionSpecialistHttp,
} from '@renderer/services/ConstitutionService';

let cachedBinary: ReturnType<typeof verifyConstitutionFsBinary> | undefined;

function realBinary(): ReturnType<typeof verifyConstitutionFsBinary> {
  if (cachedBinary) return cachedBinary;
  const manifest = path.join(process.cwd(), 'native', 'constitution-fs', 'Cargo.toml');
  execFileSync('cargo', ['build', '--locked', '--manifest-path', manifest], { stdio: 'pipe' });
  const built = path.join(process.cwd(), 'native', 'constitution-fs', 'target', 'debug', 'wayland-constitution-fs');
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-native-route-binary-'));
  const binaryPath = path.join(installRoot, 'wayland-constitution-fs');
  const manifestPath = path.join(installRoot, 'manifest.json');
  copyFileSync(built, binaryPath);
  chmodSync(binaryPath, 0o700);
  const bytes = readFileSync(binaryPath);
  const sha256 = `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
  writeFileSync(
    manifestPath,
    JSON.stringify({
      schemaVersion: 1,
      protocolVersion: 2,
      platform: process.platform,
      arch: process.arch,
      binary: { fileName: 'wayland-constitution-fs', sha256, size: bytes.byteLength },
    })
  );
  cachedBinary = verifyConstitutionFsBinary({
    binaryPath,
    manifestPath,
    authority: createTestOnlyConstitutionFsBinaryAuthority({
      sha256,
      size: bytes.byteLength,
      platform: process.platform,
      arch: process.arch,
      fileName: 'wayland-constitution-fs',
      installRoot,
      packaged: false,
    }),
  });
  return cachedBinary;
}

const secretBackend: ConstitutionArchiveSecretBackend = {
  encryptString: (plaintext) => `fenc:v1:${Buffer.from(plaintext).toString('base64')}`,
  decryptString: (ciphertext) => Buffer.from(ciphertext.slice('fenc:v1:'.length), 'base64').toString('utf8'),
};

describe.runIf(process.platform === 'darwin' || process.platform === 'linux')(
  'real native Constitution service through Express and hosted fetch client',
  () => {
    let server: http.Server;
    let baseUrl: string;
    const originalFetch = globalThis.fetch;

    beforeAll(async () => {
      const app = express();
      app.use(express.json());
      const restartableService = new Proxy({} as ConstitutionFsService, {
        get: (_target, property) => {
          const active = holder.service as ConstitutionFsService;
          const value = active[property as keyof ConstitutionFsService];
          return typeof value === 'function' ? value.bind(active) : value;
        },
      });
      registerConstitutionRoutes(app, (_req, _res, next) => next(), restartableService);
      server = http.createServer(app);
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      globalThis.fetch = (input, init) => originalFetch(new URL(String(input), baseUrl), init);
    });

    afterAll(async () => {
      globalThis.fetch = originalFetch;
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    });

    it('preserves exact committed replay and conflict behavior after a service restart', async () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-native-route-'));
      const root = path.join(parent, '.wayland');
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      holder.service = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);

      const absent = await readConstitutionHttp();
      expect(absent.state).toBe('absent');
      const requestId = '15151515-1515-4515-8515-151515151515';
      const committed = await writeConstitutionHttp('# native', absent.revision, 'grant', requestId);
      expect(committed).toMatchObject({ ok: true, requestId });

      holder.service = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      await expect(writeConstitutionHttp('# native', absent.revision, 'grant', requestId)).resolves.toEqual(committed);
      await expect(readConstitutionHttp()).resolves.toMatchObject({ state: 'present', content: '# native' });
      await expect(
        writeConstitutionHttp('# stale', absent.revision, 'grant', '16161616-1616-4616-8616-161616161616')
      ).resolves.toMatchObject({ ok: false, reason: 'conflict', status: 409 });

      const specialist = (holder.service as ConstitutionFsService).readSpecialist('copy');
      const created = await writeConstitutionSpecialistHttp(
        'copy',
        '# native overlay',
        specialist.revision,
        'grant',
        '17171717-1717-4717-8717-171717171717'
      );
      expect(created).toMatchObject({ ok: true });
      holder.service = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      await expect(
        writeConstitutionSpecialistHttp(
          'copy',
          '# native overlay',
          specialist.revision,
          'grant',
          '17171717-1717-4717-8717-171717171717'
        )
      ).resolves.toEqual(created);
    }, 45_000);
  }
);
