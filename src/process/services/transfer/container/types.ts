/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export const TRANSFER_CONTAINER_CONTRACT = 'wayland-transfer-container/1.0' as const;
export const TRANSFER_CONTAINER_FORMAT_VERSION = 1 as const;
export const TRANSFER_CHUNK_SCHEMA = 'wayland-transfer/chunk/1' as const;
export const TRANSFER_RECOVERY_SUITE = 'WT-R1' as const;
export const TRANSFER_DESTINATION_SUITE = 'WT-D1' as const;

export const TRANSFER_MAX_HEADER_BYTES = 16 * 1024;
export const TRANSFER_MAX_RECORD_BYTES = 16 * 1024;
export const TRANSFER_MAX_CHUNKS = 65_536;
export const TRANSFER_MIN_CHUNK_CIPHERTEXT_BYTES = 17;
export const TRANSFER_MAX_CHUNK_PLAINTEXT_BYTES = 64 * 1024 * 1024;
export const TRANSFER_MAX_CHUNK_CIPHERTEXT_BYTES = TRANSFER_MAX_CHUNK_PLAINTEXT_BYTES + 64 * 1024;
export const TRANSFER_MAX_PLAINTEXT_BYTES = 64 * 1024 * 1024 * 1024;
export const TRANSFER_MAX_CIPHERTEXT_BYTES = 16 * 1024 * 1024 * 1024;
export const TRANSFER_MAX_EXPANSION_RATIO = 100;

export type TransferContainerSuite = typeof TRANSFER_RECOVERY_SUITE | typeof TRANSFER_DESTINATION_SUITE;

export type TransferRecoveryProtection = Readonly<{
  mode: 'recovery';
  kdf: 'Argon2id';
  argon2Version: 19;
  memoryKiB: 262_144;
  iterations: 3;
  parallelism: 1;
  keyBytes: 32;
  salt: string;
  cipher: 'XChaCha20-Poly1305';
}>;

export type TransferDestinationProtection = Readonly<{
  mode: 'destination-bound';
  hpkeMode: 'base';
  kem: 'DHKEM(X25519,HKDF-SHA256)';
  kdf: 'HKDF-SHA256';
  aead: 'ChaCha20-Poly1305';
  recipientKeyFingerprint: `sha256:${string}`;
}>;

type TransferContainerHeaderFields = {
  recordType: 'header';
  contract: typeof TRANSFER_CONTAINER_CONTRACT;
  formatVersion: typeof TRANSFER_CONTAINER_FORMAT_VERSION;
  bundleId: string;
  declaredChunkCount: number;
  declaredCiphertextBytes: number;
  declaredPlaintextBytes: number;
};

export type TransferContainerHeader = Readonly<
  TransferContainerHeaderFields &
    (
      | { suite: typeof TRANSFER_RECOVERY_SUITE; protection: TransferRecoveryProtection }
      | { suite: typeof TRANSFER_DESTINATION_SUITE; protection: TransferDestinationProtection }
    )
>;

export type TransferChunkDescriptor = Readonly<{
  recordType: 'chunk';
  bundleId: string;
  schema: typeof TRANSFER_CHUNK_SCHEMA;
  ordinal: number;
  plaintextLength: number;
  ciphertextLength: number;
  contentDigest: `sha256:${string}`;
  ciphertextDigest: `sha256:${string}`;
  /** WT-R1 only. */
  nonce?: string;
  /** WT-D1 only; each independently resumable chunk is a fresh HPKE seal. */
  encapsulatedKey?: string;
}>;

export type TransferContainerTerminal = Readonly<{
  recordType: 'terminal';
  bundleId: string;
  chunkCount: number;
  plaintextBytes: number;
  ciphertextBytes: number;
  streamDigest: `sha256:${string}`;
}>;

export type ValidatedTransferChunk = Readonly<{
  descriptor: TransferChunkDescriptor;
}>;

export type ValidatedTransferContainer = Readonly<{
  header: TransferContainerHeader;
  terminal: TransferContainerTerminal;
}>;
