/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import { constants, link, lstat, open, readFile, realpath, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  TransferPublicationChunkRecord,
  TransferPublicationHeaderRecord,
  TransferPublicationReceipt,
  TransferPublicationTerminalRecord,
  TransferSourceAuthorizationRecord,
} from '../publish';
import {
  readTransferZip64,
  TRANSFER_ZIP64_EXTENSION,
  writeTransferZip64,
  type TransferZip64Input,
  type TransferZip64Receipt,
} from '../transport';
import {
  TRANSFER_ARCHIVE_PUBLICATION_CONTRACT,
  type PublishTransferArchiveInput,
  type TransferArchiveFileSystem,
  type TransferArchivePublicationReceipt,
  type TransferArchiveWritable,
} from './types';

const ARCHIVE_ID = /^[0-9a-f]{32}$/;
const STAGING_SUFFIX = '.partial';

export async function publishTransferArchive(
  input: PublishTransferArchiveInput
): Promise<TransferArchivePublicationReceipt> {
  assertInput(input);
  const fileSystem = input.fileSystem ?? NODE_TRANSFER_ARCHIVE_FILE_SYSTEM;
  const id = (input.idFactory ?? defaultIdFactory)();
  if (!ARCHIVE_ID.test(id)) throw new Error('Transfer archive identifier is invalid');

  const archiveName = `transfer-${id}${TRANSFER_ZIP64_EXTENSION}`;
  const stagingName = `.transfer-${id}${TRANSFER_ZIP64_EXTENSION}${STAGING_SUFFIX}`;
  const directory = await fileSystem.prepareDirectory(input.directory);
  const zipInput = publicationToZip64(input.publication);
  const sourceAuthorizationSha256 = digest(zipInput.sourceAuthorization);
  let handle: TransferArchiveWritable | undefined;
  let stagingExists = false;
  let finalExists = false;

  try {
    assertNotAborted(input.signal);
    handle = await fileSystem.openExclusive(directory, stagingName);
    stagingExists = true;
    const writeReceipt = await writeTransferZip64(zipInput, handle, input.sourcePolicy);
    assertNotAborted(input.signal);
    await handle.sync();
    await handle.close();
    handle = undefined;

    const stagedBytes = await fileSystem.readFile(directory, stagingName);
    const reopened = readTransferZip64(stagedBytes, input.sourcePolicy);
    assertArchiveReceiptEqual(writeReceipt, reopened.receipt);
    assertPublicationReceiptEqual(input.publication.supportReceipt, reopened.records.validatedPublication);
    if (reopened.records.sourceAuthorizationSha256 !== sourceAuthorizationSha256) {
      throw new Error('Transfer archive source authorization changed after staging');
    }
    reopened.materialize();
    assertNotAborted(input.signal);

    await fileSystem.renameNoReplace(directory, stagingName, archiveName);
    stagingExists = false;
    finalExists = true;
    await fileSystem.syncDirectory(directory);

    return Object.freeze({
      contract: TRANSFER_ARCHIVE_PUBLICATION_CONTRACT,
      archiveName,
      archive: Object.freeze({ ...reopened.receipt }),
      publication: Object.freeze({ ...reopened.records.validatedPublication }),
      sourceAuthorizationSha256,
    });
  } catch (primaryError) {
    const failure =
      primaryError instanceof Error
        ? primaryError
        : new Error('Transfer archive publication failed', { cause: primaryError });
    const cleanupFailures: unknown[] = [];
    if (handle) {
      try {
        await handle.close();
      } catch (cleanupError) {
        cleanupFailures.push(cleanupError);
      }
    }
    if (stagingExists) {
      try {
        await fileSystem.remove(directory, stagingName);
      } catch (cleanupError) {
        cleanupFailures.push(cleanupError);
      }
    }
    if (finalExists) {
      try {
        await fileSystem.remove(directory, archiveName);
        await fileSystem.syncDirectory(directory);
      } catch (cleanupError) {
        cleanupFailures.push(cleanupError);
      }
    }
    if (cleanupFailures.length > 0) {
      Object.defineProperty(failure, 'cleanupFailures', {
        configurable: false,
        enumerable: false,
        value: Object.freeze([...cleanupFailures]),
        writable: false,
      });
    }
    throw failure;
  }
}

const nodeTransferArchiveFileSystem: TransferArchiveFileSystem = {
  async prepareDirectory(directory: string) {
    if (typeof directory !== 'string' || directory.length === 0 || directory.includes('\0')) {
      throw new Error('Transfer archive directory is invalid');
    }
    const resolved = await realpath(directory);
    const stats = await lstat(resolved);
    if (!stats.isDirectory() || stats.isSymbolicLink())
      throw new Error('Transfer archive destination is not a directory');
    return resolved;
  },

  async openExclusive(directory: string, name: string) {
    assertGenericName(name, true);
    const file = await open(join(directory, name), constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    let position = 0;
    let closed = false;
    return {
      async write(bytes: Uint8Array) {
        if (closed) throw new Error('Transfer archive staging handle is closed');
        if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
          throw new Error('Transfer archive writer received invalid bytes');
        }
        let offset = 0;
        while (offset < bytes.byteLength) {
          // Partial writes must be completed in order on this one file handle.
          // oxlint-disable-next-line no-await-in-loop
          const result = await file.write(bytes, offset, bytes.byteLength - offset, position + offset);
          if (result.bytesWritten <= 0) throw new Error('Transfer archive staging write made no progress');
          offset += result.bytesWritten;
        }
        position += bytes.byteLength;
      },
      async sync() {
        if (closed) throw new Error('Transfer archive staging handle is closed');
        await file.sync();
      },
      async close() {
        if (closed) return;
        closed = true;
        await file.close();
      },
    };
  },

  async readFile(directory: string, name: string) {
    assertGenericName(name, true);
    return Uint8Array.from(await readFile(join(directory, name)));
  },

  async renameNoReplace(directory: string, sourceName: string, destinationName: string) {
    assertGenericName(sourceName, true);
    assertGenericName(destinationName, false);
    const source = join(directory, sourceName);
    const destination = join(directory, destinationName);
    await link(source, destination);
    try {
      await unlink(source);
    } catch (error) {
      await unlink(destination).catch((): undefined => undefined);
      throw error;
    }
  },

  async remove(directory: string, name: string) {
    assertGenericName(name, name.startsWith('.'));
    try {
      await unlink(join(directory, name));
    } catch (error) {
      if (!isNodeError(error, 'ENOENT')) throw error;
    }
  },

  async syncDirectory(directory: string) {
    let handle;
    try {
      handle = await open(directory, constants.O_RDONLY);
      await handle.sync();
    } catch (error) {
      if (!isUnsupportedDirectorySync(error)) throw error;
    } finally {
      await handle?.close();
    }
  },
};

export const NODE_TRANSFER_ARCHIVE_FILE_SYSTEM: TransferArchiveFileSystem =
  Object.freeze(nodeTransferArchiveFileSystem);

function publicationToZip64(publication: PublishTransferArchiveInput['publication']): TransferZip64Input {
  if (!publication || !Array.isArray(publication.records)) {
    throw new Error('Transfer archive publication is invalid');
  }
  const records = publication.records;
  if (records.length < 4) throw new Error('Transfer archive publication is incomplete');
  const first = records[0];
  const terminal = records.at(-2);
  const authorization = records.at(-1);
  if (!first || first.recordType !== 'header') throw new Error('Transfer archive publication must begin with header');
  if (!terminal || terminal.recordType !== 'terminal') {
    throw new Error('Transfer archive publication terminal is missing or reordered');
  }
  if (!authorization || authorization.recordType !== 'source-authorization') {
    throw new Error('Transfer archive publication source authorization is missing or reordered');
  }
  const middle = records.slice(1, -2);
  if (middle.length === 0 || middle.some((record) => record.recordType !== 'chunk')) {
    throw new Error('Transfer archive publication contains duplicate or reordered records');
  }
  return Object.freeze({
    header: copySerialized(first),
    chunks: Object.freeze(
      middle.map((record) => {
        const chunk = record as TransferPublicationChunkRecord;
        return Object.freeze({ descriptor: copyBytes(chunk.descriptor), ciphertext: copyBytes(chunk.ciphertext) });
      })
    ),
    terminal: copySerialized(terminal),
    sourceAuthorization: copySerialized(authorization),
  });
}

function copySerialized(
  record: TransferPublicationHeaderRecord | TransferPublicationTerminalRecord | TransferSourceAuthorizationRecord
): Uint8Array {
  return copyBytes(record.serialized);
}

function copyBytes(bytes: Uint8Array): Uint8Array {
  if (!(bytes instanceof Uint8Array)) throw new Error('Transfer archive record is not bytes');
  if (typeof SharedArrayBuffer !== 'undefined' && bytes.buffer instanceof SharedArrayBuffer) {
    throw new Error('Transfer archive record cannot use shared memory');
  }
  return Uint8Array.from(bytes);
}

function assertArchiveReceiptEqual(expected: TransferZip64Receipt, actual: TransferZip64Receipt): void {
  if (
    expected.contract !== actual.contract ||
    expected.archiveBytes !== actual.archiveBytes ||
    expected.entryCount !== actual.entryCount ||
    expected.archiveDigest !== actual.archiveDigest
  ) {
    throw new Error('Transfer archive changed after staging');
  }
}

function assertPublicationReceiptEqual(expected: TransferPublicationReceipt, actual: TransferPublicationReceipt): void {
  if (
    expected.contract !== actual.contract ||
    expected.bundleId !== actual.bundleId ||
    expected.suite !== actual.suite ||
    expected.chunkCount !== actual.chunkCount ||
    expected.plaintextBytes !== actual.plaintextBytes ||
    expected.ciphertextBytes !== actual.ciphertextBytes ||
    expected.streamDigest !== actual.streamDigest
  ) {
    throw new Error('Transfer archive publication receipt mismatch');
  }
}

function assertInput(input: PublishTransferArchiveInput): void {
  if (!input || typeof input !== 'object' || !input.sourcePolicy) {
    throw new Error('Transfer archive publication input is invalid');
  }
}

function assertGenericName(name: string, staging: boolean): void {
  const expected = staging
    ? /^\.transfer-[0-9a-f]{32}\.wayland-transfer\.zip\.partial$/
    : /^transfer-[0-9a-f]{32}\.wayland-transfer\.zip$/;
  if (!expected.test(name)) throw new Error('Transfer archive filename is invalid');
}

function assertNotAborted(signal: AbortSignal | undefined): void {
  if (!signal?.aborted) return;
  const error = new Error('Transfer archive publication was cancelled');
  error.name = 'AbortError';
  throw error;
}

function digest(bytes: Uint8Array): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function defaultIdFactory(): string {
  return randomUUID().replaceAll('-', '');
}

function isNodeError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === code;
}

function isUnsupportedDirectorySync(error: unknown): boolean {
  return ['EINVAL', 'ENOTSUP', 'EISDIR', 'EPERM'].some((code) => isNodeError(error, code));
}
