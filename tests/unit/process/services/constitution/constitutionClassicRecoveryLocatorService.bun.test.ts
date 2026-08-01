/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { ConstitutionClassicRecoveryOperationAuthority } from '@process/services/constitution/constitutionClassicRecoveryAuthority';
import { ConstitutionClassicRecoveryService } from '@process/services/constitution/constitutionClassicRecoveryService';
import { createHostedRestorePrincipalBinding } from '@process/services/constitution/constitutionArchiveRestoreAuthority';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';
import type {
  ConstitutionMutationResult,
  ConstitutionReadResult,
} from '@process/services/constitution/constitutionFsService';
import {
  inspectClassicConstitutionRecovery,
  publishClassicProjectionAuthority,
} from '@process/services/recovery/classicConstitutionPromotion';
import { ClassicRecoveryLocatorAuthority } from '@process/services/recovery/classicRecoveryLocator';
import {
  loadOrCreateExternalRecoveryAuthority,
  type ExternalRecoveryVaultBackend,
} from '@process/services/recovery/externalRecoveryAuthority';

const roots: string[] = [];
const principal = createHostedRestorePrincipalBinding('production', 'locator-user');
const PREPARATION_ID = 'restart-service-proof';
const ACTIVATION_ID = '11111111-1111-4111-8111-111111111111';
const PROMOTION_ID = '22222222-2222-4222-8222-222222222222';
const OPERATION_ID = '33333333-3333-4333-8333-333333333333';
const CREATED_AT = new Date('2026-07-17T15:00:00.000Z');
const FIXED_SECRET = Buffer.from(Array.from({ length: 32 }, (_, index) => 0xa0 - index));

class TestVault implements ExternalRecoveryVaultBackend {
  readonly provider = 'test-os-vault';

  async wrap(input: { secret: Buffer; keyId: string }): Promise<{ vaultRef: string; wrappedSecret: Uint8Array }> {
    return {
      vaultRef: `test-vault:${input.keyId}`,
      wrappedSecret: Buffer.from(input.secret.map((byte) => byte ^ 0x4d)),
    };
  }

  async unwrap(input: { keyId: string; vaultRef: string; wrappedSecret: Buffer }): Promise<Uint8Array> {
    if (input.vaultRef !== `test-vault:${input.keyId}`) throw new Error('test vault identity mismatch');
    return Buffer.from(input.wrappedSecret.map((byte) => byte ^ 0x4d));
  }
}

const operationBackend: ConstitutionArchiveSecretBackend = {
  encryptString: (plaintext) => `enc:v1:${Buffer.from(plaintext, 'utf8').toString('base64')}`,
  decryptString: (ciphertext) => Buffer.from(ciphertext.slice('enc:v1:'.length), 'base64').toString('utf8'),
};

function digest(bytes: Uint8Array | string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function absentRead(id: string): ConstitutionReadResult {
  return { status: 'absent', revision: `absent:${id}` as never };
}

function promotionService(): {
  readConstitution(): ConstitutionReadResult;
  writeConstitution(content: string, expectedRevision: string, requestId: string): ConstitutionMutationResult;
  deleteConstitution(expectedRevision: string, requestId: string): ConstitutionMutationResult;
  readSpecialist(id: string): ConstitutionReadResult;
  writeSpecialist(id: string, content: string, expectedRevision: string, requestId: string): ConstitutionMutationResult;
  deleteSpecialist(id: string, expectedRevision: string, requestId: string): ConstitutionMutationResult;
  content(): string | null;
} {
  let current: { content: string; revision: string } | null = { content: '# baseline\n', revision: 'rev:1' };
  const receipts = new Map<string, ConstitutionMutationResult>();
  const mutate = (content: string | null, expectedRevision: string, requestId: string): ConstitutionMutationResult => {
    const replay = receipts.get(requestId);
    if (replay) return replay;
    const currentRevision = current?.revision ?? 'rev:absent';
    if (expectedRevision !== currentRevision) throw Object.assign(new Error('CAS conflict'), { code: 'CONFLICT' });
    current = content === null ? null : { content, revision: 'rev:2' };
    const result: ConstitutionMutationResult = {
      status: 'committed',
      revision: (current?.revision ?? 'rev:deleted') as never,
      transactionId: requestId,
      receiptId: `${requestId}.jsonl`,
      requestFingerprint: digest(`${requestId}:${content ?? '<deleted>'}`),
    };
    receipts.set(requestId, result);
    return result;
  };
  return {
    readConstitution: () =>
      current
        ? { status: 'present', content: current.content, revision: current.revision as never }
        : absentRead('constitution'),
    writeConstitution: mutate,
    deleteConstitution: (expectedRevision, requestId) => mutate(null, expectedRevision, requestId),
    readSpecialist: absentRead,
    writeSpecialist: (id, _content, expectedRevision) => {
      throw Object.assign(new Error(`unexpected specialist write: ${id}:${expectedRevision}`), { code: 'CONFLICT' });
    },
    deleteSpecialist: (id, expectedRevision) => {
      throw Object.assign(new Error(`unexpected specialist delete: ${id}:${expectedRevision}`), { code: 'CONFLICT' });
    },
    content: () => current?.content ?? null,
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Constitution Classic recovery locator service', () => {
  it('discovers after restart, commits once, seals terminal evidence, and replays after another restart', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'wayland-locator-service-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'Wayland');
    const classicRoot = path.join(root, 'classic');
    const classicWaylandRoot = path.join(classicRoot, 'classic-home', '.wayland');
    const classicFile = path.join(classicWaylandRoot, 'CONSTITUTION.md');
    await mkdir(userDataRoot, { mode: 0o700 });
    await mkdir(classicWaylandRoot, { recursive: true, mode: 0o700 });
    await writeFile(classicFile, '# baseline\n', { mode: 0o600 });
    const vault = new TestVault();
    const externalAuthority = await loadOrCreateExternalRecoveryAuthority({
      userDataRoot,
      vault,
      existingRecordDigests: async () => [],
      dependencies: { now: () => CREATED_AT, randomSecret: () => Buffer.from(FIXED_SECRET) },
    });
    externalAuthority.activeSecret.fill(0);
    const locator = new ClassicRecoveryLocatorAuthority({
      liveUserDataRoot: userDataRoot,
      authorityUserDataRoot: userDataRoot,
      vault,
      now: () => CREATED_AT,
    });
    const layout = await locator.ensureWritableLayout();
    const codec = await locator.createRecordCodec(PREPARATION_ID);
    const baseline = Buffer.from('# baseline\n');
    const projection = await publishClassicProjectionAuthority({
      recoveryAuthorityParent: layout.recordsRoot,
      preparationId: PREPARATION_ID,
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
      createdAt: CREATED_AT.toISOString(),
      authentication: 'os-vault',
      codec,
    });
    await locator.activate({
      eventId: ACTIVATION_ID,
      preparationId: PREPARATION_ID,
      projectionAuthoritySha256: projection.authorityEnvelopeSha256,
    });
    await writeFile(classicFile, '# classic edit\n', { mode: 0o600 });
    const destination = promotionService();
    const operationAuthority = new ConstitutionClassicRecoveryOperationAuthority(
      path.join(root, 'operation-authority.enc'),
      operationBackend,
      { now: () => CREATED_AT }
    );
    const dependencies = {
      locatorAuthority: locator,
      destinationAuthority: 'profile:default',
      promotionService: destination,
      operationAuthority,
      authorizeDestructivePassword: async (_binding: typeof principal, password: string) => {
        if (password !== 'correct') throw Object.assign(new Error('wrong password'), { code: 'AUTH_FAILED' });
      },
      acquireQuiescence: async () => async () => undefined,
      createId: () => PROMOTION_ID,
    };

    const restartCodec = await locator.createRecordCodec(PREPARATION_ID);
    const directInspection = await inspectClassicConstitutionRecovery({
      authorityEnvelopePath: projection.authorityEnvelopePath,
      codec: restartCodec,
    });
    expect(directInspection).toMatchObject({ projectionAuthoritySha256: projection.authorityEnvelopeSha256 });

    const restarted = await ConstitutionClassicRecoveryService.fromLocator(dependencies);
    expect(restarted).not.toBeNull();
    const metadata = await restarted!.metadata(principal);
    expect(metadata.data).toMatchObject({
      state: 'awaiting-decision',
      allowedActions: ['promote', 'keep-v2', 'discard'],
    });
    const request = {
      operationId: OPERATION_ID,
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.data.recoveryRevision,
      password: 'correct',
      decision: { kind: 'promote' as const },
    };
    const committed = await restarted!.decide(principal, request);
    expect(committed.data.status).toBe('committed');
    expect(destination.content()).toBe('# classic edit\n');
    const terminal = await locator.snapshot();
    expect(terminal.active).toBeNull();
    expect(terminal.events.at(-1)).toMatchObject({
      eventId: OPERATION_ID,
      kind: 'terminal',
      terminalState: 'committed',
      operationReceiptId: committed.data.receiptId,
    });

    const afterTerminalRestart = await ConstitutionClassicRecoveryService.fromLocator(dependencies);
    expect(afterTerminalRestart).not.toBeNull();
    await expect(afterTerminalRestart!.decide(principal, request)).resolves.toEqual(committed);
    expect((await locator.snapshot()).events).toHaveLength(2);
  });
});
