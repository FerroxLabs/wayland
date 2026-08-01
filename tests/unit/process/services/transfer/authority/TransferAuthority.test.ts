import {
  TransferAuthority,
  TransferAuthorityError,
  type TransferAuthorityContext,
  type TransferKeyRequest,
  type TransferPublicationApproval,
  type VerifiedOsStepUp,
} from '@process/services/transfer/authority';

const DIGEST_A = `sha256:${'a'.repeat(64)}` as const;
const DIGEST_B = `sha256:${'b'.repeat(64)}` as const;
const DIGEST_C = `sha256:${'c'.repeat(64)}` as const;
const DIGEST_D = `sha256:${'d'.repeat(64)}` as const;
const DIGEST_E = `sha256:${'e'.repeat(64)}` as const;
const NOW = new Date('2026-07-19T00:00:00.000Z');

function context(overrides: Partial<TransferAuthorityContext> = {}): TransferAuthorityContext {
  return {
    requesterKind: 'interactive-profile-owner',
    isActiveProfileOwner: true,
    instanceId: 'instance-1',
    principalId: 'principal-1',
    tenantId: 'tenant-1',
    policyVersion: 'transfer-policy/1',
    ...overrides,
  };
}

function keyRequest(overrides: Partial<TransferKeyRequest> = {}): TransferKeyRequest {
  return {
    direction: 'export',
    scopes: ['chats', 'projects'],
    requestFingerprint: DIGEST_A,
    approvalPolicyFingerprint: DIGEST_B,
    lifetimeMs: 15 * 60 * 1000,
    ...overrides,
  };
}

function verifiedStepUp(evidence: unknown): VerifiedOsStepUp {
  return {
    provider: 'darwin-local-authentication',
    verifiedAt: NOW,
    instanceId: 'instance-1',
    principalId: 'principal-1',
    tenantId: 'tenant-1',
    evidenceFingerprint: evidence === 'step-3' ? DIGEST_E : evidence === 'step-2' ? DIGEST_D : DIGEST_C,
  };
}

function authority(now: () => Date = () => NOW): TransferAuthority {
  let id = 0;
  return new TransferAuthority({
    now,
    createId: () => `authority-id-${++id}`,
    createSecret: () => 'destination-key-with-at-least-thirty-two-bytes',
    verifyOsStepUp: verifiedStepUp,
  });
}

function publicationRequest(
  transferId: string,
  overrides: Partial<TransferPublicationApproval> = {}
): TransferPublicationApproval {
  return {
    transferId,
    scopes: ['full'],
    requestFingerprint: DIGEST_A,
    approvalPolicyFingerprint: DIGEST_B,
    dryRunDigest: DIGEST_C,
    dryRunApprovalFingerprint: DIGEST_D,
    publicationApprovalFingerprint: DIGEST_A,
    stepUpEvidence: 'step-3',
    ...overrides,
  };
}

describe('TransferAuthority identity and scope boundary', () => {
  it.each(['agent', 'schedule', 'channel', 'team', 'connector', 'background'] as const)(
    'denies a %s requester before issuing a destination key',
    (requesterKind) => {
      expect(() => authority().issueDestinationKey(keyRequest(), context({ requesterKind }))).toThrowError(
        expect.objectContaining({ code: 'DENIED_IDENTITY' })
      );
    }
  );

  it('denies an interactive requester that is not the active profile owner', () => {
    expect(() => authority().issueDestinationKey(keyRequest(), context({ isActiveProfileOwner: false }))).toThrowError(
      expect.objectContaining({ code: 'DENIED_IDENTITY' })
    );
  });

  it.each(['agents', 'schedules', 'channels', 'teams', 'connectors'] as const)(
    'permanently denies the %s transfer scope',
    (scope) => {
      expect(() => authority().issueDestinationKey(keyRequest({ scopes: [scope] }), context())).toThrowError(
        expect.objectContaining({ code: 'DENIED_SCOPE' })
      );
    }
  );

  it('rejects scope widening after key issuance', () => {
    const service = authority();
    const issued = service.issueDestinationKey(keyRequest(), context());
    expect(() =>
      service.approveDryRun(
        {
          transferId: issued.transferId,
          destinationKey: issued.destinationKey,
          scopes: ['chats', 'files', 'projects'],
          requestFingerprint: DIGEST_A,
          approvalPolicyFingerprint: DIGEST_B,
          dryRunDigest: DIGEST_C,
          approvalFingerprint: DIGEST_D,
        },
        context()
      )
    ).toThrowError(expect.objectContaining({ code: 'SCOPE_WIDENING' }));
  });

  it('fails closed on unknown runtime scopes and directions', () => {
    expect(() => authority().issueDestinationKey(keyRequest({ scopes: ['unknown'] as never }), context())).toThrowError(
      expect.objectContaining({ code: 'INVALID_REQUEST' })
    );
    expect(() => authority().issueDestinationKey(keyRequest({ direction: 'copy' as never }), context())).toThrowError(
      expect.objectContaining({ code: 'INVALID_REQUEST' })
    );
  });
});

describe('TransferAuthority lifecycle', () => {
  it('separates key issuance, dry-run approval, and publication approval', () => {
    const service = authority();
    const issued = service.issueDestinationKey(keyRequest({ scopes: ['full'], stepUpEvidence: 'step-1' }), context());
    const dryRun = service.approveDryRun(
      {
        transferId: issued.transferId,
        destinationKey: issued.destinationKey,
        scopes: ['full'],
        requestFingerprint: DIGEST_A,
        approvalPolicyFingerprint: DIGEST_B,
        dryRunDigest: DIGEST_C,
        approvalFingerprint: DIGEST_D,
        stepUpEvidence: 'step-2',
      },
      context()
    );
    const published = service.approvePublication(
      publicationRequest(issued.transferId, { publicationApprovalFingerprint: DIGEST_B }),
      context()
    );

    expect(issued.receipt.action).toBe('destination-key-issued');
    expect(dryRun.action).toBe('dry-run-approved');
    expect(published.action).toBe('publication-approved');
  });

  it('returns receipts without keys, scopes, content, paths, or approval evidence', () => {
    const issued = authority().issueDestinationKey(keyRequest(), context());
    const receipt = issued.receipt;
    const serialized = JSON.stringify(receipt);
    expect(serialized).not.toContain(issued.destinationKey);
    expect(serialized).not.toMatch(/chats|projects|content|path|approvalPolicyFingerprint|destinationKey/i);
  });

  it('requires fresh OS-backed step-up for full, sensitive, and executable scopes', () => {
    for (const scope of ['full', 'sensitive', 'executable'] as const) {
      expect(() => authority().issueDestinationKey(keyRequest({ scopes: [scope] }), context())).toThrowError(
        expect.objectContaining({ code: 'STEP_UP_REQUIRED' })
      );
    }
  });

  it('rejects stale, future, and replayed step-up evidence', () => {
    const stale = new TransferAuthority({
      now: () => NOW,
      verifyOsStepUp: () => ({ ...verifiedStepUp('step-1'), verifiedAt: new Date(NOW.getTime() - 300_001) }),
    });
    expect(() =>
      stale.issueDestinationKey(keyRequest({ scopes: ['full'], stepUpEvidence: {} }), context())
    ).toThrowError(expect.objectContaining({ code: 'STALE_STEP_UP' }));

    const service = authority();
    const issued = service.issueDestinationKey(keyRequest({ scopes: ['full'], stepUpEvidence: 'step-1' }), context());
    expect(() =>
      service.approveDryRun(
        {
          transferId: issued.transferId,
          destinationKey: issued.destinationKey,
          scopes: ['full'],
          requestFingerprint: DIGEST_A,
          approvalPolicyFingerprint: DIGEST_B,
          dryRunDigest: DIGEST_C,
          approvalFingerprint: DIGEST_D,
          stepUpEvidence: 'step-1',
        },
        context()
      )
    ).toThrowError(expect.objectContaining({ code: 'STALE_STEP_UP' }));

    const crossTransfer = authority();
    crossTransfer.issueDestinationKey(keyRequest({ scopes: ['full'], stepUpEvidence: 'step-1' }), context());
    expect(() =>
      crossTransfer.issueDestinationKey(keyRequest({ scopes: ['full'], stepUpEvidence: 'step-1' }), context())
    ).toThrowError(expect.objectContaining({ code: 'STALE_STEP_UP' }));
  });

  it('rejects key replay, expiry, revocation, and publication replay', () => {
    const service = authority();
    const issued = service.issueDestinationKey(keyRequest(), context());
    const dryRunRequest = {
      transferId: issued.transferId,
      destinationKey: issued.destinationKey,
      scopes: ['chats', 'projects'] as const,
      requestFingerprint: DIGEST_A,
      approvalPolicyFingerprint: DIGEST_B,
      dryRunDigest: DIGEST_C,
      approvalFingerprint: DIGEST_D,
    };
    service.approveDryRun(dryRunRequest, context());
    expect(() => service.approveDryRun(dryRunRequest, context())).toThrowError(
      expect.objectContaining({ code: 'CONSUMED' })
    );

    const published = service.approvePublication(
      {
        ...publicationRequest(issued.transferId),
        scopes: ['chats', 'projects'],
        stepUpEvidence: undefined,
      },
      context()
    );
    expect(published.action).toBe('publication-approved');
    expect(() =>
      service.approvePublication(
        { ...publicationRequest(issued.transferId), scopes: ['chats', 'projects'], stepUpEvidence: undefined },
        context()
      )
    ).toThrowError(expect.objectContaining({ code: 'CONSUMED' }));

    const revoked = authority();
    const revokedKey = revoked.issueDestinationKey(keyRequest(), context());
    revoked.revoke(revokedKey.transferId, context());
    expect(() =>
      revoked.approveDryRun({ ...dryRunRequest, transferId: revokedKey.transferId }, context())
    ).toThrowError(expect.objectContaining({ code: 'REVOKED' }));

    let clock = NOW;
    const expiring = authority(() => clock);
    const expiredKey = expiring.issueDestinationKey(keyRequest({ lifetimeMs: 1 }), context());
    clock = new Date(NOW.getTime() + 1);
    expect(() =>
      expiring.approveDryRun({ ...dryRunRequest, transferId: expiredKey.transferId }, context())
    ).toThrowError(expect.objectContaining({ code: 'EXPIRED' }));
  });

  it('rejects identity, tenant, policy, approval, and dry-run drift', () => {
    const service = authority();
    const issued = service.issueDestinationKey(keyRequest(), context());
    const dryRun = {
      transferId: issued.transferId,
      destinationKey: issued.destinationKey,
      scopes: ['chats', 'projects'] as const,
      requestFingerprint: DIGEST_A,
      approvalPolicyFingerprint: DIGEST_B,
      dryRunDigest: DIGEST_C,
      approvalFingerprint: DIGEST_D,
    };
    expect(() => service.approveDryRun(dryRun, context({ tenantId: 'tenant-2' }))).toThrowError(
      expect.objectContaining({ code: 'BINDING_MISMATCH' })
    );
    expect(() => service.approveDryRun(dryRun, context({ policyVersion: 'transfer-policy/2' }))).toThrowError(
      expect.objectContaining({ code: 'POLICY_DRIFT' })
    );
    expect(() => service.approveDryRun({ ...dryRun, approvalPolicyFingerprint: DIGEST_A }, context())).toThrowError(
      expect.objectContaining({ code: 'APPROVAL_DRIFT' })
    );

    service.approveDryRun(dryRun, context());
    expect(() =>
      service.approvePublication(
        {
          ...publicationRequest(issued.transferId),
          scopes: ['chats', 'projects'],
          dryRunDigest: DIGEST_B,
          stepUpEvidence: undefined,
        },
        context()
      )
    ).toThrowError(expect.objectContaining({ code: 'DRY_RUN_DRIFT' }));
    expect(() =>
      service.approvePublication(
        {
          ...publicationRequest(issued.transferId),
          scopes: ['chats', 'projects'],
          dryRunApprovalFingerprint: DIGEST_A,
          stepUpEvidence: undefined,
        },
        context()
      )
    ).toThrowError(expect.objectContaining({ code: 'APPROVAL_DRIFT' }));
  });
});

describe('TransferAuthority key lifetime', () => {
  it('rejects a destination key lifetime over fifteen minutes', () => {
    expect(() => authority().issueDestinationKey(keyRequest({ lifetimeMs: 900_001 }), context())).toThrowError(
      expect.objectContaining({ code: 'INVALID_REQUEST' })
    );
  });

  it('exposes typed authority failures', () => {
    expect(() => authority().issueDestinationKey(keyRequest({ scopes: [] }), context())).toThrow(
      TransferAuthorityError
    );
  });
});
