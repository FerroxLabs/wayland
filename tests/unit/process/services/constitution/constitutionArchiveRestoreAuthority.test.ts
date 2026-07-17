import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  CONSTITUTION_ARCHIVE_RESTORE_OPERATION_CONTRACT,
  ConstitutionArchiveRestoreAuthorityError,
  ConstitutionArchiveRestoreOperationAuthority,
  createConstitutionArchiveRestoreProcessFingerprint,
  createHostedRestorePrincipalBinding,
  type ConstitutionArchiveRestoreOperationFacts,
} from '@process/services/constitution/constitutionArchiveRestoreAuthority';
import { createConstitutionRequestFingerprint } from '@process/services/constitution/constitutionRequestFingerprint';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';

const backend: ConstitutionArchiveSecretBackend = {
  encryptString: (plaintext) => `fenc:v1:${Buffer.from(plaintext, 'utf8').toString('base64')}`,
  decryptString: (ciphertext) => Buffer.from(ciphertext.slice('fenc:v1:'.length), 'base64').toString('utf8'),
};

const fixedNow = () => new Date('2026-07-17T01:02:03.004Z');

function authorityPath(): string {
  return path.join(mkdtempSync(path.join(os.tmpdir(), 'constitution-restore-authority-')), 'authority.enc');
}

function facts(
  overrides: Partial<ConstitutionArchiveRestoreOperationFacts> = {}
): ConstitutionArchiveRestoreOperationFacts {
  return {
    operationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    principalBinding: createHostedRestorePrincipalBinding('production', 'user-42'),
    archiveId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    expectedArchiveRevision: 'rev:v2:archive-preview',
    expectedRevision: 'rev:v2:live-target',
    target: { kind: 'constitution', sourceName: 'CONSTITUTION.md' },
    contentSha256: `sha256:${'1'.repeat(64)}`,
    ...overrides,
  };
}

describe('ConstitutionArchiveRestoreOperationAuthority', () => {
  it('derives canonical principal, process, and native bindings and persists no password or prose', () => {
    const file = authorityPath();
    const authority = new ConstitutionArchiveRestoreOperationAuthority(file, backend, { now: fixedNow });
    const input = facts();
    const record = authority.reserve(input);

    expect(record).toEqual({
      contract: CONSTITUTION_ARCHIVE_RESTORE_OPERATION_CONTRACT,
      ...input,
      processRequestFingerprint: createConstitutionArchiveRestoreProcessFingerprint(input),
      nativeRequestFingerprint: createConstitutionRequestFingerprint({
        intent: 'restore',
        target: input.target,
        contentSha256: input.contentSha256,
        expectedRevision: input.expectedRevision,
        archiveIdentity: input.archiveId,
      }),
      nativeRequestId: input.operationId,
      createdAt: '2026-07-17T01:02:03.004Z',
      state: 'prepared',
    });
    const plaintext = backend.decryptString(readFileSync(file, 'utf8'));
    expect(plaintext).not.toContain('password');
    expect(plaintext).not.toContain('archived prose');

    const restarted = new ConstitutionArchiveRestoreOperationAuthority(file, backend, { now: fixedNow });
    expect(restarted.lookup(input.operationId, input.principalBinding)).toEqual(record);
    expect(restarted.reserve(input)).toEqual(record);
  });

  it('preserves global UUID ownership without revealing a mismatched principal', () => {
    const file = authorityPath();
    const authority = new ConstitutionArchiveRestoreOperationAuthority(file, backend);
    const input = facts();
    authority.reserve(input);

    expect(() => authority.reserve({ ...input, expectedRevision: 'rev:v2:changed' })).toThrowError(
      expect.objectContaining({ code: 'CONFLICT' })
    );
    const wrongPrincipal = createHostedRestorePrincipalBinding('production', 'someone-else');
    expect(() => authority.lookup(input.operationId, wrongPrincipal)).toThrowError(
      expect.objectContaining({ code: 'OPERATION_NOT_FOUND' })
    );
    expect(() => authority.reserve({ ...input, principalBinding: wrongPrincipal })).toThrowError(
      expect.objectContaining({ code: 'OPERATION_NOT_FOUND' })
    );
  });

  it('durably marks dispatch before invocation and leaves ambiguous crashes replayable', () => {
    const file = authorityPath();
    const authority = new ConstitutionArchiveRestoreOperationAuthority(file, backend);
    const input = facts();
    authority.reserve(input);

    expect(() =>
      authority.dispatch(input.operationId, input.principalBinding, () => {
        const state = JSON.parse(backend.decryptString(readFileSync(file, 'utf8'))) as {
          records: Array<{ state: string }>;
        };
        expect(state.records[0]?.state).toBe('dispatched');
        throw new Error('injected response-loss crash');
      })
    ).toThrow('injected response-loss crash');

    const restarted = new ConstitutionArchiveRestoreOperationAuthority(file, backend);
    expect(restarted.lookup(input.operationId, input.principalBinding)).toMatchObject({ state: 'dispatched' });
    const result = restarted.dispatch(input.operationId, input.principalBinding, (record) => ({
      outcome: 'committed',
      value: record.nativeRequestFingerprint,
    }));
    expect(result).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(restarted.lookup(input.operationId, input.principalBinding)).toMatchObject({ state: 'committed' });
  });

  it('requires explicit cancellation plus exact Native not_found before permanent abandonment', () => {
    const file = authorityPath();
    const authority = new ConstitutionArchiveRestoreOperationAuthority(file, backend, {
      now: () => new Date('2026-07-17T01:02:03.004Z'),
    });
    const input = facts();
    const record = authority.reserve(input);
    const tombstone = authority.abandonPrepared(
      input.operationId,
      input.principalBinding,
      { kind: 'explicit-cancellation' },
      (identity) => {
        expect(identity).toEqual({
          requestId: record.nativeRequestId,
          requestFingerprint: record.nativeRequestFingerprint,
        });
        return { outcome: 'not_found' };
      }
    );

    expect(tombstone).toEqual({
      contract: 'wayland-constitution-archive-restore-operation-tombstone/1.0',
      operationId: input.operationId,
      principalBindingSha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      processRequestFingerprint: record.processRequestFingerprint,
      createdAt: record.createdAt,
      terminalizedAt: '2026-07-17T01:02:03.004Z',
      outcome: 'abandoned',
    });

    expect(() => authority.lookup(input.operationId, input.principalBinding)).toThrowError(
      expect.objectContaining({ code: 'OPERATION_ABANDONED' })
    );
    expect(() => authority.reserve(input)).toThrowError(expect.objectContaining({ code: 'OPERATION_ABANDONED' }));
  });

  it('enforces the 30-day expiry boundary before performing Native lookup', () => {
    const file = authorityPath();
    let current = Date.parse('2026-07-17T01:02:03.004Z');
    const authority = new ConstitutionArchiveRestoreOperationAuthority(file, backend, {
      now: () => new Date(current),
    });
    const input = facts();
    authority.reserve(input);
    let lookupCount = 0;
    const lookupNative = () => {
      lookupCount += 1;
      return { outcome: 'not_found' as const };
    };

    current += 30 * 24 * 60 * 60 * 1000 - 1;
    expect(() =>
      authority.abandonPrepared(input.operationId, input.principalBinding, { kind: 'expired-prepared' }, lookupNative)
    ).toThrowError(expect.objectContaining({ code: 'CONFLICT' }));
    expect(lookupCount).toBe(0);
    expect(authority.lookup(input.operationId, input.principalBinding)).toMatchObject({ state: 'prepared' });

    current += 1;
    authority.abandonPrepared(input.operationId, input.principalBinding, { kind: 'expired-prepared' }, lookupNative);
    expect(lookupCount).toBe(1);
    expect(() => authority.lookup(input.operationId, input.principalBinding)).toThrowError(
      expect.objectContaining({ code: 'OPERATION_ABANDONED' })
    );
  });

  it('fails closed on non-not_found, malformed, or failed Native lookup without mutating prepared state', () => {
    const cases: Array<{
      name: string;
      lookup: () => never | { outcome: 'rolled_back' } | { outcome: 'committed'; result: unknown };
      expectedMessage?: string;
    }> = [
      { name: 'rolled back', lookup: () => ({ outcome: 'rolled_back' }) },
      { name: 'committed', lookup: () => ({ outcome: 'committed', result: { receiptId: 'claimed' } }) },
      {
        name: 'lookup failure',
        lookup: () => {
          throw new Error('native lookup unavailable');
        },
        expectedMessage: 'native lookup unavailable',
      },
    ];

    for (const testCase of cases) {
      const file = authorityPath();
      const authority = new ConstitutionArchiveRestoreOperationAuthority(file, backend);
      const input = facts();
      authority.reserve(input);
      expect(() =>
        authority.abandonPrepared(
          input.operationId,
          input.principalBinding,
          { kind: 'explicit-cancellation' },
          testCase.lookup
        )
      ).toThrow(testCase.expectedMessage ?? ConstitutionArchiveRestoreAuthorityError);
      expect(authority.lookup(input.operationId, input.principalBinding)).toMatchObject({ state: 'prepared' });
    }

    const file = authorityPath();
    const authority = new ConstitutionArchiveRestoreOperationAuthority(file, backend);
    const input = facts();
    authority.reserve(input);
    expect(() =>
      authority.abandonPrepared(
        input.operationId,
        input.principalBinding,
        { kind: 'explicit-cancellation' },
        () => ({ outcome: 'not_found', unauthenticatedClaim: true }) as never
      )
    ).toThrowError(expect.objectContaining({ code: 'INTEGRITY_FAILURE' }));
    expect(authority.lookup(input.operationId, input.principalBinding)).toMatchObject({ state: 'prepared' });
  });

  it('serializes dispatch and cancellation in both race directions', () => {
    const cancellationFirstFile = authorityPath();
    const cancellationFirst = new ConstitutionArchiveRestoreOperationAuthority(cancellationFirstFile, backend);
    const cancellationInput = facts();
    cancellationFirst.reserve(cancellationInput);
    let nestedDispatchCode: string | undefined;
    cancellationFirst.abandonPrepared(
      cancellationInput.operationId,
      cancellationInput.principalBinding,
      { kind: 'explicit-cancellation' },
      () => {
        try {
          cancellationFirst.dispatch(cancellationInput.operationId, cancellationInput.principalBinding, () => ({
            outcome: 'committed',
            value: undefined,
          }));
        } catch (error) {
          nestedDispatchCode = (error as ConstitutionArchiveRestoreAuthorityError).code;
        }
        return { outcome: 'not_found' };
      }
    );
    expect(nestedDispatchCode).toBe('AUTHORITY_BUSY');
    expect(() =>
      cancellationFirst.lookup(cancellationInput.operationId, cancellationInput.principalBinding)
    ).toThrowError(expect.objectContaining({ code: 'OPERATION_ABANDONED' }));

    const dispatchFirstFile = authorityPath();
    const dispatchFirst = new ConstitutionArchiveRestoreOperationAuthority(dispatchFirstFile, backend);
    const dispatchInput = facts();
    dispatchFirst.reserve(dispatchInput);
    let nestedCancellationCode: string | undefined;
    dispatchFirst.dispatch(dispatchInput.operationId, dispatchInput.principalBinding, () => {
      try {
        dispatchFirst.abandonPrepared(
          dispatchInput.operationId,
          dispatchInput.principalBinding,
          { kind: 'explicit-cancellation' },
          () => ({ outcome: 'not_found' })
        );
      } catch (error) {
        nestedCancellationCode = (error as ConstitutionArchiveRestoreAuthorityError).code;
      }
      return { outcome: 'committed', value: undefined };
    });
    expect(nestedCancellationCode).toBe('AUTHORITY_BUSY');
    expect(dispatchFirst.lookup(dispatchInput.operationId, dispatchInput.principalBinding)).toMatchObject({
      state: 'committed',
    });
  });

  it('preserves the exact 65,536-operation quota when abandonment replaces a record with a tombstone', () => {
    const file = authorityPath();
    const authority = new ConstitutionArchiveRestoreOperationAuthority(file, backend, {
      now: () => new Date('2026-07-17T01:02:03.004Z'),
    });
    const input = facts();
    authority.reserve(input);
    const state = JSON.parse(backend.decryptString(readFileSync(file, 'utf8'))) as {
      records: unknown[];
      tombstones: unknown[];
    };
    const principalBindingSha256 = `sha256:${'2'.repeat(64)}`;
    const processRequestFingerprint = `sha256:${'3'.repeat(64)}`;
    state.tombstones = Array.from({ length: 65_535 }, (_, index) => ({
      contract: 'wayland-constitution-archive-restore-operation-tombstone/1.0',
      operationId: `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`,
      principalBindingSha256,
      processRequestFingerprint,
      createdAt: '2026-06-17T01:02:03.004Z',
      terminalizedAt: '2026-07-17T01:02:03.004Z',
      outcome: 'abandoned',
    }));
    writeFileSync(file, backend.encryptString(JSON.stringify(state)), 'utf8');

    authority.abandonPrepared(input.operationId, input.principalBinding, { kind: 'explicit-cancellation' }, () => ({
      outcome: 'not_found',
    }));
    const atBoundary = JSON.parse(backend.decryptString(readFileSync(file, 'utf8'))) as {
      records: unknown[];
      tombstones: unknown[];
    };
    expect(atBoundary.records).toHaveLength(0);
    expect(atBoundary.tombstones).toHaveLength(65_536);

    const beforeRejectedReservation = readFileSync(file, 'utf8');
    expect(() =>
      authority.reserve(
        facts({
          operationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          archiveId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        })
      )
    ).toThrowError(expect.objectContaining({ code: 'OPERATION_AUTHORITY_FULL' }));
    expect(readFileSync(file, 'utf8')).toBe(beforeRejectedReservation);
  });

  it('fails closed when encrypted authority bytes are corrupt or structurally forged', () => {
    const file = authorityPath();
    const authority = new ConstitutionArchiveRestoreOperationAuthority(file, backend);
    const input = facts();
    authority.reserve(input);

    writeFileSync(file, 'fenc:v1:not-base64', 'utf8');
    expect(() => authority.lookup(input.operationId, input.principalBinding)).toThrowError(
      expect.objectContaining({ code: 'INTEGRITY_FAILURE' })
    );
  });

  it('persists one OS-vault-backed desktop installation identity across restarts', () => {
    const file = authorityPath();
    const first = new ConstitutionArchiveRestoreOperationAuthority(file, backend);
    const binding = first.desktopPrincipalBinding();
    expect(binding).toEqual({
      kind: 'desktop-installation',
      installationId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
    expect(new ConstitutionArchiveRestoreOperationAuthority(file, backend).desktopPrincipalBinding()).toEqual(binding);
  });

  it('uses a typed error surface for invalid operation identifiers', () => {
    const authority = new ConstitutionArchiveRestoreOperationAuthority(authorityPath(), backend);
    expect(() => authority.lookup('not-a-uuid', facts().principalBinding)).toThrow(
      ConstitutionArchiveRestoreAuthorityError
    );
  });
});
