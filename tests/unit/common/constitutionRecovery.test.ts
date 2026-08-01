import {
  CONSTITUTION_ARCHIVE_RECOVERY_DTO_CONTRACT,
  CONSTITUTION_CLASSIC_RECOVERY_DTO_CONTRACT,
  constitutionArchiveRestoreFailure,
  constitutionClassicRecoveryFailure,
  parseConstitutionArchiveInventoryResult,
  parseConstitutionArchiveRestoreRequest,
  parseConstitutionArchiveRestoreResult,
  parseConstitutionClassicRecoveryDecisionRequest,
  parseConstitutionClassicRecoveryMetadataResult,
  parseConstitutionClassicRecoveryMutationResult,
  parseConstitutionClassicRecoveryResumeRequest,
  validateConstitutionArchiveInventory,
  type ConstitutionArchiveRecoverySummary,
  type ConstitutionClassicRecoveryItem,
  type ConstitutionClassicRecoveryMetadataSuccess,
  type ConstitutionClassicRecoveryState,
} from '@/common/types/constitutionRecovery';

const request = {
  operationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  archiveId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  expectedArchiveRevision: 'rev:v2:archive',
  password: 'fresh password',
  expectedRevision: 'rev:v2:target',
};

function row(overrides: Partial<ConstitutionArchiveRecoverySummary> = {}): ConstitutionArchiveRecoverySummary {
  return {
    archiveId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    archivedAt: '2026-07-17T01:02:03.004Z',
    targetKind: 'constitution',
    specialistId: null,
    sourceName: 'CONSTITUTION.md',
    bytes: 12,
    targetRevision: 'rev:v2:archive',
    ...overrides,
  };
}

describe('Constitution archive recovery DTO', () => {
  it('accepts only the exact restore request and preserves the client operation ID', () => {
    expect(parseConstitutionArchiveRestoreRequest(request)).toEqual(request);
    expect(parseConstitutionArchiveRestoreRequest({ ...request, target: { kind: 'constitution' } })).toBeNull();
    expect(
      parseConstitutionArchiveRestoreRequest({ ...request, operationId: request.operationId.toUpperCase() })
    ).toBeNull();
    expect(parseConstitutionArchiveRestoreRequest({ ...request, password: '' })).toBeNull();
    expect(parseConstitutionArchiveRestoreRequest({ ...request, expectedRevision: 'decomposed-e\u0301' })).toBeNull();
  });

  it('accepts only complete, unique, canonically ordered metadata rows', () => {
    const older = row({
      archiveId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      archivedAt: '2026-07-16T01:02:03.004Z',
    });
    expect(validateConstitutionArchiveInventory([row(), older])).toEqual([row(), older]);
    expect(() => validateConstitutionArchiveInventory([older, row()])).toThrow(
      'CONSTITUTION_ARCHIVE_INVENTORY_INVALID'
    );
    expect(() => validateConstitutionArchiveInventory([row(), row()])).toThrow(
      'CONSTITUTION_ARCHIVE_INVENTORY_INVALID'
    );
    expect(() => validateConstitutionArchiveInventory([{ ...row(), specialistId: 'invented' }])).toThrow(
      'CONSTITUTION_ARCHIVE_INVENTORY_INVALID'
    );
  });

  it('uses the exact shared contract and fixed retryability taxonomy', () => {
    expect(CONSTITUTION_ARCHIVE_RECOVERY_DTO_CONTRACT).toBe('wayland-constitution-archive-recovery-dto/1.0');
    expect(constitutionArchiveRestoreFailure('AUTH_FAILED', 'No', request.operationId)).toEqual({
      success: false,
      error: { code: 'AUTH_FAILED', message: 'No', retryable: true, operationId: request.operationId },
    });
    expect(constitutionArchiveRestoreFailure('CONFLICT', 'No', request.operationId).error.retryable).toBe(false);
  });

  it('parses only exact inventory, success, and failure envelopes', () => {
    const inventory = {
      success: true,
      data: { contract: CONSTITUTION_ARCHIVE_RECOVERY_DTO_CONTRACT, archives: [row()] },
    } as const;
    expect(parseConstitutionArchiveInventoryResult(inventory)).toEqual(inventory);
    expect(parseConstitutionArchiveInventoryResult({ ...inventory, ignored: true })).toBeNull();
    expect(
      parseConstitutionArchiveInventoryResult({
        ...inventory,
        data: { ...inventory.data, archives: [{ ...row(), sourceName: 'bad\u0000name' }] },
      })
    ).toBeNull();

    const success = {
      success: true,
      data: {
        status: 'committed',
        operationId: request.operationId,
        revision: 'rev:v2:restored',
        receiptId: 'receipt:v2:restored',
      },
    } as const;
    expect(parseConstitutionArchiveRestoreResult(success)).toEqual(success);
    expect(
      parseConstitutionArchiveRestoreResult({ ...success, data: { ...success.data, status: 'prepared' } })
    ).toBeNull();

    const failure = constitutionArchiveRestoreFailure('AUTH_FAILED', 'Try again.', request.operationId);
    expect(parseConstitutionArchiveRestoreResult(failure)).toEqual(failure);
    expect(
      parseConstitutionArchiveRestoreResult({
        ...failure,
        error: { ...failure.error, retryable: false },
      })
    ).toBeNull();
  });
});

const projectionReceiptSha256 = `sha256:${'a'.repeat(64)}` as const;
const journalHeadSha256 = `sha256:${'b'.repeat(64)}` as const;
const rescueSha256 = `sha256:${'c'.repeat(64)}` as const;
const rescueRecordSha256 = `sha256:${'d'.repeat(64)}` as const;
const promotionId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function classicItem(overrides: Partial<ConstitutionClassicRecoveryItem> = {}): ConstitutionClassicRecoveryItem {
  return {
    objectId: 'constitution',
    operation: 'replace',
    state: 'pending',
    resultRevision: null,
    receiptId: null,
    conflictCode: null,
    ...overrides,
  };
}

function classicMetadata(
  state: ConstitutionClassicRecoveryState,
  overrides: Partial<ConstitutionClassicRecoveryMetadataSuccess['data']> = {}
): ConstitutionClassicRecoveryMetadataSuccess {
  const prepared = state !== 'no-change' && state !== 'awaiting-decision';
  const rescueRequired = ['applying', 'partial', 'conflicted', 'rescued'].includes(state);
  const items: ConstitutionClassicRecoveryItem[] =
    state === 'no-change'
      ? []
      : state === 'committed'
        ? [classicItem({ state: 'committed', resultRevision: 'rev:v2:done', receiptId: 'receipt:v2:done' })]
        : state === 'conflicted'
          ? [classicItem({ state: 'conflicted', conflictCode: 'STALE_DESTINATION' })]
          : state === 'partial'
            ? [
                classicItem({
                  objectId: 'a',
                  state: 'committed',
                  resultRevision: 'rev:v2:a',
                  receiptId: 'receipt:v2:a',
                }),
                classicItem({ objectId: 'b', state: 'conflicted', conflictCode: 'NATIVE_FAILURE' }),
              ]
            : [classicItem()];
  const actions = {
    'no-change': [],
    'awaiting-decision': ['promote', 'keep-v2', 'discard'],
    applying: [],
    partial: ['keep-v2', 'resume'],
    committed: [],
    conflicted: ['keep-v2'],
    rescued: [],
    discarded: [],
  }[state];
  return {
    success: true,
    data: {
      contract: CONSTITUTION_CLASSIC_RECOVERY_DTO_CONTRACT,
      recoveryRevision: `recovery:${state}`,
      projectionReceiptSha256,
      promotionId: prepared ? promotionId : null,
      journalHeadSha256: prepared ? journalHeadSha256 : null,
      state,
      items,
      rescue: rescueRequired
        ? {
            rescueId: rescueSha256,
            sha256: rescueRecordSha256,
            bytes: 512,
            createdAt: '2026-07-17T01:02:03.004Z',
          }
        : null,
      allowedActions: actions,
      discardChallenge: state === 'awaiting-decision' ? 'DISCARD constitution' : null,
      ...overrides,
    },
  } as ConstitutionClassicRecoveryMetadataSuccess;
}

describe('Constitution Classic recovery DTO', () => {
  it('accepts the exact decision and resume requests', () => {
    const decision = {
      operationId: request.operationId,
      projectionReceiptSha256,
      expectedRecoveryRevision: 'recovery:awaiting-decision',
      password: 'fresh password',
      decision: { kind: 'promote' },
    } as const;
    expect(parseConstitutionClassicRecoveryDecisionRequest(decision)).toEqual(decision);
    expect(parseConstitutionClassicRecoveryDecisionRequest({ ...decision, ignored: true })).toBeNull();
    expect(
      parseConstitutionClassicRecoveryDecisionRequest({
        ...decision,
        decision: {
          kind: 'discard',
          confirmedObjectIds: ['a', 'b'],
          confirmationText: 'DISCARD a b',
        },
      })
    ).not.toBeNull();
    expect(
      parseConstitutionClassicRecoveryDecisionRequest({
        ...decision,
        decision: {
          kind: 'discard',
          confirmedObjectIds: ['b', 'a'],
          confirmationText: 'DISCARD a b',
        },
      })
    ).toBeNull();

    const resume = {
      operationId: request.operationId,
      promotionId,
      projectionReceiptSha256,
      expectedRecoveryRevision: 'recovery:partial',
      expectedJournalHeadSha256: journalHeadSha256,
      password: 'fresh password',
    } as const;
    expect(parseConstitutionClassicRecoveryResumeRequest(resume)).toEqual(resume);
    expect(parseConstitutionClassicRecoveryResumeRequest({ ...resume, password: '' })).toBeNull();
    expect(parseConstitutionClassicRecoveryResumeRequest({ ...resume, extra: null })).toBeNull();
  });

  it.each([
    'no-change',
    'awaiting-decision',
    'applying',
    'partial',
    'committed',
    'conflicted',
    'rescued',
    'discarded',
  ] as const)('accepts the exact %s state matrix', (state) => {
    const metadata = classicMetadata(state);
    expect(parseConstitutionClassicRecoveryMetadataResult(metadata)).toEqual(metadata);
  });

  it('rejects action, challenge, rescue, item, digest, and ordering contradictions', () => {
    expect(
      parseConstitutionClassicRecoveryMetadataResult(
        classicMetadata('awaiting-decision', { allowedActions: ['keep-v2', 'promote', 'discard'] })
      )
    ).toBeNull();
    expect(
      parseConstitutionClassicRecoveryMetadataResult(classicMetadata('awaiting-decision', { discardChallenge: null }))
    ).toBeNull();
    expect(
      parseConstitutionClassicRecoveryMetadataResult(
        classicMetadata('committed', { rescue: classicMetadata('rescued').data.rescue })
      )
    ).toBeNull();
    expect(
      parseConstitutionClassicRecoveryMetadataResult(
        classicMetadata('committed', { items: [classicItem({ state: 'pending' })] })
      )
    ).toBeNull();
    expect(
      parseConstitutionClassicRecoveryMetadataResult(
        classicMetadata('partial', {
          items: [classicItem({ objectId: 'b' }), classicItem({ objectId: 'a' })],
        })
      )
    ).toBeNull();
    expect(
      parseConstitutionClassicRecoveryMetadataResult(
        classicMetadata('no-change', { projectionReceiptSha256: `sha256:${'A'.repeat(64)}` })
      )
    ).toBeNull();
    expect(parseConstitutionClassicRecoveryMetadataResult({ ...classicMetadata('no-change'), extra: true })).toBeNull();
  });

  it('fails closed on wrong-type critical Classic operation identity fields', () => {
    expect(
      parseConstitutionClassicRecoveryMetadataResult(
        classicMetadata('awaiting-decision', { promotionId: 42 as unknown as string })
      )
    ).toBeNull();
    expect(
      parseConstitutionClassicRecoveryMetadataResult(
        classicMetadata('awaiting-decision', { journalHeadSha256: 42 as unknown as `sha256:${string}` })
      )
    ).toBeNull();

    const committed = classicMetadata('committed').data;
    const mutation = {
      success: true,
      data: {
        status: committed.state,
        operationId: request.operationId,
        recoveryRevision: committed.recoveryRevision,
        promotionId: committed.promotionId,
        journalHeadSha256: committed.journalHeadSha256,
        receiptId: 'classic-recovery-receipt:v1',
        items: committed.items,
        rescue: committed.rescue,
      },
    } as const;
    expect(
      parseConstitutionClassicRecoveryMutationResult({
        ...mutation,
        data: { ...mutation.data, promotionId: 42 },
      })
    ).toBeNull();
    expect(
      parseConstitutionClassicRecoveryMutationResult({
        ...mutation,
        data: { ...mutation.data, journalHeadSha256: 42 },
      })
    ).toBeNull();
  });

  it('parses exact mutation results and fixed failure retryability', () => {
    const metadata = classicMetadata('committed');
    const success = {
      success: true,
      data: {
        status: metadata.data.state,
        operationId: request.operationId,
        recoveryRevision: metadata.data.recoveryRevision,
        promotionId: metadata.data.promotionId,
        journalHeadSha256: metadata.data.journalHeadSha256,
        receiptId: 'classic-recovery-receipt:v1',
        items: metadata.data.items,
        rescue: metadata.data.rescue,
      },
    } as const;
    expect(parseConstitutionClassicRecoveryMutationResult(success)).toEqual(success);
    expect(
      parseConstitutionClassicRecoveryMutationResult({
        ...success,
        data: { ...success.data, journalHeadSha256: null },
      })
    ).toBeNull();

    const failure = constitutionClassicRecoveryFailure('AUTH_FAILED', 'Authentication failed.', request.operationId);
    expect(failure.error.retryable).toBe(true);
    expect(parseConstitutionClassicRecoveryMutationResult(failure)).toEqual(failure);
    expect(constitutionClassicRecoveryFailure('CONFLICT', 'Conflict.', request.operationId).error.retryable).toBe(
      false
    );
    expect(
      parseConstitutionClassicRecoveryMutationResult({
        ...failure,
        error: { ...failure.error, retryable: false },
      })
    ).toBeNull();
  });

  it('never admits portable rescue lifecycle controls into the contract', () => {
    expect(JSON.stringify(classicMetadata('rescued'))).not.toMatch(/export|import|delete|purge|prune|gc/i);
    expect(CONSTITUTION_CLASSIC_RECOVERY_DTO_CONTRACT).toBe('wayland-constitution-classic-recovery-dto/1.0');
  });
});
