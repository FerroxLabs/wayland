import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  recoveryProtection,
  serializeTransferContainerRecord,
  TRANSFER_CHUNK_SCHEMA,
  TRANSFER_CONTAINER_CONTRACT,
  TRANSFER_CONTAINER_FORMAT_VERSION,
  TRANSFER_RECOVERY_SUITE,
  TransferContainerStreamValidator,
  transferCiphertextDigest,
  type TransferChunkDescriptor,
  type TransferContainerHeader,
  type TransferContainerTerminal,
} from '@process/services/transfer/container';
import {
  createSourceAuthorizationRecord,
  sourceScopeForGraph,
  SourceSigningAuthority,
  validateTransferPublication,
  type SourceAuthorizationValidationPolicy,
  type TransferPublication,
  type TransferPublicationContainerRecord,
} from '@process/services/transfer/publish';
import {
  NODE_TRANSFER_ARCHIVE_FILE_SYSTEM,
  publishTransferArchive,
  TRANSFER_ARCHIVE_PUBLICATION_CONTRACT,
  type TransferArchiveFileSystem,
} from '@process/services/transfer/archive';
import { readTransferZip64 } from '@process/services/transfer/transport';

const NOW = 1_784_413_200_000;
const ARCHIVE_ID = '0123456789abcdef0123456789abcdef';
const ARCHIVE_NAME = `transfer-${ARCHIVE_ID}.wayland-transfer.zip`;
const SOURCE_AUTHORITY = SourceSigningAuthority.issue();
const SEMANTIC_GRAPH_SHA256 = `sha256:${'a'.repeat(64)}` as const;
const BUNDLE_ID = `wtb1:${'a'.repeat(64)}`;
const MUTATION_EPOCH = { start: 'process-config:42', end: 'process-config:42' } as const;
const SOURCE_SCOPE = sourceScopeForGraph(
  SEMANTIC_GRAPH_SHA256,
  BUNDLE_ID,
  ['desktop.preferences'],
  [],
  MUTATION_EPOCH,
  { mode: 'recovery', recoveryMode: 'passphrase' }
);
const SOURCE_POLICY: SourceAuthorizationValidationPolicy = {
  trustedAuthority: SOURCE_AUTHORITY.descriptor(),
  expectedScope: SOURCE_SCOPE,
  now: () => NOW,
};

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

const digest = (value: string): `sha256:${string}` => `sha256:${createHash('sha256').update(value).digest('hex')}`;

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'wayland-transfer-archive-'));
  directories.push(directory);
  return directory;
}

function fixture(): TransferPublication {
  const ciphertext = Buffer.alloc(32, 0x41);
  const header: TransferContainerHeader = {
    recordType: 'header',
    contract: TRANSFER_CONTAINER_CONTRACT,
    formatVersion: TRANSFER_CONTAINER_FORMAT_VERSION,
    bundleId: BUNDLE_ID,
    suite: TRANSFER_RECOVERY_SUITE,
    declaredChunkCount: 1,
    declaredCiphertextBytes: ciphertext.length,
    declaredPlaintextBytes: 16,
    protection: recoveryProtection(Buffer.alloc(16, 0x22)),
  };
  const descriptor: TransferChunkDescriptor = {
    recordType: 'chunk',
    bundleId: header.bundleId,
    schema: TRANSFER_CHUNK_SCHEMA,
    ordinal: 0,
    plaintextLength: 16,
    ciphertextLength: ciphertext.length,
    contentDigest: digest('plaintext-0'),
    ciphertextDigest: transferCiphertextDigest(ciphertext),
    nonce: Buffer.alloc(24, 1).toString('base64url'),
  };
  const headerBytes = serializeTransferContainerRecord(header);
  const descriptorBytes = serializeTransferContainerRecord(descriptor);
  const validator = new TransferContainerStreamValidator(header);
  validator.acceptChunk(descriptorBytes, ciphertext);
  const terminal: TransferContainerTerminal = {
    recordType: 'terminal',
    bundleId: header.bundleId,
    chunkCount: 1,
    plaintextBytes: 16,
    ciphertextBytes: ciphertext.length,
    streamDigest: validator.currentStreamDigest(),
  };
  const terminalBytes = serializeTransferContainerRecord(terminal);
  validator.acceptTerminal(terminalBytes);
  validator.finish();
  const containerRecords: readonly TransferPublicationContainerRecord[] = [
    { recordType: 'header', serialized: headerBytes },
    { recordType: 'chunk', descriptor: descriptorBytes, ciphertext },
    { recordType: 'terminal', serialized: terminalBytes },
  ];
  const sourceAuthorization = createSourceAuthorizationRecord(
    containerRecords,
    header,
    terminal,
    SOURCE_SCOPE,
    { authority: SOURCE_AUTHORITY, mutationEpoch: MUTATION_EPOCH, expiresAt: NOW + 60_000 },
    NOW
  );
  const records = Object.freeze([...containerRecords, sourceAuthorization]);
  return Object.freeze({ records, supportReceipt: validateTransferPublication(records, SOURCE_POLICY) });
}

function fileSystem(overrides: Partial<TransferArchiveFileSystem>): TransferArchiveFileSystem {
  return { ...NODE_TRANSFER_ARCHIVE_FILE_SYSTEM, ...overrides };
}

function input(directory: string, overrides: Partial<Parameters<typeof publishTransferArchive>[0]> = {}) {
  return {
    publication: fixture(),
    sourcePolicy: SOURCE_POLICY,
    directory,
    idFactory: () => ARCHIVE_ID,
    ...overrides,
  };
}

describe('atomic signed transfer archive publication', () => {
  it('stages, reopens, verifies, and atomically publishes exact bytes', async () => {
    const directory = await temporaryDirectory();
    const receipt = await publishTransferArchive(input(directory));
    const names = await readdir(directory);
    expect(names).toEqual([ARCHIVE_NAME]);
    const bytes = await readFile(join(directory, ARCHIVE_NAME));
    const reopened = readTransferZip64(bytes, SOURCE_POLICY);
    expect(receipt).toEqual({
      contract: TRANSFER_ARCHIVE_PUBLICATION_CONTRACT,
      archiveName: ARCHIVE_NAME,
      archive: reopened.receipt,
      publication: reopened.records.validatedPublication,
      sourceAuthorizationSha256: reopened.records.sourceAuthorizationSha256,
    });
    expect(JSON.stringify(receipt)).not.toMatch(/desktop\.preferences|user|project|chat|secret/i);
    expect(names.some((name) => name.endsWith('.partial'))).toBe(false);
  });

  it('cleans staging after a partial write', async () => {
    const directory = await temporaryDirectory();
    const base = NODE_TRANSFER_ARCHIVE_FILE_SYSTEM;
    let writes = 0;
    const broken = fileSystem({
      async openExclusive(targetDirectory, name) {
        const handle = await base.openExclusive(targetDirectory, name);
        return {
          ...handle,
          async write(bytes) {
            writes += 1;
            if (writes === 2) throw new Error('partial write');
            await handle.write(bytes);
          },
        };
      },
    });
    await expect(publishTransferArchive(input(directory, { fileSystem: broken }))).rejects.toThrow(/partial write/i);
    expect(await readdir(directory)).toEqual([]);
  });

  it('cleans staging after a low-disk failure', async () => {
    const directory = await temporaryDirectory();
    const base = NODE_TRANSFER_ARCHIVE_FILE_SYSTEM;
    const noSpace = fileSystem({
      async openExclusive(targetDirectory, name) {
        const handle = await base.openExclusive(targetDirectory, name);
        return {
          ...handle,
          async write() {
            const error = new Error('no space') as NodeJS.ErrnoException;
            error.code = 'ENOSPC';
            throw error;
          },
        };
      },
    });
    await expect(publishTransferArchive(input(directory, { fileSystem: noSpace }))).rejects.toMatchObject({
      code: 'ENOSPC',
    });
    expect(await readdir(directory)).toEqual([]);
  });

  it('snapshots publication records before asynchronous writes', async () => {
    const directory = await temporaryDirectory();
    const publication = fixture();
    const header = publication.records[0];
    if (!header || header.recordType !== 'header') throw new Error('test fixture header missing');
    const base = NODE_TRANSFER_ARCHIVE_FILE_SYSTEM;
    let mutated = false;
    const mutating = fileSystem({
      async openExclusive(targetDirectory, name) {
        const handle = await base.openExclusive(targetDirectory, name);
        return {
          ...handle,
          async write(bytes) {
            if (!mutated) {
              mutated = true;
              header.serialized[0] ^= 0xff;
            }
            await handle.write(bytes);
          },
        };
      },
    });
    const receipt = await publishTransferArchive(input(directory, { publication, fileSystem: mutating }));
    expect(receipt.archiveName).toBe(ARCHIVE_NAME);
    expect(await readdir(directory)).toEqual([ARCHIVE_NAME]);
  });

  it('rejects staged-byte drift and removes the unreadable candidate', async () => {
    const directory = await temporaryDirectory();
    const base = NODE_TRANSFER_ARCHIVE_FILE_SYSTEM;
    const drifting = fileSystem({
      async readFile(targetDirectory, name) {
        const bytes = await base.readFile(targetDirectory, name);
        bytes[0] ^= 0xff;
        return bytes;
      },
    });
    await expect(publishTransferArchive(input(directory, { fileSystem: drifting }))).rejects.toThrow();
    expect(await readdir(directory)).toEqual([]);
  });

  it('rejects an untrusted signing policy and cleans staging', async () => {
    const directory = await temporaryDirectory();
    const wrongPolicy = {
      ...SOURCE_POLICY,
      trustedAuthority: SourceSigningAuthority.issue().descriptor(),
    };
    await expect(publishTransferArchive(input(directory, { sourcePolicy: wrongPolicy }))).rejects.toThrow(
      /authority.*trusted/i
    );
    expect(await readdir(directory)).toEqual([]);
  });

  it('never overwrites an existing destination', async () => {
    const directory = await temporaryDirectory();
    const existing = Buffer.from('existing archive');
    await writeFile(join(directory, ARCHIVE_NAME), existing, { mode: 0o600 });
    await expect(publishTransferArchive(input(directory))).rejects.toMatchObject({ code: 'EEXIST' });
    expect(await readFile(join(directory, ARCHIVE_NAME))).toEqual(existing);
    expect(await readdir(directory)).toEqual([ARCHIVE_NAME]);
  });

  it('cleans staging after atomic promotion failure', async () => {
    const directory = await temporaryDirectory();
    const promotionFailure = fileSystem({
      async renameNoReplace() {
        throw new Error('promotion failed');
      },
    });
    await expect(publishTransferArchive(input(directory, { fileSystem: promotionFailure }))).rejects.toThrow(
      /promotion failed/i
    );
    expect(await readdir(directory)).toEqual([]);
  });

  it('cleans staging when cancelled before promotion', async () => {
    const directory = await temporaryDirectory();
    const controller = new AbortController();
    const base = NODE_TRANSFER_ARCHIVE_FILE_SYSTEM;
    const cancelling = fileSystem({
      async readFile(targetDirectory, name) {
        const bytes = await base.readFile(targetDirectory, name);
        controller.abort();
        return bytes;
      },
    });
    await expect(
      publishTransferArchive(input(directory, { fileSystem: cancelling, signal: controller.signal }))
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(await readdir(directory)).toEqual([]);
  });

  it('rejects duplicate, missing, and reordered outer records before publication', async () => {
    const directory = await temporaryDirectory();
    const valid = fixture();
    const header = valid.records[0]!;
    const chunk = valid.records[1]!;
    const terminal = valid.records[2]!;
    const authorization = valid.records[3]!;
    const malformed = [
      [header, header, chunk, terminal, authorization],
      [header, chunk, authorization],
      [header, terminal, chunk, authorization],
      [header, chunk, terminal, authorization, authorization],
    ];
    for (const records of malformed) {
      // Each malformed case is independent but shares one empty destination.
      // oxlint-disable-next-line no-await-in-loop
      await expect(publishTransferArchive(input(directory, { publication: { ...valid, records } }))).rejects.toThrow(
        /duplicate|reordered|missing|incomplete/i
      );
    }
    expect(await readdir(directory)).toEqual([]);
  });
});
