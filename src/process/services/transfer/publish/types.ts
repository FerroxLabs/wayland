/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TransferContainerSuite } from '@process/services/transfer/container';

export const TRANSFER_PUBLICATION_RECEIPT_CONTRACT = 'wayland-transfer-publication-receipt/1.0' as const;

export type TransferPublicationHeaderRecord = Readonly<{
  recordType: 'header';
  serialized: Uint8Array;
}>;

export type TransferPublicationChunkRecord = Readonly<{
  recordType: 'chunk';
  descriptor: Uint8Array;
  ciphertext: Uint8Array;
}>;

export type TransferPublicationTerminalRecord = Readonly<{
  recordType: 'terminal';
  serialized: Uint8Array;
}>;

export type TransferPublicationRecord =
  | TransferPublicationHeaderRecord
  | TransferPublicationChunkRecord
  | TransferPublicationTerminalRecord;

/** Content-free evidence suitable for diagnostics and support logs. */
export type TransferPublicationReceipt = Readonly<{
  contract: typeof TRANSFER_PUBLICATION_RECEIPT_CONTRACT;
  bundleId: string;
  suite: TransferContainerSuite;
  chunkCount: number;
  plaintextBytes: number;
  ciphertextBytes: number;
  streamDigest: `sha256:${string}`;
}>;

export type TransferPublication = Readonly<{
  records: readonly TransferPublicationRecord[];
  supportReceipt: TransferPublicationReceipt;
}>;
