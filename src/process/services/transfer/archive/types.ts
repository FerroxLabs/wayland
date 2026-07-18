/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SourceAuthorizationValidationPolicy, TransferPublication, TransferPublicationReceipt } from '../publish';
import type { TransferZip64Receipt } from '../transport';

export const TRANSFER_ARCHIVE_PUBLICATION_CONTRACT = 'wayland-transfer-archive-publication/1.0' as const;

export interface TransferArchiveWritable {
  write(bytes: Uint8Array): Promise<void>;
  sync(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Filesystem authority deliberately receives a directory and generated base
 * name separately. This prevents publication code from smuggling paths or user
 * content into archive entries and staging names.
 */
export interface TransferArchiveFileSystem {
  prepareDirectory(directory: string): Promise<string>;
  openExclusive(directory: string, name: string): Promise<TransferArchiveWritable>;
  readFile(directory: string, name: string): Promise<Uint8Array>;
  renameNoReplace(directory: string, sourceName: string, destinationName: string): Promise<void>;
  remove(directory: string, name: string): Promise<void>;
  syncDirectory(directory: string): Promise<void>;
}

export type PublishTransferArchiveInput = Readonly<{
  publication: TransferPublication;
  sourcePolicy: SourceAuthorizationValidationPolicy;
  directory: string;
  fileSystem?: TransferArchiveFileSystem;
  idFactory?: () => string;
  signal?: AbortSignal;
}>;

/** Content-free evidence. `archiveName` is random and contains no state name. */
export type TransferArchivePublicationReceipt = Readonly<{
  contract: typeof TRANSFER_ARCHIVE_PUBLICATION_CONTRACT;
  archiveName: string;
  archive: TransferZip64Receipt;
  publication: TransferPublicationReceipt;
  sourceAuthorizationSha256: `sha256:${string}`;
}>;
