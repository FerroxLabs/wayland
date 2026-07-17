/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function formatUuidV4(bytes: Uint8Array): string {
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createConstitutionRecoveryOperationId(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi) throw new Error('Cryptographic operation-ID generation is unavailable.');

  if (typeof cryptoApi.randomUUID === 'function') {
    const operationId = cryptoApi.randomUUID();
    if (!UUID_V4_PATTERN.test(operationId)) {
      throw new Error('Cryptographic operation-ID generation returned an invalid UUID.');
    }
    return operationId;
  }

  if (typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Cryptographic operation-ID generation is unavailable.');
  }
  return formatUuidV4(cryptoApi.getRandomValues(new Uint8Array(16)));
}
