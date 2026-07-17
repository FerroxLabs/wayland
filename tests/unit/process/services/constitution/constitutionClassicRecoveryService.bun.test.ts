import { afterEach, describe, expect, it } from 'bun:test';
import { createHash, createHmac } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, mkdir, mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ConstitutionClassicRecoveryOperationAuthority } from '@process/services/constitution/constitutionClassicRecoveryAuthority';
import { ConstitutionClassicRecoveryService } from '@process/services/constitution/constitutionClassicRecoveryService';
import { createHostedRestorePrincipalBinding } from '@process/services/constitution/constitutionArchiveRestoreAuthority';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';
import {
  publishClassicProjectionAuthority,
  type ClassicAuthorityEnvelopeCodec,
  type ClassicConstitutionPromotionService,
} from '@process/services/recovery/classicConstitutionPromotion';
import type {
  ClassicRecoveryLocatorAuthority,
  ClassicRecoveryLocatorEvent,
} from '@process/services/recovery/classicRecoveryLocator';
import type {
  ConstitutionMutationResult,
  ConstitutionReadResult,
} from '@process/services/constitution/constitutionFsService';

const roots: string[] = [];
const vaultKey = Buffer.from('classic-recovery-service-test-key');
const principal = createHostedRestorePrincipalBinding('production', 'user-42');

function digest(value: Buffer | string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

const codec: ClassicAuthorityEnvelopeCodec = {
  securityClass: 'test-only',
  async sealFile(sourcePath, destinationPath) {
    const plaintext = await readFile(sourcePath);
    const envelope = JSON.stringify({
      plaintext: plaintext.toString('base64'),
      mac: createHmac('sha256', vaultKey).update(plaintext).digest('hex'),
    });
    const handle = await open(destinationPath, 'wx', 0o600);
    try {
      await handle.writeFile(envelope);
      await handle.sync();
    } finally {
      await handle.close();
    }
  },
  async unsealFile(sourcePath, destinationPath) {
    const envelope = JSON.parse(await readFile(sourcePath, 'utf8')) as { plaintext: string; mac: string };
    const plaintext = Buffer.from(envelope.plaintext, 'base64');
    if (createHmac('sha256', vaultKey).update(plaintext).digest('hex') !== envelope.mac) {
      throw new Error('test vault authentication failed');
    }
    await copyFile(sourcePath, `${destinationPath}.envelope`, constants.COPYFILE_EXCL);
    const handle = await open(destinationPath, 'wx', 0o600);
    try {
      await handle.writeFile(plaintext);
      await handle.sync();
    } finally {
      await handle.close();
    }
  },
};

const backend: ConstitutionArchiveSecretBackend = {
  encryptString: (plaintext) => `fenc:v1:${Buffer.from(plaintext, 'utf8').toString('base64')}`,
  decryptString: (ciphertext) => Buffer.from(ciphertext.slice('fenc:v1:'.length), 'base64').toString('utf8'),
};

function fakePromotionService(): ClassicConstitutionPromotionService & {
  calls: string[];
  content: (objectId?: string) => string | null;
  failOnce: (objectId: string) => void;
} {
  const state = new Map<string, { content: string; revision: string } | null>([
    ['constitution:CONSTITUTION.md', { content: '# baseline\n', revision: 'rev:1' }],
    ['specialist:research', { content: '# research\n', revision: 'rev:2' }],
  ]);
  let revisionSequence = 2;
  const receipts = new Map<string, ConstitutionMutationResult>();
  const failOnce = new Set<string>();
  const calls: string[] = [];
  const read = (objectId: string): ConstitutionReadResult => {
    const value = state.get(objectId) ?? null;
    return value
      ? { status: 'present', content: value.content, revision: value.revision as never }
      : { status: 'absent', revision: `rev:absent:${objectId}` as never };
  };
  const write = (
    objectId: string,
    next: string | null,
    expectedRevision: string,
    requestId: string
  ): ConstitutionMutationResult => {
    const replay = receipts.get(requestId);
    if (replay) return replay;
    if (failOnce.delete(objectId)) {
      throw Object.assign(new Error(`injected conflict for ${objectId}`), {
        code: 'CONSTITUTION_FS_CONFLICT',
      });
    }
    if (expectedRevision !== read(objectId).revision) {
      throw Object.assign(new Error('CAS conflict'), { code: 'CONSTITUTION_FS_CONFLICT' });
    }
    const revision = `rev:${++revisionSequence}`;
    state.set(objectId, next === null ? null : { content: next, revision });
    const result: ConstitutionMutationResult = {
      status: 'committed',
      revision: revision as never,
      transactionId: requestId,
      receiptId: `${requestId}.jsonl`,
      requestFingerprint: digest(`${objectId}:${requestId}:${next ?? '<deleted>'}:${expectedRevision}`),
    };
    receipts.set(requestId, result);
    calls.push(`${objectId}:${requestId}`);
    return result;
  };
  return {
    readConstitution: () => read('constitution:CONSTITUTION.md'),
    writeConstitution: (next, expectedRevision, requestId) =>
      write('constitution:CONSTITUTION.md', next, expectedRevision, requestId),
    deleteConstitution: (expectedRevision, requestId) =>
      write('constitution:CONSTITUTION.md', null, expectedRevision, requestId),
    readSpecialist: (id) => read(`specialist:${id}`),
    writeSpecialist: (id, next, expectedRevision, requestId) =>
      write(`specialist:${id}`, next, expectedRevision, requestId),
    deleteSpecialist: (id, expectedRevision, requestId) => write(`specialist:${id}`, null, expectedRevision, requestId),
    calls,
    content: (objectId = 'constitution:CONSTITUTION.md') => state.get(objectId)?.content ?? null,
    failOnce: (objectId) => failOnce.add(objectId),
  };
}

async function setup(
  options: {
    afterOperationInvocation?: () => void;
    locatorBinding?: Readonly<{
      authority: ClassicRecoveryLocatorAuthority;
      activation: ClassicRecoveryLocatorEvent;
    }>;
  } = {}
): Promise<{
  service: ConstitutionClassicRecoveryService;
  promotionService: ReturnType<typeof fakePromotionService>;
  classicFile: string;
  classicWaylandRoot: string;
  authorityEnvelopePath: string;
  authorizationCalls: () => number;
}> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'classic-recovery-service-'));
  roots.push(root);
  const classicRoot = path.join(root, 'classic');
  const classicWaylandRoot = path.join(classicRoot, 'classic-home', '.wayland');
  const specialistRoot = path.join(classicWaylandRoot, 'specialists');
  await mkdir(specialistRoot, { recursive: true });
  const baseline = Buffer.from('# baseline\n');
  const research = Buffer.from('# research\n');
  const classicFile = path.join(classicWaylandRoot, 'CONSTITUTION.md');
  await writeFile(classicFile, baseline);
  await writeFile(path.join(specialistRoot, 'research.md'), research);
  const authority = await publishClassicProjectionAuthority({
    recoveryAuthorityParent: path.join(root, 'recovery'),
    preparationId: '11111111-1111-4111-8111-111111111111',
    classicRoot,
    sourceAppVersion: '0.11.18',
    candidateAppVersion: '0.12.0',
    producerCommit: 'producer',
    candidateCommit: 'candidate',
    sourceSnapshotDigest: digest('snapshot'),
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
      {
        restorePath: 'constitution/files/specialists/research.md',
        classicPath: 'classic-home/.wayland/specialists/research.md',
        size: research.length,
        sha256: digest(research),
        contentBase64: research.toString('base64'),
      },
    ],
    createdAt: '2026-07-17T00:00:00.000Z',
    authentication: 'test-only',
    codec,
  });
  const operationAuthority = new ConstitutionClassicRecoveryOperationAuthority(
    path.join(root, 'operation-authority.enc'),
    backend,
    options.afterOperationInvocation ? { afterOperationInvocation: options.afterOperationInvocation } : {}
  );
  const promotionService = fakePromotionService();
  let authorizationCalls = 0;
  return {
    service: new ConstitutionClassicRecoveryService({
      authorityEnvelopePath: authority.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      codec,
      promotionService,
      operationAuthority,
      authorizeDestructivePassword: async (_binding, password) => {
        authorizationCalls += 1;
        if (password !== 'correct-password') throw Object.assign(new Error('wrong password'), { code: 'AUTH_FAILED' });
      },
      acquireQuiescence: async () => async () => undefined,
      createId: () => '22222222-2222-4222-8222-222222222222',
      ...(options.locatorBinding ? { locatorBinding: options.locatorBinding } : {}),
    }),
    promotionService,
    classicFile,
    classicWaylandRoot,
    authorityEnvelopePath: authority.authorityEnvelopePath,
    authorizationCalls: () => authorizationCalls,
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('ConstitutionClassicRecoveryService', () => {
  it('publishes exact awaiting metadata, promotes once, and replays the byte-equivalent result', async () => {
    const { service, promotionService, classicFile } = await setup();
    await writeFile(classicFile, '# classic edit\n');
    const metadata = await service.metadata(principal);
    expect(metadata.data).toMatchObject({
      state: 'awaiting-decision',
      allowedActions: ['promote', 'keep-v2', 'discard'],
      promotionId: null,
      journalHeadSha256: null,
      rescue: null,
    });
    expect(metadata.data.discardChallenge).toMatch(/^discard:[a-f0-9]{64}$/);
    const request = {
      operationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.data.recoveryRevision,
      password: 'correct-password',
      decision: { kind: 'promote' as const },
    };
    const first = await service.decide(principal, request);
    expect(first.data).toMatchObject({ status: 'committed', operationId: request.operationId, rescue: null });
    expect(first.data.promotionId).toBe('22222222-2222-4222-8222-222222222222');
    expect(promotionService.content()).toBe('# classic edit\n');
    expect(promotionService.calls).toHaveLength(1);
    expect(await service.decide(principal, request)).toEqual(first);
    expect(promotionService.calls).toHaveLength(1);
    expect((await service.metadata(principal)).data).toMatchObject({ state: 'committed', allowedActions: [] });
  });

  it('keeps v2 unchanged while surfacing authenticated indefinite local rescue metadata', async () => {
    const { service, promotionService, classicFile } = await setup();
    await writeFile(classicFile, '# classic edit\n');
    const metadata = await service.metadata(principal);
    const result = await service.decide(principal, {
      operationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.data.recoveryRevision,
      password: 'correct-password',
      decision: { kind: 'keep-v2' },
    });
    expect(result.data.status).toBe('rescued');
    expect(result.data.rescue).toMatchObject({
      rescueId: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      sha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
    expect(promotionService.content()).toBe('# baseline\n');
    expect(promotionService.calls).toHaveLength(0);
  });

  it('requires the rotating challenge and exact object set before pre-dispatch discard', async () => {
    const { service, promotionService, classicFile } = await setup();
    await writeFile(classicFile, '# classic edit\n');
    const metadata = await service.metadata(principal);
    const base = {
      operationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.data.recoveryRevision,
      password: 'correct-password',
    } as const;
    await expect(
      service.decide(principal, {
        ...base,
        decision: {
          kind: 'discard',
          confirmedObjectIds: metadata.data.items.map((item) => item.objectId),
          confirmationText: 'stale-challenge',
        },
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const result = await service.decide(principal, {
      ...base,
      decision: {
        kind: 'discard',
        confirmedObjectIds: metadata.data.items.map((item) => item.objectId),
        confirmationText: metadata.data.discardChallenge!,
      },
    });
    expect(result.data).toMatchObject({ status: 'discarded', rescue: null });
    expect(promotionService.calls).toHaveLength(0);
    expect(promotionService.content()).toBe('# baseline\n');
  });

  it('fails stale revisions and wrong passwords before reserving or mutating an operation', async () => {
    const { service, promotionService, classicFile } = await setup();
    await writeFile(classicFile, '# classic edit\n');
    const metadata = await service.metadata(principal);
    const base = {
      operationId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.data.recoveryRevision,
      password: 'correct-password',
      decision: { kind: 'promote' as const },
    };
    await expect(service.decide(principal, { ...base, expectedRecoveryRevision: 'stale' })).rejects.toMatchObject({
      code: 'STALE_RECOVERY_REVISION',
    });
    await expect(service.decide(principal, { ...base, password: 'wrong' })).rejects.toMatchObject({
      code: 'AUTH_FAILED',
    });
    expect(promotionService.calls).toHaveLength(0);
  });

  it('binds partial replay to the authenticated journal head and preserves unresolved work on keep-v2', async () => {
    const { service, promotionService, classicFile, classicWaylandRoot } = await setup();
    await writeFile(classicFile, '# classic edit\n');
    await writeFile(path.join(classicWaylandRoot, 'specialists', 'draft.md'), '# draft\n');
    await rm(path.join(classicWaylandRoot, 'specialists', 'research.md'));
    promotionService.failOnce('specialist:draft');

    const awaiting = await service.metadata(principal);
    const partial = await service.decide(principal, {
      operationId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      projectionReceiptSha256: awaiting.data.projectionReceiptSha256,
      expectedRecoveryRevision: awaiting.data.recoveryRevision,
      password: 'correct-password',
      decision: { kind: 'promote' },
    });
    expect(partial.data.status).toBe('partial');
    expect(promotionService.content()).toBe('# classic edit\n');
    expect(promotionService.content('specialist:draft')).toBeNull();
    expect(promotionService.content('specialist:research')).toBe('# research\n');

    const partialMetadata = await service.metadata(principal);
    expect(partialMetadata.data).toMatchObject({
      state: 'partial',
      allowedActions: ['keep-v2', 'resume'],
      promotionId: partial.data.promotionId,
      rescue: expect.any(Object),
    });
    await expect(
      service.resume(principal, {
        operationId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        projectionReceiptSha256: partialMetadata.data.projectionReceiptSha256,
        expectedRecoveryRevision: partialMetadata.data.recoveryRevision,
        promotionId: partialMetadata.data.promotionId!,
        expectedJournalHeadSha256: `sha256:${'0'.repeat(64)}`,
        password: 'correct-password',
      })
    ).rejects.toMatchObject({ code: 'STALE_JOURNAL_HEAD' });

    const resumed = await service.resume(principal, {
      operationId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      projectionReceiptSha256: partialMetadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: partialMetadata.data.recoveryRevision,
      promotionId: partialMetadata.data.promotionId!,
      expectedJournalHeadSha256: partialMetadata.data.journalHeadSha256!,
      password: 'correct-password',
    });
    expect(resumed.data.status).toBe('partial');
    expect(promotionService.content('specialist:research')).toBeNull();
    expect(resumed.data.journalHeadSha256).not.toBe(partialMetadata.data.journalHeadSha256);

    const afterResume = await service.metadata(principal);
    const callsBeforePreservation = [...promotionService.calls];
    const preserved = await service.decide(principal, {
      operationId: '99999999-9999-4999-8999-999999999999',
      projectionReceiptSha256: afterResume.data.projectionReceiptSha256,
      expectedRecoveryRevision: afterResume.data.recoveryRevision,
      password: 'correct-password',
      decision: { kind: 'keep-v2' },
    });
    expect(preserved.data.status).toBe('rescued');
    expect(preserved.data.rescue).toEqual(afterResume.data.rescue);
    expect(promotionService.calls).toEqual(callsBeforePreservation);
  });

  it('reconciles response loss from the durable dispatched operation without a second destination mutation', async () => {
    let loseResponse = true;
    const { service, promotionService, classicFile, authorizationCalls } = await setup({
      afterOperationInvocation: () => {
        if (loseResponse) {
          loseResponse = false;
          throw new Error('injected response loss');
        }
      },
    });
    await writeFile(classicFile, '# classic edit\n');
    const metadata = await service.metadata(principal);
    const request = {
      operationId: 'abababab-abab-4bab-8bab-abababababab',
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.data.recoveryRevision,
      password: 'correct-password',
      decision: { kind: 'promote' as const },
    };
    await expect(service.decide(principal, request)).rejects.toMatchObject({ code: 'NATIVE_FAILURE' });
    expect(authorizationCalls()).toBe(1);
    expect(promotionService.calls).toHaveLength(1);
    expect(promotionService.content()).toBe('# classic edit\n');

    const reconciled = await service.decide(principal, request);
    expect(authorizationCalls()).toBe(2);
    expect(reconciled.data).toMatchObject({ status: 'committed', operationId: request.operationId });
    expect(promotionService.calls).toHaveLength(1);
    expect(await service.decide(principal, request)).toEqual(reconciled);
    expect(authorizationCalls()).toBe(2);
  });

  it('requires fresh authentication before redispatching a response-lost resume', async () => {
    let loseResponse = false;
    const { service, promotionService, classicFile, classicWaylandRoot, authorizationCalls } = await setup({
      afterOperationInvocation: () => {
        if (loseResponse) {
          loseResponse = false;
          throw new Error('injected resume response loss');
        }
      },
    });
    await writeFile(classicFile, '# classic edit\n');
    await writeFile(path.join(classicWaylandRoot, 'specialists', 'draft.md'), '# draft\n');
    promotionService.failOnce('specialist:draft');

    const awaiting = await service.metadata(principal);
    await service.decide(principal, {
      operationId: '12121212-1212-4212-8212-121212121212',
      projectionReceiptSha256: awaiting.data.projectionReceiptSha256,
      expectedRecoveryRevision: awaiting.data.recoveryRevision,
      password: 'correct-password',
      decision: { kind: 'promote' },
    });
    const partial = await service.metadata(principal);
    const request = {
      operationId: '34343434-3434-4434-8434-343434343434',
      projectionReceiptSha256: partial.data.projectionReceiptSha256,
      expectedRecoveryRevision: partial.data.recoveryRevision,
      promotionId: partial.data.promotionId!,
      expectedJournalHeadSha256: partial.data.journalHeadSha256!,
      password: 'correct-password',
    };

    loseResponse = true;
    await expect(service.resume(principal, request)).rejects.toMatchObject({ code: 'NATIVE_FAILURE' });
    expect(authorizationCalls()).toBe(2);
    const reconciled = await service.resume(principal, request);
    expect(reconciled.data.operationId).toBe(request.operationId);
    expect(authorizationCalls()).toBe(3);
    expect(await service.resume(principal, request)).toEqual(reconciled);
    expect(authorizationCalls()).toBe(3);
  });

  it('fails closed when locator activation changes before response-loss reconciliation', async () => {
    const installationBindingSha256 = digest('installation');
    const projectionAuthoritySha256 = digest('projection');
    const activation: ClassicRecoveryLocatorEvent = {
      contract: 'wayland-constitution-classic-recovery-locator-event/1.0',
      sequence: 0,
      previousEventSha256: null,
      eventId: '56565656-5656-4656-8656-565656565656',
      kind: 'activated',
      installationBindingSha256,
      preparationId: 'prep-original',
      projectionAuthoritySha256,
      terminalState: null,
      operationReceiptId: null,
      createdAt: '2026-07-17T00:00:00.000Z',
    };
    const replacement: ClassicRecoveryLocatorEvent = {
      ...activation,
      sequence: 1,
      eventId: '78787878-7878-4878-8878-787878787878',
      preparationId: 'prep-replacement',
    };
    let changed = false;
    const locatorAuthority = {
      snapshot: async () => ({
        events: [changed ? replacement : activation],
        active: changed ? replacement : activation,
      }),
      terminal: async () => activation,
    } as unknown as ClassicRecoveryLocatorAuthority;
    const { service, promotionService, classicFile, authorizationCalls } = await setup({
      afterOperationInvocation: () => {
        changed = true;
        throw new Error('injected response loss');
      },
      locatorBinding: { authority: locatorAuthority, activation },
    });
    await writeFile(classicFile, '# classic edit\n');
    const metadata = await service.metadata(principal);
    const request = {
      operationId: '90909090-9090-4090-8090-909090909090',
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.data.recoveryRevision,
      password: 'correct-password',
      decision: { kind: 'promote' as const },
    };
    await expect(service.decide(principal, request)).rejects.toMatchObject({ code: 'NATIVE_FAILURE' });
    expect(promotionService.calls).toHaveLength(1);
    await expect(service.decide(principal, request)).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(authorizationCalls()).toBe(2);
    expect(promotionService.calls).toHaveLength(1);
  });

  it('does not enumerate another principal operation and fails closed on projection tampering', async () => {
    const { service, promotionService, classicFile, authorityEnvelopePath } = await setup();
    await writeFile(classicFile, '# classic edit\n');
    const metadata = await service.metadata(principal);
    const request = {
      operationId: 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
      projectionReceiptSha256: metadata.data.projectionReceiptSha256,
      expectedRecoveryRevision: metadata.data.recoveryRevision,
      password: 'correct-password',
      decision: { kind: 'promote' as const },
    };
    await service.decide(principal, request);
    const otherPrincipal = createHostedRestorePrincipalBinding('production', 'user-43');
    await expect(service.decide(otherPrincipal, request)).rejects.toMatchObject({ code: 'OPERATION_NOT_FOUND' });
    expect(promotionService.calls).toHaveLength(1);

    await writeFile(authorityEnvelopePath, '{"tampered":true}');
    await expect(service.metadata(principal)).rejects.toMatchObject({ code: 'INTEGRITY_FAILURE' });
  });
});
