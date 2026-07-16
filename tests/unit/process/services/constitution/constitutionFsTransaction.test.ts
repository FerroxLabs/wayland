import { createHash } from 'node:crypto';
import { chmodSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createTestOnlyConstitutionFsBinaryAuthority,
  verifyConstitutionFsBinary,
} from '@process/services/constitution/constitutionFsBinary';
import {
  ConstitutionFsTransactionError,
  createAuthenticatedConstitutionArchive,
  createConstitutionSealKey,
  createTestOnlyConstitutionArchiveAuthenticationKeyInventory,
  inventoryConstitutionSealKeys,
  inventoryConstitutionFsArchives,
  inventoryConstitutionFsLiveTargets,
  pinConstitutionFsRootAuthority,
  readConstitutionSealKey,
  readConstitutionFsArchive,
  readConstitutionFsTarget,
  reconcileConstitutionFsTransaction,
  runConstitutionFsTransaction,
  type ConstitutionFsExecutor,
  type ConstitutionFsReconcileRequest,
  type ConstitutionFsTransactionRequest,
} from '@process/services/constitution/constitutionFsTransaction';

const tx = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const journalKey = Buffer.alloc(32, 42);
const archiveKeyId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const archiveKey = Buffer.alloc(32, 73);

function binaryFixture(script: string | Buffer = '#!/bin/sh\nexit 0\n') {
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-fs-runner-'));
  const binaryPath = path.join(installRoot, 'wayland-constitution-fs');
  const manifestPath = path.join(installRoot, 'manifest.json');
  const bytes = Buffer.isBuffer(script) ? script : Buffer.from(script);
  const sha256 = `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
  writeFileSync(binaryPath, bytes);
  chmodSync(binaryPath, 0o700);
  writeFileSync(manifestPath, JSON.stringify({
    schemaVersion: 1,
    protocolVersion: 1,
    platform: process.platform,
    arch: process.arch,
    binary: { fileName: path.basename(binaryPath), sha256, size: bytes.byteLength },
  }));
  const authority = createTestOnlyConstitutionFsBinaryAuthority({
    sha256,
    size: bytes.byteLength,
    platform: process.platform,
    arch: process.arch,
    fileName: path.basename(binaryPath),
    installRoot,
    packaged: false,
  });
  return { binaryPath, verified: verifyConstitutionFsBinary({ binaryPath, manifestPath, authority }) };
}

function requestFixture(): { root: string; request: ConstitutionFsTransactionRequest; rootAuthority: ReturnType<typeof pinConstitutionFsRootAuthority> } {
  const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-fs-root-'));
  return {
    root,
    rootAuthority: pinConstitutionFsRootAuthority(root),
    request: {
      version: 1,
      transactionId: tx,
      root,
      operation: 'replace',
      target: { kind: 'constitution', sourceName: 'CONSTITUTION.md' },
      expected: { present: false },
      replacement: { contentBase64: 'bmV3', sha256: 'sha256:11507a0e2f5e69d5dfa40a62a1bd7b6ee57e6bcd85c67c9b8431b36fff21c437' },
    },
  };
}

const guarantees = {
  anchored: true,
  rootIdentityBound: true,
  reparseRejected: true,
  noReplace: true,
  durable: true,
  recoveryRetained: true,
};

function success(request: ConstitutionFsTransactionRequest, overrides: Record<string, unknown> = {}): Buffer {
  return Buffer.from(JSON.stringify({
    ok: true,
    version: 1,
    transactionId: request.transactionId,
    operation: request.operation,
    outcome: 'committed',
    reconcileDisposition: null,
    finalPresent: null,
    finalSha256: null,
    previousSha256: null,
    replacementSha256: request.operation === 'replace' ? request.replacement?.sha256 ?? null : null,
    archiveName: null,
    archivedAt: null,
    recoveryName: null,
    journalName: `${request.transactionId}.jsonl`,
    sealKeyIds: null,
    sealKeyName: null,
    envelopeBase64: null,
    envelopeSha256: null,
    target: request.target,
    expectedSha256: null,
    archiveSha256: null,
    sourceArchiveSha256: null,
    pendingTransactions: null,
    contentBase64: null,
    contentSha256: null,
    inventoryEntries: null,
    guarantees,
    ...overrides,
  }));
}

function options(rootAuthority: ReturnType<typeof pinConstitutionFsRootAuthority>, executor?: ConstitutionFsExecutor) {
  return { rootAuthority, journalAuthenticationKey: journalKey, executor };
}

function archiveInventory() {
  return createTestOnlyConstitutionArchiveAuthenticationKeyInventory([
    { keyId: archiveKeyId, key: archiveKey },
    { keyId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', key: Buffer.alloc(32, 17) },
  ]);
}

describe('Constitution filesystem transaction wrapper', () => {
  it('accepts only an exact request-bound receipt', () => {
    const { verified } = binaryFixture();
    const { request, rootAuthority } = requestFixture();
    const receipt = runConstitutionFsTransaction(request, verified, options(rootAuthority, () => ({ stdout: success(request), status: 0 })));
    expect(receipt.journalName).toBe(`${tx}.jsonl`);
  });

  it.each([
    ['previousSha256', 'sha256:0000000000000000000000000000000000000000000000000000000000000000'],
    ['replacementSha256', 'sha256:0000000000000000000000000000000000000000000000000000000000000000'],
    ['archiveName', 'other.json'],
    ['recoveryName', 'other.displaced'],
    ['journalName', 'other.jsonl'],
  ])('rejects a well-formed but wrong %s', (field, wrong) => {
    const { verified } = binaryFixture();
    const { request, rootAuthority } = requestFixture();
    expect(() => runConstitutionFsTransaction(request, verified, options(rootAuthority, () => ({ stdout: success(request, { [field]: wrong }), status: 0 })))).toThrowError(
      expect.objectContaining<Partial<ConstitutionFsTransactionError>>({ code: 'CONSTITUTION_FS_GUARANTEE_REJECTED' })
    );
  });

  it('rejects a swapped initialization-time root before executing', () => {
    const { verified } = binaryFixture();
    const { root, request, rootAuthority } = requestFixture();
    renameSync(root, `${root}-old`);
    const replacement = mkdtempSync(path.join(path.dirname(root), 'constitution-fs-root-swap-'));
    renameSync(replacement, root);
    expect(() => runConstitutionFsTransaction(request, verified, options(rootAuthority, () => ({ stdout: success(request), status: 0 })))).toThrowError(
      expect.objectContaining<Partial<ConstitutionFsTransactionError>>({ code: 'CONSTITUTION_FS_ROOT_IDENTITY_MISMATCH' })
    );
  });

  it('rejects false guarantees, malformed output, oversized output, and stable helper errors', () => {
    const { verified } = binaryFixture();
    const { request, rootAuthority } = requestFixture();
    expect(() => runConstitutionFsTransaction(request, verified, options(rootAuthority, () => ({ stdout: success(request, { guarantees: { ...guarantees, durable: false } }), status: 0 })))).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_GUARANTEE_REJECTED' }));
    expect(() => runConstitutionFsTransaction(request, verified, options(rootAuthority, () => ({ stdout: Buffer.from('nope'), status: 0 })))).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_MALFORMED_RESPONSE' }));
    expect(() => runConstitutionFsTransaction(request, verified, options(rootAuthority, () => ({ stdout: Buffer.alloc(65_537), status: 0 })))).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_RESPONSE_OVERSIZE' }));
    expect(() => runConstitutionFsTransaction(request, verified, options(rootAuthority, () => ({ stdout: Buffer.from(JSON.stringify({ ok: false, version: 1, code: 'CONSTITUTION_FS_CONFLICT', message: 'changed' })), status: 2 })))).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' }));
  });

  it('reverifies the held binary immediately before execution', () => {
    const fixture = binaryFixture();
    const { request, rootAuthority } = requestFixture();
    writeFileSync(fixture.binaryPath, 'tampered');
    expect(() => runConstitutionFsTransaction(request, fixture.verified, options(rootAuthority, () => ({ stdout: success(request), status: 0 })))).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_BINARY_UNVERIFIED' }));
  });

  it('injects the exact trusted archive-key inventory only for archive-bearing operations without exposing raw keys in receipts', () => {
    const { verified } = binaryFixture();
    const { root, rootAuthority } = requestFixture();
    const inventory = archiveInventory();
    const target = { kind: 'constitution', sourceName: 'CONSTITUTION.md' } as const;
    const previous = Buffer.from('old');
    const previousSha256 = `sha256:${createHash('sha256').update(previous).digest('hex')}` as const;
    const archiveId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const archive = createAuthenticatedConstitutionArchive({
      archiveId,
      archivedAt: 1_784_073_600_000,
      target,
      content: previous.toString('utf8'),
      keyId: archiveKeyId,
    }, inventory);
    const request: ConstitutionFsTransactionRequest = {
      version: 1,
      transactionId: tx,
      root,
      operation: 'replace',
      target,
      expected: { present: true, sha256: previousSha256 },
      replacement: { contentBase64: 'bmV3', sha256: 'sha256:11507a0e2f5e69d5dfa40a62a1bd7b6ee57e6bcd85c67c9b8431b36fff21c437' },
      archiveId,
      archivedAt: 1_784_073_600_000,
      archive,
    };
    const executor: ConstitutionFsExecutor = ({ stdin }) => {
      const wire = JSON.parse(stdin.toString('utf8')) as Record<string, unknown>;
      expect(wire.archiveAuthenticationKeys).toEqual([
        { keyId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', keyBase64: Buffer.alloc(32, 17).toString('base64') },
        { keyId: archiveKeyId, keyBase64: archiveKey.toString('base64') },
      ]);
      return {
        stdout: success(request, {
          previousSha256,
          archiveName: `${archiveId}.json`,
          archivedAt: 1_784_073_600_000,
          recoveryName: `${tx}.displaced`,
          expectedSha256: previousSha256,
          archiveSha256: archive.sha256,
        }),
        status: 0,
      };
    };
    const receipt = runConstitutionFsTransaction(request, verified, {
      ...options(rootAuthority, executor),
      archiveAuthenticationKeys: inventory,
    });
    expect(JSON.stringify(inventory)).not.toContain(archiveKey.toString('base64'));
    expect(JSON.stringify(receipt)).not.toContain(archiveKey.toString('base64'));
  });

  it('executes a real compiled helper through the verified TypeScript boundary', () => {
    const helperPath = path.join(process.cwd(), 'native', 'constitution-fs', 'target', 'debug', 'wayland-constitution-fs');
    const { verified } = binaryFixture(readFileSync(helperPath));
    const { root, request, rootAuthority } = requestFixture();
    const receipt = runConstitutionFsTransaction(request, verified, {
      rootAuthority,
      journalAuthenticationKey: journalKey,
    });
    expect(receipt.reconcileDisposition).toBeNull();
    expect(readFileSync(path.join(root, 'CONSTITUTION.md'), 'utf8')).toBe('new');
  });

  it('fails closed before execution when an archive-bearing operation lacks trusted keys', () => {
    const { verified } = binaryFixture();
    const { root, rootAuthority } = requestFixture();
    const request: ConstitutionFsTransactionRequest = {
      version: 1,
      transactionId: tx,
      root,
      operation: 'delete',
      target: { kind: 'constitution', sourceName: 'CONSTITUTION.md' },
      expected: { present: true, sha256: 'sha256:11507a0e2f5e69d5dfa40a62a1bd7b6ee57e6bcd85c67c9b8431b36fff21c437' },
      archiveId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      archivedAt: 1,
      archive: { contentBase64: 'e30=', sha256: 'sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a' },
    };
    const executor = vi.fn<ConstitutionFsExecutor>();
    expect(() => runConstitutionFsTransaction(request, verified, options(rootAuthority, executor))).toThrowError(
      expect.objectContaining({ code: 'CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE' })
    );
    expect(executor).not.toHaveBeenCalled();
  });
});

describe('Constitution reconciliation receipt binding', () => {
  it('requires roll-forward artifacts and final live state, while allowing an exact early rollback', () => {
    const { verified } = binaryFixture();
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-reconcile-'));
    const rootAuthority = pinConstitutionFsRootAuthority(root);
    const previousSha256 = 'sha256:cba06b5736faf67e54b07b561eae94395e774c517a7d910a54369e1263ccfbd4' as const;
    const replacementSha256 = 'sha256:11507a0e2f5e69d5dfa40a62a1bd7b6ee57e6bcd85c67c9b8431b36fff21c437' as const;
    const archiveSha256 = 'sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a' as const;
    const originalTx = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const archiveId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const request: ConstitutionFsReconcileRequest = {
      version: 1,
      transactionId: tx,
      root,
      operation: 'reconcile',
      reconcileTransactionId: originalTx,
      reconcileFacts: {
        operation: 'replace',
        target: { kind: 'constitution', sourceName: 'CONSTITUTION.md' },
        expectedPresent: true,
        expectedSha256: previousSha256,
        replacementSha256,
        archiveId,
        archivedAt: 1_784_073_600_000,
        archiveSha256,
        recoverySha256: previousSha256,
      },
    };
    const receipt = (overrides: Record<string, unknown> = {}) => Buffer.from(JSON.stringify({
      ok: true, version: 1, transactionId: tx, operation: 'reconcile', outcome: 'committed',
      archivedAt: 1_784_073_600_000, reconcileDisposition: 'rolled_forward', finalPresent: true, finalSha256: replacementSha256,
      previousSha256, replacementSha256, archiveName: `${archiveId}.json`, recoveryName: `${originalTx}.displaced`,
      journalName: `${originalTx}.jsonl`, sealKeyIds: null, sealKeyName: null, envelopeBase64: null, envelopeSha256: null,
      target: request.reconcileFacts.target, expectedSha256: previousSha256, archiveSha256, sourceArchiveSha256: null,
      pendingTransactions: null, contentBase64: null, contentSha256: null, inventoryEntries: null, guarantees, ...overrides,
    }));
    const run = (overrides?: Record<string, unknown>) => reconcileConstitutionFsTransaction(request, verified, {
      rootAuthority,
      journalAuthenticationKey: journalKey,
      archiveAuthenticationKeys: archiveInventory(),
      executor: () => ({ stdout: receipt(overrides), status: 0 }),
    });
    expect(run().reconcileDisposition).toBe('rolled_forward');
    expect(() => run({ archiveName: null, archivedAt: null, archiveSha256: null })).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_GUARANTEE_REJECTED' }));
    expect(() => run({ recoveryName: null })).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_GUARANTEE_REJECTED' }));
    expect(() => run({ finalSha256: previousSha256 })).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_GUARANTEE_REJECTED' }));
    expect(run({
      reconcileDisposition: 'rolled_back',
      finalSha256: previousSha256,
      archiveName: null,
      archivedAt: null,
      archiveSha256: null,
      recoveryName: null,
    }).reconcileDisposition).toBe('rolled_back');
  });
});

function sealReceipt(operation: string, overrides: Record<string, unknown>) {
  return Buffer.from(JSON.stringify({
    ok: true, version: 1, transactionId: tx, operation, outcome: 'committed',
    reconcileDisposition: null, finalPresent: null, finalSha256: null,
    previousSha256: null, replacementSha256: null, archiveName: null, recoveryName: null, journalName: null,
    archivedAt: null,
    sealKeyIds: null, sealKeyName: null, envelopeBase64: null, envelopeSha256: null,
    target: null, expectedSha256: null, archiveSha256: null, sourceArchiveSha256: null, pendingTransactions: null,
    contentBase64: null, contentSha256: null, inventoryEntries: null,
    guarantees, ...overrides,
  }));
}

describe('Constitution seal-key wrapper', () => {
  it('binds inventory, read, and exclusive-create receipts exactly', () => {
    const { verified } = binaryFixture();
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-seals-'));
    const rootAuthority = pinConstitutionFsRootAuthority(root);
    const keyId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    expect(inventoryConstitutionSealKeys(root, tx, verified, { rootAuthority, executor: () => ({ stdout: sealReceipt('seal_key_inventory', { sealKeyIds: [keyId] }), status: 0 }) })).toEqual([keyId]);
    const envelope = Buffer.from('encrypted');
    const digest = `sha256:${createHash('sha256').update(envelope).digest('hex')}`;
    expect(readConstitutionSealKey(root, tx, keyId, verified, { rootAuthority, executor: () => ({ stdout: sealReceipt('seal_key_read', { sealKeyName: `${keyId}.json`, envelopeBase64: envelope.toString('base64'), envelopeSha256: digest }), status: 0 }) }).envelope).toEqual(envelope);
    expect(() => createConstitutionSealKey(root, tx, keyId, envelope, verified, { rootAuthority, executor: () => ({ stdout: sealReceipt('seal_key_create', { sealKeyName: `${keyId}.json`, envelopeSha256: digest }), status: 0 }) })).not.toThrow();
  });
});

describe('Constitution read-only wrapper', () => {
  it('binds anchored live bytes and sorted inventories', () => {
    const { verified } = binaryFixture();
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-reads-'));
    const rootAuthority = pinConstitutionFsRootAuthority(root);
    const target = { kind: 'constitution', sourceName: 'CONSTITUTION.md' } as const;
    const content = Buffer.from('rules');
    const digest = `sha256:${createHash('sha256').update(content).digest('hex')}`;
    const base = {
      ok: true, version: 1, transactionId: tx, outcome: 'committed', previousSha256: null,
      reconcileDisposition: null, finalPresent: null, finalSha256: null,
      replacementSha256: null, archiveName: null, recoveryName: null, journalName: null,
      archivedAt: null,
      sealKeyIds: null, sealKeyName: null, envelopeBase64: null, envelopeSha256: null,
      expectedSha256: null, archiveSha256: null, sourceArchiveSha256: null, pendingTransactions: null,
      guarantees,
    };
    const read = readConstitutionFsTarget(root, tx, target, verified, { rootAuthority, executor: () => ({ stdout: Buffer.from(JSON.stringify({ ...base, operation: 'read_live', target, contentBase64: content.toString('base64'), contentSha256: digest, inventoryEntries: null })), status: 0 }) });
    expect(read.content).toEqual(content);
    expect(inventoryConstitutionFsLiveTargets(root, tx, verified, { rootAuthority, executor: () => ({ stdout: Buffer.from(JSON.stringify({ ...base, operation: 'live_inventory', target: null, contentBase64: null, contentSha256: null, inventoryEntries: ['constitution:CONSTITUTION.md'] })), status: 0 }) })).toEqual(['constitution:CONSTITUTION.md']);
    expect(inventoryConstitutionFsArchives(root, tx, verified, { rootAuthority, executor: () => ({ stdout: Buffer.from(JSON.stringify({ ...base, operation: 'archive_inventory', target: null, contentBase64: null, contentSha256: null, inventoryEntries: [] })), status: 0 }) })).toEqual([]);
  });

  it('wires trusted key history into archive reads and binds the returned record', () => {
    const { verified } = binaryFixture();
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-archive-read-'));
    const rootAuthority = pinConstitutionFsRootAuthority(root);
    const inventory = archiveInventory();
    const archiveId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const target = { kind: 'constitution', sourceName: 'CONSTITUTION.md' } as const;
    const archive = createAuthenticatedConstitutionArchive({
      archiveId,
      archivedAt: 1_784_073_600_000,
      target,
      content: 'historic',
      keyId: archiveKeyId,
    }, inventory);
    const record = Buffer.from(archive.contentBase64, 'base64');
    const base = {
      ok: true, version: 1, transactionId: tx, operation: 'read_archive', outcome: 'committed',
      reconcileDisposition: null, finalPresent: null, finalSha256: null,
      previousSha256: null, replacementSha256: null, archiveName: null, recoveryName: null, journalName: null,
      archivedAt: null,
      sealKeyIds: null, sealKeyName: null, envelopeBase64: null, envelopeSha256: null,
      target, expectedSha256: null, archiveSha256: null, sourceArchiveSha256: null, pendingTransactions: null,
      contentBase64: archive.contentBase64, contentSha256: archive.sha256, inventoryEntries: null, guarantees,
    };
    const result = readConstitutionFsArchive(root, tx, archiveId, verified, {
      rootAuthority,
      archiveAuthenticationKeys: inventory,
      executor: ({ stdin, maxResponseBytes }) => {
        expect(maxResponseBytes).toBe(448 * 1024);
        const wire = JSON.parse(stdin.toString('utf8')) as Record<string, unknown>;
        expect(wire.archiveAuthenticationKeys).toHaveLength(2);
        expect(wire).not.toHaveProperty('journalKeyBase64');
        return { stdout: Buffer.from(JSON.stringify(base)), status: 0 };
      },
    });
    expect(result.record).toEqual(record);
    expect(result.sha256).toBe(archive.sha256);
  });

  it('uses operation-specific response caps at the exact boundary and rejects one byte over', () => {
    const { verified } = binaryFixture();
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-read-caps-'));
    const rootAuthority = pinConstitutionFsRootAuthority(root);
    const target = { kind: 'constitution', sourceName: 'CONSTITUTION.md' } as const;
    expect(() => readConstitutionFsTarget(root, tx, target, verified, {
      rootAuthority,
      executor: ({ maxResponseBytes }) => {
        expect(maxResponseBytes).toBe(384 * 1024);
        return { stdout: Buffer.alloc(maxResponseBytes, 0x20), status: 0 };
      },
    })).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_MALFORMED_RESPONSE' }));
    expect(() => readConstitutionFsTarget(root, tx, target, verified, {
      rootAuthority,
      executor: ({ maxResponseBytes }) => ({ stdout: Buffer.alloc(maxResponseBytes + 1), status: 0 }),
    })).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_RESPONSE_OVERSIZE' }));

    const inventory = archiveInventory();
    const archiveId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    expect(() => readConstitutionFsArchive(root, tx, archiveId, verified, {
      rootAuthority,
      archiveAuthenticationKeys: inventory,
      executor: ({ maxResponseBytes }) => {
        expect(maxResponseBytes).toBe(448 * 1024);
        return { stdout: Buffer.alloc(maxResponseBytes, 0x20), status: 0 };
      },
    })).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_MALFORMED_RESPONSE' }));
    expect(() => readConstitutionFsArchive(root, tx, archiveId, verified, {
      rootAuthority,
      archiveAuthenticationKeys: inventory,
      executor: ({ maxResponseBytes }) => ({ stdout: Buffer.alloc(maxResponseBytes + 1), status: 0 }),
    })).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_RESPONSE_OVERSIZE' }));
  });
});
