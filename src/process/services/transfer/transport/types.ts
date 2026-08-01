/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TransferChunkDescriptor,
  TransferContainerHeader,
  TransferContainerTerminal,
  ValidatedTransferContainer,
} from '../container';
import type { TransferPublicationReceipt } from '../publish';

export const TRANSFER_ZIP64_CONTRACT = 'wayland-transfer-zip64/1.0' as const;
export const TRANSFER_ZIP64_EXTENSION = '.wayland-transfer.zip' as const;
export const TRANSFER_ZIP64_MAX_ENTRIES = 3 + 2 * 65_536;
export const TRANSFER_ZIP64_MAX_ARCHIVE_BYTES = 18 * 1024 * 1024 * 1024;
export const TRANSFER_ZIP64_MAX_NAME_BYTES = 64;

export type TransferZip64Chunk = Readonly<{
  descriptor: Uint8Array;
  ciphertext: Uint8Array;
}>;

export type TransferZip64Input = Readonly<{
  header: Uint8Array;
  chunks: readonly TransferZip64Chunk[];
  terminal: Uint8Array;
  sourceAuthorization: Uint8Array;
}>;

export interface TransferZip64Sink {
  write(bytes: Uint8Array): void | Promise<void>;
}

export type TransferZip64Receipt = Readonly<{
  contract: typeof TRANSFER_ZIP64_CONTRACT;
  archiveBytes: number;
  entryCount: number;
  archiveDigest: `sha256:${string}`;
}>;

export type MaterializedTransferZip64 = Readonly<{
  header: Uint8Array;
  chunks: readonly TransferZip64Chunk[];
  terminal: Uint8Array;
  sourceAuthorization: Uint8Array;
  validatedContainer: ValidatedTransferContainer;
  validatedPublication: TransferPublicationReceipt;
}>;

export type TransferZip64SemanticRecords = Readonly<{
  header: TransferContainerHeader;
  descriptors: readonly TransferChunkDescriptor[];
  terminal: TransferContainerTerminal;
  sourceAuthorizationSha256: `sha256:${string}`;
  validatedPublication: TransferPublicationReceipt;
}>;
