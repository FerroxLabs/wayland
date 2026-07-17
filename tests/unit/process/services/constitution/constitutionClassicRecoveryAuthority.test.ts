import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  CONSTITUTION_CLASSIC_RECOVERY_OPERATION_CONTRACT,
  ConstitutionClassicRecoveryAuthorityError,
  ConstitutionClassicRecoveryOperationAuthority,
  createConstitutionClassicRecoveryProcessFingerprint,
  type ConstitutionClassicRecoveryOperationFacts,
} from '@process/services/constitution/constitutionClassicRecoveryAuthority';
import { createHostedRestorePrincipalBinding } from '@process/services/constitution/constitutionArchiveRestoreAuthority';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';
import type { ConstitutionClassicRecoveryMutationSuccess } from '@/common/types/constitutionRecovery';

const backend: ConstitutionArchiveSecretBackend = {
  encryptString: (plaintext) => `fenc:v1:${Buffer.from(plaintext, 'utf8').toString('base64')}`,
  decryptString: (ciphertext) => Buffer.from(ciphertext.slice('fenc:v1:'.length), 'base64').toString('utf8'),
};

function authorityPath(): string {
  return path.join(mkdtempSync(path.join(os.tmpdir(), 'classic-recovery-authority-')), 'authority.enc');
}

function facts(
  overrides: Partial<ConstitutionClassicRecoveryOperationFacts> = {}
): ConstitutionClassicRecoveryOperationFacts {
  return {
    operationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    principalBinding: createHostedRestorePrincipalBinding('production', 'user-42'),
    kind: 'decision',
    decision: 'promote',
    projectionReceiptSha256: `sha256:${'1'.repeat(64)}`,
    expectedRecoveryRevision: 'recovery:v1:awaiting',
    confirmedObjectIds: [],
    promotionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    expectedJournalHeadSha256: null,
    ...overrides,
  };
}

function result(
  overrides: Partial<ConstitutionClassicRecoveryMutationSuccess['data']> = {}
): ConstitutionClassicRecoveryMutationSuccess {
  return {
    success: true,
    data: {
      status: 'committed',
      operationId: facts().operationId,
      recoveryRevision: 'recovery:v1:committed',
      promotionId: facts().promotionId,
      journalHeadSha256: `sha256:${'2'.repeat(64)}`,
      receiptId: 'classic-recovery-receipt:v1',
      items: [
        {
          objectId: 'constitution:CONSTITUTION.md',
          operation: 'replace',
          state: 'committed',
          resultRevision: 'rev:v2:result',
          receiptId: 'receipt:v2:result',
          conflictCode: null,
        },
      ],
      rescue: null,
      ...overrides,
    },
  };
}

describe('ConstitutionClassicRecoveryOperationAuthority', () => {
  it('persists canonical operation facts without passwords, challenges, paths, or prose', () => {
    const file = authorityPath();
    const input = facts();
    const authority = new ConstitutionClassicRecoveryOperationAuthority(file, backend, {
      now: () => new Date('2026-07-17T01:02:03.004Z'),
    });
    const record = authority.reserve(input);

    expect(record).toEqual({
      contract: CONSTITUTION_CLASSIC_RECOVERY_OPERATION_CONTRACT,
      ...input,
      processRequestFingerprint: createConstitutionClassicRecoveryProcessFingerprint(input),
      createdAt: '2026-07-17T01:02:03.004Z',
      state: 'prepared',
      result: null,
    });
    const plaintext = backend.decryptString(readFileSync(file, 'utf8'));
    expect(plaintext).not.toMatch(/password|confirmationText|discardChallenge|classicRoot|journalRoot/i);
    expect(
      new ConstitutionClassicRecoveryOperationAuthority(file, backend).lookup(input.operationId, input.principalBinding)
    ).toEqual(record);
  });

  it('preserves global UUID ownership and distinguishes changed facts without principal enumeration', () => {
    const authority = new ConstitutionClassicRecoveryOperationAuthority(authorityPath(), backend);
    const input = facts();
    authority.reserve(input);
    expect(() => authority.reserve({ ...input, expectedRecoveryRevision: 'recovery:v1:changed' })).toThrowError(
      expect.objectContaining({ code: 'OPERATION_ID_CONFLICT' })
    );
    const wrongPrincipal = createHostedRestorePrincipalBinding('production', 'someone-else');
    expect(() => authority.lookup(input.operationId, wrongPrincipal)).toThrowError(
      expect.objectContaining({ code: 'OPERATION_NOT_FOUND' })
    );
    expect(() => authority.reserve({ ...input, principalBinding: wrongPrincipal })).toThrowError(
      expect.objectContaining({ code: 'OPERATION_NOT_FOUND' })
    );
  });

  it('marks dispatch durably before execution and reconciles response loss exactly once', async () => {
    const file = authorityPath();
    const input = facts();
    const authority = new ConstitutionClassicRecoveryOperationAuthority(file, backend, {
      afterOperationInvocation: () => {
        throw new Error('injected response-loss crash');
      },
    });
    authority.reserve(input);
    await expect(
      authority.dispatch(input.operationId, input.principalBinding, async () => {
        const state = JSON.parse(backend.decryptString(readFileSync(file, 'utf8'))) as {
          records: Array<{ state: string }>;
        };
        expect(state.records[0]?.state).toBe('dispatched');
        return result();
      })
    ).rejects.toThrow('injected response-loss crash');

    const restarted = new ConstitutionClassicRecoveryOperationAuthority(file, backend);
    expect(restarted.lookup(input.operationId, input.principalBinding)).toMatchObject({ state: 'dispatched' });
    expect(restarted.commitReconciled(input.operationId, input.principalBinding, result())).toEqual(result());
    expect(restarted.lookup(input.operationId, input.principalBinding)).toMatchObject({
      state: 'committed',
      result: result(),
    });
    expect(
      await restarted.dispatch(input.operationId, input.principalBinding, async () => {
        throw new Error('must not execute a committed operation');
      })
    ).toEqual(result());
  });

  it('binds resume identity to the exact authenticated journal head', () => {
    const authority = new ConstitutionClassicRecoveryOperationAuthority(authorityPath(), backend);
    const resume = facts({
      kind: 'resume',
      decision: 'resume',
      confirmedObjectIds: [],
      expectedJournalHeadSha256: `sha256:${'3'.repeat(64)}`,
    });
    authority.reserve(resume);
    expect(() => authority.reserve({ ...resume, expectedJournalHeadSha256: `sha256:${'4'.repeat(64)}` })).toThrowError(
      expect.objectContaining({ code: 'OPERATION_ID_CONFLICT' })
    );
  });

  it('fails closed on corrupt encrypted state and malformed operation facts', () => {
    const file = authorityPath();
    const authority = new ConstitutionClassicRecoveryOperationAuthority(file, backend);
    authority.reserve(facts());
    writeFileSync(file, 'fenc:v1:not-base64', 'utf8');
    expect(() => authority.lookup(facts().operationId, facts().principalBinding)).toThrowError(
      expect.objectContaining({ code: 'INTEGRITY_FAILURE' })
    );
    expect(() =>
      new ConstitutionClassicRecoveryOperationAuthority(authorityPath(), backend).reserve(
        facts({ operationId: 'not-an-operation-id' })
      )
    ).toThrow(ConstitutionClassicRecoveryAuthorityError);
  });
});
