import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProductionConstitutionClassicRecoveryService } from '@process/services/constitution/constitutionClassicRecoveryRuntime';
import { publishClassicProjectionAuthority } from '@process/services/recovery/classicConstitutionPromotion';
import { ClassicRecoveryLocatorAuthority } from '@process/services/recovery/classicRecoveryLocator';
import {
  loadOrCreateExternalRecoveryAuthority,
  type ExternalRecoveryVaultBackend,
} from '@process/services/recovery/externalRecoveryAuthority';

const roots: string[] = [];

class TestVault implements ExternalRecoveryVaultBackend {
  readonly provider = 'test-os-vault';

  async wrap(input: { secret: Buffer; keyId: string }): Promise<{ vaultRef: string; wrappedSecret: Uint8Array }> {
    return {
      vaultRef: `test-vault:${input.keyId}`,
      wrappedSecret: Buffer.from(input.secret.map((byte) => byte ^ 0x5a)),
    };
  }

  async unwrap(input: { keyId: string; vaultRef: string; wrappedSecret: Buffer }): Promise<Uint8Array> {
    if (input.vaultRef !== `test-vault:${input.keyId}`) throw new Error('test vault identity mismatch');
    return Buffer.from(input.wrappedSecret.map((byte) => byte ^ 0x5a));
  }
}

const secretBackend = {
  encryptString: (plaintext: string) => `enc:v1:${Buffer.from(plaintext, 'utf8').toString('base64')}`,
  decryptString: (ciphertext: string) => Buffer.from(ciphertext.slice('enc:v1:'.length), 'base64').toString('utf8'),
};

function digest(value: Uint8Array | string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('production Constitution Classic recovery composition', () => {
  it('treats cold absence as non-creating and never asks for a password', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-runtime-cold-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'Wayland');
    await mkdir(userDataRoot, { mode: 0o700 });
    const verifyDesktopPassword = vi.fn(async () => true);

    await expect(
      createProductionConstitutionClassicRecoveryService({
        userDataRoot,
        constitutionFsService: {} as never,
        secretBackend,
        verifyDesktopPassword,
        externalRecoveryVault: new TestVault(),
      })
    ).resolves.toBeNull();

    expect(await readdir(userDataRoot)).toEqual([]);
    expect(verifyDesktopPassword).not.toHaveBeenCalled();
  });

  it('discovers the authenticated external locator after restart without accepting a caller path', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-runtime-active-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'Wayland');
    const classicRoot = path.join(root, 'classic');
    const classicWaylandRoot = path.join(classicRoot, 'classic-home', '.wayland');
    const classicFile = path.join(classicWaylandRoot, 'CONSTITUTION.md');
    await mkdir(userDataRoot, { mode: 0o700 });
    await mkdir(classicWaylandRoot, { recursive: true, mode: 0o700 });
    const baseline = Buffer.from('# baseline\n');
    await writeFile(classicFile, baseline, { mode: 0o600 });
    const vault = new TestVault();
    const authority = await loadOrCreateExternalRecoveryAuthority({
      userDataRoot,
      vault,
      existingRecordDigests: async () => [],
    });
    authority.activeSecret.fill(0);
    const locator = new ClassicRecoveryLocatorAuthority({
      liveUserDataRoot: userDataRoot,
      authorityUserDataRoot: userDataRoot,
      vault,
    });
    const layout = await locator.ensureWritableLayout();
    const codec = await locator.createRecordCodec('production-runtime-proof');
    const projection = await publishClassicProjectionAuthority({
      recoveryAuthorityParent: layout.recordsRoot,
      preparationId: 'production-runtime-proof',
      classicRoot,
      sourceAppVersion: '0.11.18',
      candidateAppVersion: '0.12.0',
      producerCommit: 'producer-proof',
      candidateCommit: 'candidate-proof',
      sourceSnapshotDigest: digest('snapshot-proof'),
      sourceRevisionAuthorityEnvelopeSha256: null,
      sourceRevisionAuthorityEnvelope: null,
      projectedFiles: [
        {
          restorePath: 'constitution/files/CONSTITUTION.md',
          classicPath: 'classic-home/.wayland/CONSTITUTION.md',
          size: baseline.length,
          sha256: digest(baseline),
          contentBase64: baseline.toString('base64'),
        },
      ],
      createdAt: '2026-07-17T16:00:00.000Z',
      authentication: 'os-vault',
      codec,
    });
    await locator.activate({
      eventId: '11111111-1111-4111-8111-111111111111',
      preparationId: 'production-runtime-proof',
      projectionAuthoritySha256: projection.authorityEnvelopeSha256,
    });
    await writeFile(classicFile, '# Classic edit\n', { mode: 0o600 });

    const service = await createProductionConstitutionClassicRecoveryService({
      userDataRoot,
      constitutionFsService: {} as never,
      secretBackend,
      verifyDesktopPassword: async () => true,
      externalRecoveryVault: vault,
    });
    expect(service).not.toBeNull();
    const result = await service!.metadata({
      kind: 'desktop-installation',
      installationId: '22222222-2222-4222-8222-222222222222',
    });
    expect(result.data).toMatchObject({
      state: 'awaiting-decision',
      projectionReceiptSha256: projection.authorityEnvelopeSha256,
      allowedActions: ['promote', 'keep-v2', 'discard'],
    });
    expect(JSON.stringify(result)).not.toContain(classicRoot);
    expect(JSON.stringify(result)).not.toContain(userDataRoot);
  });
});
